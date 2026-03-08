import { useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, X, AlertTriangle, Download, Pencil, RefreshCw, Users, Hash, Save, FolderOpen, Trash2, Clock, Building2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useImportPresets, useImportDrafts } from "@/hooks/useImportPresetsAndDrafts";

/* ─── Types ─────────────────────────────────────────── */

interface CsvRow {
  [key: string]: string;
}

interface MappedEmployee {
  id: string;
  selected: boolean;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  employee_code: string;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
  duplicateOf?: string;
  raw: CsvRow;
  // personal_info sub-fields
  personalInfo: Record<string, string>;
}

type SystemField = {
  key: string;
  label: string;
  group: "core" | "address" | "personal";
  required?: boolean;
};

const SYSTEM_FIELDS: SystemField[] = [
  { key: "name", label: "Full Name (will split)", group: "core" },
  { key: "first_name", label: "First Name", group: "core" },
  { key: "middle_name", label: "Middle Name", group: "core" },
  { key: "last_name", label: "Last Name", group: "core" },
  { key: "employee_code", label: "Employee ID / Anställnings-ID", group: "core" },
  { key: "email", label: "Email", group: "core", required: true },
  { key: "phone", label: "Phone", group: "core" },
  { key: "mobilePhone", label: "Mobile Phone", group: "core" },
  { key: "address1", label: "Address Line 1", group: "address" },
  { key: "address2", label: "Address Line 2", group: "address" },
  { key: "city", label: "City", group: "address" },
  { key: "postcode", label: "Postcode", group: "address" },
  { key: "stateProvince", label: "State / Province", group: "address" },
  { key: "country", label: "Country", group: "address" },
  { key: "dateOfBirth", label: "Date of Birth", group: "personal" },
  { key: "countryOfBirth", label: "Country of Birth", group: "personal" },
  { key: "citizenship", label: "Citizenship", group: "personal" },
  { key: "nationality", label: "Nationality", group: "personal" },
  { key: "preferredName", label: "Preferred Name", group: "personal" },
  { key: "bankName", label: "Bank Name", group: "personal" },
  { key: "bankAccount", label: "Bank Account", group: "personal" },
  { key: "bicCode", label: "BIC Code", group: "personal" },
  { key: "bankCountry", label: "Bank Country", group: "personal" },
  { key: "emergencyFirstName", label: "Emergency Contact First Name", group: "personal" },
  { key: "emergencyLastName", label: "Emergency Contact Last Name", group: "personal" },
  { key: "emergencyPhone", label: "Emergency Phone", group: "personal" },
  { key: "swedishPersonalNumber", label: "Swedish Personal Number / Personnummer", group: "personal" },
  { key: "swedishCoordinationNumber", label: "Swedish Coordination Number / Samordningsnummer", group: "personal" },
  { key: "_skip", label: "— Skip this column —", group: "core" },
];

const HEADER_ALIASES: Record<string, string> = {
  name: "name", fullname: "name", full_name: "name",
  first_name: "first_name", firstname: "first_name", "first name": "first_name",
  middle_name: "middle_name", middlename: "middle_name",
  last_name: "last_name", lastname: "last_name", surname: "last_name",
  email: "email", "e-mail": "email", mail: "email",
  phone: "phone", telephone: "phone",
  mobile: "mobilePhone", mobilephone: "mobilePhone", mobile_phone: "mobilePhone", "mobile phone": "mobilePhone",
  city: "city", town: "city",
  country: "country",
  address: "address1", street: "address1", address1: "address1", address_1: "address1", "address 1": "address1", "address line 1": "address1",
  address2: "address2", address_2: "address2", "address 2": "address2", "address line 2": "address2",
  postcode: "postcode", zip: "postcode", zip_code: "postcode", postal_code: "postcode",
  state: "stateProvince", province: "stateProvince", stateprovince: "stateProvince", state_province: "stateProvince", "state province": "stateProvince",
  dateofbirth: "dateOfBirth", birthday: "dateOfBirth", dob: "dateOfBirth", date_of_birth: "dateOfBirth",
  countryofbirth: "countryOfBirth", country_of_birth: "countryOfBirth", "country of birth": "countryOfBirth",
  citizenship: "citizenship",
  nationality: "nationality",
  preferredname: "preferredName", preferred_name: "preferredName",
  bankname: "bankName", bank_name: "bankName", bank: "bankName",
  bankaccount: "bankAccount", bank_account: "bankAccount", account: "bankAccount", iban: "bankAccount", bank_account_number: "bankAccount",
  biccode: "bicCode", bic: "bicCode", bic_code: "bicCode", swift: "bicCode", swift_code: "bicCode",
  bankcountry: "bankCountry", bank_country: "bankCountry", "bank country": "bankCountry",
  emergencyfirstname: "emergencyFirstName", emergency_first_name: "emergencyFirstName", "emergency first name": "emergencyFirstName", ice_first_name: "emergencyFirstName",
  emergencylastname: "emergencyLastName", emergency_last_name: "emergencyLastName", "emergency last name": "emergencyLastName", ice_last_name: "emergencyLastName",
  emergencycontact: "emergencyFirstName",
  emergencyphone: "emergencyPhone", emergency_phone: "emergencyPhone", ice_phone: "emergencyPhone",
  employee_code: "employee_code", employeecode: "employee_code",
  employeeid: "employee_code", employee_id: "employee_code",
  empid: "employee_code", emp_id: "employee_code",
  anstallid: "employee_code", "anställdid": "employee_code",
  personnr: "swedishPersonalNumber", personnummer: "swedishPersonalNumber",
  personal_number: "swedishPersonalNumber", swedishpersonalnumber: "swedishPersonalNumber",
  samordningsnummer: "swedishCoordinationNumber", coordination_number: "swedishCoordinationNumber",
  swedishcoordinationnumber: "swedishCoordinationNumber",
};

function autoMapHeader(header: string): string {
  const normalized = header.toLowerCase().trim().replace(/[\s_-]+/g, "");
  for (const [alias, field] of Object.entries(HEADER_ALIASES)) {
    if (normalized === alias.replace(/[\s_-]+/g, "")) return field;
  }
  return "_skip";
}

function splitName(fullName: string): { first: string; middle: string; last: string } {
  const tokens = fullName.trim().split(/\s+/);
  if (tokens.length === 0) return { first: "", middle: "", last: "" };
  if (tokens.length === 1) return { first: "", middle: "", last: tokens[0] };
  if (tokens.length === 2) return { first: tokens[1], middle: "", last: tokens[0] };
  // Token 1 = last name, Token 2 = first name, Token 3+ = middle name(s)
  return {
    last: tokens[0],
    first: tokens[1],
    middle: tokens.slice(2).join(" "),
  };
}

function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const rows: CsvRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;\t]/).map((v) => v.trim().replace(/^["']|["']$/g, ""));
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  
  return { headers, rows };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Component ─────────────────────────────────────── */

export function DataHandlingView() {
  const { orgId, orgName, orgType } = useOrg();
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1 state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [mappedData, setMappedData] = useState<MappedEmployee[]>([]);
  const [filterTab, setFilterTab] = useState("all");
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Step 3 state
  const [autoAssignIds, setAutoAssignIds] = useState(true);

  // Step 4 state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Preset & Draft state
  const { presets, savePreset, deletePreset } = useImportPresets(orgId);
  const { drafts, saveDraft, deleteDraft } = useImportDrafts(orgId);
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [showLoadDraftDialog, setShowLoadDraftDialog] = useState(false);

  // Fetch existing employees for duplicate detection
  const { data: existingEmployees } = useQuery({
    queryKey: ["employees-for-dedup", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("employees")
        .select("id, email, first_name, middle_name, last_name, employee_code, phone")
        .eq("org_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch companies for this org
  const { data: companies } = useQuery({
    queryKey: ["companies-for-import", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("org_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const companyNames = companies?.map((c) => c.name).join(", ") || "—";

  // Fetch employee ID settings
  const { data: idSettings } = useQuery({
    queryKey: ["employee-id-settings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase
        .from("employee_id_settings")
        .select("*")
        .eq("org_id", orgId)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  /* ─── Step 1: Upload & Parse ─── */

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCsv(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-map columns
      const mapping: Record<string, string> = {};
      headers.forEach((h) => {
        mapping[h] = autoMapHeader(h);
      });
      setColumnMapping(mapping);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.match(/\.(csv|txt|tsv)$/i)) {
      toast.error("Please drop a CSV file");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCsv(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      const mapping: Record<string, string> = {};
      headers.forEach((h) => {
        mapping[h] = autoMapHeader(h);
      });
      setColumnMapping(mapping);
    };
    reader.readAsText(file);
  }, []);

  const downloadTemplate = useCallback(() => {
    const template = "name,email,phone,city,country,address,postcode,dateOfBirth,citizenship,bankName,bankAccount,bicCode\nLazea Dorin Felician,dorin@example.com,+46701234567,Stockholm,Sweden,Street 1,12345,1990-01-15,Romania,Nordea,1234567890,NDEASESS";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  /* ─── Step 1 → Step 2: Map & Validate ─── */

  const hasNameColumn = useMemo(() => {
    return Object.values(columnMapping).includes("name");
  }, [columnMapping]);

  const proceedToWashing = useCallback(() => {
    const existingEmails = new Set((existingEmployees || []).map((e) => e.email.toLowerCase()));
    const existingNames = new Set(
      (existingEmployees || []).map((e) =>
        [e.first_name, e.middle_name, e.last_name].filter(Boolean).join(" ").toLowerCase()
      )
    );

    const mapped: MappedEmployee[] = csvRows.map((raw) => {
      const entry: MappedEmployee = {
        id: generateId(),
        selected: true,
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone: "",
        city: "",
        country: "",
        employee_code: "",
        status: "valid",
        errors: [],
        raw,
        personalInfo: {},
      };

      // Apply mapping
      for (const [csvCol, sysField] of Object.entries(columnMapping)) {
        const val = raw[csvCol] || "";
        if (sysField === "_skip" || !val) continue;

        if (sysField === "name") {
          const { first, middle, last } = splitName(val);
          entry.first_name = first;
          entry.middle_name = middle;
          entry.last_name = last;
        } else if (sysField === "first_name") entry.first_name = val;
        else if (sysField === "middle_name") entry.middle_name = val;
        else if (sysField === "last_name") entry.last_name = val;
        else if (sysField === "email") entry.email = val.toLowerCase().trim();
        else if (sysField === "phone") entry.phone = val;
        else if (sysField === "mobilePhone") { entry.phone = val; entry.personalInfo.mobilePhone = val; }
        else if (sysField === "city") entry.city = val;
        else if (sysField === "country") entry.country = val;
        else {
          // personal_info sub-field (address1, address2, stateProvince, bankName, etc.)
          entry.personalInfo[sysField] = val;
        }
      }

      // Validate
      if (!entry.email) {
        entry.errors.push("Email is required");
        entry.status = "invalid";
      } else if (!EMAIL_REGEX.test(entry.email)) {
        entry.errors.push("Invalid email format");
        entry.status = "invalid";
      }

      if (!entry.first_name && !entry.last_name) {
        entry.errors.push("Name is required");
        entry.status = "invalid";
      }

      // Duplicate detection
      if (entry.email && existingEmails.has(entry.email)) {
        entry.status = "duplicate";
        entry.duplicateOf = "email";
        entry.errors.push("Email already exists in system");
      }

      const fullName = [entry.first_name, entry.middle_name, entry.last_name].filter(Boolean).join(" ").toLowerCase();
      if (fullName && existingNames.has(fullName) && entry.status !== "duplicate") {
        entry.status = "duplicate";
        entry.duplicateOf = "name";
        entry.errors.push("Name match found in system");
      }

      return entry;
    });

    // Check for duplicates within the CSV itself
    const seenEmails = new Map<string, number>();
    mapped.forEach((row, idx) => {
      if (row.email) {
        if (seenEmails.has(row.email)) {
          row.status = "duplicate";
          row.errors.push(`Duplicate email in CSV (row ${(seenEmails.get(row.email) || 0) + 2})`);
        } else {
          seenEmails.set(row.email, idx);
        }
      }
    });

    setMappedData(mapped);
    setStep(2);
  }, [csvRows, columnMapping, existingEmployees]);

  /* ─── Step 2: Data washing helpers ─── */

  const updateRow = useCallback((rowId: string, updates: Partial<MappedEmployee>) => {
    setMappedData((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r))
    );
  }, []);

  const toggleRow = useCallback((rowId: string) => {
    setMappedData((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, selected: !r.selected } : r))
    );
  }, []);

  const selectAllValid = useCallback(() => {
    setMappedData((prev) =>
      prev.map((r) => ({ ...r, selected: r.status === "valid" }))
    );
  }, []);

  const deselectDuplicates = useCallback(() => {
    setMappedData((prev) =>
      prev.map((r) => (r.status === "duplicate" ? { ...r, selected: false } : r))
    );
  }, []);

  const startEdit = useCallback((rowId: string, field: string, currentValue: string) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    updateRow(editingCell.rowId, { [editingCell.field]: editValue } as any);
    setEditingCell(null);
  }, [editingCell, editValue, updateRow]);

  const filteredData = useMemo(() => {
    if (filterTab === "all") return mappedData;
    if (filterTab === "valid") return mappedData.filter((r) => r.status === "valid");
    if (filterTab === "invalid") return mappedData.filter((r) => r.status === "invalid");
    if (filterTab === "duplicate") return mappedData.filter((r) => r.status === "duplicate");
    return mappedData;
  }, [mappedData, filterTab]);

  const counts = useMemo(() => ({
    all: mappedData.length,
    valid: mappedData.filter((r) => r.status === "valid").length,
    invalid: mappedData.filter((r) => r.status === "invalid").length,
    duplicate: mappedData.filter((r) => r.status === "duplicate").length,
    selected: mappedData.filter((r) => r.selected).length,
  }), [mappedData]);

  /* ─── Step 3: Employee ID assignment ─── */

  const previewIds = useMemo(() => {
    if (!idSettings) return [];
    const prefix = idSettings.prefix || "EPM";
    const sep = idSettings.separator || "-";
    const pad = idSettings.padding || 3;
    let next = idSettings.next_number || 1;

    // Find actual max from existing employees
    const existingMax = (existingEmployees || []).reduce((max, emp) => {
      if (!emp.employee_code) return max;
      const numPart = emp.employee_code.replace(prefix + sep, "");
      const num = parseInt(numPart, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    next = Math.max(next, existingMax + 1);

    return mappedData
      .filter((r) => r.selected)
      .map((r, i) => ({
        ...r,
        employee_code: autoAssignIds
          ? `${prefix}${sep}${String(next + i).padStart(pad, "0")}`
          : r.employee_code,
      }));
  }, [mappedData, idSettings, existingEmployees, autoAssignIds]);

  const proceedToIds = useCallback(() => {
    setStep(3);
  }, []);

  const proceedToReview = useCallback(() => {
    // Apply IDs to mapped data
    if (autoAssignIds) {
      const idMap = new Map(previewIds.map((p) => [p.id, p.employee_code]));
      setMappedData((prev) =>
        prev.map((r) => ({
          ...r,
          employee_code: idMap.get(r.id) || r.employee_code,
        }))
      );
    }
    setStep(4);
  }, [autoAssignIds, previewIds]);

  /* ─── Step 4: Import ─── */

  const toImport = useMemo(() => mappedData.filter((r) => r.selected), [mappedData]);

  const handleImport = useCallback(async () => {
    if (!orgId) return;
    setImporting(true);
    setImportProgress(0);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      try {
        const personalInfo: Record<string, any> = {
          ...row.personalInfo,
          mobilePhone: row.phone,
          city: row.city,
          country: row.country,
        };

        // Build emergency contact object from split fields
        if (personalInfo.emergencyFirstName || personalInfo.emergencyLastName) {
          personalInfo.emergencyContact = {
            firstName: personalInfo.emergencyFirstName || "",
            lastName: personalInfo.emergencyLastName || "",
            phone: personalInfo.emergencyPhone || "",
          };
        }

        const { error } = await supabase.from("employees").insert({
          org_id: orgId,
          email: row.email,
          first_name: row.first_name,
          middle_name: row.middle_name || null,
          last_name: row.last_name,
          phone: row.phone || null,
          city: row.city || null,
          country: row.country || null,
          personal_info: personalInfo,
          status: "ACTIVE",
        });

        if (error) throw error;
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`${row.email}: ${err.message}`);
      }
      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    setImportResults(results);
    setImporting(false);
    if (results.success > 0) {
      toast.success(`${results.success} employees imported successfully`);
    }
    if (results.failed > 0) {
      toast.error(`${results.failed} employees failed to import`);
    }
  }, [toImport, orgId]);

  const resetAll = useCallback(() => {
    setStep(1);
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMapping({});
    setFileName("");
    setMappedData([]);
    setImportResults(null);
    setImportProgress(0);
    setActiveDraftId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* ─── Preset helpers ─── */

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;
    // Strip _skip mappings for cleaner storage
    const cleanedMappings: Record<string, string> = {};
    for (const [csvCol, sysField] of Object.entries(columnMapping)) {
      if (sysField !== "_skip") cleanedMappings[csvCol] = sysField;
    }
    savePreset.mutate({ name: presetName.trim(), mappings: cleanedMappings });
    setPresetName("");
    setShowSavePresetDialog(false);
  }, [presetName, columnMapping, savePreset]);

  const handleLoadPreset = useCallback((preset: { mappings: Record<string, string> }) => {
    const storedMappings = preset.mappings as Record<string, string>;
    // Re-apply: for each current CSV header, find if the preset has a mapping for the same header name
    const newMapping: Record<string, string> = {};
    csvHeaders.forEach((h) => {
      const normalized = h.toLowerCase().trim();
      // Try exact header match first, then normalized
      if (storedMappings[h]) {
        newMapping[h] = storedMappings[h];
      } else if (storedMappings[normalized]) {
        newMapping[h] = storedMappings[normalized];
      } else {
        // Try matching by normalized key
        const match = Object.entries(storedMappings).find(
          ([k]) => k.toLowerCase().trim() === normalized
        );
        newMapping[h] = match ? match[1] : "_skip";
      }
    });
    setColumnMapping(newMapping);
    toast.success("Preset applied");
  }, [csvHeaders]);

  /* ─── Draft helpers ─── */

  const handleSaveDraft = useCallback(() => {
    const name = draftName.trim() || `Import ${new Date().toLocaleDateString()}`;
    const serializableData = mappedData.map(({ raw, ...rest }) => rest);
    saveDraft.mutate({
      id: activeDraftId || undefined,
      name,
      step,
      file_name: fileName,
      raw_headers: csvHeaders,
      mappings: columnMapping,
      mapped_data: step >= 2 ? serializableData : [],
      raw_csv_rows: csvRows,
      row_count: mappedData.length || csvRows.length,
    });
    setDraftName("");
    setShowSaveDraftDialog(false);
  }, [draftName, activeDraftId, step, fileName, csvHeaders, columnMapping, mappedData, csvRows, saveDraft]);

  const handleLoadDraft = useCallback((draft: any) => {
    setCsvHeaders(draft.raw_headers || []);
    setColumnMapping(draft.mappings || {});
    setFileName(draft.file_name || "");
    setActiveDraftId(draft.id);

    // Restore raw CSV rows if stored
    const storedCsvRows = draft.raw_csv_rows || [];
    if (storedCsvRows.length > 0) {
      setCsvRows(storedCsvRows);
    }

    if (draft.mapped_data && draft.mapped_data.length > 0) {
      // Reconstruct raw references from stored CSV rows
      const restoredData = draft.mapped_data.map((d: any, idx: number) => ({
        ...d,
        raw: storedCsvRows[idx] || {},
      }));
      setMappedData(restoredData);
      // If CSV rows are stored, allow resuming from actual step
      setStep(storedCsvRows.length > 0 ? draft.step : Math.min(draft.step, 2));
    } else {
      setStep(storedCsvRows.length > 0 ? 1 : 1);
    }
    toast.success(`Draft "${draft.name}" loaded`);
  }, []);

  /* ─── Render ─── */

  const renderEditableCell = (row: MappedEmployee, field: keyof MappedEmployee, value: string) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === field;
    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === "Enter" && commitEdit()}
          autoFocus
          className="h-7 text-xs"
        />
      );
    }
    return (
      <button
        onClick={() => startEdit(row.id, field as string, value)}
        className="text-left w-full hover:bg-muted/50 px-1 py-0.5 rounded text-xs group flex items-center gap-1"
      >
        <span className="truncate">{value || "—"}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Handling</h1>
          <p className="text-sm text-muted-foreground">Import, map, clean, and validate employee data from CSV</p>
        </div>
        <div className="flex items-center gap-2">
          {drafts.length > 0 && !importResults && (
            <Button variant="outline" size="sm" onClick={() => setShowLoadDraftDialog(true)}>
              <FolderOpen className="h-4 w-4 mr-1" /> Load Draft
            </Button>
          )}
          {step > 0 && step < 4 && (csvHeaders.length > 0 || mappedData.length > 0) && !importResults && (
            <Button variant="outline" size="sm" onClick={() => {
              setDraftName(activeDraftId ? fileName : "");
              setShowSaveDraftDialog(true);
            }}>
              <Save className="h-4 w-4 mr-1" /> Save Draft
            </Button>
          )}
          {step > 1 && !importResults && (
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RefreshCw className="h-4 w-4 mr-1" /> Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Upload & Map" },
          { n: 2, label: "Data Washing" },
          { n: 3, label: "Employee IDs" },
          { n: 4, label: "Import" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                step === n
                  ? "bg-primary text-primary-foreground"
                  : step > n
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > n ? <Check className="h-3 w-3" /> : <span>{n}</span>}
              <span className="hidden sm:inline">{label}</span>
            </div>
            {n < 4 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Organization context banner */}
      <Alert className="border-primary/30 bg-primary/5">
        <Building2 className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">Importing to:</span>
          <span className="font-bold">{orgName || "—"}</span>
          {companies && companies.length > 0 && (
            <span className="text-muted-foreground">({companyNames})</span>
          )}
          {orgType === "sandbox" && (
            <Badge variant="warning" className="ml-1">Sandbox</Badge>
          )}
        </AlertDescription>
      </Alert>

      {/* ─── STEP 1: Upload & Column Mapping ─── */}
      {step === 1 && (
        <div className="space-y-6">
          {csvHeaders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Drop CSV file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports .csv, .tsv, .txt files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-1" /> Download Template
                  </Button>
                </div>

                {/* Saved Drafts */}
                {drafts.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Saved Drafts
                    </h3>
                    <div className="grid gap-2">
                      {drafts.map((draft) => (
                        <div
                          key={draft.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoadDraft(draft)}>
                            <p className="text-sm font-medium truncate">{draft.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {draft.file_name} · {draft.row_count} rows · Step {draft.step} · {new Date(draft.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleLoadDraft(draft)}>
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteDraft.mutate(draft.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{fileName}</CardTitle>
                      <Badge variant="secondary">{csvRows.length} rows</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetAll}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Column Mapping</CardTitle>
                      <CardDescription>
                        Map each CSV column to the corresponding employee field —{" "}
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {csvHeaders.filter(h => columnMapping[h] && columnMapping[h] !== "_skip").length} mapped
                        </span>
                        {" / "}
                        <span className="text-muted-foreground">{csvHeaders.filter(h => !columnMapping[h] || columnMapping[h] === "_skip").length} skipped</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {presets.length > 0 && (
                        <Select onValueChange={(val) => {
                          const preset = presets.find((p) => p.id === val);
                          if (preset) handleLoadPreset(preset);
                        }}>
                          <SelectTrigger className="h-8 text-xs w-auto gap-1">
                            <FolderOpen className="h-3.5 w-3.5" />
                            <SelectValue placeholder="Load Preset" />
                          </SelectTrigger>
                          <SelectContent>
                            {presets.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const cleared: Record<string, string> = {};
                          csvHeaders.forEach((h) => { cleared[h] = "_skip"; });
                          setColumnMapping(cleared);
                          toast.info("All mappings cleared");
                        }}
                        className="h-8 text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Clear All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setPresetName(""); setShowSavePresetDialog(true); }}
                        className="h-8 text-xs"
                      >
                        <Save className="h-3.5 w-3.5 mr-1" /> Save Preset
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {csvHeaders.map((header) => {
                      const mappedValue = columnMapping[header] || "_skip";
                      const isMapped = mappedValue !== "_skip";
                      return (
                        <div
                          key={header}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                            isMapped
                              ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                              : "bg-muted/30 border-border"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <Label className="text-xs text-muted-foreground">CSV Column</Label>
                            <p className="text-sm font-medium truncate">{header}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              e.g. "{csvRows[0]?.[header] || ""}"
                            </p>
                          </div>
                          <ArrowRight className={cn("h-4 w-4 shrink-0", isMapped ? "text-green-600 dark:text-green-400" : "text-muted-foreground")} />
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">System Field</Label>
                            <Select
                              value={mappedValue}
                              onValueChange={(val) =>
                                setColumnMapping((prev) => ({ ...prev, [header]: val }))
                              }
                            >
                              <SelectTrigger className={cn("h-8 text-xs", isMapped && "border-green-300 dark:border-green-700")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SYSTEM_FIELDS.map((f) => (
                                  <SelectItem key={f.key} value={f.key}>
                                    {f.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {isMapped && <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {hasNameColumn && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Name Splitting Preview</span>
                      </div>
                      <div className="space-y-1">
                        {csvRows.slice(0, 3).map((row, i) => {
                          const nameCol = Object.entries(columnMapping).find(([, v]) => v === "name")?.[0];
                          const fullName = nameCol ? row[nameCol] : "";
                          const { first, middle, last } = splitName(fullName);
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground w-32 truncate">"{fullName}"</span>
                              <ArrowRight className="h-3 w-3" />
                              <Badge variant="outline" className="text-xs">First: {first}</Badge>
                              {middle && <Badge variant="outline" className="text-xs">Middle: {middle}</Badge>}
                              <Badge variant="outline" className="text-xs">Last: {last}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={proceedToWashing} disabled={!Object.values(columnMapping).includes("email")}>
                  Continue to Data Washing <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 2: Data Washing ─── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary bar */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 text-sm">
                  <span><strong>{counts.selected}</strong> of {counts.all} selected</span>
                  <Badge variant="default">{counts.valid} valid</Badge>
                  {counts.invalid > 0 && <Badge variant="destructive">{counts.invalid} invalid</Badge>}
                  {counts.duplicate > 0 && <Badge variant="secondary">{counts.duplicate} duplicate</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllValid}>Select All Valid</Button>
                  <Button variant="outline" size="sm" onClick={deselectDuplicates}>Deselect Duplicates</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={filterTab} onValueChange={setFilterTab}>
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="valid">Valid ({counts.valid})</TabsTrigger>
              <TabsTrigger value="invalid">Invalid ({counts.invalid})</TabsTrigger>
              <TabsTrigger value="duplicate">Duplicate ({counts.duplicate})</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredData.length > 0 && filteredData.every((r) => r.selected)}
                        onCheckedChange={(checked) => {
                          const ids = new Set(filteredData.map((r) => r.id));
                          setMappedData((prev) =>
                            prev.map((r) => (ids.has(r.id) ? { ...r, selected: !!checked } : r))
                          );
                        }}
                      />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Middle</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        !row.selected && "opacity-50",
                        row.status === "invalid" && "bg-destructive/5",
                        row.status === "duplicate" && "bg-yellow-500/5"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={row.selected}
                          onCheckedChange={() => toggleRow(row.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {row.status === "valid" && <Badge variant="default" className="text-xs"><Check className="h-3 w-3 mr-0.5" />Valid</Badge>}
                        {row.status === "invalid" && <Badge variant="destructive" className="text-xs"><X className="h-3 w-3 mr-0.5" />Invalid</Badge>}
                        {row.status === "duplicate" && <Badge variant="secondary" className="text-xs"><AlertTriangle className="h-3 w-3 mr-0.5" />Dup</Badge>}
                      </TableCell>
                      <TableCell>{renderEditableCell(row, "first_name", row.first_name)}</TableCell>
                      <TableCell>{renderEditableCell(row, "middle_name", row.middle_name)}</TableCell>
                      <TableCell>{renderEditableCell(row, "last_name", row.last_name)}</TableCell>
                      <TableCell>{renderEditableCell(row, "email", row.email)}</TableCell>
                      <TableCell>{renderEditableCell(row, "phone", row.phone)}</TableCell>
                      <TableCell>{renderEditableCell(row, "city", row.city)}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <span className="text-xs text-destructive">{row.errors.join("; ")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No rows match this filter
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={proceedToIds} disabled={counts.selected === 0}>
              Continue to ID Assignment <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Employee ID Assignment ─── */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Employee ID Assignment
              </CardTitle>
              <CardDescription>
                {idSettings
                  ? `Current format: ${idSettings.prefix}${idSettings.separator}${"0".repeat(idSettings.padding)} (next: ${idSettings.next_number})`
                  : "Using default format: EPM-001"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Checkbox
                  checked={autoAssignIds}
                  onCheckedChange={(v) => setAutoAssignIds(!!v)}
                  id="auto-ids"
                />
                <Label htmlFor="auto-ids">Auto-assign sequential Employee IDs</Label>
              </div>

              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewIds.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {row.employee_code || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {[row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={proceedToReview}>
              Continue to Import <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: Review & Import ─── */}
      {step === 4 && (
        <div className="space-y-4">
          {!importResults ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{toImport.length}</p>
                      <p className="text-xs text-muted-foreground">Employees to import</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{toImport.filter((r) => r.employee_code).length}</p>
                      <p className="text-xs text-muted-foreground">With Employee IDs</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{Object.values(columnMapping).filter((v) => v !== "_skip").length}</p>
                      <p className="text-xs text-muted-foreground">Fields mapped</p>
                    </div>
                  </div>

                  {importing && (
                    <div className="space-y-2">
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">{importProgress}% complete</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)} disabled={importing}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setShowImportConfirm(true)} disabled={importing || toImport.length === 0}>
                  {importing ? "Importing..." : `Import ${toImport.length} Employees`}
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Import Complete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{importResults.success}</p>
                    <p className="text-xs text-muted-foreground">Successfully imported</p>
                  </div>
                  <div className="text-center p-4 bg-destructive/10 rounded-lg">
                    <p className="text-2xl font-bold text-destructive">{importResults.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
                {importResults.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Errors:</p>
                    {importResults.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">{err}</p>
                    ))}
                  </div>
                )}
                <Button onClick={resetAll} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-1" /> Start New Import
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── Save Preset Dialog ─── */}
      <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Column Mapping Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Preset Name</Label>
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g. Hogia Export, Visma Format"
                autoFocus
              />
            </div>
            {presets.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Existing Presets</Label>
                <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                  {presets.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/50">
                      <span>{p.name}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deletePreset.mutate(p.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePresetDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim() || savePreset.isPending}>
              {savePreset.isPending ? "Saving..." : "Save Preset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Save Draft Dialog ─── */}
      <Dialog open={showSaveDraftDialog} onOpenChange={setShowSaveDraftDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{activeDraftId ? "Update Draft" : "Save Import Draft"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Draft Name</Label>
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={`Import ${new Date().toLocaleDateString()}`}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Saves your current progress (step {step}, {mappedData.length || csvRows.length} rows) so you can resume later.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDraftDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveDraft} disabled={saveDraft.isPending}>
              {saveDraft.isPending ? "Saving..." : activeDraftId ? "Update Draft" : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import confirmation dialog */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Confirm Employee Import
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to import <strong>{toImport.length} employees</strong> into:
                </p>
                <div className="flex items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold">{orgName || "—"}</span>
                  {companies && companies.length > 0 && (
                    <span className="text-muted-foreground text-sm">({companyNames})</span>
                  )}
                  {orgType === "sandbox" && (
                    <Badge variant="warning" className="ml-1">Sandbox</Badge>
                  )}
                </div>
                <p className="text-sm">This action cannot be undone. Please verify the target organization is correct.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowImportConfirm(false); handleImport(); }}>
              Import {toImport.length} Employees
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Load Draft Dialog ─── */}
      <Dialog open={showLoadDraftDialog} onOpenChange={setShowLoadDraftDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Load Saved Draft
            </DialogTitle>
            <DialogDescription>Select a draft to resume your import</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No saved drafts</p>
            ) : (
              drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      handleLoadDraft(draft);
                      setShowLoadDraftDialog(false);
                    }}
                  >
                    <p className="text-sm font-medium truncate">{draft.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {draft.file_name} · {draft.row_count} rows · Step {draft.step} · {new Date(draft.updated_at).toLocaleDateString()}
                    </p>
                    {(draft as any).raw_csv_rows && (draft as any).raw_csv_rows.length > 0 && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">CSV data stored</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        handleLoadDraft(draft);
                        setShowLoadDraftDialog(false);
                      }}
                    >
                      Resume
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteDraft.mutate(draft.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
