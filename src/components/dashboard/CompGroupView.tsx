import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Check, Copy, Download, Upload, Search, RotateCcw, Lock, BarChart3, Settings2, Star, Pencil } from "lucide-react";

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
  net_value: number;
  sort_order: number;
}

interface CompGroupType {
  id: string;
  org_id: string;
  group_id: string;
  label: string;
  sort_order: number;
}

/* ------------------------------------------------------------------ */
/* Seed data — distinct for each of the 4 groups                       */
/* ------------------------------------------------------------------ */

const DEFAULT_GROUPS = [
  { name: "Comp. group clearing hourly salary", category: "clearing", method: "hourly", sort_order: 0 },
  { name: "Comp. group planting hourly salary", category: "planting", method: "hourly", sort_order: 1 },
  { name: "Comp. group clearing piece work salary", category: "clearing", method: "piecework", sort_order: 2 },
  { name: "Comp. group planting piece work salary", category: "planting", method: "piecework", sort_order: 3 },
];

const SEED_PER_GROUP: Array<{
  typeLabel: string;
  typeFull: string;
  client: string;
  classes: Array<{ sla: string; s1: number; s2: number; s3: number; s4: number; s5: number; gross: number; net: number }>;
}> = [
  {
    typeLabel: "Clearing Type 1",
    typeFull: "Clearing Type 1 (Hourly Salary)",
    client: "Standard Inc.",
    classes: [
      { sla: "104", s1: 125, s2: 135, s3: 145, s4: 155, s5: 170, gross: 145, net: 0 },
      { sla: "105", s1: 130, s2: 140, s3: 150, s4: 160, s5: 175, gross: 150, net: 0 },
      { sla: "106", s1: 135, s2: 145, s3: 155, s4: 165, s5: 180, gross: 155, net: 0 },
      { sla: "107", s1: 140, s2: 150, s3: 160, s4: 170, s5: 185, gross: 160, net: 0 },
      { sla: "108", s1: 145, s2: 155, s3: 165, s4: 175, s5: 190, gross: 165, net: 0 },
      { sla: "109", s1: 150, s2: 160, s3: 170, s4: 180, s5: 195, gross: 170, net: 0 },
      { sla: "110", s1: 155, s2: 165, s3: 175, s4: 185, s5: 200, gross: 175, net: 0 },
    ],
  },
  {
    typeLabel: "Planting Type 1",
    typeFull: "Planting Type 1 (Hourly Salary)",
    client: "Standard Inc.",
    classes: [
      { sla: "104", s1: 157, s2: 167, s3: 177, s4: 187, s5: 197, gross: 420, net: 0 },
      { sla: "105", s1: 158, s2: 168, s3: 178, s4: 188, s5: 198, gross: 430, net: 0 },
      { sla: "106", s1: 159, s2: 169, s3: 179, s4: 189, s5: 199, gross: 440, net: 0 },
      { sla: "107", s1: 160, s2: 170, s3: 180, s4: 190, s5: 200, gross: 450, net: 0 },
      { sla: "108", s1: 161, s2: 171, s3: 181, s4: 191, s5: 201, gross: 460, net: 0 },
      { sla: "109", s1: 162, s2: 172, s3: 182, s4: 192, s5: 202, gross: 470, net: 0 },
      { sla: "110", s1: 163, s2: 173, s3: 183, s4: 193, s5: 203, gross: 480, net: 0 },
    ],
  },
  {
    typeLabel: "Clearing Type 1",
    typeFull: "Clearing Type 1 (Piece Work)",
    client: "Standard Inc.",
    classes: [
      { sla: "104", s1: 1.05, s2: 1.15, s3: 1.25, s4: 1.35, s5: 1.45, gross: 3200, net: 1145 },
      { sla: "105", s1: 1.00, s2: 1.10, s3: 1.20, s4: 1.30, s5: 1.40, gross: 3300, net: 1200 },
      { sla: "106", s1: 0.95, s2: 1.05, s3: 1.15, s4: 1.25, s5: 1.35, gross: 3400, net: 1270 },
      { sla: "107", s1: 0.90, s2: 1.00, s3: 1.10, s4: 1.20, s5: 1.30, gross: 3500, net: 1335 },
      { sla: "108", s1: 0.85, s2: 0.95, s3: 1.05, s4: 1.15, s5: 1.25, gross: 3725, net: 1415 },
      { sla: "109", s1: 0.80, s2: 0.90, s3: 1.00, s4: 1.10, s5: 1.20, gross: 3950, net: 1500 },
      { sla: "110", s1: 0.75, s2: 0.85, s3: 0.95, s4: 1.05, s5: 1.15, gross: 4175, net: 1650 },
    ],
  },
  {
    typeLabel: "Planting Type 1",
    typeFull: "Planting Type 1 (Piece Work)",
    client: "Standard Inc.",
    classes: [
      { sla: "104", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "105", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "106", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "107", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "108", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "109", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "110", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
    ],
  },
];

const ALL_SLA_IDS = ["101","102","103","104","105","106","107","108","109","110","111","112","113"];
const SHOW_CLASS_OPTIONS = [
  { label: "All (13)", value: 13 },
  { label: "1", value: 1 },
  { label: "3", value: 3 },
  { label: "5", value: 5 },
  { label: "7 (default)", value: 7 },
  { label: "9", value: 9 },
  { label: "11", value: 11 },
  { label: "13", value: 13 },
];

const DEFAULT_CLIENTS = [
  "Swedish Forestry Corporation",
  "Standard Inc.",
  "Green Valley Enterprises",
  "Pacific Forest Management",
  "Sveaskog Norrland",
  "SCA Skog AB",
  "Northwest Logging Co.",
  "Forest Solutions Inc.",
  "Timber Tech Ltd",
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function CompGroupView() {
  const { orgId: currentOrgId } = useOrg();

  const [groups, setGroups] = useState<CompGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [classes, setClasses] = useState<CompGroupClass[]>([]);
  const [types, setTypes] = useState<CompGroupType[]>([]);
  const [allTypes, setAllTypes] = useState<CompGroupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState(false);
  const [showClassCount, setShowClassCount] = useState(7);
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [clientForAll, setClientForAll] = useState<string>("__none__");
  const [forestryClients, setForestryClients] = useState<string[]>([]);

  // Dialogs
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState("clearing");
  const [newGroupMethod, setNewGroupMethod] = useState("hourly");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);

  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [manageTypesOpen, setManageTypesOpen] = useState(false);
  const [manageTypesGroupId, setManageTypesGroupId] = useState<string | null>(null);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeLabel, setEditingTypeLabel] = useState("");

  const [addClassOpen, setAddClassOpen] = useState(false);
  const [newClassId, setNewClassId] = useState("104");

  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSelected, setCompareSelected] = useState<Set<string>>(new Set());

  const seeded = useRef(false);

  /* ---- Fetch forestry clients ---- */
  const fetchForestryClients = useCallback(async () => {
    if (!currentOrgId) return;
    const { data } = await supabase
      .from("forestry_clients")
      .select("company_name")
      .eq("org_id", currentOrgId)
      .eq("status", "active")
      .order("company_name");
    const names = data?.map(d => d.company_name) || [];
    // Merge with defaults, deduplicate
    const merged = Array.from(new Set([...names, ...DEFAULT_CLIENTS]));
    setForestryClients(merged);
  }, [currentOrgId]);

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

    const { data: createdGroups } = await supabase
      .from("comp_groups")
      .insert(DEFAULT_GROUPS.map(g => ({ ...g, org_id: currentOrgId })))
      .select()
      .order("sort_order");

    if (!createdGroups || createdGroups.length === 0) return;

    for (let i = 0; i < createdGroups.length && i < SEED_PER_GROUP.length; i++) {
      const group = createdGroups[i];
      const seed = SEED_PER_GROUP[i];
      const method = DEFAULT_GROUPS[i].method;
      const category = DEFAULT_GROUPS[i].category;
      const methodLabel = method === "hourly" ? "Hourly Salary" : "Piece Work";
      const catLabel = category === "clearing" ? "Clearing" : "Planting";

      await supabase.from("comp_group_classes").insert(
        seed.classes.map((c, idx) => ({
          org_id: currentOrgId,
          group_id: group.id,
          sla_class_id: c.sla,
          type_label: seed.typeLabel,
          client: seed.client,
          star_1: c.s1, star_2: c.s2, star_3: c.s3, star_4: c.s4, star_5: c.s5,
          hourly_gross: c.gross,
          net_value: c.net,
          sort_order: idx,
        }))
      );

      // Seed 10 types per group
      const typeInserts = Array.from({ length: 10 }, (_, idx) => ({
        org_id: currentOrgId,
        group_id: group.id,
        label: `${catLabel} Type ${idx + 1} (${methodLabel})`,
        sort_order: idx,
      }));
      await supabase.from("comp_group_types").insert(typeInserts);
    }

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

  /* ---- Fetch ALL types across all groups (for Manage Types dialog) ---- */
  const fetchAllTypes = useCallback(async () => {
    if (!currentOrgId) return;
    const { data } = await supabase
      .from("comp_group_types")
      .select("*")
      .eq("org_id", currentOrgId)
      .order("sort_order");
    if (data) setAllTypes(data as unknown as CompGroupType[]);
  }, [currentOrgId]);

  /* ---- Init ---- */
  useEffect(() => {
    if (!currentOrgId) return;
    setLoading(true);
    Promise.all([
      seedDefaults().then(() => fetchGroups()),
      fetchForestryClients(),
    ]).finally(() => setLoading(false));
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

  /* ---- Apply type filter to all classes in group ---- */
  const applyTypeFilter = async (typeLabel: string) => {
    setTypeFilter(typeLabel);
    if (typeLabel === "__all__" || !activeGroupId) return;
    // Set the type_label on all classes in this group
    const shortLabel = typeLabel.split(" (")[0];
    const { error } = await supabase
      .from("comp_group_classes")
      .update({ type_label: shortLabel } as any)
      .eq("group_id", activeGroupId);
    if (error) { toast.error("Failed to apply type"); return; }
    setClasses(prev => prev.map(c => ({ ...c, type_label: shortLabel })));
    toast.success(`Applied "${shortLabel}" to all classes`);
  };

  /* ---- Apply client for all ---- */
  const applyClientForAll = async (client: string) => {
    setClientForAll(client);
    if (client === "__none__" || !activeGroupId) return;
    const { error } = await supabase
      .from("comp_group_classes")
      .update({ client } as any)
      .eq("group_id", activeGroupId);
    if (error) { toast.error("Failed to apply client"); return; }
    setClasses(prev => prev.map(c => ({ ...c, client })));
    toast.success(`Set client "${client}" for all classes`);
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
    if (!renameTargetId || !renameValue.trim()) return;
    const { error } = await supabase
      .from("comp_groups")
      .update({ name: renameValue.trim() } as any)
      .eq("id", renameTargetId);
    if (error) { toast.error("Failed to rename"); return; }
    toast.success("Group renamed");
    setRenameOpen(false);
    await fetchGroups();
  };

  const deleteGroup = async () => {
    const targetId = deleteTargetId;
    if (!targetId) return;
    await supabase.from("comp_group_classes").delete().eq("group_id", targetId);
    await supabase.from("comp_group_types").delete().eq("group_id", targetId);
    const { error } = await supabase.from("comp_groups").delete().eq("id", targetId);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Group deleted");
    setDeleteGroupOpen(false);
    if (activeGroupId === targetId) setActiveGroupId(null);
    await fetchGroups();
  };

  const duplicateGroup = async () => {
    if (!activeGroupId || !currentOrgId || !duplicateName.trim()) return;
    const src = groups.find(g => g.id === activeGroupId);
    if (!src) return;
    const { data: newGroup } = await supabase
      .from("comp_groups")
      .insert({ org_id: currentOrgId, name: duplicateName.trim(), category: src.category, method: src.method, sort_order: groups.length })
      .select()
      .single();
    if (!newGroup) return;
    if (classes.length > 0) {
      await supabase.from("comp_group_classes").insert(
        classes.map(c => ({ org_id: currentOrgId, group_id: newGroup.id, sla_class_id: c.sla_class_id, type_label: c.type_label, client: c.client, star_1: c.star_1, star_2: c.star_2, star_3: c.star_3, star_4: c.star_4, star_5: c.star_5, hourly_gross: c.hourly_gross, net_value: c.net_value, sort_order: c.sort_order }))
      );
    }
    // Also duplicate types
    if (types.length > 0) {
      await supabase.from("comp_group_types").insert(
        types.map(t => ({ org_id: currentOrgId, group_id: newGroup.id, label: t.label, sort_order: t.sort_order }))
      );
    }
    toast.success("Group duplicated");
    setDuplicateOpen(false);
    setDuplicateName("");
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
      net_value: 0,
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
  const addType = async (groupId: string) => {
    if (!currentOrgId || !newTypeLabel.trim()) return;
    const targetTypes = allTypes.filter(t => t.group_id === groupId);
    await supabase.from("comp_group_types").insert({
      org_id: currentOrgId,
      group_id: groupId,
      label: newTypeLabel.trim(),
      sort_order: targetTypes.length,
    });
    setNewTypeLabel("");
    await Promise.all([fetchTypes(), fetchAllTypes()]);
  };

  const deleteType = async (id: string) => {
    await supabase.from("comp_group_types").delete().eq("id", id);
    await Promise.all([fetchTypes(), fetchAllTypes()]);
  };

  const updateType = async (id: string, label: string) => {
    await supabase.from("comp_group_types").update({ label } as any).eq("id", id);
    setEditingTypeId(null);
    setEditingTypeLabel("");
    await Promise.all([fetchTypes(), fetchAllTypes()]);
  };

  /* ---- CSV Export ---- */
  const exportCsv = () => {
    if (classes.length === 0) return;
    const isPw = activeGroup?.method === "piecework";
    const headers = ["SLA Class", "Type", "Client", "Star 1", "Star 2", "Star 3", "Star 4", "Star 5", "Gross", ...(isPw ? ["Net"] : [])];
    const rows = classes.map(c => [c.sla_class_id, c.type_label, c.client, c.star_1, c.star_2, c.star_3, c.star_4, c.star_5, c.hourly_gross, ...(isPw ? [c.net_value] : [])].join(","));
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
    const groupIdx = groups.findIndex(g => g.id === activeGroupId);
    const seed = groupIdx >= 0 && groupIdx < SEED_PER_GROUP.length ? SEED_PER_GROUP[groupIdx] : SEED_PER_GROUP[0];
    await supabase.from("comp_group_classes").delete().eq("group_id", activeGroupId);
    await supabase.from("comp_group_classes").insert(
      seed.classes.map((c, idx) => ({
        org_id: currentOrgId,
        group_id: activeGroupId,
        sla_class_id: c.sla,
        type_label: seed.typeLabel,
        client: seed.client,
        star_1: c.s1, star_2: c.s2, star_3: c.s3, star_4: c.s4, star_5: c.s5,
        hourly_gross: c.gross,
        net_value: c.net,
        sort_order: idx,
      }))
    );
    toast.success("Reset to default values");
    await fetchClasses();
  };

  /* ---- Derived state ---- */
  const activeGroup = groups.find(g => g.id === activeGroupId);
  const isPiecework = activeGroup?.method === "piecework";
  const isClearing = activeGroup?.category === "clearing";

  const starGroupLabel = isPiecework
    ? (isClearing ? "Clearing units/day" : "Planting units/hr")
    : "Hourly salary";
  const grossLabel = isPiecework
    ? (isClearing ? "Clear Gross" : "Plant Gross")
    : "Hourly Gross";
  const netLabel = isPiecework
    ? (isClearing ? "Clear Net" : "Plant Net")
    : null;

  // Filter by search then limit by showClassCount
  let filteredClasses = search
    ? classes.filter(c => c.sla_class_id.includes(search) || c.type_label.toLowerCase().includes(search.toLowerCase()) || c.client.toLowerCase().includes(search.toLowerCase()))
    : classes;
  
  // Apply show class count limit
  if (showClassCount < 13 && !search) {
    filteredClasses = filteredClasses.slice(0, showClassCount);
  }

  const allSelected = filteredClasses.length > 0 && filteredClasses.every(c => selectedRows.has(c.id));

  // For manage types dialog
  const manageTypesGroup = manageTypesGroupId ? groups.find(g => g.id === manageTypesGroupId) : null;
  const manageTypesGroupTypes = manageTypesGroupId ? allTypes.filter(t => t.group_id === manageTypesGroupId) : [];
  const manageTypesMethodLabel = manageTypesGroup?.method === "piecework" ? "Piece Work" : "Hourly Salary";

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground">Loading compensation groups…</div>;
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compensation Group</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage compensation groups and pricing data</p>
      </div>

      {/* ---- Groups card ---- */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Groups</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm" variant="outline" onClick={() => {
                setManageTypesGroupId(activeGroupId);
                setManageTypesOpen(true);
                fetchAllTypes();
              }}>
                <Settings2 className="w-4 h-4 mr-1" /> Manage Types
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLocked(!locked)}>
                <Lock className="w-4 h-4 mr-1" /> {locked ? "Unlock Cells" : "Lock Cells"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setCompareSelected(new Set()); setCompareOpen(true); }}>
                <BarChart3 className="w-4 h-4 mr-1" /> Compare Groups
              </Button>
              <Button size="sm" onClick={() => setNewGroupOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Group
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                if (!activeGroup) return;
                setDuplicateName("");
                setDuplicateOpen(true);
              }} disabled={!activeGroupId}>
                <Copy className="w-4 h-4 mr-1" /> Duplicate Group
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {groups.map(g => (
              <div
                key={g.id}
                className={`inline-flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                  g.id === activeGroupId
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:bg-accent"
                }`}
                onClick={() => { setActiveGroupId(g.id); setSelectedRows(new Set()); setTypeFilter("__all__"); setClientForAll("__none__"); }}
              >
                {g.id === activeGroupId && <Check className="w-3.5 h-3.5" />}
                <span className="mr-1">{g.name}</span>
                <button
                  className="p-0.5 rounded-full hover:bg-background/20"
                  onClick={e => { e.stopPropagation(); setRenameTargetId(g.id); setRenameValue(g.name); setRenameOpen(true); }}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  className="p-0.5 rounded-full hover:bg-destructive/20 text-destructive"
                  onClick={e => { e.stopPropagation(); setDeleteTargetId(g.id); setDeleteGroupOpen(true); }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-3">SLA = Service Level Agreement</p>
        </CardContent>
      </Card>

      {/* ---- SLA Classes card ---- */}
      {activeGroup && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold mb-4">SLA Classes - {activeGroup.name}</h2>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 items-center mb-4">
              {/* Type for 101-113 */}
              <div className="flex items-center gap-2 border rounded-md px-3 py-1.5">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Type for 101-113:</span>
                <Select value={typeFilter} onValueChange={applyTypeFilter}>
                  <SelectTrigger className="h-7 w-44 border-0 p-0 text-xs shadow-none">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">None</SelectItem>
                    {types.map(t => (
                      <SelectItem key={t.id} value={t.label}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show classes */}
              <div className="flex items-center gap-2 border rounded-md px-3 py-1.5">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Show classes:</span>
                <Select value={String(showClassCount)} onValueChange={v => setShowClassCount(Number(v))}>
                  <SelectTrigger className="h-7 w-28 border-0 p-0 text-xs shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOW_CLASS_OPTIONS.map(opt => (
                      <SelectItem key={opt.label} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client for All */}
              <div className="flex items-center gap-2 border rounded-md px-3 py-1.5">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Client for All:</span>
                <Select value={clientForAll} onValueChange={applyClientForAll}>
                  <SelectTrigger className="h-7 w-40 border-0 p-0 text-xs shadow-none">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {forestryClients.map(c => (
                      <SelectItem key={c} value={c}>
                        {c}{c === "Standard Inc." ? " (Standard)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" variant="outline" onClick={resetDefaults}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reset to Defaults
              </Button>

              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search classes…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 w-44" />
              </div>

              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={exportCsv}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
                <Button size="sm" variant="outline" disabled>
                  <Upload className="w-4 h-4 mr-1" /> Import CSV
                </Button>
                <Button size="sm" onClick={() => setAddClassOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Class
                </Button>
              </div>
            </div>

            {selectedRows.size > 0 && (
              <div className="flex gap-2 mb-4">
                <Button size="sm" variant="destructive" onClick={deleteSelected}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete {selectedRows.size}
                </Button>
              </div>
            )}

            {/* Table */}
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
                    <TableHead className="w-32">SLA Class ID</TableHead>
                    <TableHead className="w-52">Type</TableHead>
                    <TableHead className="w-32">Client</TableHead>
                    <TableHead colSpan={5} className="text-center border-l">
                      <span className="font-semibold">{starGroupLabel}</span>
                    </TableHead>
                    <TableHead className="w-28 text-center">{grossLabel}</TableHead>
                    {netLabel && <TableHead className="w-28 text-center">{netLabel}</TableHead>}
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead />
                    <TableHead />
                    <TableHead />
                    <TableHead />
                    {[1,2,3,4,5].map(s => (
                      <TableHead key={s} className="text-center border-l w-24">
                        <span className="inline-flex items-center gap-0.5 text-xs">
                          {s}<Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        </span>
                      </TableHead>
                    ))}
                    <TableHead />
                    {netLabel && <TableHead />}
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={netLabel ? 12 : 11} className="text-center text-muted-foreground py-8">
                        No classes added yet. Click "+ Add Class" to begin.
                      </TableCell>
                    </TableRow>
                  ) : filteredClasses.map(cls => {
                    const isHighlighted = cls.sla_class_id === "107";
                    return (
                      <TableRow key={cls.id} className={isHighlighted ? "bg-accent/50 border-y-2 border-primary/20" : ""}>
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
                        <TableCell className="font-medium">SLA Class {cls.sla_class_id}</TableCell>
                        <TableCell>
                          {locked ? (
                            <span className="text-sm text-muted-foreground">{cls.type_label ? `${cls.type_label} (${isPiecework ? "Piece Work" : "Hourly Salary"})` : "—"}</span>
                          ) : (
                            <Select value={cls.type_label} onValueChange={v => updateClassType(cls.id, v)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {types.map(t => (
                                  <SelectItem key={t.id} value={t.label.split(" (")[0]}>{t.label}</SelectItem>
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
                            <Select value={cls.client || "__empty__"} onValueChange={v => updateClassClient(cls.id, v === "__empty__" ? "" : v)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__empty__">—</SelectItem>
                                {forestryClients.map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        {([1,2,3,4,5] as const).map(star => {
                          const field = `star_${star}` as keyof CompGroupClass;
                          const val = cls[field] as number;
                          return (
                            <TableCell key={star} className="text-center border-l">
                              {locked ? (
                                <span className="text-sm">{val.toFixed(2)}</span>
                              ) : (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={val}
                                  onChange={e => updateClassField(cls.id, field, Number(e.target.value))}
                                  className="h-8 w-20 text-center text-xs mx-auto"
                                />
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          {locked ? (
                            <span className="text-sm font-semibold">{(cls.hourly_gross as number).toFixed(2)}</span>
                          ) : (
                            <Input
                              type="number"
                              step="0.01"
                              value={cls.hourly_gross}
                              onChange={e => updateClassField(cls.id, "hourly_gross", Number(e.target.value))}
                              className="h-8 w-24 text-center text-xs mx-auto font-semibold"
                            />
                          )}
                        </TableCell>
                        {netLabel && (
                          <TableCell className="text-center">
                            {locked ? (
                              <span className="text-sm font-semibold">{(cls.net_value as number).toFixed(2)}</span>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                value={cls.net_value}
                                onChange={e => updateClassField(cls.id, "net_value", Number(e.target.value))}
                                className="h-8 w-24 text-center text-xs mx-auto font-semibold"
                              />
                            )}
                          </TableCell>
                        )}
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
          </CardContent>
        </Card>
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
            <DialogDescription>
              This will permanently delete "{groups.find(g => g.id === deleteTargetId)?.name}" and all its classes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGroupOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteGroup}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Group */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate: {activeGroup?.name}</DialogTitle>
            <DialogDescription>Create a copy of this group with all its classes and types.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">New Group Name</label>
              <Input
                value={duplicateName}
                onChange={e => setDuplicateName(e.target.value)}
                placeholder="Enter name for duplicated group"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will create a new group with all {classes.length} classes copied from "{activeGroup?.name}".
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>Cancel</Button>
            <Button onClick={duplicateGroup} disabled={!duplicateName.trim()}>Duplicate Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Groups */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compare Groups</DialogTitle>
            <DialogDescription>Select groups to compare side by side.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {groups.map(g => (
              <label key={g.id} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={compareSelected.has(g.id)}
                  onCheckedChange={v => {
                    const next = new Set(compareSelected);
                    if (v) next.add(g.id); else next.delete(g.id);
                    setCompareSelected(next);
                  }}
                />
                <span className="text-sm">{g.name}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareOpen(false)}>Close</Button>
            <Button disabled={compareSelected.size < 2} onClick={() => {
              toast.info(`Compare view for ${compareSelected.size} groups coming soon`);
              setCompareOpen(false);
            }}>
              Compare {compareSelected.size} Groups
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Compensation Types */}
      <Dialog open={manageTypesOpen} onOpenChange={v => { setManageTypesOpen(v); if (!v) { setEditingTypeId(null); setEditingTypeLabel(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Compensation Types</DialogTitle>
            <DialogDescription>Define compensation types for each group. Each group has its own set of types.</DialogDescription>
          </DialogHeader>

          {/* Group selector */}
          <div>
            <label className="text-sm font-medium">Select Compensation Group</label>
            <Select value={manageTypesGroupId || ""} onValueChange={v => setManageTypesGroupId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {manageTypesGroup && (
            <>
              <div className="bg-muted/50 rounded-md px-4 py-2">
                <h3 className="text-sm font-semibold">{manageTypesMethodLabel} Types ({manageTypesGroupTypes.length})</h3>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {manageTypesGroupTypes.map((t, idx) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 border rounded-md">
                    <div className="flex-1 min-w-0">
                      {editingTypeId === t.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingTypeLabel}
                            onChange={e => setEditingTypeLabel(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={e => { if (e.key === "Enter") updateType(t.id, editingTypeLabel); if (e.key === "Escape") { setEditingTypeId(null); setEditingTypeLabel(""); } }}
                          />
                          <Button size="sm" onClick={() => updateType(t.id, editingTypeLabel)}>Save</Button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Type {idx + 1}</span>
                            <span className="text-sm font-semibold">{t.label}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{manageTypesMethodLabel}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            1★: 0.00 | 2★: 0.00 | 3★: 0.00 | 4★: 0.00 | 5★: 0.00 | Gross: 0.00
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingTypeId(t.id); setEditingTypeLabel(t.label); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteType(t.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {manageTypesGroupTypes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No types defined yet.</p>}
              </div>

              <div className="flex gap-2">
                <Input value={newTypeLabel} onChange={e => setNewTypeLabel(e.target.value)} placeholder={`e.g. ${manageTypesGroup.category === "clearing" ? "Clearing" : "Planting"} Type ${manageTypesGroupTypes.length + 1} (${manageTypesMethodLabel})`} className="flex-1" />
                <Button onClick={() => addType(manageTypesGroupId!)} disabled={!newTypeLabel.trim()} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Each compensation group has its own set of types. Define rates specific to each group's piece work or hourly compensation structure.
                </p>
              </div>
            </>
          )}

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
                <SelectItem key={id} value={id}>SLA Class {id}</SelectItem>
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
