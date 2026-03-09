import { useState, useEffect } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Calendar, CheckCircle2, Loader2, Save, Send, ChevronLeft, ChevronRight, Clock, MessageSquare, Users, Copy, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, addDays, getISOWeek, subDays } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function getWeekDays(weekStart: Date, includeSaturday: boolean): Date[] {
  return Array.from({ length: includeSaturday ? 6 : 5 }, (_, i) => addDays(weekStart, i));
}

const DAY_LABELS_5 = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_LABELS_6 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AttendanceEntry {
  worked: boolean;
  hours: number;
  note: string;
}

const DEFAULT_HOURS = 8;

export function WeeklyAttendanceView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [localAttendance, setLocalAttendance] = useState<Record<string, Record<string, AttendanceEntry>>>({});
  const [reportNotes, setReportNotes] = useState("");
  const [includeSaturday, setIncludeSaturday] = useState(false);

  const weekNumber = getISOWeek(currentWeekStart);
  const year = currentWeekStart.getFullYear();
  const weekDays = getWeekDays(currentWeekStart, includeSaturday);
  const DAY_LABELS = includeSaturday ? DAY_LABELS_6 : DAY_LABELS_5;

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["time-projects", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_projects")
        .select("id, name, project_id_display, status, daily_hours")
        .eq("org_id", orgId!)
        .in("status", ["in_progress", "planning"])
        .order("name");
      return data || [];
    },
    enabled: !!orgId,
  });

  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);
  const projectDailyHours = Number(selectedProject?.daily_hours) || DEFAULT_HOURS;

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
      const map: Record<string, Record<string, AttendanceEntry>> = {};
      (existingReport.attendance_entries as any[]).forEach((e: any) => {
        if (!map[e.employee_id]) map[e.employee_id] = {};
        map[e.employee_id][e.work_date] = {
          worked: e.worked,
          hours: Number(e.hours) || 0,
          note: e.note || "",
        };
      });
      setLocalAttendance(map);
      setReportNotes(existingReport.notes || "");
    } else {
      setLocalAttendance({});
      setReportNotes("");
    }
  }, [existingReport]);

  const toggleAttendance = (employeeId: string, dateStr: string) => {
    setLocalAttendance(prev => {
      const emp = { ...(prev[employeeId] || {}) };
      const current = emp[dateStr];
      if (current?.worked) {
        emp[dateStr] = { worked: false, hours: 0, note: current.note || "" };
      } else {
        emp[dateStr] = { worked: true, hours: projectDailyHours, note: current?.note || "" };
      }
      return { ...prev, [employeeId]: emp };
    });
  };

  const updateHours = (employeeId: string, dateStr: string, hours: number) => {
    setLocalAttendance(prev => {
      const emp = { ...(prev[employeeId] || {}) };
      const current = emp[dateStr] || { worked: false, hours: 0, note: "" };
      emp[dateStr] = { ...current, hours: Math.max(0, Math.min(24, hours)), worked: hours > 0 };
      return { ...prev, [employeeId]: emp };
    });
  };

  const updateNote = (employeeId: string, dateStr: string, note: string) => {
    setLocalAttendance(prev => {
      const emp = { ...(prev[employeeId] || {}) };
      const current = emp[dateStr] || { worked: false, hours: 0, note: "" };
      emp[dateStr] = { ...current, note };
      return { ...prev, [employeeId]: emp };
    });
  };

  const checkAllForDay = (dateStr: string) => {
    setLocalAttendance(prev => {
      const updated = { ...prev };
      for (const member of teamMembers) {
        const emp = { ...(updated[member.employeeId] || {}) };
        emp[dateStr] = { worked: true, hours: projectDailyHours, note: emp[dateStr]?.note || "" };
        updated[member.employeeId] = emp;
      }
      return updated;
    });
  };

  const checkAllWeek = (employeeId: string) => {
    setLocalAttendance(prev => {
      const emp = { ...(prev[employeeId] || {}) };
      weekDays.forEach(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        if (!emp[dateStr]?.worked) {
          emp[dateStr] = { worked: true, hours: projectDailyHours, note: emp[dateStr]?.note || "" };
        }
      });
      return { ...prev, [employeeId]: emp };
    });
  };

  // Copy from previous week
  const copyFromPreviousWeek = async () => {
    const prevWeekStart = subDays(currentWeekStart, 7);
    const { data: prevReport } = await supabase
      .from("weekly_reports")
      .select("*, attendance_entries(*)")
      .eq("org_id", orgId!)
      .eq("project_id", selectedProjectId)
      .eq("week_start", format(prevWeekStart, "yyyy-MM-dd"))
      .maybeSingle();

    if (!prevReport?.attendance_entries || (prevReport.attendance_entries as any[]).length === 0) {
      toast.error("No attendance data found for previous week");
      return;
    }

    const newAttendance: Record<string, Record<string, AttendanceEntry>> = {};
    (prevReport.attendance_entries as any[]).forEach((e: any) => {
      if (!newAttendance[e.employee_id]) newAttendance[e.employee_id] = {};
      // Map previous week dates to current week
      const prevDate = new Date(e.work_date);
      const dayOfWeek = prevDate.getDay(); // 0=Sun, 1=Mon, etc.
      if (dayOfWeek === 0) return; // Skip Sunday
      const currentDate = addDays(currentWeekStart, dayOfWeek - 1);
      const dateStr = format(currentDate, "yyyy-MM-dd");
      newAttendance[e.employee_id][dateStr] = {
        worked: e.worked,
        hours: Number(e.hours) || 0,
        note: "", // Don't copy notes
      };
    });

    setLocalAttendance(newAttendance);
    toast.success("Copied attendance from previous week");
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
            notes: reportNotes || null,
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
            notes: reportNotes || null,
          })
          .eq("id", reportId);

        await supabase.from("attendance_entries").delete().eq("report_id", reportId);
      }

      const entries: any[] = [];
      for (const member of teamMembers) {
        for (const day of weekDays) {
          const dateStr = format(day, "yyyy-MM-dd");
          const entry = localAttendance[member.employeeId]?.[dateStr];
          const worked = entry?.worked || false;
          const hours = entry?.hours || 0;
          entries.push({
            report_id: reportId,
            employee_id: member.employeeId,
            work_date: dateStr,
            worked,
            hours: worked ? hours : 0,
            note: entry?.note || null,
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

  const getTotalHours = (employeeId: string) => {
    return weekDays.reduce((sum, day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const entry = localAttendance[employeeId]?.[dateStr];
      return sum + (entry?.worked ? (entry.hours || 0) : 0);
    }, 0);
  };

  const grandTotalHours = teamMembers.reduce((sum: number, m: any) => sum + getTotalHours(m.employeeId), 0);

  // ─── Mobile card layout for one employee ───
  const renderMobileCard = (member: any) => {
    const totalHours = getTotalHours(member.employeeId);
    const expectedHours = 5 * projectDailyHours;
    const allChecked = weekDays.every(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      return localAttendance[member.employeeId]?.[dateStr]?.worked;
    });

    return (
      <Card key={member.employeeId} className="border-border/60">
        <CardContent className="p-4">
          {/* Employee header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{member.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {member.code || member.role}
                {member.starRating > 0 && ` • ${"★".repeat(member.starRating)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isSubmitted && !allChecked && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => checkAllWeek(member.employeeId)}
                >
                  All ✓
                </Button>
              )}
              <div className="text-right">
                <p className={`text-sm font-bold ${totalHours === expectedHours ? "text-emerald-600" : totalHours > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {totalHours}h
                </p>
                <p className="text-[10px] text-muted-foreground">/{expectedHours}h</p>
              </div>
            </div>
          </div>

          {/* Day rows */}
          <div className="space-y-1.5">
            {weekDays.map((day, i) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const entry = localAttendance[member.employeeId]?.[dateStr];
              const checked = entry?.worked || false;
              const hours = entry?.hours || 0;
              const hasNote = !!entry?.note;
              const isNonStandard = checked && hours !== projectDailyHours;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[48px] transition-colors ${
                    checked ? "bg-primary/5 border border-primary/20" : "bg-muted/30 border border-transparent"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleAttendance(member.employeeId, dateStr)}
                    disabled={isSubmitted}
                    className="h-5 w-5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{DAY_LABELS[i]}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">{format(day, "d/M")}</span>
                  </div>
                  {checked && (
                    <Input
                      type="number"
                      value={hours}
                      onChange={(e) => updateHours(member.employeeId, dateStr, parseFloat(e.target.value) || 0)}
                      disabled={isSubmitted}
                      className={`h-8 w-16 text-center text-sm ${isNonStandard ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : ""}`}
                      min={0}
                      max={24}
                      step={0.5}
                    />
                  )}
                  {!checked && <span className="text-xs text-muted-foreground w-16 text-center">—</span>}
                  {!isSubmitted && (
                    <Popover modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 shrink-0 ${hasNote ? "text-primary" : "text-muted-foreground/30"}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" side="top" align="end">
                        <Input
                          value={entry?.note || ""}
                          onChange={(e) => updateNote(member.employeeId, dateStr, e.target.value)}
                          placeholder="Note (e.g. sick, half day)..."
                          className="h-9 text-sm"
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ─── Desktop table layout ───
  const renderDesktopTable = () => (
    <Card className="border-border/60">
      <CardContent className="pt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Employee</TableHead>
              {weekDays.map((day, i) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const allChecked = teamMembers.every((m: any) =>
                  localAttendance[m.employeeId]?.[dateStr]?.worked
                );
                return (
                  <TableHead key={i} className="text-center min-w-[90px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</span>
                      <span className="text-xs font-semibold">{format(day, "d/M")}</span>
                      {!isSubmitted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-primary"
                          onClick={() => checkAllForDay(dateStr)}
                          disabled={allChecked}
                        >
                          {allChecked ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : "All ✓"}
                        </Button>
                      )}
                    </div>
                  </TableHead>
                );
              })}
              <TableHead className="text-center min-w-[70px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member: any) => {
              const totalHours = getTotalHours(member.employeeId);
              const expectedHours = 5 * projectDailyHours;
              return (
                <TableRow key={member.employeeId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{member.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {member.code || member.role}
                        {member.starRating > 0 && ` • ${"★".repeat(member.starRating)}`}
                      </span>
                    </div>
                  </TableCell>
                  {weekDays.map((day, i) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const entry = localAttendance[member.employeeId]?.[dateStr];
                    const checked = entry?.worked || false;
                    const hours = entry?.hours || 0;
                    const hasNote = !!entry?.note;
                    const isNonStandard = checked && hours !== projectDailyHours;
                    return (
                      <TableCell key={i} className="text-center p-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleAttendance(member.employeeId, dateStr)}
                            disabled={isSubmitted}
                            className="mx-auto"
                          />
                          {checked && (
                            <Input
                              type="number"
                              value={hours}
                              onChange={(e) => updateHours(member.employeeId, dateStr, parseFloat(e.target.value) || 0)}
                              disabled={isSubmitted}
                              className={`h-6 w-14 text-center text-xs px-1 ${isNonStandard ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : ""}`}
                              min={0}
                              max={24}
                              step={0.5}
                            />
                          )}
                          {!isSubmitted && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className={`h-4 w-4 p-0 ${hasNote ? "text-primary" : "text-muted-foreground/30 hover:text-muted-foreground"}`}>
                                  <MessageSquare className="w-3 h-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-2" side="bottom">
                                <Input
                                  value={entry?.note || ""}
                                  onChange={(e) => updateNote(member.employeeId, dateStr, e.target.value)}
                                  placeholder="Note (e.g. sick, half day)..."
                                  className="h-7 text-xs"
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-bold ${totalHours === expectedHours ? "text-emerald-600" : totalHours > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {totalHours}h
                      </span>
                      <span className="text-[9px] text-muted-foreground">/{expectedHours}h</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Grand total row */}
            <TableRow className="border-t-2 border-border">
              <TableCell className="font-semibold text-sm">Total</TableCell>
              {weekDays.map((day, i) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayTotal = teamMembers.reduce((sum: number, m: any) => {
                  const entry = localAttendance[m.employeeId]?.[dateStr];
                  return sum + (entry?.worked ? (entry.hours || 0) : 0);
                }, 0);
                return (
                  <TableCell key={i} className="text-center text-sm font-semibold">
                    {dayTotal > 0 ? `${dayTotal}h` : "—"}
                  </TableCell>
                );
              })}
              <TableCell className="text-center text-sm font-bold text-primary">
                {grandTotalHours}h
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 md:space-y-6 pt-2 md:pt-4 pb-24 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Weekly Attendance</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Veckovis närvaro • Report hours per employee per day
        </p>
      </div>

      {/* Week + Project selector — stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-1">
          <Button variant="outline" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 sm:px-3 sm:py-1.5 bg-accent rounded-md text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Week {weekNumber}, {year}
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-full sm:w-[250px] h-10 sm:h-8 text-sm">
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

        <div className="flex items-center justify-between sm:justify-start gap-3 sm:ml-auto flex-wrap">
          {existingReport && (
            <Badge
              variant={existingReport.status === "approved" ? "default" : "outline"}
              className="text-xs capitalize"
            >
              {existingReport.status}
            </Badge>
          )}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Standard: <span className="font-semibold text-foreground">{projectDailyHours}h/day</span></span>
          </div>
        </div>
      </div>

      {/* Toolbar: Saturday toggle, copy from previous */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Switch checked={includeSaturday} onCheckedChange={setIncludeSaturday} id="sat-toggle" />
          <label htmlFor="sat-toggle" className="cursor-pointer text-muted-foreground">Include Saturday</label>
        </div>
        {!isSubmitted && teamMembers.length > 0 && (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={copyFromPreviousWeek}>
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy from Previous Week
          </Button>
        )}
        {/* Overtime warning */}
        {grandTotalHours > teamMembers.length * (includeSaturday ? 6 : 5) * projectDailyHours && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overtime detected ({grandTotalHours}h / expected {teamMembers.length * (includeSaturday ? 6 : 5) * projectDailyHours}h)
          </div>
        )}
      </div>

      {/* Attendance content */}
      {teamMembers.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No team members assigned to this project.</p>
            <p className="text-xs text-muted-foreground mt-1">Assign employees in the Forestry Project Manager first.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: card per employee */}
          {isMobile ? (
            <div className="space-y-3">
              {teamMembers.map((member: any) => renderMobileCard(member))}
              {/* Grand total card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Total Hours</span>
                    <span className="text-lg font-bold text-primary">{grandTotalHours}h</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            renderDesktopTable()
          )}
        </>
      )}

      {/* Report notes */}
      {teamMembers.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-4 md:pt-4">
            <label className="text-sm font-medium mb-1.5 block">Report Notes (optional)</label>
            <Textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="Any general notes for this week's report..."
              className="text-sm resize-none"
              rows={2}
              disabled={isSubmitted}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions — sticky bottom on mobile */}
      {teamMembers.length > 0 && !isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 md:static md:bottom-auto bg-background/95 backdrop-blur-sm border-t md:border-t-0 border-border p-4 md:p-0 flex items-center gap-3 z-30">
          <Button
            variant="outline"
            className="flex-1 md:flex-none h-12 md:h-9"
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Draft
          </Button>
          <Button
            className="flex-1 md:flex-none h-12 md:h-9"
            onClick={() => saveMutation.mutate(true)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
            Submit Report
          </Button>
        </div>
      )}
    </div>
  );
}
