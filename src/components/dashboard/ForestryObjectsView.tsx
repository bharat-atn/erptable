import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ForestryObjectFormDialog } from "./ForestryObjectFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import {
  Plus, Search, Pencil, Trash2, MapPin, Layers, TrendingUp, Settings2,
  Copy, Download, Upload, ArrowUpDown, ArrowUp, ArrowDown, Hexagon, AlertTriangle,
  SlidersHorizontal, BookmarkPlus,
} from "lucide-react";
import { toast } from "sonner";

type SortKey = "object_id_display" | "type" | "area_hectares" | "notes";
type SortDir = "asc" | "desc";

function generateObjectId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `OBJ-${year}-${num}`;
}

function getObjectType(obj: any): "clearing" | "planting" | "unknown" {
  const name = (obj.name || "").toLowerCase();
  const projType = obj.forestry_projects?.type?.toLowerCase();
  if (name.includes("planting") || projType === "planting") return "planting";
  if (name.includes("clearing") || projType === "clearing") return "clearing";
  if (projType === "mixed") {
    if (name.includes("plant")) return "planting";
    return "clearing";
  }
  return "unknown";
}

function getTypeLabel(type: string) {
  switch (type) {
    case "clearing": return "Forest Clearing";
    case "planting": return "Forest Planting";
    default: return "Unknown";
  }
}

function getQuantityDisplay(obj: any, type: string) {
  if (type === "planting") {
    // Use area_hectares as a proxy for plant count if large, or notes may contain it
    const plants = obj.area_hectares ? Math.round(obj.area_hectares) : null;
    if (plants != null) return { value: plants.toLocaleString(), unit: "forest plants" };
    return { value: "—", unit: "" };
  }
  if (obj.area_hectares != null) {
    return { value: Number(obj.area_hectares).toLocaleString(undefined, { maximumFractionDigits: 1 }), unit: "hectares" };
  }
  return { value: "—", unit: "" };
}

export function ForestryObjectsView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "clearing" | "planting">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editObject, setEditObject] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("object_id_display");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: objects = [], isLoading } = useQuery({
    queryKey: ["forestry-objects", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("forestry_objects" as any)
        .select("*, forestry_projects!inner(name, type)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["forestry-projects", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("forestry_projects")
        .select("id, name, project_id_display, type")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("forestry_objects" as any).insert({
        ...values,
        org_id: orgId,
        object_id_display: generateObjectId(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-objects"] });
      toast.success("Object created");
      setFormOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      const { error } = await supabase.from("forestry_objects" as any).update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-objects"] });
      toast.success("Object updated");
      setEditObject(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forestry_objects" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-objects"] });
      toast.success("Object deleted");
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (obj: any) => {
      const { error } = await supabase.from("forestry_objects" as any).insert({
        name: obj.name,
        description: obj.description,
        project_id: obj.project_id,
        sla_class: obj.sla_class,
        location: obj.location,
        area_hectares: obj.area_hectares,
        status: "registered",
        coordinates: obj.coordinates,
        notes: obj.notes,
        org_id: orgId,
        object_id_display: generateObjectId(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-objects"] });
      toast.success("Object duplicated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Derived stats
  const stats = useMemo(() => {
    let clearingCount = 0, plantingCount = 0, totalHectares = 0, totalPlants = 0, missingMethod = 0;
    objects.forEach((o: any) => {
      const type = getObjectType(o);
      if (type === "clearing") {
        clearingCount++;
        totalHectares += Number(o.area_hectares || 0);
      } else if (type === "planting") {
        plantingCount++;
        totalPlants += Number(o.area_hectares || 0);
      }
      // "Missing Method" = no comp method assigned (placeholder logic)
      missingMethod++;
    });
    return {
      total: objects.length,
      clearing: clearingCount,
      planting: plantingCount,
      totalHectares,
      totalPlants,
      missingMethod,
    };
  }, [objects]);

  const filtered = useMemo(() => {
    let result = objects.filter((o: any) => {
      const matchesSearch = !search || [o.name, o.object_id_display, o.location, o.notes].some(
        (f) => f?.toLowerCase().includes(search.toLowerCase())
      );
      const type = getObjectType(o);
      const matchesType = typeFilter === "all" || type === typeFilter;
      return matchesSearch && matchesType;
    });

    // Sort
    result = [...result].sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      if (sortKey === "type") {
        aVal = getObjectType(a);
        bVal = getObjectType(b);
      } else if (sortKey === "area_hectares") {
        aVal = Number(a.area_hectares || 0);
        bVal = Number(b.area_hectares || 0);
      } else {
        aVal = (a[sortKey] || "").toLowerCase();
        bVal = (b[sortKey] || "").toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [objects, search, typeFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3.5 h-3.5 ml-1" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1" />;
  };

  const allFilteredIds = useMemo(() => new Set(filtered.map((o: any) => o.id)), [filtered]);
  const allSelected = filtered.length > 0 && filtered.every((o: any) => selectedIds.has(o.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((o: any) => o.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Export CSV
  const exportCsv = useCallback(() => {
    const headers = ["Object ID", "Type", "Comp. Method", "Quantity", "Unit", "Notes"];
    const rows = filtered.map((obj: any) => {
      const type = getObjectType(obj);
      const qty = getQuantityDisplay(obj, type);
      return [obj.object_id_display, getTypeLabel(type), "", qty.value, qty.unit, obj.notes || ""].map(
        (v) => `"${String(v).replace(/"/g, '""')}"`
      ).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "object-register.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [filtered]);

  // Download template
  const downloadTemplate = useCallback(() => {
    const headers = ["Object ID", "Name", "Type", "Project ID", "SLA Class", "Area/Quantity", "Location", "Notes"];
    const sample = ["D00001", "Forest Clearing North", "Forest Clearing", "PJ-26-0001", "standard", "15.5", "Ånge", "Sample note"];
    const csv = [headers.join(","), sample.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "object-register-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Object Register</h1>
        <p className="text-sm text-muted-foreground">Manage forest clearing and planting objects with proper hierarchy</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Objects</p>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <Hexagon className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clearing Objects</p>
              <p className="text-3xl font-bold text-foreground">{stats.clearing}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stats.totalHectares.toLocaleString(undefined, { maximumFractionDigits: 1 })} hectares</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <Layers className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Planting Objects</p>
              <p className="text-3xl font-bold text-foreground">{stats.planting}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stats.totalPlants.toLocaleString()} plants</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Missing Method</p>
              <p className="text-3xl font-bold text-foreground">{stats.missingMethod}</p>
              <p className="text-xs text-destructive font-medium mt-0.5">Needs attention</p>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search objects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="flex rounded-lg border overflow-hidden">
          {(["all", "clearing", "planting"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => toast.info("Column picker coming soon")}>
            <SlidersHorizontal className="w-4 h-4 mr-1.5" /> Columns
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-1.5" /> Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("CSV import coming soon")}>
            <Upload className="w-4 h-4 mr-1.5" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Object
          </Button>
        </div>
      </div>

      {/* Save filter + count */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => toast.info("Filter saving coming soon")}>
          <BookmarkPlus className="w-4 h-4 mr-1.5" /> Save Filter
        </Button>
        <span className="text-sm text-muted-foreground">
          Showing {filtered.length} of {objects.length} objects
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("object_id_display")}>
                  <span className="flex items-center">Object ID <SortIcon col="object_id_display" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("type")}>
                  <span className="flex items-center">Type <SortIcon col="type" /></span>
                </TableHead>
                <TableHead>Comp. Method</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("area_hectares")}>
                  <span className="flex items-center">Quantity <SortIcon col="area_hectares" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("notes")}>
                  <span className="flex items-center">Notes <SortIcon col="notes" /></span>
                </TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No objects found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((obj: any) => {
                  const type = getObjectType(obj);
                  const qty = getQuantityDisplay(obj, type);
                  return (
                    <TableRow key={obj.id} className="group">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(obj.id)}
                          onCheckedChange={() => toggleOne(obj.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">{obj.object_id_display}</span>
                        <button
                          className="ml-1.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                          title="Copy ID"
                          onClick={() => { navigator.clipboard.writeText(obj.object_id_display); toast.success("Copied"); }}
                        >
                          <Copy className="w-3.5 h-3.5 inline text-muted-foreground" />
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">{getTypeLabel(type)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{qty.value}</div>
                        {qty.unit && <div className="text-xs text-muted-foreground">{qty.unit}</div>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {obj.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditObject(obj)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateMutation.mutate(obj)} title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(obj)} title="Delete">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <ForestryObjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(v) => createMutation.mutate(v)}
        projects={projects}
        loading={createMutation.isPending}
      />

      {/* Edit dialog */}
      {editObject && (
        <ForestryObjectFormDialog
          open={!!editObject}
          onOpenChange={(open) => { if (!open) setEditObject(null); }}
          onSubmit={(v) => updateMutation.mutate({ id: editObject.id, ...v })}
          initialData={editObject}
          projects={projects}
          loading={updateMutation.isPending}
        />
      )}

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Object"
        itemName={deleteTarget?.name || ""}
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
