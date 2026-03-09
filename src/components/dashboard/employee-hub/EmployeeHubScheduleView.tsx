import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Sun, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_TYPE_COLORS: Record<string, string> = {
  Workday: "border-l-emerald-500",
  Weekend: "border-l-muted-foreground/30 opacity-60",
  Holiday: "border-l-amber-500",
  Vacation: "border-l-blue-500",
  "Off-season": "border-l-muted-foreground/20 opacity-50",
};

export function EmployeeHubScheduleView() {
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["employee-hub-schedule"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: profile } = await supabase.from("profiles").select("email").eq("user_id", user.id).single();
      if (!profile?.email) return [];
      const { data: emp } = await supabase.from("employees").select("id").eq("email", profile.email).maybeSingle();
      if (!emp) return [];
      const { data: contract } = await supabase
        .from("contracts")
        .select("id")
        .eq("employee_id", emp.id)
        .in("status", ["signed", "active", "draft"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!contract) return [];
      const { data } = await supabase
        .from("contract_schedules")
        .select("*")
        .eq("contract_id", contract.id)
        .order("schedule_date");
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const totalHours = schedules.reduce((sum: number, s: any) => sum + Number(s.scheduled_hours || 0), 0);
  const workdays = schedules.filter((s: any) => s.day_type === "Workday").length;
  const holidays = schedules.filter((s: any) => s.day_type === "Holiday").length;

  return (
    <div className="space-y-5 px-2 pt-2 pb-24 max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-5 text-white shadow-xl mb-6">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <p className="text-sm text-white/80">Mitt schema</p>
      </div>

      {/* Summary cards — 2x2 grid for mobile */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-4 text-center shadow-sm">
          <Calendar className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-emerald-600">{schedules.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total Days</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-4 text-center shadow-sm">
          <Clock className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-emerald-600">{workdays}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Workdays</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl border-2 border-amber-600/20 p-4 text-center shadow-sm">
          <Sun className="w-6 h-6 mx-auto text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-amber-600">{holidays}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Holidays</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl border-2 border-blue-600/20 p-4 text-center shadow-sm">
          <Clock className="w-6 h-6 mx-auto text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total Hours</p>
        </div>
      </div>

      {/* Schedule — card list instead of table for mobile */}
      {schedules.length === 0 ? (
        <Card className="border-border/60 mx-2">
          <CardContent className="pt-6 pb-6 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No schedule available yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your work schedule will appear here once your contract is set up</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5 px-2">
          {schedules.map((s: any) => {
            const d = new Date(s.schedule_date + "T00:00:00");
            const dayName = d.toLocaleDateString("sv-SE", { weekday: "short" });
            const dateLabel = d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
            const colorClass = DAY_TYPE_COLORS[s.day_type] || "";
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg bg-card border border-border/40 border-l-[3px]",
                  colorClass
                )}
              >
                <div className="min-w-[52px] text-center">
                  <p className="text-xs font-bold uppercase">{dayName}</p>
                  <p className="text-[10px] text-muted-foreground">{dateLabel}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.day_type}</Badge>
                    {(s.holiday_name_sv || s.holiday_name_en) && (
                      <span className="text-[10px] text-amber-600 truncate">{s.holiday_name_sv || s.holiday_name_en}</span>
                    )}
                  </div>
                  {s.start_time && s.end_time && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{s.start_time} – {s.end_time}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{Number(s.scheduled_hours) || "—"}</p>
                  <p className="text-[9px] text-muted-foreground">hrs</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
