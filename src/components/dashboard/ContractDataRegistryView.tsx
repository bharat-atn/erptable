import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Pen, Trash2, Plus, Save, Download, Upload, FileText, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

// Language field helpers
const LANG_KEYS = ["en", "sv", "ro", "th", "uk"] as const;
const LANG_LABELS: Record<string, string> = { en: "English", sv: "Swedish", ro: "Romanian", th: "Thai", uk: "Ukrainian" };

// ─── Positions Tab ───────────────────────────────────────────────

function PositionsTab() {
  const queryClient = useQueryClient();
  const [newLabels, setNewLabels] = useState<Record<string, string>>({ en: "", sv: "", ro: "", th: "", uk: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabels, setEditLabels] = useState<Record<string, string>>({ en: "", sv: "", ro: "", th: "", uk: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("type_number")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("positions").insert({
        label_en: newLabels.en, label_sv: newLabels.sv,
        label_ro: newLabels.ro, label_th: newLabels.th, label_uk: newLabels.uk,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setNewLabels({ en: "", sv: "", ro: "", th: "", uk: "" });
      toast.success("Position added");
    },
    onError: () => toast.error("Failed to add position"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, labels }: { id: string; labels: Record<string, string> }) => {
      const { error } = await supabase.from("positions").update({
        label_en: labels.en, label_sv: labels.sv,
        label_ro: labels.ro, label_th: labels.th, label_uk: labels.uk,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setEditId(null);
      toast.success("Position updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("positions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Position deleted");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("positions").update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: () => toast.error("Failed to update position status"),
  });

  const bulkToggleMutation = useMutation({
    mutationFn: async (is_active: boolean) => {
      const ids = positions.map((p) => p.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("positions").update({ is_active } as any).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("All positions updated");
    },
    onError: () => toast.error("Failed to update positions"),
  });

  const grouped = positions.reduce<Record<number, typeof positions>>((acc, p) => {
    (acc[p.type_number] = acc[p.type_number] || []).push(p);
    return acc;
  }, {});

  const startEdit = (pos: any) => {
    setEditId(pos.id);
    setEditLabels({
      en: pos.label_en || "", sv: pos.label_sv || "",
      ro: pos.label_ro || "", th: pos.label_th || "", uk: pos.label_uk || "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Add new */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Add New Item</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {LANG_KEYS.map((lang) => (
              <div key={lang} className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase">{LANG_LABELS[lang]} Label</Label>
                <Input value={newLabels[lang]} onChange={(e) => setNewLabels(prev => ({ ...prev, [lang]: e.target.value }))} />
              </div>
            ))}
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!newLabels.en.trim() || !newLabels.sv.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Positions</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkToggleMutation.mutate(true)} disabled={bulkToggleMutation.isPending}>
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkToggleMutation.mutate(false)} disabled={bulkToggleMutation.isPending}>
                Deselect All
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] min-w-[900px] px-5 py-2 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Active</span>
              <span>English</span>
              <span>Swedish</span>
              <span>Romanian</span>
              <span>Thai</span>
              <span>Ukrainian</span>
              <span>Actions</span>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : Object.entries(grouped).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No positions added yet</div>
            ) : (
              Object.entries(grouped)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([typeNum, items]) => (
                  <div key={typeNum}>
                    <div className="px-5 py-2 bg-muted/50 border-b border-border">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Type {typeNum}: {items[0]?.type_label_en || "Uncategorized"}
                      </span>
                      {items[0]?.type_label_sv && (
                        <span className="text-xs text-muted-foreground ml-2">/ {items[0].type_label_sv}</span>
                      )}
                    </div>
                    {items.map((pos: any) => (
                      <div key={pos.id} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] min-w-[900px] items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors gap-3">
                        {editId === pos.id ? (
                          <>
                            <Checkbox
                              checked={pos.is_active !== false}
                              onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: pos.id, is_active: !!checked })}
                            />
                            {LANG_KEYS.map((lang) => (
                              <Input key={lang} value={editLabels[lang]} onChange={(e) => setEditLabels(prev => ({ ...prev, [lang]: e.target.value }))} className="h-8" />
                            ))}
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: pos.id, labels: editLabels })}>
                                <Save className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <Checkbox
                              checked={pos.is_active !== false}
                              onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: pos.id, is_active: !!checked })}
                            />
                            <span className={cn("text-sm", pos.is_active === false && "text-muted-foreground line-through")}>{pos.label_en}</span>
                            <span className={cn("text-sm text-muted-foreground", pos.is_active === false && "line-through")}>{pos.label_sv}</span>
                            <span className={cn("text-sm text-muted-foreground", pos.is_active === false && "line-through")}>{pos.label_ro || "—"}</span>
                            <span className={cn("text-sm text-muted-foreground", pos.is_active === false && "line-through")}>{pos.label_th || "—"}</span>
                            <span className={cn("text-sm text-muted-foreground", pos.is_active === false && "line-through")}>{pos.label_uk || "—"}</span>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(pos)}>
                                <Pen className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: pos.id, label: pos.label_en })}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Position"
        itemName={deleteTarget?.label || ""}
        description="This position will be removed. Any agreement periods referencing it may be affected."
        onConfirm={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Skill Groups Tab ────────────────────────────────────────────

function SkillGroupsTab() {
  const queryClient = useQueryClient();
  const [newLabels, setNewLabels] = useState<Record<string, string>>({ en: "", sv: "", ro: "", th: "", uk: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabels, setEditLabels] = useState<Record<string, string>>({ en: "", sv: "", ro: "", th: "", uk: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["skill-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skill_groups").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("skill_groups").insert({
        label_en: newLabels.en, label_sv: newLabels.sv,
        label_ro: newLabels.ro, label_th: newLabels.th, label_uk: newLabels.uk,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-groups"] });
      setNewLabels({ en: "", sv: "", ro: "", th: "", uk: "" });
      toast.success("Skill group added");
    },
    onError: () => toast.error("Failed to add skill group"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, labels }: { id: string; labels: Record<string, string> }) => {
      const { error } = await supabase.from("skill_groups").update({
        label_en: labels.en, label_sv: labels.sv,
        label_ro: labels.ro, label_th: labels.th, label_uk: labels.uk,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-groups"] });
      setEditId(null);
      toast.success("Skill group updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skill_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-groups"] });
      toast.success("Skill group deleted");
    },
  });

  const startEdit = (g: any) => {
    setEditId(g.id);
    setEditLabels({
      en: g.label_en || "", sv: g.label_sv || "",
      ro: g.label_ro || "", th: g.label_th || "", uk: g.label_uk || "",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Add New Item</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {LANG_KEYS.map((lang) => (
              <div key={lang} className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase">{LANG_LABELS[lang]} Label</Label>
                <Input value={newLabels[lang]} onChange={(e) => setNewLabels(prev => ({ ...prev, [lang]: e.target.value }))} />
              </div>
            ))}
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!newLabels.en.trim() || !newLabels.sv.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] min-w-[800px] px-5 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>English</span>
              <span>Swedish</span>
              <span>Romanian</span>
              <span>Thai</span>
              <span>Ukrainian</span>
              <span>Actions</span>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : groups.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No skill groups added yet</div>
            ) : (
              groups.map((g: any) => (
                <div key={g.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] min-w-[800px] items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                  {editId === g.id ? (
                    <>
                      {LANG_KEYS.map((lang) => (
                        <Input key={lang} value={editLabels[lang]} onChange={(e) => setEditLabels(prev => ({ ...prev, [lang]: e.target.value }))} className="h-8" />
                      ))}
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: g.id, labels: editLabels })}>
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">{g.label_en}</span>
                      <span className="text-sm text-muted-foreground">{g.label_sv}</span>
                      <span className="text-sm text-muted-foreground">{g.label_ro || "—"}</span>
                      <span className="text-sm text-muted-foreground">{g.label_th || "—"}</span>
                      <span className="text-sm text-muted-foreground">{g.label_uk || "—"}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(g)}>
                          <Pen className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: g.id, label: g.label_en })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Skill Group"
        itemName={deleteTarget?.label || ""}
        description="This skill group will be removed. Any agreement periods referencing it may be affected."
        onConfirm={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Salaries & Periods Tab ──────────────────────────────────────

function SalariesPeriodsTab() {
  const queryClient = useQueryClient();
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterSkillGroup, setFilterSkillGroup] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterAge, setFilterAge] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("positions").select("*").order("label_en");
      if (error) throw error;
      return data;
    },
  });

  const { data: skillGroups = [] } = useQuery({
    queryKey: ["skill-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skill_groups").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ["agreement-periods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agreement_periods")
        .select("*, positions(label_en, label_sv, label_ro, label_th, label_uk), skill_groups(label_en, label_sv, label_ro, label_th, label_uk)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agreement_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agreement-periods"] });
      toast.success("Mapping deleted");
    },
  });

  const handleExportCsv = () => {
    if (agreements.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Position (EN)", "Position (SV)", "Position (RO)", "Position (TH)", "Position (UK)",
      "Skill Group (EN)", "Skill Group (SV)", "Skill Group (RO)", "Skill Group (TH)", "Skill Group (UK)",
      "Period", "Age Group", "Monthly Rate (SEK)", "Hourly Rate (SEK)", "Start Date", "End Date"
    ];
    const rows = filteredAgreements.map((a: any) => [
      a.positions?.label_en || "", a.positions?.label_sv || "", a.positions?.label_ro || "", a.positions?.label_th || "", a.positions?.label_uk || "",
      a.skill_groups?.label_en || "", a.skill_groups?.label_sv || "", a.skill_groups?.label_ro || "", a.skill_groups?.label_th || "", a.skill_groups?.label_uk || "",
      a.period_label, ageGroupLabel(a.age_group || "19_plus"),
      a.monthly_rate, a.hourly_rate, a.start_date || "", a.end_date || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salaries-periods-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const ageGroupLabel = (ag: string) => {
    switch (ag) {
      case "19_plus": return "19+ years";
      case "18": return "Age 18";
      case "17": return "Age 17";
      case "16": return "Age 16";
      default: return ag;
    }
  };

  const uniquePeriods = [...new Set(agreements.map((a) => a.period_label))].sort();
  const uniqueAgeGroups = [...new Set(agreements.map((a) => (a as any).age_group || "19_plus"))].sort();

  const filteredAgreements = agreements.filter((a) => {
    if (filterPosition !== "all" && a.position_id !== filterPosition) return false;
    if (filterSkillGroup !== "all" && a.skill_group_id !== filterSkillGroup) return false;
    if (filterPeriod !== "all" && a.period_label !== filterPeriod) return false;
    if (filterAge !== "all" && ((a as any).age_group || "19_plus") !== filterAge) return false;
    return true;
  });

  const hasActiveFilters = filterPosition !== "all" || filterSkillGroup !== "all" || filterPeriod !== "all" || filterAge !== "all";

  const clearFilters = () => {
    setFilterPosition("all");
    setFilterSkillGroup("all");
    setFilterPeriod("all");
    setFilterAge("all");
  };

  return (
    <div className="space-y-6">
      {/* PDF Reference */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-foreground">Collective Agreement Reference</p>
                <p className="text-xs text-muted-foreground mt-0.5">Kollektivavtal Skogsbruk — Skogsavtalet Lönedata (2025-04-01 – 2027-03-31)</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2" asChild>
              <a href="/documents/kollektivavtal-skogsbruk-lonedata-2025-2027.pdf" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" /> View PDF
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agreement Lookup</p>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                  Clear Filters
                </Button>
              )}
              <Badge variant="secondary">{filteredAgreements.length} of {agreements.length} records</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Position</Label>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Skill Group</Label>
              <Select value={filterSkillGroup} onValueChange={setFilterSkillGroup}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skill Groups</SelectItem>
                  {skillGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.label_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Period</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {uniquePeriods.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Age Group</Label>
              <Select value={filterAge} onValueChange={setFilterAge}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  {uniqueAgeGroups.map((ag) => (
                    <SelectItem key={ag} value={ag}>{ageGroupLabel(ag)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExportCsv} disabled={filteredAgreements.length === 0} className="gap-2">
          <Download className="w-4 h-4" /> Export Filtered CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1.5fr_1fr_0.5fr_0.7fr_0.7fr_auto] px-5 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Position / Period</span>
            <span>Skill Group</span>
            <span>Age</span>
            <span>Monthly</span>
            <span>Hourly</span>
            <span>Actions</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : filteredAgreements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No agreement mappings match the filter</div>
          ) : (
            filteredAgreements.map((a: any) => (
              <div key={a.id} className="grid grid-cols-[1.5fr_1fr_0.5fr_0.7fr_0.7fr_auto] items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">
                    {a.positions?.label_en || "—"} / {a.positions?.label_sv || "—"}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary">
                      📅 {a.period_label}
                    </Badge>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{a.skill_groups?.label_en || "—"}</span>
                <span className="text-xs">
                  <Badge variant={a.age_group === "19_plus" || !a.age_group ? "default" : "secondary"} className="text-[10px]">
                    {ageGroupLabel(a.age_group || "19_plus")}
                  </Badge>
                </span>
                <span className="text-sm font-medium">{a.monthly_rate > 0 ? formatCurrency(a.monthly_rate, "SEK", 0) : "—"}</span>
                <span className="text-sm font-medium">{formatCurrency(a.hourly_rate, "SEK", 2)}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: a.id, label: `${a.positions?.label_en || "—"} / ${a.skill_groups?.label_en || "—"}` })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Agreement Period"
        itemName={deleteTarget?.label || ""}
        description="This salary/period mapping will be permanently removed."
        onConfirm={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Backup & Restore Tab ────────────────────────────────────────

function BackupRestoreTab() {
  const [exporting, setExporting] = useState(false);

  const escapeCsvValue = (val: string | number | null | undefined): string => {
    if (val == null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleCsvExport = async () => {
    setExporting(true);
    try {
      const [positions, skillGroups, agreements] = await Promise.all([
        supabase.from("positions").select("*").order("sort_order"),
        supabase.from("skill_groups").select("*").order("sort_order"),
        supabase.from("agreement_periods").select("*"),
      ]);

      const posData = (positions.data || []) as any[];
      const sgData = (skillGroups.data || []) as any[];
      const apData = agreements.data || [];

      const posMap = new Map(posData.map((p: any) => [p.id, p]));
      const sgMap = new Map(sgData.map((s: any) => [s.id, s]));

      // --- Sheet 1: Positions ---
      const posHeaders = ["id", "type_number", "label_en", "label_sv", "label_ro", "label_th", "label_uk", "type_label_en", "type_label_sv", "type_label_ro", "type_label_th", "type_label_uk", "is_active", "sort_order", "created_at", "updated_at"];
      const posRows = posData.map((p: any) => posHeaders.map(h => escapeCsvValue(p[h])).join(","));

      // --- Sheet 2: Skill Groups ---
      const sgHeaders = ["id", "label_en", "label_sv", "label_ro", "label_th", "label_uk", "sort_order", "created_at", "updated_at"];
      const sgRows = sgData.map((s: any) => sgHeaders.map(h => escapeCsvValue(s[h])).join(","));

      // --- Sheet 3: Agreement Periods (with resolved names) ---
      const apHeaders = [
        "id", "position_id",
        "position_label_en", "position_label_sv", "position_label_ro", "position_label_th", "position_label_uk",
        "skill_group_id",
        "skill_group_label_en", "skill_group_label_sv", "skill_group_label_ro", "skill_group_label_th", "skill_group_label_uk",
        "period_label", "monthly_rate", "hourly_rate", "start_date", "end_date", "created_at", "updated_at"
      ];
      const apRows = apData.map(a => {
        const pos = posMap.get(a.position_id) as any;
        const sg = sgMap.get(a.skill_group_id) as any;
        return [
          escapeCsvValue(a.id), escapeCsvValue(a.position_id),
          escapeCsvValue(pos?.label_en), escapeCsvValue(pos?.label_sv), escapeCsvValue(pos?.label_ro), escapeCsvValue(pos?.label_th), escapeCsvValue(pos?.label_uk),
          escapeCsvValue(a.skill_group_id),
          escapeCsvValue(sg?.label_en), escapeCsvValue(sg?.label_sv), escapeCsvValue(sg?.label_ro), escapeCsvValue(sg?.label_th), escapeCsvValue(sg?.label_uk),
          escapeCsvValue(a.period_label), escapeCsvValue(a.monthly_rate), escapeCsvValue(a.hourly_rate),
          escapeCsvValue(a.start_date), escapeCsvValue(a.end_date),
          escapeCsvValue(a.created_at), escapeCsvValue(a.updated_at),
        ].join(",");
      });

      const lines: string[] = [];
      lines.push("### POSITIONS ###");
      lines.push(posHeaders.join(","));
      lines.push(...posRows);
      lines.push("");
      lines.push("### SKILL GROUPS ###");
      lines.push(sgHeaders.join(","));
      lines.push(...sgRows);
      lines.push("");
      lines.push("### AGREEMENT PERIODS ###");
      lines.push(apHeaders.join(","));
      lines.push(...apRows);

      const csv = lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-data-backup-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV backup exported successfully");
    } catch {
      toast.error("Failed to export CSV backup");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Export Data (CSV)</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Download all contract registry data (positions, skill groups, agreement periods) as a single CSV file. 
              The file includes resolved names in all 5 languages for easy use in other systems like Excel.
            </p>
            <Button onClick={handleCsvExport} variant="outline" disabled={exporting}>
              <Download className="w-4 h-4 mr-2" /> {exporting ? "Exporting..." : "Export CSV Backup"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────

export function ContractDataRegistryView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Contract Data Registry</h1>
          <p className="text-muted-foreground text-sm">Maintain job positions, historical rates, and manage database backups.</p>
        </div>
      </div>

      <Tabs defaultValue="positions">
        <TabsList className="w-full justify-start bg-card border border-border rounded-lg p-1">
          <TabsTrigger value="positions" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Positions</TabsTrigger>
          <TabsTrigger value="skill-groups" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Skill Groups</TabsTrigger>
          <TabsTrigger value="salaries" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Salaries & Periods</TabsTrigger>
          <TabsTrigger value="backup" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Backup & Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="positions"><PositionsTab /></TabsContent>
        <TabsContent value="skill-groups"><SkillGroupsTab /></TabsContent>
        <TabsContent value="salaries"><SalariesPeriodsTab /></TabsContent>
        <TabsContent value="backup"><BackupRestoreTab /></TabsContent>
      </Tabs>
    </div>
  );
}
