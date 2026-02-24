import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, eachDayOfInterval, isWeekend, parseISO, addDays } from "date-fns";
import { CalendarIcon, CalendarDays, Briefcase, Clock, Plane, ArrowLeft, ArrowRight, Save, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Swedish public holidays (fixed + Easter-based for multiple years)
function getSwedishHolidays(year: number): { date: string; nameEn: string; nameSv: string }[] {
  const fixed = [
    { m: 1, d: 1, nameEn: "New Year's Day", nameSv: "Nyårsdagen" },
    { m: 1, d: 6, nameEn: "Epiphany", nameSv: "Trettondedag jul" },
    { m: 5, d: 1, nameEn: "Labour Day", nameSv: "Första Maj" },
    { m: 6, d: 6, nameEn: "National Day", nameSv: "Sveriges nationaldag" },
    { m: 12, d: 24, nameEn: "Christmas Eve", nameSv: "Julafton" },
    { m: 12, d: 25, nameEn: "Christmas Day", nameSv: "Juldagen" },
    { m: 12, d: 26, nameEn: "Second Day of Christmas", nameSv: "Annandag jul" },
    { m: 12, d: 31, nameEn: "New Year's Eve", nameSv: "Nyårsafton" },
  ];

  // Easter calculation (Anonymous Gregorian algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);

  const easterBased = [
    { offset: -2, nameEn: "Good Friday", nameSv: "Långfredagen" },
    { offset: 0, nameEn: "Easter Sunday", nameSv: "Påskdagen" },
    { offset: 1, nameEn: "Easter Monday", nameSv: "Annandag påsk" },
    { offset: 39, nameEn: "Ascension Day", nameSv: "Kristi himmelsfärdsdag" },
    { offset: 49, nameEn: "Pentecost Sunday", nameSv: "Pingstdagen" },
  ];

  // Midsummer Eve: Friday between June 19-25
  let midsummerEve = new Date(year, 5, 19);
  while (midsummerEve.getDay() !== 5) midsummerEve = addDays(midsummerEve, 1);

  // All Saints' Day: Saturday between Oct 31 - Nov 6
  let allSaints = new Date(year, 9, 31);
  while (allSaints.getDay() !== 6) allSaints = addDays(allSaints, 1);

  const holidays = fixed.map(h => ({
    date: `${year}-${String(h.m).padStart(2, "0")}-${String(h.d).padStart(2, "0")}`,
    nameEn: h.nameEn,
    nameSv: h.nameSv,
  }));

  easterBased.forEach(eb => {
    const d = addDays(easter, eb.offset);
    holidays.push({
      date: format(d, "yyyy-MM-dd"),
      nameEn: eb.nameEn,
      nameSv: eb.nameSv,
    });
  });

  holidays.push({
    date: format(midsummerEve, "yyyy-MM-dd"),
    nameEn: "Midsummer Eve",
    nameSv: "Midsommarafton",
  });
  holidays.push({
    date: format(addDays(midsummerEve, 1), "yyyy-MM-dd"),
    nameEn: "Midsummer Day",
    nameSv: "Midsommardagen",
  });
  holidays.push({
    date: format(allSaints, "yyyy-MM-dd"),
    nameEn: "All Saints' Day",
    nameSv: "Alla helgons dag",
  });

  return holidays;
}

export interface SchedulingData {
  seasonYear: number;
  contractStartDate: string | null;
  contractEndDate: string | null;
  weeklyHours: number;
  startTime: string;
  endTime: string;
  workStartDate: string | null;
  workEndDate: string | null;
  vacationEnabled: boolean;
  vacationStartDate: string | null;
  vacationEndDate: string | null;
  attachToContract: boolean;
}

interface SchedulingStepProps {
  initialData: SchedulingData;
  onChange: (data: SchedulingData) => void;
  onBack: () => void;
  onNext: () => void;
  contractId: string;
}

type FilterMode = "all" | "holidays" | "vacation" | "workdays";

const SEASON_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032];

export function SchedulingStep({ initialData, onChange, onBack, onNext, contractId }: SchedulingStepProps) {
  const [data, setData] = useState<SchedulingData>(initialData);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [saving, setSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const scheduleScrollRef = useRef<HTMLDivElement>(null);

  // Check if schedule already exists in DB (for resumed contracts)
  useEffect(() => {
    if (!contractId) return;
    const checkExisting = async () => {
      const { count } = await supabase
        .from("contract_schedules")
        .select("id", { count: "exact", head: true })
        .eq("contract_id", contractId);
      if (count && count > 0) setScheduleSaved(true);
    };
    checkExisting();
  }, [contractId]);

  const update = useCallback((partial: Partial<SchedulingData>) => {
    setData(prev => {
      const next = { ...prev, ...partial };
      onChange(next);
      return next;
    });
  }, [onChange]);

  // Collect holidays for the season year
  const holidays = useMemo(() => getSwedishHolidays(data.seasonYear), [data.seasonYear]);
  const holidayDates = useMemo(() => new Set(holidays.map(h => h.date)), [holidays]);

  // Build daily schedule
  const schedule = useMemo(() => {
    if (!data.contractStartDate || !data.contractEndDate) return [];
    try {
      const start = parseISO(data.contractStartDate);
      const end = parseISO(data.contractEndDate);
      if (end < start) return [];
      const days = eachDayOfInterval({ start, end });
      const hoursPerDay = data.weeklyHours / 5;

      const vacStart = data.vacationEnabled && data.vacationStartDate ? parseISO(data.vacationStartDate) : null;
      const vacEnd = data.vacationEnabled && data.vacationEndDate ? parseISO(data.vacationEndDate) : null;

      return days.map(d => {
        const dateStr = format(d, "yyyy-MM-dd");
        const weekend = isWeekend(d);
        const holiday = holidayDates.has(dateStr);
        const holidayInfo = holidays.find(h => h.date === dateStr);
        const isVacation = vacStart && vacEnd && d >= vacStart && d <= vacEnd && !weekend && !holiday;

        const workStart = data.workStartDate ? parseISO(data.workStartDate) : null;
        const workEnd = data.workEndDate ? parseISO(data.workEndDate) : null;
        const inWorkPeriod = workStart && workEnd ? d >= workStart && d <= workEnd : true;

        let type: "Weekend" | "Holiday" | "Vacation" | "Workday" | "Off-season" = "Workday";
        let hours = hoursPerDay;

        if (weekend) { type = "Weekend"; hours = 0; }
        else if (holiday) { type = "Holiday"; hours = 0; }
        else if (isVacation) { type = "Vacation"; hours = 0; }
        else if (!inWorkPeriod) { type = "Off-season"; hours = 0; }

        return { date: dateStr, type, hours, holidayInfo };
      });
    } catch {
      return [];
    }
  }, [data, holidayDates, holidays]);

  // Filtered schedule
  const filteredSchedule = useMemo(() => {
    if (filter === "all") return schedule;
    if (filter === "holidays") return schedule.filter(d => d.type === "Holiday");
    if (filter === "vacation") return schedule.filter(d => d.type === "Vacation");
    if (filter === "workdays") return schedule.filter(d => d.type === "Workday");
    return schedule;
  }, [schedule, filter]);

  // Auto-scroll to first workday when "All" filter is active
  useEffect(() => {
    if (filter === "all" && filteredSchedule.length > 0 && scheduleScrollRef.current) {
      const firstWorkdayIndex = filteredSchedule.findIndex(d => d.type === "Workday");
      if (firstWorkdayIndex > 0) {
        const rows = scheduleScrollRef.current.querySelectorAll("tbody tr");
        if (rows[firstWorkdayIndex]) {
          rows[firstWorkdayIndex].scrollIntoView({ block: "start", behavior: "smooth" });
        }
      }
    }
  }, [filter, filteredSchedule]);


  const stats = useMemo(() => {
    const totalDays = schedule.length;
    const workDays = schedule.filter(d => d.type === "Workday").length;
    const totalHours = schedule.reduce((s, d) => s + d.hours, 0);
    const holidayCount = schedule.filter(d => d.type === "Holiday").length;
    const vacationDays = schedule.filter(d => d.type === "Vacation").length;
    return { totalDays, workDays, totalHours, holidayCount, vacationDays };
  }, [schedule]);

  // Save schedule to database
  const saveScheduleToDb = async () => {
    if (!contractId || schedule.length === 0) {
      toast.error("No schedule to save. Set contract dates first.");
      return;
    }
    setSaving(true);
    try {
      // Delete existing schedule entries for this contract
      const { error: delErr } = await supabase
        .from("contract_schedules")
        .delete()
        .eq("contract_id", contractId);
      if (delErr) throw delErr;

      // Insert in batches of 100
      const rows = schedule.map(d => ({
        contract_id: contractId,
        schedule_date: d.date,
        day_type: d.type,
        scheduled_hours: d.hours,
        holiday_name_en: d.holidayInfo?.nameEn || null,
        holiday_name_sv: d.holidayInfo?.nameSv || null,
        start_time: d.type === "Workday" ? data.startTime : null,
        end_time: d.type === "Workday" ? data.endTime : null,
      }));

      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await supabase.from("contract_schedules").insert(batch);
        if (error) throw error;
      }

      setScheduleSaved(true);
      toast.success(`Schedule saved! ${rows.length} days stored for time reporting.`);
    } catch (err: any) {
      console.error("Save schedule error:", err);
      toast.error("Failed to save schedule: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const DatePicker = ({ value, onSelect, label }: { value: string | null; onSelect: (d: string | null) => void; label: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !value && "text-muted-foreground")}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            {value || "Select date..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? parseISO(value) : undefined}
            onSelect={(d) => onSelect(d ? format(d, "yyyy-MM-dd") : null)}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header pill */}
      <div className="space-y-1 mb-4">
        <div className={cn(
          "w-full flex items-center justify-between rounded-full border px-6 py-3 text-sm font-semibold",
          "border-primary bg-primary/5 text-primary"
        )}>
          <span>Schedule & Timing / Schema & Tidsplanering</span>
          <span className="text-xs text-muted-foreground font-normal">Appendix / Bilaga</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "DURATION", labelSv: "DAGAR", value: stats.totalDays, unit: "days", icon: CalendarDays, color: "text-foreground" },
          { label: "WORK DAYS", labelSv: "ARBETSDAGAR", value: stats.workDays, unit: "", icon: Briefcase, color: "text-primary" },
          { label: "TOTAL HOURS", labelSv: "TIMMAR", value: Math.round(stats.totalHours), unit: "", icon: Clock, color: "text-foreground" },
          { label: "HOLIDAYS", labelSv: "HELGDAGAR", value: stats.holidayCount, unit: "", icon: CalendarDays, color: "text-destructive" },
          { label: "VACATION", labelSv: "SEMESTER", value: stats.vacationDays, unit: "", icon: Plane, color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <s.icon className={cn("w-4 h-4", s.color)} />
                <span className="text-2xl font-bold">{s.value}</span>
              </div>
              {s.unit && <p className="text-[10px] text-muted-foreground">{s.unit}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Season Year selector */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">SEASON YEAR / SÄSONGSÅR</span>
            <div className="flex gap-1">
              {SEASON_YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => update({
                    seasonYear: y,
                    contractStartDate: `${y}-02-01`,
                    contractEndDate: `${y}-11-30`,
                    workStartDate: `${y}-03-01`,
                    workEndDate: `${y}-10-31`,
                    vacationStartDate: `${y}-07-01`,
                    vacationEndDate: `${y}-07-31`,
                  })}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    data.seasonYear === y ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
            <button
              onClick={() => update({
                contractStartDate: null, contractEndDate: null,
                workStartDate: null, workEndDate: null,
                vacationStartDate: null, vacationEndDate: null,
              })}
              className="ml-auto text-xs text-destructive hover:underline font-medium"
            >
              Clear Dates
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Duration & Timing */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Duration & Timing / Avtalets varaktighet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="START DATE / STARTDATUM" value={data.contractStartDate} onSelect={(d) => update({ contractStartDate: d })} />
            <DatePicker label="END DATE / SLUTDATUM" value={data.contractEndDate} onSelect={(d) => update({ contractEndDate: d })} />
          </div>

          {/* Daily Schedule */}
          <Card className="border-2 border-dashed border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">DAILY SCHEDULE / DAGLIGT SCHEMA</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">WEEKLY HOURS / VECKOTIMMAR</label>
                  <Input
                    type="number"
                    value={data.weeklyHours}
                    onChange={e => update({ weeklyHours: parseFloat(e.target.value) || 0 })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">START TIME / STARTTID</label>
                  <Input type="time" value={data.startTime} onChange={e => update({ startTime: e.target.value })} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">END TIME / SLUTTID</label>
                  <Input type="time" value={data.endTime} onChange={e => update({ endTime: e.target.value })} className="h-11" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work period */}
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="WORK START (FIRST DAY) / ARBETSSTART" value={data.workStartDate} onSelect={(d) => update({ workStartDate: d })} />
            <DatePicker label="WORK END (LAST DAY) / ARBETSSTOPP" value={data.workEndDate} onSelect={(d) => update({ workEndDate: d })} />
          </div>
        </CardContent>
      </Card>

      {/* Vacation Planning */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Vacation Planning / Semesterplanering
          </CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={data.vacationEnabled}
              onCheckedChange={(v) => update({ vacationEnabled: !!v })}
            />
            <span className="text-xs font-medium">Enable Vacation / Aktivera semester</span>
          </div>
        </CardHeader>
        {data.vacationEnabled && (
          <CardContent className="space-y-3">
            <div className="rounded-lg border-2 border-warning/30 bg-warning/5 p-4">
              <div className="grid grid-cols-2 gap-4">
                <DatePicker label="VACATION START / SEMESTERSTART" value={data.vacationStartDate} onSelect={(d) => update({ vacationStartDate: d })} />
                <DatePicker label="VACATION END / SEMESTERSTOPP" value={data.vacationEndDate} onSelect={(d) => update({ vacationEndDate: d })} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * Weekends and public holidays are automatically excluded from vacation day counts. / 
              <span className="italic"> Helger och helgdagar exkluderas automatiskt från semesterdagarna.</span>
            </p>
          </CardContent>
        )}
      </Card>

      {/* Daily Schedule Report */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            📋 DAILY SCHEDULE REPORT / DAGLIGT SCHEMA
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {([
                { key: "all" as FilterMode, label: "All", count: schedule.length },
                { key: "workdays" as FilterMode, label: "Work", count: stats.workDays },
                { key: "holidays" as FilterMode, label: "Holidays", count: stats.holidayCount },
                { key: "vacation" as FilterMode, label: "Vacation", count: stats.vacationDays },
              ]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors",
                    filter === f.key
                      ? f.key === "holidays" ? "bg-destructive text-destructive-foreground"
                        : f.key === "vacation" ? "bg-primary text-primary-foreground"
                        : "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={data.attachToContract}
                onCheckedChange={(v) => update({ attachToContract: !!v })}
              />
              <span className="text-xs font-medium">Attach / Bifoga</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSchedule.length > 0 ? (
            <>
              <div className="max-h-[400px] overflow-y-auto" ref={scheduleScrollRef}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider">Date / Datum</th>
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider">Day / Dag</th>
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider">Type / Typ</th>
                      <th className="text-center px-4 py-2 text-xs font-bold uppercase tracking-wider">Hours / Timmar</th>
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider">Time / Tid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedule.map((row) => {
                      const d = parseISO(row.date);
                      const dayName = format(d, "EEEE");
                      return (
                        <tr key={row.date} className={cn(
                          "border-t border-border",
                          row.type === "Holiday" && "bg-destructive/5",
                          row.type === "Vacation" && "bg-primary/5",
                          row.type === "Weekend" && "bg-muted/50",
                        )}>
                          <td className="px-4 py-2 font-mono text-xs">{row.date}</td>
                          <td className="px-4 py-2 text-xs">{dayName}</td>
                          <td className="px-4 py-2">
                            <span className={cn(
                              "text-xs font-semibold",
                              row.type === "Weekend" && "text-muted-foreground",
                              row.type === "Holiday" && "text-destructive",
                              row.type === "Vacation" && "text-primary",
                              row.type === "Off-season" && "text-muted-foreground",
                              row.type === "Workday" && "text-foreground",
                            )}>
                              {row.type}
                              {row.holidayInfo && (
                                <span className="ml-1 font-normal text-muted-foreground">
                                  ({row.holidayInfo.nameSv})
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center font-mono text-xs">
                            {row.hours != null ? (row.hours > 0 ? row.hours.toFixed(1) : "0h") : "—"}
                          </td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">
                            {row.type === "Workday" ? `${data.startTime} – ${data.endTime}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-t border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  SHOWING {filteredSchedule.length} OF {schedule.length} DAYS / VISAR {filteredSchedule.length} AV {schedule.length} DAGAR
                </span>
                <Button
                  onClick={saveScheduleToDb}
                  disabled={saving}
                  size="sm"
                  className="gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Schedule to DB / Spara schema"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {schedule.length === 0
                ? "Set contract start and end dates to generate the schedule. / Ange start- och slutdatum för att generera schemat."
                : "No matching entries for selected filter. / Inga matchande poster för valt filter."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Before you continue / Innan du fortsätter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Vacation question */}
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <Checkbox
                checked={data.vacationEnabled}
                onCheckedChange={(v) => update({ vacationEnabled: !!v })}
              />
              <div>
                <p className="text-sm font-medium">Have you considered vacation planning?</p>
                <p className="text-xs text-muted-foreground italic">Har du övervägt semesterplanering?</p>
              </div>
            </div>
            {/* Attach question */}
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <Checkbox
                checked={data.attachToContract}
                onCheckedChange={(v) => update({ attachToContract: !!v })}
              />
              <div>
                <p className="text-sm font-medium">Do you want to attach this schedule to the contract?</p>
                <p className="text-xs text-muted-foreground italic">Vill du bifoga detta schema till avtalet?</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Go back / Tillbaka
            </Button>
            <Button onClick={() => { setShowConfirmDialog(false); onNext(); }} className="px-8">
              Continue / Fortsätt
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back / Tillbaka
        </Button>
        <Button className="px-8" onClick={() => setShowConfirmDialog(true)} disabled={!scheduleSaved}>
          Next Step / Nästa
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
