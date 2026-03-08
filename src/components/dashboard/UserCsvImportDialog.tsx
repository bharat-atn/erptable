import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, FileText, CheckCircle2, XCircle, AlertTriangle, ArrowRight, ArrowLeft, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppDefinition } from "./AppLauncher";

interface UserCsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apps: AppDefinition[];
  allOrgs: { id: string; name: string; org_type: string }[];
}

interface ParsedRow {
  _idx: number;
  email: string;
  full_name: string;
  role: string;
  _selected: boolean;
  _status: "valid" | "invalid" | "duplicate";
  _errors: string[];
  _editing?: { field: string; value: string };
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Super Admin" },
  { value: "org_admin", label: "Admin" },
  { value: "user", label: "Standard User" },
  { value: "team_leader", label: "Team Leader" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "project_manager", label: "Project Manager" },
  { value: "payroll_manager", label: "Payroll Manager" },
];

const VALID_ROLES = new Set(ROLE_OPTIONS.map(r => r.value));
const roleLabel = (r: string) => ROLE_OPTIONS.find(o => o.value === r)?.label ?? r;

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ""; });
    return row;
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UserCsvImportDialog({ open, onClose, onSuccess, apps, allOrgs }: UserCsvImportDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const [editCell, setEditCell] = useState<{ idx: number; field: "email" | "full_name" | "role" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "invalid" | "duplicate">("all");

  const downloadTemplate = () => {
    const csv = "email,full_name,role\nuser@company.com,John Doe,user\nadmin@company.com,Jane Smith,org_admin\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rawRows = parseCSV(text);
    if (rawRows.length === 0) {
      toast({ title: "No data rows found in CSV", variant: "destructive" });
      return;
    }

    // Fetch existing emails for duplicate detection
    const [{ data: profilesData }, { data: pendingData }] = await Promise.all([
      supabase.from("profiles").select("email"),
      supabase.from("pending_role_assignments").select("email"),
    ]);
    const existing = new Set<string>();
    profilesData?.forEach(p => { if (p.email) existing.add(p.email.toLowerCase()); });
    pendingData?.forEach(p => { if (p.email) existing.add(p.email.toLowerCase()); });
    setExistingEmails(existing);

    const parsed: ParsedRow[] = rawRows.map((r, i) => {
      const email = (r.email || "").trim().toLowerCase();
      const full_name = (r.full_name || r.name || "").trim();
      const role = (r.role || "user").trim().toLowerCase();
      const errors: string[] = [];

      if (!email) errors.push("Email is required");
      else if (!EMAIL_RE.test(email)) errors.push("Invalid email format");
      if (!VALID_ROLES.has(role)) errors.push(`Invalid role: ${role}`);
      const isDuplicate = existing.has(email);
      if (isDuplicate) errors.push("Email already exists");

      return {
        _idx: i,
        email,
        full_name,
        role: VALID_ROLES.has(role) ? role : "user",
        _selected: errors.length === 0,
        _status: isDuplicate ? "duplicate" : errors.length > 0 ? "invalid" : "valid",
        _errors: errors,
      };
    });

    setRows(parsed);
    setStep(2);
  };

  const toggleRow = (idx: number) => {
    setRows(prev => prev.map(r => r._idx === idx ? { ...r, _selected: !r._selected } : r));
  };

  const selectAllValid = () => {
    setRows(prev => prev.map(r => ({ ...r, _selected: r._status === "valid" })));
  };

  const deselectDuplicates = () => {
    setRows(prev => prev.map(r => r._status === "duplicate" ? { ...r, _selected: false } : r));
  };

  const setBulkRole = (role: string) => {
    setRows(prev => prev.map(r => r._selected ? { ...r, role } : r));
  };

  const startEdit = (idx: number, field: "email" | "full_name") => {
    const row = rows.find(r => r._idx === idx);
    if (!row) return;
    setEditCell({ idx, field });
    setEditValue(row[field]);
  };

  const commitEdit = () => {
    if (!editCell) return;
    const { idx, field } = editCell;
    setRows(prev => prev.map(r => {
      if (r._idx !== idx) return r;
      const updated = { ...r, [field]: editValue.trim() };
      // Re-validate
      const errors: string[] = [];
      if (!updated.email) errors.push("Email is required");
      else if (!EMAIL_RE.test(updated.email)) errors.push("Invalid email format");
      if (!VALID_ROLES.has(updated.role)) errors.push(`Invalid role: ${updated.role}`);
      const isDuplicate = existingEmails.has(updated.email.toLowerCase());
      if (isDuplicate) errors.push("Email already exists");
      updated._errors = errors;
      updated._status = isDuplicate ? "duplicate" : errors.length > 0 ? "invalid" : "valid";
      return updated;
    }));
    setEditCell(null);
    setEditValue("");
  };

  const updateRowRole = (idx: number, role: string) => {
    setRows(prev => prev.map(r => r._idx === idx ? { ...r, role } : r));
  };

  const filteredRows = useMemo(() => {
    if (filterStatus === "all") return rows;
    return rows.filter(r => r._status === filterStatus);
  }, [rows, filterStatus]);

  const stats = useMemo(() => {
    const selected = rows.filter(r => r._selected).length;
    const valid = rows.filter(r => r._status === "valid").length;
    const invalid = rows.filter(r => r._status === "invalid").length;
    const duplicate = rows.filter(r => r._status === "duplicate").length;
    return { total: rows.length, selected, valid, invalid, duplicate };
  }, [rows]);

  const toggleOrg = (id: string) => {
    setSelectedOrgs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleApp = (id: string) => {
    setSelectedApps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    const toImport = rows.filter(r => r._selected && r._status !== "invalid");
    if (toImport.length === 0) return;

    setImporting(true);
    setImportProgress(0);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      try {
        const { data, error } = await supabase.functions.invoke("invite-user", {
          body: {
            email: row.email,
            full_name: row.full_name || row.email,
            role: row.role,
            app_access: Array.from(selectedApps),
            org_ids: Array.from(selectedOrgs),
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`${row.email}: ${err.message}`);
      }
      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    setImportResults(results);
    setImporting(false);
    setStep(4);
    if (results.success > 0) onSuccess();
  };

  const handleClose = () => {
    setStep(1);
    setRows([]);
    setExistingEmails(new Set());
    setSelectedOrgs(new Set());
    setSelectedApps(new Set());
    setImporting(false);
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0, errors: [] });
    setEditCell(null);
    setFilterStatus("all");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Users from CSV
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Upload a CSV file to bulk-import users."}
            {step === 2 && "Review, filter, and clean data before importing."}
            {step === 3 && "Choose organization and app access for imported users."}
            {step === 4 && "Import complete."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-1 shrink-0">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              s <= step ? "text-primary" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                s === step ? "bg-primary text-primary-foreground" : s < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>{s}</div>
              <span className="hidden sm:inline">{["Upload", "Review", "Assign", "Done"][s - 1]}</span>
              {s < 4 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto py-2">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-3">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Select a CSV file with user data</p>
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" asChild>
                    <span className="gap-2"><Upload className="w-4 h-4" />Choose File</span>
                  </Button>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Required columns: <code className="bg-muted px-1 rounded">email</code>. Optional: <code className="bg-muted px-1 rounded">full_name</code>, <code className="bg-muted px-1 rounded">role</code>
                </p>
                <Button variant="ghost" size="sm" className="gap-2 text-xs" onClick={downloadTemplate}>
                  <Download className="w-3.5 h-3.5" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Data Washing */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Summary bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="gap-1">
                  {stats.selected} of {stats.total} selected
                </Badge>
                <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
                  <CheckCircle2 className="w-3 h-3" /> {stats.valid} valid
                </Badge>
                {stats.invalid > 0 && (
                  <Badge variant="outline" className="gap-1 text-red-700 border-red-300">
                    <XCircle className="w-3 h-3" /> {stats.invalid} errors
                  </Badge>
                )}
                {stats.duplicate > 0 && (
                  <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300">
                    <AlertTriangle className="w-3 h-3" /> {stats.duplicate} duplicates
                  </Badge>
                )}
              </div>

              {/* Bulk actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={selectAllValid}>Select All Valid</Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={deselectDuplicates}>Deselect Duplicates</Button>
                <Select onValueChange={setBulkRole}>
                  <SelectTrigger className="h-7 w-[180px] text-xs">
                    <SelectValue placeholder="Set role for selected…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Filter */}
                <div className="ml-auto flex gap-1">
                  {(["all", "valid", "invalid", "duplicate"] as const).map(f => (
                    <Button key={f} variant={filterStatus === f ? "default" : "ghost"} size="sm" className="text-xs h-7 px-2" onClick={() => setFilterStatus(f)}>
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="border border-border rounded-lg overflow-auto max-h-[40vh]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="w-10 p-2"></th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Status</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Email</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Name</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map(row => (
                      <tr key={row._idx} className={cn("border-t border-border hover:bg-muted/30", !row._selected && "opacity-50")}>
                        <td className="p-2 text-center">
                          <Checkbox checked={row._selected} onCheckedChange={() => toggleRow(row._idx)} />
                        </td>
                        <td className="p-2">
                          {row._status === "valid" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          {row._status === "invalid" && (
                            <span title={row._errors.join(", ")}><XCircle className="w-4 h-4 text-red-500" /></span>
                          )}
                          {row._status === "duplicate" && (
                            <span title={row._errors.join(", ")}><AlertTriangle className="w-4 h-4 text-amber-500" /></span>
                          )}
                        </td>
                        <td className="p-2">
                          {editCell?.idx === row._idx && editCell.field === "email" ? (
                            <Input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => e.key === "Enter" && commitEdit()}
                              className="h-7 text-xs"
                              autoFocus
                            />
                          ) : (
                            <span
                              className={cn("cursor-pointer hover:underline", row._errors.some(e => e.includes("email")) && "text-red-600")}
                              onClick={() => startEdit(row._idx, "email")}
                            >
                              {row.email || <span className="italic text-muted-foreground">empty</span>}
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {editCell?.idx === row._idx && editCell.field === "full_name" ? (
                            <Input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => e.key === "Enter" && commitEdit()}
                              className="h-7 text-xs"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:underline"
                              onClick={() => startEdit(row._idx, "full_name")}
                            >
                              {row.full_name || <span className="italic text-muted-foreground">—</span>}
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          <Select value={row.role} onValueChange={v => updateRowRole(row._idx, v)}>
                            <SelectTrigger className="h-7 text-xs w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRows.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No rows match the current filter.</p>
              )}
            </div>
          )}

          {/* Step 3: Org & App Assignment */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Access</Label>
                <div className="rounded-lg border border-border p-3 space-y-2 max-h-40 overflow-y-auto">
                  {allOrgs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No organizations available</p>
                  ) : (
                    allOrgs.map(org => (
                      <label key={org.id} className="flex items-center gap-3 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                        <Checkbox checked={selectedOrgs.has(org.id)} onCheckedChange={() => toggleOrg(org.id)} />
                        <span className="text-sm">{org.name}</span>
                        <Badge variant={org.org_type === "production" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 ml-auto">
                          {org.org_type}
                        </Badge>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Application Access</Label>
                <div className="rounded-lg border border-border p-3 space-y-2 max-h-40 overflow-y-auto">
                  {apps.filter(a => a.enabled && a.id !== "user-management").map(app => (
                    <label key={app.id} className="flex items-center gap-3 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={selectedApps.has(app.id)} onCheckedChange={() => toggleApp(app.id)} />
                      <span className="text-sm">{app.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 border border-border p-3">
                <p className="text-sm font-medium">{stats.selected} user(s) will be imported</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each user will be invited via the standard invitation flow with email notification.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <div className="space-y-4">
              {importing ? (
                <div className="space-y-3 py-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Importing users… {importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">Import Complete</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between p-2 rounded bg-green-50 border border-green-200">
                        <span className="text-green-700">Successful</span>
                        <span className="font-medium text-green-800">{importResults.success}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-red-50 border border-red-200">
                        <span className="text-red-700">Failed</span>
                        <span className="font-medium text-red-800">{importResults.failed}</span>
                      </div>
                    </div>
                  </div>

                  {importResults.errors.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1 max-h-40 overflow-y-auto">
                      <p className="text-xs font-medium text-red-700">Errors:</p>
                      {importResults.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-600">{err}</p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t pt-3 gap-2">
          {step === 1 && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={stats.selected === 0}
                className="gap-1"
              >
                Next: Assign Access <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)} className="gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
              <Button
                onClick={() => { setStep(4); handleImport(); }}
                disabled={stats.selected === 0}
                className="gap-1"
              >
                <Users className="w-4 h-4" /> Import {stats.selected} User(s)
              </Button>
            </>
          )}
          {step === 4 && !importing && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
