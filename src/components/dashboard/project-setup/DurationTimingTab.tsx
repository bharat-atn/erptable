import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Clock, ChevronRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  format, differenceInCalendarDays, eachDayOfInterval, isWeekend,
  startOfDay, parseISO
} from "date-fns";

interface Props {
  project: any;
  onSave: (updates: Record<string, any>) => Promise<void>;
}

export function DurationTimingTab({ project, onSave }: Props) {
  const [startDate, setStartDate] = useState(project?.start_date || "");
  const [endDate, setEndDate] = useState(project?.end_date || "");
  const [dailyHours, setDailyHours] = useState(String(project?.daily_hours ?? 8));
  const [startTime, setStartTime] = useState(project?.start_time || "06:30");
  const [endTime, setEndTime] = useState(project?.end_time || "17:00");
  const [workStart, setWorkStart] = useState(project?.work_start_date || "");
  const [workEnd, setWorkEnd] = useState(project?.work_end_date || "");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    if (project) {
      setStartDate(project.start_date || "");
      setEndDate(project.end_date || "");
      setDailyHours(String(project.daily_hours ?? 8));
      setStartTime(project.start_time || "06:30");
      setEndTime(project.end_time || "17:00");
      setWorkStart(project.work_start_date || project.start_date || "");
      setWorkEnd(project.work_end_date || project.end_date || "");
    }
  }, [project]);

  // Calculations
  const stats = useMemo(() => {
    if (!startDate || !endDate) return { duration: 0, workDays: 0, totalHours: 0, holidays: 0 };
    const s = parseISO(startDate);
    const e = parseISO(endDate);
    const duration = differenceInCalendarDays(e, s) + 1;
    const days = eachDayOfInterval({ start: s, end: e });
    const workDays = days.filter((d) => !isWeekend(d)).length;
    const totalHours = workDays * (Number(dailyHours) || 8);
    return { duration, workDays, totalHours, holidays: 0 };
  }, [startDate, endDate, dailyHours]);

  const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();

  const handleSave = async () => {
    if (!startDate || !endDate) { toast.error("Start and end dates are required"); return; }
    await onSave({
      start_date: startDate,
      end_date: endDate,
      daily_hours: Number(dailyHours) || 8,
      start_time: startTime,
      end_time: endTime,
      work_start_date: workStart || startDate,
      work_end_date: workEnd || endDate,
    });
    toast.success("Timing saved");
  };

  // Schedule breakdown
  const scheduleDays = useMemo(() => {
    if (!startDate || !endDate) return [];
    try {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      return eachDayOfInterval({ start: s, end: e }).map((d) => ({
        date: d,
        isWeekend: isWeekend(d),
        dayType: isWeekend(d) ? "Weekend" : "Workday",
        hours: isWeekend(d) ? 0 : Number(dailyHours) || 8,
      }));
    } catch { return []; }
  }, [startDate, endDate, dailyHours]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "DURATION", value: stats.duration, unit: "days", color: "border-blue-200 bg-blue-50 dark:bg-blue-950/30" },
          { label: "WORK DAYS", value: stats.workDays, unit: "workdays", color: "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "TOTAL HOURS", value: stats.totalHours, unit: "hours", color: "border-amber-200 bg-amber-50 dark:bg-amber-950/30" },
          { label: "HOLIDAYS", value: stats.holidays, unit: "days", color: "border-rose-200 bg-rose-50 dark:bg-rose-950/30" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.label}</span>
            <div className="text-3xl font-bold text-foreground mt-1">{card.value}</div>
            <span className="text-xs text-muted-foreground">{card.unit}</span>
          </div>
        ))}
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Timeline */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10"><Calendar className="w-4 h-4 text-primary" /></div>
              <h3 className="font-semibold text-sm">Project Timeline</h3>
              <Badge variant="outline" className="ml-auto text-[10px]">YEAR {year}</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Start Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">End Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10"><Clock className="w-4 h-4 text-primary" /></div>
              <h3 className="font-semibold text-sm">Daily Schedule</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Daily Hours Per Person</Label>
                <Input type="number" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Execution Period */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10"><Building2 className="w-4 h-4 text-primary" /></div>
              <h3 className="font-semibold text-sm">Work Execution Period</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Work Start (First Day) <span className="text-destructive">*</span></Label>
                <Input type="date" value={workStart || startDate} onChange={(e) => setWorkStart(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Work End (Last Day) <span className="text-destructive">*</span></Label>
                <Input type="date" value={workEnd || endDate} onChange={(e) => setWorkEnd(e.target.value)} className="h-9" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Schedule Breakdown */}
      <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <Card className="border-border/60">
          <CollapsibleTrigger asChild>
            <CardContent className="pt-6 pb-6 cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10"><Building2 className="w-4 h-4 text-primary" /></div>
                <h3 className="font-semibold text-sm">Daily Schedule Breakdown</h3>
                <Badge variant="outline" className="text-[10px]">{scheduleDays.length} days</Badge>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${scheduleOpen ? "rotate-90" : ""}`} />
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-6 pb-6 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-7 gap-1.5">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="text-[10px] font-semibold text-center text-muted-foreground py-1">{d}</div>
                ))}
                {scheduleDays.map((day, i) => (
                  <div
                    key={i}
                    className={`text-center py-2 rounded-md text-[10px] ${
                      day.isWeekend
                        ? "bg-muted/40 text-muted-foreground"
                        : "bg-primary/10 text-primary font-medium"
                    }`}
                  >
                    <div className="font-semibold">{format(day.date, "d")}</div>
                    <div>{day.hours}h</div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">Save Timing</Button>
      </div>
    </div>
  );
}
