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
                    <span>Attendance: {attendanceCount}/{totalEntries} checked</span>
                    <span>Progress entries: {progressEntries.length}</span>
                  </div>

                  {isExpanded && progressEntries.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
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
                              <TableCell className="text-sm">{pe.object_id?.substring(0, 8)}...</TableCell>
                              <TableCell className="text-right font-bold text-sm">{pe.completion_pct}%</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{pe.notes || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
