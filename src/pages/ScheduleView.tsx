import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Calendar, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/ljungan-forestry-logo.png";

interface ScheduleDay {
  schedule_date: string;
  day_type: string;
  scheduled_hours: number;
  start_time: string | null;
  end_time: string | null;
  holiday_name_en: string | null;
  holiday_name_sv: string | null;
}

const dayTypeColor = (t: string) => {
  switch (t) {
    case "Workday": return "text-foreground";
    case "Weekend": return "text-muted-foreground";
    case "Holiday": return "text-destructive";
    case "Vacation": return "text-primary";
    default: return "text-muted-foreground/60";
  }
};

const dayTypeBg = (t: string) => {
  switch (t) {
    case "Holiday": return "bg-destructive/5";
    case "Vacation": return "bg-primary/5";
    case "Weekend": return "bg-muted/50";
    default: return "";
  }
};

export default function ScheduleView() {
  const { contractId } = useParams<{ contractId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [contractCode, setContractCode] = useState<string | null>(null);
  const [schedData, setSchedData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!contractId) return;
    const load = async (retries = 2): Promise<void> => {
      const { data: c } = await supabase
        .from("contracts")
        .select("contract_code, form_data")
        .eq("id", contractId)
        .maybeSingle();

      if (!c) {
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
          return load(retries - 1);
        }
        setError("Contract not found.");
        setLoading(false);
        return;
      }

      setContractCode(c.contract_code);
      const fd = (c.form_data || {}) as Record<string, any>;
      setSchedData(fd.schedulingData as Record<string, any> | undefined ?? null);

      const { data: sched } = await supabase
        .from("contract_schedules")
        .select("schedule_date, day_type, scheduled_hours, start_time, end_time, holiday_name_en, holiday_name_sv")
        .eq("contract_id", contractId)
        .order("schedule_date");

      if (sched) setSchedule(sched);
      setLoading(false);
    };
    load();
  }, [contractId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-lg font-semibold">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Summary stats
  const totalWorkdays = schedule.filter((d) => d.day_type === "Workday").length;
  const totalHours = schedule.reduce((sum, d) => sum + (d.scheduled_hours || 0), 0);
  const totalHolidays = schedule.filter((d) => d.day_type === "Holiday").length;
  const totalVacation = schedule.filter((d) => d.day_type === "Vacation").length;
  const totalWeekends = schedule.filter((d) => d.day_type === "Weekend").length;

  // Group by month
  const months = new Map<string, ScheduleDay[]>();
  schedule.forEach((day) => {
    const monthKey = day.schedule_date.substring(0, 7); // YYYY-MM
    if (!months.has(monthKey)) months.set(monthKey, []);
    months.get(monthKey)!.push(day);
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between print:static">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Logo" className="h-8" />
          <div>
            <p className="text-sm font-semibold">Schedule Appendix / Schemabilaga</p>
            <p className="text-xs text-muted-foreground">{contractCode || "—"}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Summary card */}
        {schedData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Overview / Översikt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{totalWorkdays}</p>
                  <p className="text-xs text-muted-foreground">Workdays / Arbetsdagar</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{totalHours}h</p>
                  <p className="text-xs text-muted-foreground">Total hours / Totalt timmar</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/5">
                  <p className="text-2xl font-bold text-destructive">{totalHolidays}</p>
                  <p className="text-xs text-muted-foreground">Holidays / Helgdagar</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/5">
                  <p className="text-2xl font-bold text-primary">{totalVacation}</p>
                  <p className="text-xs text-muted-foreground">Vacation / Semester</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Contract period / Avtalsperiod:</span>
                <span className="font-medium">{schedData.contractStartDate || "—"} → {schedData.contractEndDate || "—"}</span>
                <span className="text-muted-foreground">Work period / Arbetsperiod:</span>
                <span className="font-medium">{schedData.workStartDate || "—"} → {schedData.workEndDate || "—"}</span>
                <span className="text-muted-foreground">Weekly hours / Veckotimmar:</span>
                <span className="font-medium">{schedData.weeklyHours || 40}h</span>
                <span className="text-muted-foreground">Daily hours / Dagliga timmar:</span>
                <span className="font-medium">{schedData.startTime || "06:30"} – {schedData.endTime || "17:00"}</span>
                {schedData.vacationEnabled && (
                  <>
                    <span className="text-muted-foreground">Vacation / Semester:</span>
                    <span className="font-medium">{schedData.vacationStartDate || "—"} → {schedData.vacationEndDate || "—"}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Disclaimer */}
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">Payment & Work Period Disclaimer</p>
              <p className="text-xs text-foreground/80">
                Hourly compensation is only payable for hours actually worked during the defined work period.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Timlön utbetalas endast för faktiskt arbetade timmar under den definierade arbetsperioden.
              </p>
            </div>
          </div>
        </div>

        {/* Full calendar by month */}
        {Array.from(months.entries()).map(([monthKey, days]) => {
          const d = new Date(monthKey + "-01T00:00:00");
          const monthName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          const monthHours = days.reduce((sum, day) => sum + (day.scheduled_hours || 0), 0);
          const monthWorkdays = days.filter((day) => day.day_type === "Workday").length;

          return (
            <Card key={monthKey}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{monthName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {monthWorkdays} workdays · {monthHours}h
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-semibold">Date</th>
                      <th className="text-left p-2 font-semibold">Day</th>
                      <th className="text-left p-2 font-semibold">Type</th>
                      <th className="text-right p-2 font-semibold">Hours</th>
                      <th className="text-left p-2 font-semibold hidden sm:table-cell">Time</th>
                      <th className="text-left p-2 font-semibold hidden sm:table-cell">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => {
                      const dd = new Date(day.schedule_date + "T00:00:00");
                      const dayName = dd.toLocaleDateString("en-US", { weekday: "short" });
                      return (
                        <tr key={day.schedule_date} className={cn("border-t border-border", dayTypeBg(day.day_type))}>
                          <td className="p-2 font-mono">{day.schedule_date}</td>
                          <td className="p-2">{dayName}</td>
                          <td className={cn("p-2 font-medium", dayTypeColor(day.day_type))}>{day.day_type}</td>
                          <td className="p-2 text-right font-medium">{day.scheduled_hours > 0 ? `${day.scheduled_hours}h` : "—"}</td>
                          <td className="p-2 hidden sm:table-cell text-muted-foreground">
                            {day.start_time && day.end_time ? `${day.start_time}–${day.end_time}` : "—"}
                          </td>
                          <td className="p-2 hidden sm:table-cell text-muted-foreground">
                            {day.holiday_name_en || ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}

        {schedule.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No schedule data available for this contract.
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ljungan Forestry · Schedule Appendix
          </p>
        </div>
      </div>
    </div>
  );
}
