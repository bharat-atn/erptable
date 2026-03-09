import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function ApprovalsView({ t: _t }: { t?: (key: string) => string }) {
  const t = _t || ((k: string) => k);
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Fetch recent approval history
  const { data: recentApprovals = [] } = useQuery({
    queryKey: ["recent-approvals", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_reports")
        .select("id, week_number, year, status, approved_at, forestry_projects!inner(name, project_id_display)")
        .eq("org_id", orgId!)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(5);
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
      toast.success(approve ? t("tr.reportApproved") : t("tr.reportReturned"));
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["recent-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["time-reporting-stats"] });
    },
  });

  // Batch approve
  const batchApproveMutation = useMutation({
    mutationFn: async (reportIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      for (const id of reportIds) {
        await supabase
          .from("weekly_reports")
          .update({
            status: "approved",
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", id);
      }
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} ${t("tr.reportsApproved")}`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["recent-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["time-reporting-stats"] });
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingReports.map((r: any) => r.id)));
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pt-2 md:pt-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">{t("tr.reportApprovals")}</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{t("tr.approvalsSub")}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : pendingReports.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
             <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
             <p className="text-sm font-medium text-muted-foreground">{t("tr.noReportsPending")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Batch actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === pendingReports.length && pendingReports.length > 0}
                onCheckedChange={toggleSelectAll}
              />
               <span className="text-xs text-muted-foreground">
                 {selectedIds.size > 0 ? `${selectedIds.size} ${t("tr.selected")}` : t("tr.selectAll")}
               </span>
            </div>
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                className="h-8"
                onClick={() => batchApproveMutation.mutate(Array.from(selectedIds))}
                disabled={batchApproveMutation.isPending}
              >
                <CheckSquare className="w-4 h-4 mr-1.5" />
                Approve {selectedIds.size} Report{selectedIds.size !== 1 ? "s" : ""}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {pendingReports.map((report: any) => {
              const project = report.forestry_projects;
              const attendanceEntries = report.attendance_entries || [];
              const attendanceCount = attendanceEntries.filter((e: any) => e.worked).length;
              const totalHours = attendanceEntries.reduce((s: number, e: any) => s + (e.worked ? (Number(e.hours) || 0) : 0), 0);
              const progressEntries = report.progress_entries || [];
              const isExpanded = expandedId === report.id;

              return (
                <Card key={report.id} className={`border-border/60 transition-all ${selectedIds.has(report.id) ? "ring-2 ring-primary/30" : ""}`}>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={selectedIds.has(report.id)}
                          onCheckedChange={() => toggleSelect(report.id)}
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">{project?.name}</span>
                            <Badge variant="outline" className="text-[10px]">{project?.project_id_display}</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Week {report.week_number}, {report.year}
                            {report.submitted_at && ` • ${format(new Date(report.submitted_at), "yyyy-MM-dd HH:mm")}`}
                          </p>
                        </div>
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
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground ml-9">
                      <span>Attendance: {attendanceCount} checked ({totalHours}h)</span>
                      <span>Progress: {progressEntries.length} objects</span>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-border pt-3 space-y-4 ml-9">
                        {attendanceEntries.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-2">Attendance</p>
                            <div className="space-y-1.5 sm:space-y-0">
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
        </>
      )}

      {/* Approval History */}
      {recentApprovals.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-4 md:pt-6">
            <h3 className="text-sm font-semibold mb-3">Recently Approved</h3>
            <div className="space-y-2">
              {recentApprovals.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30">
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{r.forestry_projects?.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">W{r.week_number}, {r.year}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Approved
                    </Badge>
                    {r.approved_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(r.approved_at), "d MMM")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}