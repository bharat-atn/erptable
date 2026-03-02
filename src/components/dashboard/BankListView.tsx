import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Landmark,
  Plus,
  Trash2,
  Pencil,
  Download,
  Upload,
  Loader2,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { EnhancedTable, type ColumnDef } from "@/components/ui/enhanced-table";
import { useUiLanguage } from "@/hooks/useUiLanguage";

interface Bank {
  id: string;
  name: string;
  bic_code: string | null;
  country: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

/* ── Add / Edit Dialog ──────────────────────────────────────────── */

function BankFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Bank | null;
  onSave: (data: { name: string; bic_code: string; country: string }) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bicCode, setBicCode] = useState(initial?.bic_code ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");

  const isEdit = !!initial;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Bank" : "Add Bank"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Bank Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Swedbank AB" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>BIC / SWIFT Code</Label>
            <Input value={bicCode} onChange={(e) => setBicCode(e.target.value)} placeholder="e.g. SWEDSESS" />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Sweden" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => onSave({ name: name.trim(), bic_code: bicCode.trim(), country: country.trim() })}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {isEdit ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── CSV Import Dialog ──────────────────────────────────────────── */

function CsvImportPreview({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImport: (rows: { name: string; bic_code: string; country: string }[]) => void;
}) {
  const [rows, setRows] = useState<{ name: string; bic_code: string; country: string }[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setError("CSV must have a header row and at least one data row");
        return;
      }
      const header = lines[0].toLowerCase();
      if (!header.includes("name")) {
        setError('CSV must have a "name" column');
        return;
      }
      const cols = lines[0].split(",").map((c) => c.trim().toLowerCase().replace(/['"]/g, ""));
      const nameIdx = cols.indexOf("name");
      const bicIdx = cols.findIndex((c) => c === "bic_code" || c === "bic code" || c === "bic/swift" || c === "swift");
      const countryIdx = cols.indexOf("country");

      const parseCsvLine = (line: string): string[] => {
        const values: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') { inQuotes = !inQuotes; }
          else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
          else { current += char; }
        }
        values.push(current.trim());
        return values;
      };

      const parsed = lines.slice(1).map((line) => {
        const parts = parseCsvLine(line);
        return {
          name: parts[nameIdx] || "",
          bic_code: bicIdx >= 0 ? parts[bicIdx] || "" : "",
          country: countryIdx >= 0 ? parts[countryIdx] || "" : "",
        };
      }).filter((r) => r.name);

      setRows(parsed);
      setError("");
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setRows([]); setError(""); } onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Import Banks from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">bic_code</code> (optional), <code className="text-xs bg-muted px-1 py-0.5 rounded">country</code> (optional).
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" /> Select CSV File
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {rows.length > 0 && (
            <div className="border rounded-lg max-h-60 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-left px-3 py-2 font-medium">BIC Code</th>
                    <th className="text-left px-3 py-2 font-medium">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-1.5">{r.name}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.bic_code || "—"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.country || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={rows.length === 0} onClick={() => onImport(rows)} className="gap-2">
            <Upload className="w-4 h-4" /> Import {rows.length} Bank{rows.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main View ──────────────────────────────────────────────────── */

export function BankListView() {
  const { t } = useUiLanguage();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editBank, setEditBank] = useState<Bank | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);
  const { data: banks = [], isLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Bank[];
    },
  });

  const [countryFilter, setCountryFilter] = useState<string>("all");

  const uniqueCountries = Array.from(
    new Set(banks.map((b) => b.country).filter(Boolean) as string[])
  ).sort();

  const filteredBanks = countryFilter === "all"
    ? banks
    : banks.filter((b) => b.country === countryFilter);

  const addBank = useMutation({
    mutationFn: async (input: { name: string; bic_code: string; country: string }) => {
      const { error } = await supabase.from("banks").insert({
        name: input.name,
        bic_code: input.bic_code || null,
        country: input.country || null,
        sort_order: banks.length + 1,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setFormOpen(false);
      toast.success("Bank added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateBank = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name: string; bic_code: string; country: string }) => {
      const { error } = await supabase.from("banks").update({
        name: input.name,
        bic_code: input.bic_code || null,
        country: input.country || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setEditBank(null);
      toast.success("Bank updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBank = useMutation({
    mutationFn: async (bank: Bank) => {
      const { error } = await supabase.from("banks").delete().eq("id", bank.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setDeleteTarget(null);
      toast.success("Bank deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("banks").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banks"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const importBanks = useMutation({
    mutationFn: async (rows: { name: string; bic_code: string; country: string }[]) => {
      let added = 0;
      for (const row of rows) {
        const { error } = await supabase.from("banks").insert({
          name: row.name,
          bic_code: row.bic_code || null,
          country: row.country || null,
          sort_order: banks.length + added + 1,
        } as any);
        if (!error) added++;
      }
      return added;
    },
    onSuccess: (added) => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setImportOpen(false);
      toast.success(`${added} bank(s) imported`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCsv = () => {
    const header = "name,bic_code,country,is_active";
    const rows = banks.map((b) =>
      `"${b.name}","${b.bic_code || ""}","${b.country || ""}",${b.is_active}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "banks.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const downloadTemplate = () => {
    const csv = "name,bic_code,country\nExample Bank AB,EXABSESS,Sweden\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "banks-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const DEFAULT_BANKS = [
    { name: "Swedbank", bic_code: "SWEDSESS", country: "Sweden" },
    { name: "SEB", bic_code: "ESSESESS", country: "Sweden" },
    { name: "Nordea", bic_code: "NDEASESS", country: "Sweden" },
    { name: "Handelsbanken", bic_code: "HANDSESS", country: "Sweden" },
    { name: "BANCA TRANSILVANIA S.A.", bic_code: "BTRLRO22", country: "Romania" },
    { name: "Banca Comercială Română S.A.", bic_code: "RNCBROBU", country: "Romania" },
    { name: "BRD - Groupe Société Générale S.A.", bic_code: "BRDEROBU", country: "Romania" },
    { name: "CEC BANK S.A.", bic_code: "CECEROBU", country: "Romania" },
    { name: "ING Bank NV, Amsterdam - Bucharest Branch", bic_code: "INGBROBU", country: "Romania" },
    { name: "UniCredit Bank S.A.", bic_code: "BACXROBU", country: "Romania" },
    { name: "RAIFFEISEN BANK S.A.", bic_code: "RZBRROBU", country: "Romania" },
    { name: "Bangkok Bank", bic_code: "BKKBTHBK", country: "Thailand" },
    { name: "Kasikornbank", bic_code: "KASITHBK", country: "Thailand" },
    { name: "Krungthai Bank", bic_code: "KRTHTHBK", country: "Thailand" },
    { name: "Siam Commercial Bank", bic_code: "SICOTHBK", country: "Thailand" },
    { name: "maib", bic_code: "AGRNMD2X", country: "Moldova" },
    { name: "Moldindconbank", bic_code: "MOLDMD2X", country: "Moldova" },
    { name: "OTP Bank Moldova", bic_code: "OTPVMD22", country: "Moldova" },
    { name: "Victoriabank", bic_code: "VICBMD2X", country: "Moldova" },
    { name: "PrivatBank", bic_code: "PBANUA2X", country: "Ukraine" },
    { name: "Monobank", bic_code: "UABORUA", country: "Ukraine" },
    { name: "PUMB", bic_code: "FUIBUA2X", country: "Ukraine" },
    { name: "Oschadbank", bic_code: "ABORUA2X", country: "Ukraine" },
    { name: "Raiffeisen Bank Aval", bic_code: "AVALUA2X", country: "Ukraine" },
  ];

  const seedDefaultBanks = async () => {
    setSeedingDefaults(true);
    try {
      const existingNames = new Set(banks.map((b) => b.name.toLowerCase()));
      const toInsert = DEFAULT_BANKS.filter((b) => !existingNames.has(b.name.toLowerCase()));
      if (toInsert.length === 0) {
        toast.info("All default banks already exist in the registry");
        return;
      }
      let added = 0;
      for (const row of toInsert) {
        const { error } = await supabase.from("banks").insert({
          name: row.name,
          bic_code: row.bic_code,
          country: row.country,
          sort_order: banks.length + added + 1,
        } as any);
        if (!error) added++;
      }
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success(`${added} default bank(s) added`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSeedingDefaults(false);
    }
  };

  const columns: ColumnDef<Bank>[] = [
    {
      key: "name",
      header: "Bank Name",
      accessor: (b) => b.name,
      hideable: false,
      render: (b, hl) => <span className="font-medium text-sm">{hl?.(b.name) ?? b.name}</span>,
    },
    {
      key: "bic_code",
      header: "BIC / SWIFT",
      accessor: (b) => b.bic_code,
      render: (b, hl) => <span className="text-sm text-muted-foreground font-mono">{hl?.(b.bic_code || "—") ?? b.bic_code ?? "—"}</span>,
    },
    {
      key: "country",
      header: "Country",
      accessor: (b) => b.country,
      render: (b, hl) => <span className="text-sm">{hl?.(b.country || "—") ?? b.country ?? "—"}</span>,
    },
    {
      key: "is_active",
      header: "Active",
      accessor: (b) => b.is_active ? "Active" : "Inactive",
      render: (b) => (
        <Switch
          checked={b.is_active}
          onCheckedChange={(checked) => toggleActive.mutate({ id: b.id, is_active: checked })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" />
            {t("page.bankList.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("page.bankList.desc")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={seedDefaultBanks} disabled={seedingDefaults} className="gap-1.5">
            {seedingDefaults ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Landmark className="w-3.5 h-3.5" />}
            Seed Default Banks
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
            <FileDown className="w-3.5 h-3.5" /> Template
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Import
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Bank
          </Button>
        </div>
      </div>

      {uniqueCountries.length > 1 && (
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Country:</Label>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {uniqueCountries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <EnhancedTable<Bank>
        data={filteredBanks}
        columns={columns}
        rowKey={(b) => b.id}
        defaultSortKey="name"
        isLoading={isLoading}
        emptyMessage="No banks configured yet"
        searchPlaceholder="Search banks..."
        enableColumnToggle
        enableHighlight
        rowActions={(bank) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditBank(bank)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteTarget(bank)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      />

      {/* Add Dialog */}
      <BankFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={(data) => addBank.mutate(data)}
        isSaving={addBank.isPending}
      />

      {/* Edit Dialog */}
      {editBank && (
        <BankFormDialog
          open={!!editBank}
          onOpenChange={(o) => !o && setEditBank(null)}
          initial={editBank}
          onSave={(data) => updateBank.mutate({ id: editBank.id, ...data })}
          isSaving={updateBank.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Bank"
        itemName={deleteTarget?.name ?? ""}
        description="This bank will be removed from the selection list in the invitation template."
        onConfirm={() => deleteTarget && deleteBank.mutate(deleteTarget)}
        isLoading={deleteBank.isPending}
        requireTypedConfirmation
      />

      {/* CSV Import */}
      <CsvImportPreview
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(rows) => importBanks.mutate(rows)}
      />
    </div>
  );
}
