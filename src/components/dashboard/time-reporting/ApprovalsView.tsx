import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Loader2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function ApprovalsView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: pendingReports = [], isLoading } = useQuery({
    queryKey: ["pending-approvals", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_reports")
        .select("*, forestry_projects!inner(name, project_id_display), attendance_entries(*, employees!inner(first_name, last_name, employee_code)), progress_entries(*, forestry_objects!inner(name, object_id_display))")
        .eq("org_id", orgId!)
        .eq("status", "submitted")
        .order("week_start", { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ reportId, approve }: { reportId: string; approve: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("weekly_reports")
        .update({
          status: approve ? "approved" : "draft",
          approved_by: approve ? user?.id : null,
          approved_at: approve ? new Date().toISOString() : null,
        })
        .eq("id", reportId);
    },
    onSuccess: (_, { approve }) => {
      toast.success(approve ? "Report approved" : "Report returned to draft");
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["time-reporting-stats"] });
    },
  });

  return (
    <div className="space-y-4 md:space-y-6 pt-2 md:pt-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Report Approvals</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Godkännande • Review and approve submitted reports</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : pendingReports.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No reports pending approval</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingReports.map((report: any) => {
            const project = report.forestry_projects;
            const attendanceEntries = report.attendance_entries || [];
            const attendanceCount = attendanceEntries.filter((e: any) => e.worked).length;
            const totalHours = attendanceEntries.reduce((s: number, e: any) => s + (e.worked ? (Number(e.hours) || 0) : 0), 0);
            const progressEntries = report.progress_entries || [];
            const isExpanded = expandedId === report.id;

            return (
              <Card key={report.id} className="border-border/60">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold">{project?.name}</span>
                        <Badge variant="outline" className="text-[10px]">{project?.project_id_display}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Week {report.week_number}, {report.year}
                        {report.submitted_at && ` • ${format(new Date(report.submitted_at), "yyyy-MM-dd HH:mm")}`}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 sm:h-8"
                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        {isExpanded ? "Hide" : "Details"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 sm:h-8"
                        onClick={() => approveMutation.mutate({ reportId: report.id, approve: false })}
                        disabled={approveMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Return
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 sm:h-8"
                        onClick={() => approveMutation.mutate({ reportId: report.id, approve: true })}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>

                  {/* Summary line */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Attendance: {attendanceCount} checked ({totalHours}h)</span>
                    <span>Progress: {progressEntries.length} objects</span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 border-t border-border pt-3 space-y-4">
                      {attendanceEntries.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2">Attendance</p>
                          <div className="space-y-1.5 sm:space-y-0">
                            {/* Group by employee */}
                            {(() => {
                              const byEmp: Record<string, { name: string; code: string; days: number; hours: number }> = {};
                              attendanceEntries.forEach((e: any) => {
                                const empName = e.employees ? `${e.employees.first_name || ""} ${e.employees.last_name || ""}`.trim() : "Unknown";
                                if (!byEmp[e.employee_id]) byEmp[e.employee_id] = { name: empName, code: e.employees?.employee_code || "", days: 0, hours: 0 };
                                if (e.worked) { byEmp[e.employee_id].days += 1; byEmp[e.employee_id].hours += Number(e.hours) || 0; }
                              });
                              return Object.entries(byEmp).map(([id, emp]) => (
                                <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                  <div>
                                    <span className="text-sm font-medium">{emp.name}</span>
                                    {emp.code && <span className="text-[10px] text-muted-foreground ml-1.5">{emp.code}</span>}
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-bold">{emp.hours}h</span>
                                    <span className="text-[10px] text-muted-foreground ml-1">({emp.days}/5 days)</span>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {progressEntries.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2">Object Progress</p>
                          <div className="space-y-1.5">
                            {progressEntries.map((pe: any) => (
                              <div key={pe.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm font-medium">{pe.forestry_objects?.name || "Unknown"}</span>
                                  <span className="text-[10px] text-muted-foreground ml-1.5">{pe.forestry_objects?.object_id_display || ""}</span>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <div className="w-16 bg-muted rounded-full h-2 hidden sm:block">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: `${pe.completion_pct}%` }} />
                                  </div>
                                  <span className="text-sm font-bold w-10 text-right">{pe.completion_pct}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {report.notes && (
                        <div>
                          <p className="text-xs font-semibold mb-1">Notes</p>
                          <p className="text-xs text-muted-foreground">{report.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
