import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Check, Copy, Download, Upload, Search, RotateCcw, Lock, BarChart3, Settings2, Star, Pencil } from "lucide-react";
import { formatNumber } from "@/lib/format-currency";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface CompGroup {
  id: string;
  org_id: string;
  name: string;
  category: string;
  method: string;
  sort_order: number;
}

interface CompGroupClass {
  id: string;
  org_id: string;
  group_id: string;
  sla_class_id: string;
  type_label: string;
  client: string;
  star_1: number;
  star_2: number;
  star_3: number;
  star_4: number;
  star_5: number;
  hourly_gross: number;
  sort_order: number;
}

interface CompGroupType {
  id: string;
  org_id: string;
  group_id: string;
  label: string;
  sort_order: number;
}

/* Default seed data matching the screenshot */
const DEFAULT_GROUPS = [
  { name: "Comp. group clearing hourly salary", category: "clearing", method: "hourly", sort_order: 0 },
  { name: "Comp. group clearing piece work", category: "clearing", method: "piecework", sort_order: 1 },
  { name: "Comp. group planting hourly salary", category: "planting", method: "hourly", sort_order: 2 },
  { name: "Comp. group planting piece work", category: "planting", method: "piecework", sort_order: 3 },
];

const DEFAULT_CLASSES = [
  { sla_class_id: "104", star_1: 125, star_2: 135, star_3: 145, star_4: 155, star_5: 170, hourly_gross: 145, sort_order: 0 },
  { sla_class_id: "105", star_1: 130, star_2: 140, star_3: 150, star_4: 160, star_5: 175, hourly_gross: 150, sort_order: 1 },
  { sla_class_id: "106", star_1: 135, star_2: 145, star_3: 155, star_4: 165, star_5: 180, hourly_gross: 155, sort_order: 2 },
  { sla_class_id: "107", star_1: 140, star_2: 150, star_3: 160, star_4: 170, star_5: 185, hourly_gross: 160, sort_order: 3 },
  { sla_class_id: "108", star_1: 145, star_2: 155, star_3: 165, star_4: 175, star_5: 190, hourly_gross: 165, sort_order: 4 },
  { sla_class_id: "109", star_1: 150, star_2: 160, star_3: 170, star_4: 180, star_5: 195, hourly_gross: 170, sort_order: 5 },
  { sla_class_id: "110", star_1: 155, star_2: 165, star_3: 175, star_4: 185, star_5: 200, hourly_gross: 175, sort_order: 6 },
];

const ALL_SLA_IDS = ["101","102","103","104","105","106","107","108","109","110","111","112","113"];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function CompGroupView() {
  const { orgId: currentOrgId } = useOrg();

  const [groups, setGroups] = useState<CompGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [classes, setClasses] = useState<CompGroupClass[]>([]);
  const [types, setTypes] = useState<CompGroupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState(false);

  // Dialogs
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState("clearing");
  const [newGroupMethod, setNewGroupMethod] = useState("hourly");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);

  const [manageTypesOpen, setManageTypesOpen] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState("");

  const [addClassOpen, setAddClassOpen] = useState(false);
  const [newClassId, setNewClassId] = useState("104");

  const seeded = useRef(false);

  /* ---- Fetch groups ---- */
  const fetchGroups = useCallback(async () => {
    if (!currentOrgId) return;
    const { data } = await supabase
      .from("comp_groups")
      .select("*")
      .eq("org_id", currentOrgId)
      .order("sort_order");
    if (data) {
      setGroups(data as unknown as CompGroup[]);
      if (data.length > 0 && !activeGroupId) {
        setActiveGroupId(data[0].id);
      }
    }
    return data;
  }, [currentOrgId, activeGroupId]);

  /* ---- Seed defaults ---- */
  const seedDefaults = useCallback(async () => {
    if (!currentOrgId || seeded.current) return;
    seeded.current = true;

    const { data: existing } = await supabase
      .from("comp_groups")
      .select("id")
      .eq("org_id", currentOrgId)
      .limit(1);

    if (existing && existing.length > 0) return;

    // Create default groups
    const { data: createdGroups } = await supabase
      .from("comp_groups")
      .insert(DEFAULT_GROUPS.map(g => ({ ...g, org_id: currentOrgId })))
      .select();

    if (!createdGroups || createdGroups.length === 0) return;

    // Seed classes for the first group
    const firstGroup = createdGroups[0];
    await supabase
      .from("comp_group_classes")
      .insert(DEFAULT_CLASSES.map(c => ({
        ...c,
        org_id: currentOrgId,
        group_id: firstGroup.id,
        type_label: "Clearing Type 1",
        client: "",
      })));

    // Seed a default type
    await supabase
      .from("comp_group_types")
      .insert({
        org_id: currentOrgId,
        group_id: firstGroup.id,
        label: "Clearing Type 1 (Hourly Salary)",
        sort_order: 0,
      });

    await fetchGroups();
  }, [currentOrgId, fetchGroups]);

  /* ---- Fetch classes for active group ---- */
  const fetchClasses = useCallback(async () => {
    if (!activeGroupId || !currentOrgId) return;
    const { data } = await supabase
      .from("comp_group_classes")
      .select("*")
      .eq("group_id", activeGroupId)
      .eq("org_id", currentOrgId)
      .order("sort_order");
    if (data) setClasses(data as unknown as CompGroupClass[]);
  }, [activeGroupId, currentOrgId]);

  /* ---- Fetch types for active group ---- */
  const fetchTypes = useCallback(async () => {
    if (!activeGroupId || !currentOrgId) return;
    const { data } = await supabase
      .from("comp_group_types")
      .select("*")
      .eq("group_id", activeGroupId)
      .eq("org_id", currentOrgId)
      .order("sort_order");
    if (data) setTypes(data as unknown as CompGroupType[]);
  }, [activeGroupId, currentOrgId]);

  /* ---- Init ---- */
  useEffect(() => {
    if (!currentOrgId) return;
    setLoading(true);
    seedDefaults().then(() => fetchGroups()).finally(() => setLoading(false));
  }, [currentOrgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeGroupId) {
      fetchClasses();
      fetchTypes();
    }
  }, [activeGroupId, fetchClasses, fetchTypes]);

  /* ---- Inline edit cell ---- */
  const updateClassField = async (classId: string, field: string, value: number) => {
    if (locked) return;
    const { error } = await supabase
      .from("comp_group_classes")
      .update({ [field]: value } as any)
      .eq("id", classId);
    if (error) { toast.error("Failed to update"); return; }
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, [field]: value } : c));
  };

  const updateClassType = async (classId: string, typeLabel: string) => {
    if (locked) return;
    const { error } = await supabase
      .from("comp_group_classes")
      .update({ type_label: typeLabel } as any)
      .eq("id", classId);
    if (error) { toast.error("Failed to update"); return; }
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, type_label: typeLabel } : c));
  };

  const updateClassClient = async (classId: string, client: string) => {
    if (locked) return;
    const { error } = await supabase
      .from("comp_group_classes")
      .update({ client } as any)
      .eq("id", classId);
    if (error) { toast.error("Failed to update"); return; }
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, client } : c));
  };

  /* ---- Group CRUD ---- */
  const createGroup = async () => {
    if (!currentOrgId || !newGroupName.trim()) return;
    const { data, error } = await supabase
      .from("comp_groups")
      .insert({ org_id: currentOrgId, name: newGroupName.trim(), category: newGroupCategory, method: newGroupMethod, sort_order: groups.length })
      .select()
      .single();
    if (error) { toast.error("Failed to create group"); return; }
    toast.success("Group created");
    setNewGroupOpen(false);
    setNewGroupName("");
    await fetchGroups();
    if (data) setActiveGroupId(data.id);
  };

  const renameGroup = async () => {
    if (!activeGroupId || !renameValue.trim()) return;
    const { error } = await supabase
      .from("comp_groups")
      .update({ name: renameValue.trim() } as any)
      .eq("id", activeGroupId);
    if (error) { toast.error("Failed to rename"); return; }
    toast.success("Group renamed");
    setRenameOpen(false);
    await fetchGroups();
  };

  const deleteGroup = async () => {
    if (!activeGroupId) return;
    await supabase.from("comp_group_classes").delete().eq("group_id", activeGroupId);
    await supabase.from("comp_group_types").delete().eq("group_id", activeGroupId);
    const { error } = await supabase.from("comp_groups").delete().eq("id", activeGroupId);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Group deleted");
    setDeleteGroupOpen(false);
    setActiveGroupId(null);
    await fetchGroups();
  };

  const duplicateGroup = async () => {
    if (!activeGroupId || !currentOrgId) return;
    const src = groups.find(g => g.id === activeGroupId);
    if (!src) return;
    const { data: newGroup } = await supabase
      .from("comp_groups")
      .insert({ org_id: currentOrgId, name: `${src.name} (Copy)`, category: src.category, method: src.method, sort_order: groups.length })
      .select()
      .single();
    if (!newGroup) return;
    if (classes.length > 0) {
      await supabase.from("comp_group_classes").insert(
        classes.map(c => ({ org_id: currentOrgId, group_id: newGroup.id, sla_class_id: c.sla_class_id, type_label: c.type_label, client: c.client, star_1: c.star_1, star_2: c.star_2, star_3: c.star_3, star_4: c.star_4, star_5: c.star_5, hourly_gross: c.hourly_gross, sort_order: c.sort_order }))
      );
    }
    toast.success("Group duplicated");
    await fetchGroups();
    setActiveGroupId(newGroup.id);
  };

  /* ---- Class CRUD ---- */
  const addClass = async () => {
    if (!activeGroupId || !currentOrgId) return;
    const { error } = await supabase.from("comp_group_classes").insert({
      org_id: currentOrgId,
      group_id: activeGroupId,
      sla_class_id: newClassId,
      type_label: types.length > 0 ? types[0].label.split(" (")[0] : "",
      client: "",
      star_1: 0, star_2: 0, star_3: 0, star_4: 0, star_5: 0,
      hourly_gross: 0,
      sort_order: classes.length,
    });
    if (error) { toast.error("Failed to add class"); return; }
    toast.success("Class added");
    setAddClassOpen(false);
    await fetchClasses();
  };

  const deleteClass = async (id: string) => {
    const { error } = await supabase.from("comp_group_classes").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const deleteSelected = async () => {
    if (selectedRows.size === 0) return;
    for (const id of selectedRows) {
      await supabase.from("comp_group_classes").delete().eq("id", id);
    }
    setSelectedRows(new Set());
    toast.success(`${selectedRows.size} classes deleted`);
    await fetchClasses();
  };

  /* ---- Types CRUD ---- */
  const addType = async () => {
    if (!activeGroupId || !currentOrgId || !newTypeLabel.trim()) return;
    await supabase.from("comp_group_types").insert({
      org_id: currentOrgId,
      group_id: activeGroupId,
      label: newTypeLabel.trim(),
      sort_order: types.length,
    });
    setNewTypeLabel("");
    await fetchTypes();
  };

  const deleteType = async (id: string) => {
    await supabase.from("comp_group_types").delete().eq("id", id);
    await fetchTypes();
  };

  /* ---- CSV Export ---- */
  const exportCsv = () => {
    if (classes.length === 0) return;
    const headers = ["SLA Class", "Type", "Client", "Star 1", "Star 2", "Star 3", "Star 4", "Star 5", "Hourly Gross"];
    const rows = classes.map(c => [c.sla_class_id, c.type_label, c.client, c.star_1, c.star_2, c.star_3, c.star_4, c.star_5, c.hourly_gross].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comp-group-${activeGroup?.name || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- Reset to defaults ---- */
  const resetDefaults = async () => {
    if (!activeGroupId || !currentOrgId) return;
    await supabase.from("comp_group_classes").delete().eq("group_id", activeGroupId);
    await supabase.from("comp_group_classes").insert(
      DEFAULT_CLASSES.map(c => ({ ...c, org_id: currentOrgId, group_id: activeGroupId, type_label: "Clearing Type 1", client: "" }))
    );
    toast.success("Reset to default values");
    await fetchClasses();
  };

  /* ---- Derived state ---- */
  const activeGroup = groups.find(g => g.id === activeGroupId);
  const filteredClasses = search
    ? classes.filter(c => c.sla_class_id.includes(search) || c.type_label.toLowerCase().includes(search.toLowerCase()) || c.client.toLowerCase().includes(search.toLowerCase()))
    : classes;

  const allSelected = filteredClasses.length > 0 && filteredClasses.every(c => selectedRows.has(c.id));

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground">Loading compensation groups…</div>;
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compensation Groups</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage SLA class compensation rates by group, type and performance stars.</p>
      </div>

      {/* ---- Group selector tabs ---- */}
      <div className="flex flex-wrap gap-2 items-center">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => { setActiveGroupId(g.id); setSelectedRows(new Set()); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              g.id === activeGroupId
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {g.id === activeGroupId && <Check className="w-3.5 h-3.5" />}
            {g.name}
          </button>
        ))}
        <Button size="sm" variant="outline" onClick={() => setNewGroupOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Group
        </Button>
      </div>

      {/* ---- Toolbar ---- */}
      {activeGroup && (
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" variant="outline" onClick={() => { setRenameValue(activeGroup.name); setRenameOpen(true); }}>
            <Pencil className="w-4 h-4 mr-1" /> Rename
          </Button>
          <Button size="sm" variant="outline" onClick={() => setManageTypesOpen(true)}>
            <Settings2 className="w-4 h-4 mr-1" /> Manage Types
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLocked(!locked)}>
            <Lock className="w-4 h-4 mr-1" /> {locked ? "Unlock Cells" : "Lock Cells"}
          </Button>
          <Button size="sm" variant="outline" disabled>
            <BarChart3 className="w-4 h-4 mr-1" /> Compare Groups
          </Button>
          <Button size="sm" variant="outline" onClick={duplicateGroup}>
            <Copy className="w-4 h-4 mr-1" /> Duplicate
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteGroupOpen(true)}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete Group
          </Button>
        </div>
      )}

      {/* ---- Filter bar ---- */}
      {activeGroup && (
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" variant="outline" onClick={resetDefaults}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset to Defaults
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search classes…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 w-48" />
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" variant="outline" disabled>
            <Upload className="w-4 h-4 mr-1" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setAddClassOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Class
          </Button>
          {selectedRows.size > 0 && (
            <Button size="sm" variant="destructive" onClick={deleteSelected}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete {selectedRows.size}
            </Button>
          )}
        </div>
      )}

      {/* ---- Table ---- */}
      {activeGroup && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={v => {
                      if (v) setSelectedRows(new Set(filteredClasses.map(c => c.id)));
                      else setSelectedRows(new Set());
                    }}
                  />
                </TableHead>
                <TableHead className="w-24">SLA Class</TableHead>
                <TableHead className="w-40">Type</TableHead>
                <TableHead className="w-32">Client</TableHead>
                {[1,2,3,4,5].map(s => (
                  <TableHead key={s} className="w-24 text-center">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {s}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="w-28 text-center">Hourly Gross</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No classes added yet. Click "+ Add Class" to begin.
                  </TableCell>
                </TableRow>
              ) : filteredClasses.map(cls => {
                const isHighlighted = cls.sla_class_id === "107";
                return (
                  <TableRow key={cls.id} className={isHighlighted ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(cls.id)}
                        onCheckedChange={v => {
                          const next = new Set(selectedRows);
                          if (v) next.add(cls.id); else next.delete(cls.id);
                          setSelectedRows(next);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={isHighlighted ? "default" : "secondary"} className="font-mono">
                        {cls.sla_class_id}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {locked ? (
                        <span className="text-sm">{cls.type_label || "—"}</span>
                      ) : (
                        <Select value={cls.type_label} onValueChange={v => updateClassType(cls.id, v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {types.map(t => (
                              <SelectItem key={t.id} value={t.label.split(" (")[0]}>{t.label.split(" (")[0]}</SelectItem>
                            ))}
                            {types.length === 0 && <SelectItem value="">No types defined</SelectItem>}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {locked ? (
                        <span className="text-sm">{cls.client || "—"}</span>
                      ) : (
                        <Input value={cls.client} onChange={e => updateClassClient(cls.id, e.target.value)} className="h-8 text-xs" placeholder="All" />
                      )}
                    </TableCell>
                    {([1,2,3,4,5] as const).map(star => {
                      const field = `star_${star}` as keyof CompGroupClass;
                      return (
                        <TableCell key={star} className="text-center">
                          {locked ? (
                            <span className="text-sm font-medium">{formatNumber(cls[field] as number)}</span>
                          ) : (
                            <Input
                              type="number"
                              value={cls[field] as number}
                              onChange={e => updateClassField(cls.id, field, Number(e.target.value))}
                              className="h-8 w-20 text-center text-xs mx-auto"
                            />
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      {locked ? (
                        <span className="text-sm font-semibold">{formatNumber(cls.hourly_gross)}</span>
                      ) : (
                        <Input
                          type="number"
                          value={cls.hourly_gross}
                          onChange={e => updateClassField(cls.id, "hourly_gross", Number(e.target.value))}
                          className="h-8 w-24 text-center text-xs mx-auto font-semibold"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteClass(cls.id)} disabled={locked}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!activeGroup && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Settings2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Compensation Groups</h2>
          <p className="text-muted-foreground max-w-md mb-4">Create your first compensation group to manage SLA class rates.</p>
          <Button onClick={() => setNewGroupOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Group
          </Button>
        </div>
      )}

      {/* ========== DIALOGS ========== */}

      {/* New Group */}
      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Compensation Group</DialogTitle>
            <DialogDescription>Create a new group to manage SLA class compensation rates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Group Name</label>
              <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Comp. group clearing hourly salary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newGroupCategory} onValueChange={setNewGroupCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clearing">Clearing</SelectItem>
                    <SelectItem value="planting">Planting</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Method</label>
                <Select value={newGroupMethod} onValueChange={setNewGroupMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly Salary</SelectItem>
                    <SelectItem value="piecework">Piece Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGroupOpen(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={!newGroupName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Group */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
            <DialogDescription>Enter a new name for this compensation group.</DialogDescription>
          </DialogHeader>
          <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={renameGroup}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group */}
      <Dialog open={deleteGroupOpen} onOpenChange={setDeleteGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>This will permanently delete "{activeGroup?.name}" and all its classes. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGroupOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteGroup}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Types */}
      <Dialog open={manageTypesOpen} onOpenChange={setManageTypesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Types</DialogTitle>
            <DialogDescription>Define compensation types for this group (e.g. "Clearing Type 1 (Hourly Salary)").</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {types.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 border rounded-md">
                <span className="text-sm">{t.label}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteType(t.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {types.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No types defined yet.</p>}
          </div>
          <div className="flex gap-2">
            <Input value={newTypeLabel} onChange={e => setNewTypeLabel(e.target.value)} placeholder="e.g. Clearing Type 2 (Hourly Salary)" className="flex-1" />
            <Button onClick={addType} disabled={!newTypeLabel.trim()} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageTypesOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Class */}
      <Dialog open={addClassOpen} onOpenChange={setAddClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add SLA Class</DialogTitle>
            <DialogDescription>Select the SLA class ID to add to this group.</DialogDescription>
          </DialogHeader>
          <Select value={newClassId} onValueChange={setNewClassId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_SLA_IDS.map(id => (
                <SelectItem key={id} value={id}>{id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClassOpen(false)}>Cancel</Button>
            <Button onClick={addClass}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
