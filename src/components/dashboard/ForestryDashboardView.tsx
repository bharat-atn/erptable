import { useState, useMemo } from "react";
import { SandboxToolsCard } from "./SandboxToolsCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle, Clock, CheckCircle2, TrendingUp,
  FolderKanban, Search, Activity, CalendarDays,
  DollarSign, BarChart3, TreePine, Leaf
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

interface ForestryDashboardViewProps {
  onNavigate?: (view: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  setup: "bg-slate-100 text-slate-700",
  planning: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  payroll_ready: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABELS: Record<string, string> = {
  setup: "Setup",
  planning: "Planning",
  in_progress: "In Progress",
  payroll_ready: "Payroll Ready",
  completed: "Completed",
};

const TYPE_LABELS: Record<string, string> = {
  clearing: "Clearing",
  planting: "Planting",
  mixed: "Mixed",
};

export function ForestryDashboardView({ onNavigate }: ForestryDashboardViewProps) {
  const { orgId } = useOrg();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
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

  const { data: tasks = [] } = useQuery({
    queryKey: ["forestry-tasks", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const projectIds = projects.map((p: any) => p.id);
      if (projectIds.length === 0) return [];
      const { data, error } = await supabase
        .from("forestry_tasks" as any)
        .select("*")
        .in("project_id", projectIds);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId && projects.length > 0,
  });

  // Computed stats
  const stats = useMemo(() => {
    const now = new Date();
    const overdue = projects.filter((p: any) => p.end_date && isPast(new Date(p.end_date)) && p.status !== "completed");
    const setup = projects.filter((p: any) => p.status === "setup");
    const active = projects.filter((p: any) => p.status === "in_progress");
    const planning = projects.filter((p: any) => p.status === "planning");
    const completed = projects.filter((p: any) => p.status === "completed");
    const pendingTasks = tasks.filter((t: any) => t.status === "pending");
    const completedTasks = tasks.filter((t: any) => t.status === "completed");
    const taskRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    const totalRevenue = projects.reduce((sum: number, p: any) => sum + (Number(p.revenue) || 0), 0);
    const totalCost = projects.reduce((sum: number, p: any) => sum + (Number(p.cost) || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const completedWithDates = completed.filter((p: any) => p.start_date && p.end_date);
    const avgDuration = completedWithDates.length > 0
      ? Math.round(completedWithDates.reduce((sum: number, p: any) => sum + differenceInDays(new Date(p.end_date), new Date(p.start_date)), 0) / completedWithDates.length)
      : 0;
    const highValue = projects.filter((p: any) => (Number(p.budget) || 0) > 100000);

    return {
      overdue: overdue.length,
      setup: setup.length,
      pendingTasks: pendingTasks.length,
      taskRate,
      total: projects.length,
      active: active.length,
      planning: planning.length,
      assignments: tasks.filter((t: any) => t.assigned_to).length,
      completed: completed.length,
      totalRevenue,
      totalProfit,
      avgDuration,
      highValue: highValue.length,
    };
  }, [projects, tasks]);

  // Filtered projects
  const filtered = useMemo(() => {
    return projects.filter((p: any) => {
      const matchSearch = !search || 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.project_id_display?.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchType = typeFilter === "all" || p.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [projects, search, statusFilter, typeFilter]);

  const formatCurrency = (val: number) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TreePine className="w-6 h-6 text-primary" />
          Forestry Project Manager
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of all forestry projects and tasks</p>
      </div>

      {/* Warning & Attention Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={AlertTriangle} label="Overdue Projects" value={stats.overdue} variant="warning" />
        <StatCard icon={Clock} label="In Setup" value={stats.setup} variant="info" />
        <StatCard icon={FolderKanban} label="Pending Tasks" value={stats.pendingTasks} variant="neutral" />
        <StatCard icon={CheckCircle2} label="Task Completion" value={`${stats.taskRate}%`} variant="success" />
      </div>

      {/* Status Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FolderKanban} label="Total Projects" value={stats.total} variant="neutral" />
        <StatCard icon={Activity} label="Active" value={stats.active} variant="info" />
        <StatCard icon={CalendarDays} label="Planning" value={stats.planning} variant="neutral" />
        <StatCard icon={TrendingUp} label="Assignments" value={stats.assignments} variant="neutral" />
      </div>

      {/* Financial Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} variant="success" />
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} variant="neutral" />
        <StatCard icon={BarChart3} label="Total Profit" value={formatCurrency(stats.totalProfit)} variant={stats.totalProfit >= 0 ? "success" : "warning"} />
        <StatCard icon={CalendarDays} label="Avg Duration" value={`${stats.avgDuration}d`} variant="neutral" />
        <StatCard icon={Leaf} label="High-Value" value={stats.highValue} variant="info" />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "setup", "planning", "in_progress", "payroll_ready", "completed"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="text-xs h-8">
              {s === "all" ? "All Status" : STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "clearing", "planting", "mixed"].map((t) => (
            <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)} className="text-xs h-8">
              {t === "all" ? "All Types" : TYPE_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingProjects ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No projects found</TableCell></TableRow>
              ) : (
                filtered.slice(0, 20).map((p: any) => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{p.project_id_display}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{TYPE_LABELS[p.type] || p.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{p.location || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.client || "—"}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[p.status] || ""}>{STATUS_LABELS[p.status] || p.status}</Badge></TableCell>
                    <TableCell className="text-xs">{p.start_date ? format(new Date(p.start_date), "yyyy-MM-dd") : "—"}</TableCell>
                    <TableCell className="text-xs">{p.end_date ? format(new Date(p.end_date), "yyyy-MM-dd") : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sandbox Tools */}
      <SandboxToolsCard />
    </div>
  );
}

// Stat Card helper
function StatCard({ icon: Icon, label, value, variant }: { icon: any; label: string; value: string | number; variant: "warning" | "info" | "success" | "neutral" }) {
  const colors = {
    warning: "border-amber-200 bg-amber-50/50",
    info: "border-blue-200 bg-blue-50/50",
    success: "border-emerald-200 bg-emerald-50/50",
    neutral: "border-border bg-card",
  };
  const iconColors = {
    warning: "text-amber-500",
    info: "text-blue-500",
    success: "text-emerald-500",
    neutral: "text-muted-foreground",
  };
  return (
    <Card className={`${colors[variant]} border`}>
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className={`w-5 h-5 shrink-0 ${iconColors[variant]}`} />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
