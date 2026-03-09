import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, CheckCircle2, Clock, AlertCircle, AlertTriangle,
  TrendingUp, Users, FolderKanban, Loader2, BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { format, startOfWeek, subWeeks, getISOWeek } from "date-fns";

interface TimeReportingDashboardViewProps {
  onNavigate: (view: string) => void;
}

export function TimeReportingDashboardView({ onNavigate }: TimeReportingDashboardViewProps) {
  const { orgId } = useOrg();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["time-reporting-stats", orgId],
    queryFn: async () => {
      const now = new Date();
      const year = now.getFullYear();
      const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const currentWeek = getISOWeek(now);

      const { data: reports } = await supabase
        .from("weekly_reports")
        .select("id, status, week_number, year, project_id, submitted_at")
        .eq("org_id", orgId!)
        .eq("year", year);

      const { data: projects } = await supabase
        .from("forestry_projects")
        .select("id, name, status, project_id_display")
        .eq("org_id", orgId!)
        .in("status", ["in_progress", "planning"]);

      const { data: employees } = await supabase
        .from("employees")
        .select("id")
        .eq("org_id", orgId!)
        .eq("status", "ACTIVE");

      // Get last 8 weeks for chart
      const weeklyData: { week: string; approved: number; pending: number; draft: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekDate = subWeeks(currentWeekStart, i);
        const weekNum = getISOWeek(weekDate);
        const weekReports = (reports || []).filter(r => r.week_number === weekNum);
        weeklyData.push({
          week: `W${weekNum}`,
          approved: weekReports.filter(r => r.status === "approved").length,
          pending: weekReports.filter(r => r.status === "submitted").length,
          draft: weekReports.filter(r => r.status === "draft").length,
        });
      }

      // Check for unsubmitted current week (projects without reports this week)
      const currentWeekReportProjectIds = (reports || [])
        .filter(r => r.week_number === currentWeek && r.status !== "draft")
        .map(r => r.project_id);
      const projectsWithoutReport = (projects || []).filter(
        p => !currentWeekReportProjectIds.includes(p.id)
      );

      // Team productivity (hours from attendance_entries in approved reports)
      const { data: attendanceData } = await supabase
        .from("attendance_entries")
        .select("employee_id, hours, worked, weekly_reports!inner(status, year)")
        .eq("weekly_reports.status", "approved")
        .eq("weekly_reports.year", year);

      const employeeHours: Record<string, number> = {};
      (attendanceData || []).forEach((e: any) => {
        if (e.worked) {
          employeeHours[e.employee_id] = (employeeHours[e.employee_id] || 0) + (Number(e.hours) || 0);
        }
      });

      const sortedEmployees = Object.entries(employeeHours)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Get employee names for top performers
      let topPerformers: { id: string; hours: number; name: string }[] = [];
      if (sortedEmployees.length > 0) {
        const { data: empData } = await supabase
          .from("employees")
          .select("id, first_name, last_name, employee_code")
          .in("id", sortedEmployees.map(e => e[0]));

        topPerformers = sortedEmployees.map(([id, hours]) => {
          const emp = (empData || []).find((e: any) => e.id === id);
          return {
            id,
            hours,
            name: emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || emp.employee_code || "—" : "—",
          };
        });
      }

      const allReports = reports || [];
      return {
        totalReports: allReports.length,
        draftCount: allReports.filter(r => r.status === "draft").length,
        submittedCount: allReports.filter(r => r.status === "submitted").length,
        approvedCount: allReports.filter(r => r.status === "approved").length,
        activeProjects: (projects || []).length,
        activeEmployees: (employees || []).length,
        projects: projects || [],
        weeklyData,
        projectsWithoutReport,
        currentWeek,
        topPerformers,
      };
    },
    enabled: !!orgId,
  });

  return (
    <div className="space-y-4 md:space-y-6 pt-2 md:pt-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Time & Status Reporting</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Tid- & statusrapportering • Weekly attendance and project progress
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Pending actions banner */}
          {stats?.projectsWithoutReport && stats.projectsWithoutReport.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                      Week {stats.currentWeek} reports pending
                    </p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">
                      {stats.projectsWithoutReport.length} project{stats.projectsWithoutReport.length !== 1 ? "s" : ""} missing submitted report this week:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {stats.projectsWithoutReport.slice(0, 3).map((p: any) => (
                        <Badge key={p.id} variant="outline" className="text-[10px] border-amber-500/40 bg-amber-100/50 dark:bg-amber-900/30">
                          {p.project_id_display}
                        </Badge>
                      ))}
                      {stats.projectsWithoutReport.length > 3 && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/40">
                          +{stats.projectsWithoutReport.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 h-8 border-amber-500/40 text-amber-700 hover:bg-amber-100" onClick={() => onNavigate("weekly-attendance")}>
                    Submit →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-border/60 cursor-pointer hover:border-primary/40 active:scale-[0.98] transition-all" onClick={() => onNavigate("weekly-attendance")}>
              <CardContent className="p-3 md:pt-4 md:pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-[11px] md:text-xs text-muted-foreground">Draft Reports</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stats?.draftCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 cursor-pointer hover:border-primary/40 active:scale-[0.98] transition-all" onClick={() => onNavigate("approvals")}>
              <CardContent className="p-3 md:pt-4 md:pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] md:text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stats?.submittedCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-3 md:pt-4 md:pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] md:text-xs text-muted-foreground">Approved</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stats?.approvedCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-3 md:pt-4 md:pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[11px] md:text-xs text-muted-foreground">Employees</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stats?.activeEmployees || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly completion chart */}
          {stats?.weeklyData && stats.weeklyData.length > 0 && (
            <Card className="border-border/60">
              <CardContent className="p-4 md:pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Weekly Report Status (Last 8 Weeks)</h3>
                </div>
                <div className="h-[140px] md:h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.weeklyData} barCategoryGap="20%">
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={20} />
                      <Bar dataKey="approved" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="pending" stackId="a" fill="hsl(var(--chart-4))" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="draft" stackId="a" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--chart-2))" }} />
                    Approved
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--chart-4))" }} />
                    Pending
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--chart-3))" }} />
                    Draft
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team productivity & quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Top performers */}
            {stats?.topPerformers && stats.topPerformers.length > 0 && (
              <Card className="border-border/60">
                <CardContent className="p-4 md:pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-sm">Top Hours This Year</h3>
                  </div>
                  <div className="space-y-2">
                    {stats.topPerformers.map((emp, i) => (
                      <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/30 border border-border/40">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium truncate">{emp.name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{emp.hours}h</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick action cards */}
            <Card className="border-border/60 cursor-pointer hover:border-primary/40 active:scale-[0.99] transition-all" onClick={() => onNavigate("weekly-attendance")}>
              <CardContent className="p-4 md:pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Weekly Attendance</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Report daily attendance and hours for each team member per project.
                </p>
                <Button size="sm" className="h-9 md:h-8 w-full md:w-auto">
                  Open Attendance →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress reporting card */}
          <Card className="border-border/60 cursor-pointer hover:border-primary/40 active:scale-[0.99] transition-all" onClick={() => onNavigate("progress-reporting")}>
            <CardContent className="p-4 md:pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">Progress Reporting</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Report completion % per object. Project manager sees project-level progress.
              </p>
              <Button size="sm" className="h-9 md:h-8 w-full md:w-auto">
                Open Progress →
              </Button>
            </CardContent>
          </Card>

          {/* Active projects */}
          {stats?.projects && stats.projects.length > 0 && (
            <Card className="border-border/60">
              <CardContent className="p-4 md:pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <FolderKanban className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Active Projects</h3>
                </div>
                <div className="space-y-2">
                  {stats.projects.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 md:p-2 rounded-lg bg-accent/30 border border-border/40">
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium block truncate">{p.name}</span>
                        <span className="text-[11px] text-muted-foreground">{p.project_id_display}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize ml-2 shrink-0">{p.status?.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
