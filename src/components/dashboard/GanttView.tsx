import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ChevronLeft, ChevronRight, Search, CalendarDays, AlertTriangle,
  FolderKanban, BarChart3
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isWeekend, addMonths, subMonths, isWithinInterval, differenceInCalendarDays,
  isBefore, isAfter, startOfDay
} from "date-fns";

/* ── Status config ─────────────────────────────────── */
const STATUSES = [
  { key: "setup", label: "Setup", color: "bg-slate-400", dot: "bg-slate-400" },
  { key: "planning", label: "Planning", color: "bg-blue-500", dot: "bg-blue-500" },
  { key: "in_progress", label: "In Progress", color: "bg-emerald-500", dot: "bg-emerald-500" },
  { key: "payroll_ready", label: "Payroll Ready", color: "bg-purple-500", dot: "bg-purple-500" },
  { key: "completed", label: "Completed", color: "bg-gray-300", dot: "bg-gray-300" },
] as const;

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

const TYPE_LABELS: Record<string, string> = { clearing: "Clearing", planting: "Planting", mixed: "Mixed" };
const TYPE_BADGE: Record<string, string> = {
  clearing: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  planting: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  mixed: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const DAY_COL_W = 44; // px per day column
const PROJECT_COL_W = 260; // project name column

/* ══════════════════════════════════════════════════════ */

export function GanttView() {
  const { orgId } = useOrg();
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["forestry-projects", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("forestry_projects" as any)
        .select("*")
        .eq("org_id", orgId)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  /* ── Month days ─── */
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  /* ── Derived data ─── */
  const clients = useMemo(() => [...new Set(projects.map((p: any) => p.client).filter(Boolean))].sort(), [projects]);

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
      const matchClient = clientFilter === "all" || p.client === clientFilter;

      let matchOverdue = true;
      if (overdueOnly) {
        if (!p.end_date) matchOverdue = false;
        else matchOverdue = isBefore(new Date(p.end_date), today) && p.status !== "completed";
      }

      return matchSearch && matchStatus && matchType && matchClient && matchOverdue;
    });
  }, [projects, search, statusFilter, typeFilter, clientFilter, overdueOnly, today]);

  /* ── Projects that overlap this month ─── */
  const visibleProjects = useMemo(() => {
    return filtered.filter((p: any) => {
      if (!p.start_date && !p.end_date) return false;
      const pStart = p.start_date ? startOfDay(new Date(p.start_date)) : null;
      const pEnd = p.end_date ? startOfDay(new Date(p.end_date)) : null;
      if (pStart && pEnd) {
        return !(isAfter(pStart, monthEnd) || isBefore(pEnd, monthStart));
      }
      if (pStart) return !isAfter(pStart, monthEnd);
      if (pEnd) return !isBefore(pEnd, monthStart);
      return false;
    });
  }, [filtered, monthStart, monthEnd]);

  /* ── Bar position calc ─── */
  function getBarStyle(p: any) {
    const pStart = p.start_date ? startOfDay(new Date(p.start_date)) : null;
    const pEnd = p.end_date ? startOfDay(new Date(p.end_date)) : null;

    const barStart = pStart && isBefore(pStart, monthStart) ? monthStart : pStart || monthStart;
    const barEnd = pEnd && isAfter(pEnd, monthEnd) ? monthEnd : pEnd || monthEnd;

    const left = differenceInCalendarDays(barStart, monthStart) * DAY_COL_W;
    const width = (differenceInCalendarDays(barEnd, barStart) + 1) * DAY_COL_W - 4;

    const clipsLeft = pStart && isBefore(pStart, monthStart);
    const clipsRight = pEnd && isAfter(pEnd, monthEnd);

    return { left, width: Math.max(width, DAY_COL_W - 4), clipsLeft, clipsRight };
  }

  const goToday = () => setCurrentMonth(startOfMonth(today));

  const totalWidth = days.length * DAY_COL_W;

  return (
    <div className="space-y-5 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Project Timeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Visual overview of project schedules and progress</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-3">
        {/* Month nav */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-sm min-w-[130px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 ml-1 text-xs" onClick={goToday}>Today</Button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>

        {/* Project count */}
        <Badge variant="outline" className="ml-auto text-xs gap-1">
          <FolderKanban className="w-3 h-3" /> {visibleProjects.length} Projects
        </Badge>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="clearing">Clearing</SelectItem>
            <SelectItem value="planting">Planting</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Client" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant={overdueOnly ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => setOverdueOnly(!overdueOnly)}
        >
          <AlertTriangle className="w-3 h-3" /> Overdue Only
        </Button>
      </div>

      {/* Gantt Chart */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="flex">
          {/* Fixed project column */}
          <div className="flex-shrink-0 border-r border-border" style={{ width: PROJECT_COL_W }}>
            {/* Header */}
            <div className="h-14 border-b border-border flex items-center px-4 bg-muted/30">
              <span className="font-semibold text-sm text-foreground">Project</span>
            </div>
            {/* Project rows */}
            {visibleProjects.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
                No projects found for this period
              </div>
            ) : (
              visibleProjects.map((p: any, i: number) => (
                <div
                  key={p.id}
                  className={`h-14 flex items-center px-3 gap-2 border-b border-border/50 ${i % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_MAP[p.status]?.dot || "bg-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs font-medium text-foreground truncate cursor-default">{p.name}</p>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.project_id_display} · {p.client || "No client"}</p>
                        {p.start_date && p.end_date && (
                          <p className="text-xs mt-1">{format(new Date(p.start_date), "MMM dd")} → {format(new Date(p.end_date), "MMM dd, yyyy")}</p>
                        )}
                        {p.budget > 0 && <p className="text-xs">Budget: {Number(p.budget).toLocaleString("sv-SE")} SEK</p>}
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {p.project_id_display}
                      {p.client ? ` · ${p.client}` : ""}
                    </p>
                  </div>
                  <Badge className={`text-[9px] px-1.5 py-0 h-4 flex-shrink-0 ${TYPE_BADGE[p.type] || ""}`}>
                    {TYPE_LABELS[p.type] || p.type}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {/* Scrollable timeline area */}
          <div className="flex-1 overflow-x-auto" ref={scrollRef}>
            <div style={{ width: totalWidth, minWidth: "100%" }}>
              {/* Day headers */}
              <div className="h-14 border-b border-border flex bg-muted/30">
                {days.map((day) => {
                  const isToday = isSameDay(day, today);
                  const weekend = isWeekend(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-border/30 ${
                        isToday ? "bg-primary/10" : weekend ? "bg-muted/40" : ""
                      }`}
                      style={{ width: DAY_COL_W }}
                    >
                      <span className={`text-xs font-bold leading-tight ${isToday ? "text-primary" : "text-foreground"}`}>
                        {format(day, "d")}
                      </span>
                      <span className={`text-[10px] leading-tight ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                        {format(day, "EEE")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Project bar rows */}
              {visibleProjects.length === 0 ? (
                <div className="h-20" />
              ) : (
                visibleProjects.map((p: any, i: number) => {
                  const bar = getBarStyle(p);
                  const statusCfg = STATUS_MAP[p.status];
                  const isOverdue = p.end_date && isBefore(new Date(p.end_date), today) && p.status !== "completed";
                  const progress = p.status === "completed" ? 100 : p.status === "payroll_ready" ? 90 : p.status === "in_progress" ? 55 : p.status === "planning" ? 25 : 10;

                  return (
                    <div
                      key={p.id}
                      className={`h-14 relative border-b border-border/30 ${i % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                    >
                      {/* Weekend/today stripes */}
                      {days.map((day) => {
                        const isToday = isSameDay(day, today);
                        const weekend = isWeekend(day);
                        if (!isToday && !weekend) return null;
                        return (
                          <div
                            key={day.toISOString()}
                            className={`absolute top-0 bottom-0 ${isToday ? "bg-primary/5 border-l-2 border-primary/30" : "bg-muted/20"}`}
                            style={{
                              left: differenceInCalendarDays(day, monthStart) * DAY_COL_W,
                              width: DAY_COL_W,
                            }}
                          />
                        );
                      })}

                      {/* Bar */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute top-2.5 h-9 ${
                              bar.clipsLeft ? "rounded-l-none" : "rounded-l-md"
                            } ${
                              bar.clipsRight ? "rounded-r-none" : "rounded-r-md"
                            } cursor-pointer transition-all hover:brightness-110 hover:shadow-md group`}
                            style={{ left: bar.left + 2, width: bar.width }}
                          >
                            {/* Background */}
                            <div className={`absolute inset-0 ${statusCfg?.color || "bg-gray-400"} opacity-20 ${
                              bar.clipsLeft ? "rounded-l-none" : "rounded-l-md"
                            } ${bar.clipsRight ? "rounded-r-none" : "rounded-r-md"}`} />
                            {/* Progress fill */}
                            <div
                              className={`absolute top-0 bottom-0 left-0 ${statusCfg?.color || "bg-gray-400"} opacity-70 ${
                                bar.clipsLeft ? "rounded-l-none" : "rounded-l-md"
                              } ${progress >= 100 && !bar.clipsRight ? "rounded-r-md" : ""}`}
                              style={{ width: `${progress}%` }}
                            />
                            {/* Label */}
                            <div className="relative z-10 h-full flex items-center px-2 overflow-hidden">
                              <span className="text-[10px] font-semibold text-foreground truncate drop-shadow-sm">
                                {p.name}
                              </span>
                              {isOverdue && (
                                <AlertTriangle className="w-3 h-3 text-destructive ml-1 flex-shrink-0 animate-pulse" />
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.project_id_display}</p>
                            <div className="flex gap-3 text-xs">
                              <span>Status: <strong>{STATUS_MAP[p.status]?.label}</strong></span>
                              <span>Type: <strong>{TYPE_LABELS[p.type]}</strong></span>
                            </div>
                            {p.start_date && <p className="text-xs">Start: {format(new Date(p.start_date), "MMM dd, yyyy")}</p>}
                            {p.end_date && <p className="text-xs">End: {format(new Date(p.end_date), "MMM dd, yyyy")}</p>}
                            {p.start_date && p.end_date && (
                              <p className="text-xs">Duration: {differenceInCalendarDays(new Date(p.end_date), new Date(p.start_date))} days</p>
                            )}
                            {p.budget > 0 && <p className="text-xs">Budget: {Number(p.budget).toLocaleString("sv-SE")} SEK</p>}
                            {isOverdue && <p className="text-xs text-destructive font-semibold">⚠ Overdue</p>}
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full ${statusCfg?.color} rounded-full`} style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-[10px] font-medium">{progress}%</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground py-2">
        {STATUSES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${s.dot}`} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
