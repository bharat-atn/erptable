import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ForestryObjectFormDialog } from "./ForestryObjectFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Plus, Search, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

const SLA_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  standard: "bg-blue-100 text-blue-700",
  difficult: "bg-amber-100 text-amber-700",
  extreme: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  registered: "bg-slate-100 text-slate-700",
  planned: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABELS: Record<string, string> = {
  registered: "Registered", planned: "Planned", in_progress: "In Progress", completed: "Completed",
};

function generateObjectId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `OBJ-${year}-${num}`;
}

export function ForestryObjectsView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [slaFilter, setSlaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editObject, setEditObject] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { data: objects = [], isLoading } = useQuery({
    queryKey: ["forestry-objects", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("forestry_objects" as any)
        .select("*, forestry_projects!inner(name)")
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
        .select("id, name, project_id_display")
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

  const filtered = useMemo(() => {
    return objects.filter((o: any) => {
      const matchesSearch = !search || [o.name, o.object_id_display, o.location].some(
        (f) => f?.toLowerCase().includes(search.toLowerCase())
      );
      const matchesSla = slaFilter === "all" || o.sla_class === slaFilter;
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesSla && matchesStatus;
    });
  }, [objects, search, slaFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Objects</h1>
          <p className="text-sm text-muted-foreground">Forest parcels, cutting areas, and planting sites</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Object
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search objects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {["all", "easy", "standard", "difficult", "extreme"].map((s) => (
            <Button key={s} variant={slaFilter === s ? "default" : "outline"} size="sm" onClick={() => setSlaFilter(s)}>
              {s === "all" ? "All SLA" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "registered", "planned", "in_progress", "completed"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All Status" : STATUS_LABELS[s] || s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Object ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>SLA Class</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Area (ha)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No objects found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((obj: any) => (
                  <TableRow key={obj.id}>
                    <TableCell className="font-mono text-xs">{obj.object_id_display}</TableCell>
                    <TableCell className="font-medium">{obj.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{(obj as any).forestry_projects?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge className={SLA_COLORS[obj.sla_class] || ""} variant="secondary">
                        {obj.sla_class?.charAt(0).toUpperCase() + obj.sla_class?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{obj.location || "—"}</TableCell>
                    <TableCell className="text-sm">{obj.area_hectares != null ? Number(obj.area_hectares).toFixed(1) : "—"}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[obj.status] || ""} variant="secondary">
                        {STATUS_LABELS[obj.status] || obj.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditObject(obj)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(obj)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
