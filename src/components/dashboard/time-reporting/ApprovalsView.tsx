import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Loader2, Eye } from "lucide-react";
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
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Report Approvals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Godkännande • Review and approve submitted weekly reports</p>
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
        <div className="space-y-4">
          {pendingReports.map((report: any) => {
            const project = report.forestry_projects;
            const attendanceCount = (report.attendance_entries || []).filter((e: any) => e.worked).length;
            const totalEntries = (report.attendance_entries || []).length;
            const progressEntries = report.progress_entries || [];
            const isExpanded = expandedId === report.id;

            return (
              <Card key={report.id} className="border-border/60">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{project?.name}</span>
                        <Badge variant="outline" className="text-[10px]">{project?.project_id_display}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Week {report.week_number}, {report.year} •
                        {report.submitted_at && ` Submitted ${format(new Date(report.submitted_at), "yyyy-MM-dd HH:mm")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : report.id)}>
                        <Eye className="w-4 h-4 mr-1" /> {isExpanded ? "Hide" : "Details"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveMutation.mutate({ reportId: report.id, approve: false })}
                        disabled={approveMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Return
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate({ reportId: report.id, approve: true })}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Attendance: {attendanceCount}/{totalEntries} checked ({totalHours}h)</span>
                    <span>Progress entries: {progressEntries.length}</span>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-border pt-3 space-y-4">
                      {/* Attendance details */}
                      {(report.attendance_entries || []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2">Attendance Details</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="text-center">Days Worked</TableHead>
                                <TableHead className="text-right">Total Hours</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                // Group attendance by employee
                                const byEmployee: Record<string, { name: string; code: string; days: number; hours: number }> = {};
                                (report.attendance_entries || []).forEach((e: any) => {
                                  const empName = e.employees ? `${e.employees.first_name || ""} ${e.employees.last_name || ""}`.trim() : "Unknown";
                                  const empCode = e.employees?.employee_code || "";
                                  if (!byEmployee[e.employee_id]) {
                                    byEmployee[e.employee_id] = { name: empName, code: empCode, days: 0, hours: 0 };
                                  }
                                  if (e.worked) {
                                    byEmployee[e.employee_id].days += 1;
                                    byEmployee[e.employee_id].hours += Number(e.hours) || 0;
                                  }
                                });
                                return Object.entries(byEmployee).map(([id, emp]) => (
                                  <TableRow key={id}>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium">{emp.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{emp.code}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center text-sm">{emp.days}/5</TableCell>
                                    <TableCell className="text-right font-bold text-sm">{emp.hours}h</TableCell>
                                  </TableRow>
                                ));
                              })()}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Progress details */}
                      {progressEntries.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2">Object Progress</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Object</TableHead>
                                <TableHead className="text-right">Completion</TableHead>
                                <TableHead>Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {progressEntries.map((pe: any) => (
                                <TableRow key={pe.id}>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">{pe.forestry_objects?.name || "Unknown"}</span>
                                      <span className="text-[10px] text-muted-foreground">{pe.forestry_objects?.object_id_display || ""}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-sm">{pe.completion_pct}%</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{pe.notes || "—"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Report notes */}
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
