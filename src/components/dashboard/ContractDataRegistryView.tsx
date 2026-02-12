import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Pen, Trash2, Plus, Save, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Positions Tab ───────────────────────────────────────────────

function PositionsTab() {
  const queryClient = useQueryClient();
  const [newEn, setNewEn] = useState("");
  const [newSv, setNewSv] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editEn, setEditEn] = useState("");
  const [editSv, setEditSv] = useState("");

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
      const { error } = await supabase.from("positions").insert({ label_en: newEn, label_sv: newSv });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setNewEn("");
      setNewSv("");
      toast.success("Position added");
    },
    onError: () => toast.error("Failed to add position"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, label_en, label_sv }: { id: string; label_en: string; label_sv: string }) => {
      const { error } = await supabase.from("positions").update({ label_en, label_sv }).eq("id", id);
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

  // Group by type_number
  const grouped = positions.reduce<Record<number, typeof positions>>((acc, p) => {
    (acc[p.type_number] = acc[p.type_number] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Add new */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Add New Item</p>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold uppercase">English Label</Label>
              <Input value={newEn} onChange={(e) => setNewEn(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Swedish Label</Label>
              <Input value={newSv} onChange={(e) => setNewSv(e.target.value)} />
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={!newEn.trim() || !newSv.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_1fr_auto] px-5 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>English</span>
            <span>Swedish</span>
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
                      <span className="text-xs text-muted-foreground ml-2">
                        / {items[0].type_label_sv}
                      </span>
                    )}
                  </div>
                  {items.map((pos) => (
                    <div key={pos.id} className="grid grid-cols-[1fr_1fr_auto] items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                      {editId === pos.id ? (
                        <>
                          <Input value={editEn} onChange={(e) => setEditEn(e.target.value)} className="h-8" />
                          <Input value={editSv} onChange={(e) => setEditSv(e.target.value)} className="h-8" />
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: pos.id, label_en: editEn, label_sv: editSv })}>
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">{pos.label_en}</span>
                          <span className="text-sm text-muted-foreground">{pos.label_sv}</span>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditId(pos.id); setEditEn(pos.label_en); setEditSv(pos.label_sv); }}>
                              <Pen className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(pos.id)}>
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
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Skill Groups Tab ────────────────────────────────────────────

function SkillGroupsTab() {
  const queryClient = useQueryClient();
  const [newEn, setNewEn] = useState("");
  const [newSv, setNewSv] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editEn, setEditEn] = useState("");
  const [editSv, setEditSv] = useState("");

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
      const { error } = await supabase.from("skill_groups").insert({ label_en: newEn, label_sv: newSv });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-groups"] });
      setNewEn("");
      setNewSv("");
      toast.success("Skill group added");
    },
    onError: () => toast.error("Failed to add skill group"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, label_en, label_sv }: { id: string; label_en: string; label_sv: string }) => {
      const { error } = await supabase.from("skill_groups").update({ label_en, label_sv }).eq("id", id);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Add New Item</p>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold uppercase">English Label</Label>
              <Input value={newEn} onChange={(e) => setNewEn(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Swedish Label</Label>
              <Input value={newSv} onChange={(e) => setNewSv(e.target.value)} />
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={!newEn.trim() || !newSv.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_1fr_auto] px-5 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>English</span>
            <span>Swedish</span>
            <span>Actions</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No skill groups added yet</div>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="grid grid-cols-[1fr_1fr_auto] items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                {editId === g.id ? (
                  <>
                    <Input value={editEn} onChange={(e) => setEditEn(e.target.value)} className="h-8" />
                    <Input value={editSv} onChange={(e) => setEditSv(e.target.value)} className="h-8" />
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: g.id, label_en: editEn, label_sv: editSv })}>
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm">{g.label_en}</span>
                    <span className="text-sm text-muted-foreground">{g.label_sv}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditId(g.id); setEditEn(g.label_en); setEditSv(g.label_sv); }}>
                        <Pen className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(g.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Salaries & Periods Tab ──────────────────────────────────────

function SalariesPeriodsTab() {
  const queryClient = useQueryClient();
  const [positionId, setPositionId] = useState("");
  const [skillGroupId, setSkillGroupId] = useState("");
  const [periodLabel, setPeriodLabel] = useState("2026/2027");
  const [monthlyRate, setMonthlyRate] = useState("0");
  const [hourlyRate, setHourlyRate] = useState("0");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2027-03-31");

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("positions").select("*").order("sort_order");
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
        .select("*, positions(label_en, label_sv), skill_groups(label_en, label_sv)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agreement_periods").insert({
        position_id: positionId,
        skill_group_id: skillGroupId,
        period_label: periodLabel,
        monthly_rate: Number(monthlyRate),
        hourly_rate: Number(hourlyRate),
        start_date: startDate,
        end_date: endDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agreement-periods"] });
      toast.success("Agreement mapping saved");
    },
    onError: () => toast.error("Failed to save mapping"),
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
    const headers = ["Position (EN)", "Position (SV)", "Skill Group (EN)", "Skill Group (SV)", "Period", "Monthly Rate (SEK)", "Hourly Rate (SEK)", "Start Date", "End Date"];
    const rows = agreements.map((a) => [
      (a as any).positions?.label_en || "",
      (a as any).positions?.label_sv || "",
      (a as any).skill_groups?.label_en || "",
      (a as any).skill_groups?.label_sv || "",
      a.period_label,
      a.monthly_rate,
      a.hourly_rate,
      a.start_date || "",
      a.end_date || "",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agreement Period Mapping</p>
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={agreements.length === 0}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Position</Label>
              <Select value={positionId} onValueChange={setPositionId}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Skill Group</Label>
              <Select value={skillGroupId} onValueChange={setSkillGroupId}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {skillGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.label_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Period Label</Label>
              <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Monthly Rate (SEK)</Label>
              <Input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Hourly Rate (SEK)</Label>
              <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!positionId || !skillGroupId}>
            <Save className="w-4 h-4 mr-2" /> Save Agreement Mapping
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1.5fr_1fr_0.7fr_0.7fr_auto] px-5 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Position / Period</span>
            <span>Skill Group</span>
            <span>Monthly</span>
            <span>Hourly</span>
            <span>Actions</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : agreements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No agreement mappings yet</div>
          ) : (
            agreements.map((a) => (
              <div key={a.id} className="grid grid-cols-[1.5fr_1fr_0.7fr_0.7fr_auto] items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">
                    {(a as any).positions?.label_en || "—"} / {(a as any).positions?.label_sv || "—"}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary">
                      📅 {a.period_label}
                    </Badge>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{(a as any).skill_groups?.label_en || "—"}</span>
                <span className="text-sm font-medium">{a.monthly_rate} <span className="text-muted-foreground text-xs">SEK</span></span>
                <span className="text-sm font-medium">{a.hourly_rate} <span className="text-muted-foreground text-xs">SEK</span></span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Backup & Restore Tab ────────────────────────────────────────

function BackupRestoreTab() {
  const handleExport = async () => {
    try {
      const [positions, skillGroups, agreements] = await Promise.all([
        supabase.from("positions").select("*"),
        supabase.from("skill_groups").select("*"),
        supabase.from("agreement_periods").select("*"),
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        positions: positions.data || [],
        skill_groups: skillGroups.data || [],
        agreement_periods: agreements.data || [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-data-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exported successfully");
    } catch {
      toast.error("Failed to export backup");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Export Data</h3>
            <p className="text-xs text-muted-foreground mb-3">Download all contract registry data as a JSON backup file.</p>
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export Backup
            </Button>
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-1">Import Data</h3>
            <p className="text-xs text-muted-foreground mb-3">Restore contract registry data from a previously exported backup file.</p>
            <Button variant="outline" disabled>
              <Upload className="w-4 h-4 mr-2" /> Import Backup
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Import functionality coming soon.</p>
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
