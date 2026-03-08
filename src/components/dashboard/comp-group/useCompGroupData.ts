import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CompGroup, CompGroupClass, CompGroupType } from "./types";
import { DEFAULT_GROUPS, SEED_PER_GROUP, DEFAULT_CLIENTS } from "./types";

export function useCompGroupData(orgId: string | null) {
  const [groups, setGroups] = useState<CompGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [classes, setClasses] = useState<CompGroupClass[]>([]);
  const [types, setTypes] = useState<CompGroupType[]>([]);
  const [allTypes, setAllTypes] = useState<CompGroupType[]>([]);
  const [forestryClients, setForestryClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const seeded = useRef(false);

  const fetchForestryClients = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("forestry_clients")
      .select("company_name")
      .eq("org_id", orgId)
      .eq("status", "active")
      .order("company_name");
    const names = data?.map(d => d.company_name) || [];
    setForestryClients(Array.from(new Set([...names, ...DEFAULT_CLIENTS])));
  }, [orgId]);

  const fetchGroups = useCallback(async () => {
    if (!orgId) return [];
    const { data } = await supabase
      .from("comp_groups")
      .select("*")
      .eq("org_id", orgId)
      .order("sort_order");
    if (data) {
      setGroups(data as unknown as CompGroup[]);
      if (data.length > 0 && !activeGroupId) {
        setActiveGroupId(data[0].id);
      }
    }
    return data || [];
  }, [orgId, activeGroupId]);

  const seedDefaults = useCallback(async () => {
    if (!orgId || seeded.current) return;
    seeded.current = true;
    const { data: existing } = await supabase.from("comp_groups").select("id").eq("org_id", orgId).limit(1);
    if (existing && existing.length > 0) return;

    const { data: createdGroups } = await supabase
      .from("comp_groups")
      .insert(DEFAULT_GROUPS.map(g => ({ ...g, org_id: orgId })))
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
          org_id: orgId, group_id: group.id, sla_class_id: c.sla,
          type_label: seed.typeLabel, client: seed.client,
          star_1: c.s1, star_2: c.s2, star_3: c.s3, star_4: c.s4, star_5: c.s5,
          hourly_gross: c.gross, net_value: c.net, sort_order: idx,
        }))
      );

      const typeInserts = Array.from({ length: 10 }, (_, idx) => ({
        org_id: orgId, group_id: group.id,
        label: `${catLabel} Type ${idx + 1} (${methodLabel})`,
        sort_order: idx,
      }));
      await supabase.from("comp_group_types").insert(typeInserts);
    }
    await fetchGroups();
  }, [orgId, fetchGroups]);

  const fetchClasses = useCallback(async () => {
    if (!activeGroupId || !orgId) return;
    const { data } = await supabase
      .from("comp_group_classes")
      .select("*")
      .eq("group_id", activeGroupId)
      .eq("org_id", orgId)
      .order("sort_order");
    if (data) setClasses(data as unknown as CompGroupClass[]);
  }, [activeGroupId, orgId]);

  const fetchTypes = useCallback(async () => {
    if (!activeGroupId || !orgId) return;
    const { data } = await supabase
      .from("comp_group_types")
      .select("*")
      .eq("group_id", activeGroupId)
      .eq("org_id", orgId)
      .order("sort_order");
    if (data) setTypes(data as unknown as CompGroupType[]);
  }, [activeGroupId, orgId]);

  const fetchAllTypes = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("comp_group_types")
      .select("*")
      .eq("org_id", orgId)
      .order("sort_order");
    if (data) setAllTypes(data as unknown as CompGroupType[]);
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    Promise.all([seedDefaults().then(() => fetchGroups()), fetchForestryClients()])
      .finally(() => setLoading(false));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeGroupId) { fetchClasses(); fetchTypes(); }
  }, [activeGroupId, fetchClasses, fetchTypes]);

  /* ---- Mutations ---- */
  const updateClassField = async (classId: string, field: string, value: number) => {
    const { error } = await supabase.from("comp_group_classes").update({ [field]: value } as any).eq("id", classId);
    if (error) { toast.error("Failed to update"); return; }
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, [field]: value } : c));
  };

  const updateClassType = async (classId: string, typeLabel: string) => {
    const { error } = await supabase.from("comp_group_classes").update({ type_label: typeLabel } as any).eq("id", classId);
    if (error) { toast.error("Failed to update"); return; }
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, type_label: typeLabel } : c));
  };

  const updateClassClient = async (classId: string, client: string) => {
    const { error } = await supabase.from("comp_group_classes").update({ client } as any).eq("id", classId);
    if (error) { toast.error("Failed to update"); return; }
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, client } : c));
  };

  const applyTypeToAll = async (typeLabel: string) => {
    if (!activeGroupId) return;
    const shortLabel = typeLabel.split(" (")[0];
    const { error } = await supabase.from("comp_group_classes").update({ type_label: shortLabel } as any).eq("group_id", activeGroupId);
    if (error) { toast.error("Failed to apply type"); return; }
    setClasses(prev => prev.map(c => ({ ...c, type_label: shortLabel })));
    toast.success(`Applied "${shortLabel}" to all classes`);
  };

  const applyClientToAll = async (client: string) => {
    if (!activeGroupId) return;
    const { error } = await supabase.from("comp_group_classes").update({ client } as any).eq("group_id", activeGroupId);
    if (error) { toast.error("Failed to apply client"); return; }
    setClasses(prev => prev.map(c => ({ ...c, client })));
    toast.success(`Set client "${client}" for all classes`);
  };

  const createGroup = async (name: string, category: string, method: string) => {
    if (!orgId) return null;
    const { data, error } = await supabase
      .from("comp_groups")
      .insert({ org_id: orgId, name, category, method, sort_order: groups.length })
      .select().single();
    if (error) { toast.error("Failed to create group"); return null; }
    toast.success("Group created");
    await fetchGroups();
    if (data) setActiveGroupId(data.id);
    return data;
  };

  const renameGroup = async (id: string, name: string) => {
    const { error } = await supabase.from("comp_groups").update({ name } as any).eq("id", id);
    if (error) { toast.error("Failed to rename"); return; }
    toast.success("Group renamed");
    await fetchGroups();
  };

  const deleteGroup = async (id: string) => {
    await supabase.from("comp_group_classes").delete().eq("group_id", id);
    await supabase.from("comp_group_types").delete().eq("group_id", id);
    const { error } = await supabase.from("comp_groups").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Group deleted");
    if (activeGroupId === id) setActiveGroupId(null);
    await fetchGroups();
  };

  const duplicateGroup = async (name: string) => {
    if (!activeGroupId || !orgId) return;
    const src = groups.find(g => g.id === activeGroupId);
    if (!src) return;
    const { data: newGroup } = await supabase
      .from("comp_groups")
      .insert({ org_id: orgId, name, category: src.category, method: src.method, sort_order: groups.length })
      .select().single();
    if (!newGroup) return;
    if (classes.length > 0) {
      await supabase.from("comp_group_classes").insert(
        classes.map(c => ({ org_id: orgId, group_id: newGroup.id, sla_class_id: c.sla_class_id, type_label: c.type_label, client: c.client, star_1: c.star_1, star_2: c.star_2, star_3: c.star_3, star_4: c.star_4, star_5: c.star_5, hourly_gross: c.hourly_gross, net_value: c.net_value, sort_order: c.sort_order }))
      );
    }
    if (types.length > 0) {
      await supabase.from("comp_group_types").insert(
        types.map(t => ({ org_id: orgId, group_id: newGroup.id, label: t.label, sort_order: t.sort_order }))
      );
    }
    toast.success("Group duplicated");
    await fetchGroups();
    setActiveGroupId(newGroup.id);
  };

  const addClass = async (slaClassId: string) => {
    if (!activeGroupId || !orgId) return;
    const { error } = await supabase.from("comp_group_classes").insert({
      org_id: orgId, group_id: activeGroupId, sla_class_id: slaClassId,
      type_label: types.length > 0 ? types[0].label.split(" (")[0] : "",
      client: "", star_1: 0, star_2: 0, star_3: 0, star_4: 0, star_5: 0,
      hourly_gross: 0, net_value: 0, sort_order: classes.length,
    });
    if (error) { toast.error("Failed to add class"); return; }
    toast.success("Class added");
    await fetchClasses();
  };

  const deleteClass = async (id: string) => {
    const { error } = await supabase.from("comp_group_classes").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const deleteSelected = async (ids: Set<string>) => {
    for (const id of ids) {
      await supabase.from("comp_group_classes").delete().eq("id", id);
    }
    toast.success(`${ids.size} classes deleted`);
    await fetchClasses();
  };

  const resetDefaults = async () => {
    if (!activeGroupId || !orgId) return;
    const groupIdx = groups.findIndex(g => g.id === activeGroupId);
    const seed = groupIdx >= 0 && groupIdx < SEED_PER_GROUP.length ? SEED_PER_GROUP[groupIdx] : SEED_PER_GROUP[0];
    await supabase.from("comp_group_classes").delete().eq("group_id", activeGroupId);
    await supabase.from("comp_group_classes").insert(
      seed.classes.map((c, idx) => ({
        org_id: orgId, group_id: activeGroupId, sla_class_id: c.sla,
        type_label: seed.typeLabel, client: seed.client,
        star_1: c.s1, star_2: c.s2, star_3: c.s3, star_4: c.s4, star_5: c.s5,
        hourly_gross: c.gross, net_value: c.net, sort_order: idx,
      }))
    );
    toast.success("Reset to default values");
    await fetchClasses();
  };

  const addType = async (groupId: string, label: string) => {
    if (!orgId) return;
    const targetTypes = allTypes.filter(t => t.group_id === groupId);
    await supabase.from("comp_group_types").insert({ org_id: orgId, group_id: groupId, label, sort_order: targetTypes.length });
    await Promise.all([fetchTypes(), fetchAllTypes()]);
  };

  const deleteType = async (id: string) => {
    await supabase.from("comp_group_types").delete().eq("id", id);
    await Promise.all([fetchTypes(), fetchAllTypes()]);
  };

  const updateType = async (id: string, label: string) => {
    await supabase.from("comp_group_types").update({ label } as any).eq("id", id);
    await Promise.all([fetchTypes(), fetchAllTypes()]);
  };

  return {
    groups, activeGroupId, setActiveGroupId, classes, types, allTypes, forestryClients,
    loading, fetchAllTypes,
    updateClassField, updateClassType, updateClassClient,
    applyTypeToAll, applyClientToAll,
    createGroup, renameGroup, deleteGroup, duplicateGroup,
    addClass, deleteClass, deleteSelected, resetDefaults,
    addType, deleteType, updateType,
  };
}
