import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText, CheckCircle, AlertTriangle, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedRow {
  first_name: string;
  middle_name: string;
  last_name: string;
  preferred_name: string;
  email: string;
  address1: string;
  address2: string;
  zip_code: string;
  city: string;
  state_province: string;
  country: string;
  birthday: string;
  country_of_birth: string;
  citizenship: string;
  mobile_phone: string;
  bank_name: string;
  bic_code: string;
  bank_account_number: string;
  bank_country: string;
  emergency_first_name: string;
  emergency_last_name: string;
  emergency_phone: string;
  swedish_coordination_number: string;
  swedish_personal_number: string;
  status: string;
  errors: string[];
}

const REQUIRED_HEADERS = ["email"];
const VALID_STATUSES = ["INVITED", "ONBOARDING", "ACTIVE", "INACTIVE"];

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
  return { headers, rows };
}

/** Flexible header lookup — tries multiple variants */
function flexGet(headers: string[], values: string[], ...keys: string[]): string {
  for (const key of keys) {
    const idx = headers.indexOf(key);
    if (idx >= 0 && idx < values.length) {
      const v = values[idx].trim();
      if (v) return v;
    }
  }
  return "";
}

function validateRow(headers: string[], values: string[]): ParsedRow {
  const g = (...keys: string[]) => flexGet(headers, values, ...keys);

  const errors: string[] = [];
  const email = g("email");
  const firstName = g("first_name", "first name", "firstname");
  const lastName = g("last_name", "last name", "lastname");
  const middleName = g("middle_name", "middle name", "middlename");
  const preferredName = g("preferred_name", "preferred name", "preferredname");
  const address1 = g("address1", "address_1", "address 1", "address");
  const address2 = g("address2", "address_2", "address 2");
  const zipCode = g("zip_code", "zip code", "zipcode", "postcode", "postal_code");
  const city = g("city");
  const stateProvince = g("state_province", "state", "province");
  const country = g("country");
  const birthday = g("birthday", "date_of_birth", "date of birth", "dob");
  const countryOfBirth = g("country_of_birth", "country of birth");
  const citizenship = g("citizenship");
  const mobilePhone = g("mobile_phone", "mobile", "phone", "phone_number");
  const bankName = g("bank_name", "bank name", "bankname", "bank");
  const bicCode = g("bic_code", "bic", "swift", "swift_code");
  const bankAccountNumber = g("bank_account_number", "bank account", "account_number", "iban");
  const bankCountry = g("bank_country", "bank country");
  const emergencyFirstName = g("emergency_first_name", "emergency first name", "ice_first_name");
  const emergencyLastName = g("emergency_last_name", "emergency last name", "ice_last_name");
  const emergencyPhone = g("emergency_phone", "emergency phone", "ice_phone");
  const swedishCoordinationNumber = g("swedish_coordination_number", "coordination_number", "samordningsnummer");
  const swedishPersonalNumber = g("swedish_personal_number", "personal_number", "personnummer");
  const status = (g("status") || "INVITED").toUpperCase();

  if (!email) errors.push("Email is required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format");
  if (!VALID_STATUSES.includes(status)) errors.push(`Invalid status: ${status}`);
  if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) errors.push("Birthday must be YYYY-MM-DD");

  return {
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    preferred_name: preferredName,
    email,
    address1,
    address2,
    zip_code: zipCode,
    city,
    state_province: stateProvince,
    country,
    birthday,
    country_of_birth: countryOfBirth,
    citizenship,
    mobile_phone: mobilePhone,
    bank_name: bankName,
    bic_code: bicCode,
    bank_account_number: bankAccountNumber,
    bank_country: bankCountry,
    emergency_first_name: emergencyFirstName,
    emergency_last_name: emergencyLastName,
    emergency_phone: emergencyPhone,
    swedish_coordination_number: swedishCoordinationNumber,
    swedish_personal_number: swedishPersonalNumber,
    status,
    errors,
  };
}

export function CsvImportDialog({ open, onOpenChange, onSuccess }: CsvImportDialogProps) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importResult, setImportResult] = useState({ success: 0, failed: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setParsedRows([]);
    setFileName("");
    setStep("upload");
    setImportResult({ success: 0, failed: 0 });
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsv(text);

      if (!headers.some((h) => REQUIRED_HEADERS.includes(h))) {
        toast.error("CSV must have at least an 'email' column");
        return;
      }

      const validated = rows.map((row) => validateRow(headers, row));
      setParsedRows(validated);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
    else toast.error("Please drop a CSV file");
  };

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);

    let success = 0;
    let failed = 0;

    const insertData = validRows.map((r) => {
      const personalInfo: Record<string, any> = {};
      if (r.preferred_name) personalInfo.preferredName = r.preferred_name;
      if (r.address1) personalInfo.address1 = r.address1;
      if (r.address2) personalInfo.address2 = r.address2;
      if (r.zip_code) personalInfo.zipCode = r.zip_code;
      if (r.city) personalInfo.city = r.city;
      if (r.state_province) personalInfo.stateProvince = r.state_province;
      if (r.country) personalInfo.country = r.country;
      if (r.birthday) personalInfo.birthday = r.birthday;
      if (r.country_of_birth) personalInfo.countryOfBirth = r.country_of_birth;
      if (r.citizenship) personalInfo.citizenship = r.citizenship;
      if (r.mobile_phone) personalInfo.mobilePhone = r.mobile_phone;
      if (r.bank_name) personalInfo.bankName = r.bank_name;
      if (r.bic_code) personalInfo.bicCode = r.bic_code;
      if (r.bank_account_number) personalInfo.bankAccountNumber = r.bank_account_number;
      if (r.bank_country) personalInfo.bankCountry = r.bank_country;
      if (r.swedish_coordination_number) personalInfo.swedishCoordinationNumber = r.swedish_coordination_number;
      if (r.swedish_personal_number) personalInfo.swedishPersonalNumber = r.swedish_personal_number;
      if (r.emergency_first_name || r.emergency_last_name || r.emergency_phone) {
        personalInfo.emergencyContact = {
          firstName: r.emergency_first_name || "",
          lastName: r.emergency_last_name || "",
          phone: r.emergency_phone || "",
        };
      }

      return {
        first_name: r.first_name || null,
        last_name: r.last_name || null,
        middle_name: r.middle_name || null,
        email: r.email,
        phone: r.mobile_phone || null,
        city: r.city || null,
        country: r.country || null,
        status: r.status as "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE",
        personal_info: Object.keys(personalInfo).length > 0 ? personalInfo : {},
      };
    });

    for (let i = 0; i < insertData.length; i += 50) {
      const batch = insertData.slice(i, i + 50);
      const { error } = await supabase.from("employees").insert(batch as any);
      if (error) {
        failed += batch.length;
      } else {
        success += batch.length;
      }
    }

    setImportResult({ success, failed: failed + invalidRows.length });
    setStep("done");
    setImporting(false);
    onSuccess();
  };

  const downloadTemplate = () => {
    const headers = [
      "first_name", "middle_name", "last_name", "preferred_name", "email",
      "address1", "address2", "zip_code", "city", "state_province", "country",
      "birthday", "country_of_birth", "citizenship", "mobile_phone",
      "bank_name", "bic_code", "bank_account_number", "bank_country",
      "emergency_first_name", "emergency_last_name", "emergency_phone",
      "swedish_coordination_number", "swedish_personal_number", "status",
    ];
    const sample = [
      "John", "", "Doe", "Johnny", "john.doe@example.com",
      "Storgatan 1", "", "111 22", "Stockholm", "", "Sweden",
      "1990-05-15", "Sweden", "Swedish", "+46 70 123 4567",
      "Swedbank", "SWEDSESS", "1234-5678901", "Sweden",
      "Jane", "Doe", "+46 70 765 4321",
      "", "", "INVITED",
    ];
    const csv = headers.join(",") + "\n" + sample.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Upload className="w-5 h-5 text-primary" />
            Import Employees from CSV
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Drop your CSV file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                Required: email. Optional: name, address, bank details, emergency contact, and more.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {validRows.length} valid
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {invalidRows.length} errors
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{fileName}</p>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Birthday</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow key={i} className={row.errors.length > 0 ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-sm">
                        {row.first_name || row.last_name
                          ? `${row.first_name} ${row.last_name}`.trim()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{row.email || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.country || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.birthday || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.bank_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.errors.length === 0 ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <span className="text-xs text-destructive">{row.errors.join(", ")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={reset}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
                className="gap-2"
              >
                {importing ? "Importing..." : `Import ${validRows.length} Employees`}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold">Import Complete</p>
              <p className="text-sm text-muted-foreground mt-1">
                {importResult.success} employees imported successfully
                {importResult.failed > 0 && `, ${importResult.failed} failed`}
              </p>
            </div>
            <Button onClick={() => { onOpenChange(false); reset(); }}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
