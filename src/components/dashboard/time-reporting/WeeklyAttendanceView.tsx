import { useState, useEffect, useCallback } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calendar, CheckCircle2, Loader2, Save, Send, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, addDays, getISOWeek } from "date-fns";

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_LABELS_SV = ["Mån", "Tis", "Ons", "Tor", "Fre"];

export function WeeklyAttendanceView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [localAttendance, setLocalAttendance] = useState<Record<string, Record<string, boolean>>>({});

  const weekNumber = getISOWeek(currentWeekStart);
  const year = currentWeekStart.getFullYear();
  const weekDays = getWeekDays(currentWeekStart);

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["time-projects", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_projects")
        .select("id, name, project_id_display, status")
        .eq("org_id", orgId!)
        .in("status", ["in_progress", "planning"])
        .order("name");
      return data || [];
    },
    enabled: !!orgId,
  });

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch team members for selected project
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["project-team", selectedProjectId],
    queryFn: async () => {
      const { data: members } = await supabase
        .from("forestry_project_members")
        .select("employee_id, role, star_rating, employees!inner(id, first_name, last_name, employee_code)")
        .eq("project_id", selectedProjectId);
      return (members || []).map((m: any) => ({
        employeeId: m.employee_id,
        name: `${m.employees.first_name || ""} ${m.employees.last_name || ""}`.trim(),
        code: m.employees.employee_code,
        role: m.role,
        starRating: m.star_rating,
      }));
    },
    enabled: !!selectedProjectId,
  });

  // Fetch existing report for this week/project
  const { data: existingReport } = useQuery({
    queryKey: ["weekly-report", orgId, selectedProjectId, currentWeekStart.toISOString()],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_reports")
        .select("*, attendance_entries(*)")
        .eq("org_id", orgId!)
        .eq("project_id", selectedProjectId)
        .eq("week_start", format(currentWeekStart, "yyyy-MM-dd"))
        .maybeSingle();
      return data;
    },
    enabled: !!orgId && !!selectedProjectId,
  });

  // Initialize local attendance from existing data
  useEffect(() => {
    if (existingReport?.attendance_entries) {
      const map: Record<string, Record<string, boolean>> = {};
      (existingReport.attendance_entries as any[]).forEach((e: any) => {
        if (!map[e.employee_id]) map[e.employee_id] = {};
        map[e.employee_id][e.work_date] = e.worked;
      });
      setLocalAttendance(map);
    } else {
      setLocalAttendance({});
    }
  }, [existingReport]);

  const toggleAttendance = (employeeId: string, dateStr: string) => {
    setLocalAttendance(prev => {
      const emp = { ...(prev[employeeId] || {}) };
      emp[dateStr] = !emp[dateStr];
      return { ...prev, [employeeId]: emp };
    });
  };

  // Save/update report
  const saveMutation = useMutation({
    mutationFn: async (submit: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let reportId = existingReport?.id;

      if (!reportId) {
        const { data: newReport, error } = await supabase
          .from("weekly_reports")
          .insert({
            org_id: orgId!,
            project_id: selectedProjectId,
            submitted_by: user.id,
            week_start: format(currentWeekStart, "yyyy-MM-dd"),
            week_number: weekNumber,
            year,
            status: submit ? "submitted" : "draft",
            submitted_at: submit ? new Date().toISOString() : null,
          })
          .select("id")
          .single();
        if (error) throw error;
        reportId = newReport.id;
      } else {
        await supabase
          .from("weekly_reports")
          .update({
            status: submit ? "submitted" : "draft",
            submitted_at: submit ? new Date().toISOString() : null,
          })
          .eq("id", reportId);

        // Delete existing entries to re-insert
        await supabase.from("attendance_entries").delete().eq("report_id", reportId);
      }

      // Insert attendance entries
      const entries: any[] = [];
      for (const member of teamMembers) {
        for (const day of weekDays) {
          const dateStr = format(day, "yyyy-MM-dd");
          const worked = localAttendance[member.employeeId]?.[dateStr] || false;
          entries.push({
            report_id: reportId,
            employee_id: member.employeeId,
            work_date: dateStr,
            worked,
            hours: worked ? 8 : 0,
          });
        }
      }

      if (entries.length > 0) {
        const { error: entryErr } = await supabase.from("attendance_entries").insert(entries);
        if (entryErr) throw entryErr;
      }
    },
    onSuccess: (_, submit) => {
      toast.success(submit ? "Report submitted for approval" : "Draft saved");
      queryClient.invalidateQueries({ queryKey: ["weekly-report"] });
      queryClient.invalidateQueries({ queryKey: ["time-reporting-stats"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save");
    },
  });

  const isSubmitted = existingReport?.status === "submitted" || existingReport?.status === "approved";

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Weekly Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Veckovis närvaro • Check attendance per employee per day</p>
      </div>

      {/* Week + Project selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-3 py-1.5 bg-accent rounded-md text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Week {weekNumber}, {year}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[250px] h-8 text-sm">
            <SelectValue placeholder="Select project..." />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.project_id_display} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {existingReport && (
          <Badge
            variant={existingReport.status === "approved" ? "default" : "outline"}
            className="text-xs capitalize"
          >
            {existingReport.status}
          </Badge>
        )}
      </div>

      {/* Attendance grid */}
      {teamMembers.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No team members assigned to this project.</p>
            <p className="text-xs text-muted-foreground mt-1">Assign employees in the Forestry Project Manager first.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60">
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Employee</TableHead>
                  {weekDays.map((day, i) => (
                    <TableHead key={i} className="text-center min-w-[70px]">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</span>
                        <span className="text-xs font-semibold">{format(day, "d/M")}</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member: any) => {
                  const workedDays = weekDays.filter(d =>
                    localAttendance[member.employeeId]?.[format(d, "yyyy-MM-dd")]
                  ).length;
                  return (
                    <TableRow key={member.employeeId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{member.name}</span>
                          <span className="text-[10px] text-muted-foreground">{member.code || member.role}</span>
                        </div>
                      </TableCell>
                      {weekDays.map((day, i) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const checked = localAttendance[member.employeeId]?.[dateStr] || false;
                        return (
                          <TableCell key={i} className="text-center">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleAttendance(member.employeeId, dateStr)}
                              disabled={isSubmitted}
                              className="mx-auto"
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <Badge variant={workedDays === 5 ? "default" : "outline"} className="text-xs">
                          {workedDays}/5
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {teamMembers.length > 0 && !isSubmitted && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-1" />
            Save Draft
          </Button>
          <Button
            onClick={() => saveMutation.mutate(true)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Submit Report
          </Button>
        </div>
      )}
    </div>
  );
}
