import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ForestryProjectFormDialog } from "./ForestryProjectFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Plus, Search, Pencil, Trash2, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  setup: "bg-slate-100 text-slate-700",
  planning: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  payroll_ready: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABELS: Record<string, string> = {
  setup: "Setup", planning: "Planning", in_progress: "In Progress",
  payroll_ready: "Payroll Ready", completed: "Completed",
};

const TYPE_LABELS: Record<string, string> = {
  clearing: "Clearing", planting: "Planting", mixed: "Mixed",
};

function generateProjectId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `PJ-${year}-${num}`;
}

export function ForestryProjectsView({ onOpenSetup }: { onOpenSetup?: (id: string) => void }) {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["forestry-projects", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("forestry_projects" as any)
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from("forestry_projects" as any).insert({
        org_id: orgId!,
        project_id_display: generateProjectId(),
        name: form.name,
        description: form.description || null,
        type: form.type,
        status: form.status,
        location: form.location || null,
        client: form.client || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: Number(form.budget) || 0,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-projects"] });
      setFormOpen(false);
      toast.success("Project created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: any }) => {
      const { error } = await supabase.from("forestry_projects" as any).update({
        name: form.name,
        description: form.description || null,
        type: form.type,
        status: form.status,
        location: form.location || null,
        client: form.client || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: Number(form.budget) || 0,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-projects"] });
      setEditProject(null);
      toast.success("Project updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forestry_projects" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-projects"] });
      setDeleteTarget(null);
      toast.success("Project deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return projects.filter((p: any) => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        p.name?.toLowerCase().includes(q) ||
        p.project_id_display?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.client?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchType = typeFilter === "all" || p.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [projects, search, statusFilter, typeFilter]);

  const formatCurrency = (val: number) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-primary" />
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projects registered</p>
        </div>
        <Button onClick={() => { setEditProject(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "setup", "planning", "in_progress", "payroll_ready", "completed"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="text-xs h-8">
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "clearing", "planting", "mixed"].map((t) => (
            <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)} className="text-xs h-8">
              {t === "all" ? "All" : TYPE_LABELS[t]}
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
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No projects found</TableCell></TableRow>
              ) : (
                filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.project_id_display}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{TYPE_LABELS[p.type] || p.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.location || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.client || "—"}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(Number(p.budget) || 0)}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[p.status] || ""}>{STATUS_LABELS[p.status] || p.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.start_date ? format(new Date(p.start_date), "MM/dd") : "—"} → {p.end_date ? format(new Date(p.end_date), "MM/dd") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditProject(p); setFormOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(p)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ForestryProjectFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditProject(null); }}
        initialData={editProject ? {
          name: editProject.name,
          description: editProject.description || "",
          type: editProject.type,
          status: editProject.status,
          location: editProject.location || "",
          client: editProject.client || "",
          start_date: editProject.start_date || "",
          end_date: editProject.end_date || "",
          budget: String(editProject.budget || 0),
        } : null}
        onSubmit={(form) => {
          if (editProject) {
            updateMutation.mutate({ id: editProject.id, form });
          } else {
            createMutation.mutate(form);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Project"
        itemName={deleteTarget?.name || ""}
        description={`This will also delete all associated tasks.`}
      />
    </div>
  );
}
