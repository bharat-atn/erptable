import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ForestryProjectFormDialog } from "./ForestryProjectFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import {
  Search, MoreVertical, MapPin, Calendar, Pencil, Trash2,
  ArrowUpDown, Rocket, Clock, TrendingUp, CheckCircle2, Wallet,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInCalendarDays } from "date-fns";

/* ── Status pipeline ─────────────────────────────────────────── */
const STATUSES = [
  { key: "setup", label: "Setup", icon: Rocket, gradient: "from-orange-400 to-amber-500", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800/40", accent: "text-orange-600" },
  { key: "planning", label: "Planning", icon: Clock, gradient: "from-blue-400 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800/40", accent: "text-blue-600" },
  { key: "in_progress", label: "In Progress", icon: TrendingUp, gradient: "from-emerald-400 to-green-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800/40", accent: "text-emerald-600" },
  { key: "payroll_ready", label: "Payroll Ready", icon: Wallet, gradient: "from-purple-400 to-violet-500", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800/40", accent: "text-purple-600" },
  { key: "completed", label: "Completed", icon: CheckCircle2, gradient: "from-slate-400 to-gray-500", bg: "bg-slate-50 dark:bg-slate-950/30", border: "border-slate-200 dark:border-slate-800/40", accent: "text-slate-500" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  clearing: "bg-emerald-500 text-white",
  planting: "bg-sky-500 text-white",
  mixed: "bg-amber-500 text-white",
};

const TYPE_LABELS: Record<string, string> = { clearing: "Clearing", planting: "Planting", mixed: "Mixed" };

type SortOption = "none" | "date_asc" | "date_desc" | "budget_asc" | "budget_desc" | "name";
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "none", label: "No Sort" },
  { value: "date_asc", label: "Date ↑" },
  { value: "date_desc", label: "Date ↓" },
  { value: "budget_desc", label: "Budget ↓" },
  { value: "budget_asc", label: "Budget ↑" },
  { value: "name", label: "Name A-Z" },
];

function formatValue(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val}`;
}

/* ── Fake team avatars (deterministic by project id) ──── */
const AVATAR_COLORS = ["bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-sky-500", "bg-indigo-500"];
const AVATAR_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function getAvatars(id: string): { letter: string; color: string }[] {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = (hash % 4) + 1;
  return Array.from({ length: count }, (_, i) => ({
    letter: AVATAR_LETTERS[(hash + i) % AVATAR_LETTERS.length],
    color: AVATAR_COLORS[(hash + i * 3) % AVATAR_COLORS.length],
  }));
}

/* ── Progress calc based on lifecycle position ──── */
function statusProgress(status: string): number {
  const map: Record<string, number> = { setup: 83, planning: 50, in_progress: 65, payroll_ready: 90, completed: 100 };
  return map[status] ?? 0;
}

/* ══════════════════════════════════════════════════════════════ */

export function KanbanBoardView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("none");
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const { data: projects = [] } = useQuery({
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("forestry_projects" as any).update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-projects"] });
      toast.success("Project moved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: any }) => {
      const { error } = await supabase.from("forestry_projects" as any).update({
        name: form.name, description: form.description || null, type: form.type,
        status: form.status, location: form.location || null, client: form.client || null,
        start_date: form.start_date || null, end_date: form.end_date || null,
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

  /* ── Derived data ─── */
  const clients = useMemo(() => [...new Set(projects.map((p: any) => p.client).filter(Boolean))].sort(), [projects]);

  const filtered = useMemo(() => {
    let list = projects.filter((p: any) => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        p.name?.toLowerCase().includes(q) ||
        p.project_id_display?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.client?.toLowerCase().includes(q);
      const matchClient = clientFilter === "all" || p.client === clientFilter;
      const matchType = typeFilter === "all" || p.type === typeFilter;
      return matchSearch && matchClient && matchType;
    });

    if (sort !== "none") {
      list = [...list].sort((a: any, b: any) => {
        switch (sort) {
          case "date_asc": return (a.start_date || "").localeCompare(b.start_date || "");
          case "date_desc": return (b.start_date || "").localeCompare(a.start_date || "");
          case "budget_desc": return (Number(b.budget) || 0) - (Number(a.budget) || 0);
          case "budget_asc": return (Number(a.budget) || 0) - (Number(b.budget) || 0);
          case "name": return (a.name || "").localeCompare(b.name || "");
          default: return 0;
        }
      });
    }

    return list;
  }, [projects, search, clientFilter, typeFilter, sort]);

  const columns = useMemo(() => {
    return STATUSES.map((s) => ({
      ...s,
      projects: filtered.filter((p: any) => p.status === s.key),
      totalBudget: filtered.filter((p: any) => p.status === s.key).reduce((sum: number, p: any) => sum + (Number(p.budget) || 0), 0),
      totalDays: filtered.filter((p: any) => p.status === s.key).reduce((sum: number, p: any) => {
        if (p.start_date && p.end_date) return sum + differenceInCalendarDays(new Date(p.end_date), new Date(p.start_date));
        return sum;
      }, 0),
    }));
  }, [filtered]);

  /* ── Drag handlers ─── */
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDragItem(projectId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, statusKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(statusKey);
  };
  const handleDragLeave = () => setDragOverCol(null);
  const handleDrop = (e: React.DragEvent, statusKey: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!dragItem) return;
    const project = projects.find((p: any) => p.id === dragItem);
    if (project && project.status !== statusKey) {
      updateStatusMutation.mutate({ id: dragItem, status: statusKey });
    }
    setDragItem(null);
  };

  return (
    <div className="space-y-5 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
          <Rocket className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Project Kanban</h1>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 bg-background" />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[150px] h-10"><SelectValue placeholder="All Clients" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] h-10"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="clearing">Clearing</SelectItem>
            <SelectItem value="planting">Planting</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-[130px] h-10">
            <div className="flex items-center gap-1.5"><ArrowUpDown className="w-3.5 h-3.5" /><SelectValue placeholder="No Sort" /></div>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
        {columns.map((col) => {
          const Icon = col.icon;
          const isDropTarget = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              className={`flex-shrink-0 w-[268px] flex flex-col rounded-xl border ${col.border} ${col.bg} transition-all duration-200 ${isDropTarget ? "ring-2 ring-primary/50 scale-[1.01]" : ""}`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {/* Column header */}
              <div className="p-3 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${col.gradient} shadow-sm`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-foreground">{col.label}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">{col.projects.length} project{col.projects.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>Value <strong className="text-foreground ml-1">{formatValue(col.totalBudget)}</strong></span>
                  {col.key === "setup" && <span>Days <strong className="text-foreground ml-1">{col.totalDays}</strong></span>}
                  {col.key !== "setup" && <span><strong className="text-foreground">{formatValue(col.totalBudget)}</strong></span>}
                </div>
                <div className={`h-0.5 mt-2 rounded-full bg-gradient-to-r ${col.gradient} opacity-60`} />
              </div>

              {/* Cards */}
              <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
                {col.projects.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground/60">
                    Drop project here
                  </div>
                )}
                {col.projects.map((p: any) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    statusAccent={col.accent}
                    onDragStart={handleDragStart}
                    onEdit={(proj) => { setEditProject(proj); setFormOpen(true); }}
                    onDelete={(proj) => setDeleteTarget(proj)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <ForestryProjectFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditProject(null); }}
        initialData={editProject ? {
          name: editProject.name, description: editProject.description || "",
          type: editProject.type, status: editProject.status,
          location: editProject.location || "", client: editProject.client || "",
          start_date: editProject.start_date || "", end_date: editProject.end_date || "",
          budget: String(editProject.budget || 0),
        } : null}
        onSubmit={(form) => {
          if (editProject) updateMutation.mutate({ id: editProject.id, form });
        }}
        loading={updateMutation.isPending}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Project"
        itemName={deleteTarget?.name || ""}
        description="This will also delete all associated objects and tasks."
      />
    </div>
  );
}

/* ═══ Card Component ════════════════════════════════════════ */

function ProjectCard({ project, statusAccent, onDragStart, onEdit, onDelete }: {
  project: any;
  statusAccent: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onEdit: (p: any) => void;
  onDelete: (p: any) => void;
}) {
  const p = project;
  const progress = statusProgress(p.status);
  const avatars = getAvatars(p.id);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, p.id)}
      className="group bg-card rounded-lg border border-border/60 shadow-sm hover:shadow-md hover:border-border transition-all duration-150 cursor-grab active:cursor-grabbing active:shadow-lg active:scale-[1.02]"
    >
      <div className="p-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-foreground leading-tight truncate">{p.name}</h4>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{p.project_id_display}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEdit(p)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(p)} className="text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Client */}
        {p.client && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary">{p.client.charAt(0)}</span>
            </div>
            <span className="text-xs text-muted-foreground truncate">{p.client}</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] ${statusAccent} flex items-center gap-1`}>
              <Rocket className="w-3 h-3" />
              {STATUSES.find((s) => s.key === p.status)?.label}
            </span>
            <span className="text-[11px] font-medium text-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 my-2.5" />

        {/* Bottom meta */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {p.location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />{p.location}
            </span>
          )}
          {p.end_date && (
            <span className="flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />{format(new Date(p.end_date), "MMM dd")}
            </span>
          )}
        </div>

        {/* Footer: avatars + type badge */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex -space-x-1.5">
            {avatars.map((a, i) => (
              <div key={i} className={`w-6 h-6 rounded-full ${a.color} flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-card`}>
                {a.letter}
              </div>
            ))}
          </div>
          <Badge className={`text-[10px] px-2 py-0 h-5 font-semibold ${TYPE_COLORS[p.type] || "bg-muted text-muted-foreground"}`}>
            {TYPE_LABELS[p.type] || p.type}
          </Badge>
        </div>
      </div>
    </div>
  );
}
