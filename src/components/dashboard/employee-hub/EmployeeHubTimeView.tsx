import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock, CheckCircle2, AlertCircle, Star, FolderKanban, Loader2, BarChart3
} from "lucide-react";
import { format } from "date-fns";

/**
 * EmployeeHubTimeView — shows the logged-in employee their own
 * weekly hours, project assignments, and report approval status.
 * Read-only data from what team leaders submitted via Time & Status Reporting.
 */
export function EmployeeHubTimeView() {
  const { orgId } = useOrg();

  // Get the current user's employee record
  const { data: currentEmployee, isLoading: empLoading } = useQuery({
    queryKey: ["my-employee-record", orgId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Try to match employee by email
      const { data: profiles } = await supabase
        .from("profiles" as any)
        .select("email")
        .eq("user_id", user.id)
        .maybeSingle();

      const email = (profiles as any)?.email || user.email;
      if (!email) return null;

      const { data: emp } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code, status")
        .eq("org_id", orgId!)
        .eq("email", email)
        .maybeSingle();

      return emp;
    },
    enabled: !!orgId,
  });

  // Get project assignments
  const { data: assignments = [], isLoading: assignLoading } = useQuery({
    queryKey: ["my-project-assignments", currentEmployee?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_project_members")
        .select("role, star_rating, forestry_projects!inner(id, name, project_id_display, status)")
        .eq("employee_id", currentEmployee!.id);
      return data || [];
    },
    enabled: !!currentEmployee?.id,
  });

  // Get attendance entries for this employee
  const { data: myAttendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["my-attendance", currentEmployee?.id, orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_entries")
        .select("worked, hours, work_date, weekly_reports!inner(week_number, year, status, forestry_projects!inner(name, project_id_display))")
        .eq("employee_id", currentEmployee!.id)
        .order("work_date", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!currentEmployee?.id,
  });

  // Group attendance by week
  const weeklyHours: { week: string; project: string; projectId: string; hours: number; days: number; status: string }[] = [];
  const weekMap = new Map<string, { hours: number; days: number; status: string; project: string; projectId: string }>();

  myAttendance.forEach((a: any) => {
    const report = a.weekly_reports;
    const key = `W${report.week_number}-${report.year}-${report.forestry_projects?.name}`;
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        hours: 0,
        days: 0,
        status: report.status,
        project: report.forestry_projects?.name || "—",
        projectId: report.forestry_projects?.project_id_display || "",
      });
    }
    const entry = weekMap.get(key)!;
    if (a.worked) {
      entry.hours += Number(a.hours) || 0;
      entry.days += 1;
    }
  });

  weekMap.forEach((val, key) => {
    const parts = key.split("-");
    weeklyHours.push({
      week: parts[0] + ", " + parts[1],
      project: val.project,
      projectId: val.projectId,
      hours: val.hours,
      days: val.days,
      status: val.status,
    });
  });

  const isLoading = empLoading || assignLoading || attendanceLoading;

  const statusBadge = (s: string) => {
    switch (s) {
      case "approved": return <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-0.5" />Approved</Badge>;
      case "submitted": return <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><AlertCircle className="w-3 h-3 mr-0.5" />Pending</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
    }
  };

  if (!currentEmployee && !isLoading) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <h2 className="text-lg font-bold">My Time Reports</h2>
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No employee record linked to your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pt-2 pb-24">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* My Project Assignments */}
          <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <FolderKanban className="w-4 h-4" /> My Projects
            </h3>
            {assignments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No project assignments found.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-border/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{a.forestry_projects?.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.forestry_projects?.project_id_display} • {a.role || "Worker"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.star_rating > 0 && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: a.star_rating }).map((_, j) => (
                            <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                      <Badge variant="outline" className="text-[10px] capitalize">{a.forestry_projects?.status?.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Weekly Hours */}
          <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <Clock className="w-4 h-4" /> My Weekly Hours
            </h3>
            {weeklyHours.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No attendance records found.</p>
            ) : (
              <div className="space-y-2">
                {weeklyHours.slice(0, 8).map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono">{w.week}</span>
                        {statusBadge(w.status)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{w.project} ({w.projectId})</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{w.hours}h</p>
                      <p className="text-[10px] text-muted-foreground">{w.days} days</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approval Status Feed */}
          <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <BarChart3 className="w-4 h-4" /> Approval Status
            </h3>
            {weeklyHours.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No reports to show.</p>
            ) : (
              <div className="space-y-1.5">
                {weeklyHours.slice(0, 10).map((w, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      w.status === "approved" ? "bg-emerald-500" :
                      w.status === "submitted" ? "bg-amber-500" :
                      "bg-muted-foreground/30"
                    }`} />
                    <span className="text-xs font-medium flex-1">{w.week} • {w.project}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{w.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}