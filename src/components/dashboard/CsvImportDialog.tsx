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
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
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
    // Handle quoted values with commas
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

function validateRow(headers: string[], values: string[]): ParsedRow {
  const get = (key: string) => {
    const idx = headers.indexOf(key);
    return idx >= 0 && idx < values.length ? values[idx].trim() : "";
  };

  const errors: string[] = [];
  const email = get("email");
  const firstName = get("first_name") || get("first name") || get("firstname");
  const lastName = get("last_name") || get("last name") || get("lastname");
  const status = (get("status") || "INVITED").toUpperCase();

  if (!email) errors.push("Email is required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format");
  if (!VALID_STATUSES.includes(status)) errors.push(`Invalid status: ${status}`);

  return {
    first_name: firstName,
    last_name: lastName,
    middle_name: get("middle_name") || get("middle name") || get("middlename"),
    email,
    phone: get("phone") || get("phone_number"),
    city: get("city"),
    country: get("country"),
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

    // Batch insert valid rows
    const insertData = validRows.map((r) => ({
      first_name: r.first_name || null,
      last_name: r.last_name || null,
      middle_name: r.middle_name || null,
      email: r.email,
      phone: r.phone || null,
      city: r.city || null,
      country: r.country || null,
      status: r.status as "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE",
    }));

    // Insert in batches of 50
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
    const csv = "first_name,last_name,middle_name,email,phone,city,country,status\nJohn,Doe,,john.doe@example.com,+46 70 123 4567,Stockholm,Sweden,INVITED\n";
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
                Required column: email. Optional: first_name, last_name, middle_name, phone, city, country, status
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
