import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Sun, Umbrella, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_TYPE_STYLES: Record<string, string> = {
  Workday: "",
  Weekend: "bg-muted/50 text-muted-foreground",
  Holiday: "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400",
  Vacation: "bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400",
  "Off-season": "bg-muted/30 text-muted-foreground",
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
      // Get the latest active contract
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
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold">My Schedule</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 text-center">
            <Calendar className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{schedules.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Days</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">{workdays}</p>
            <p className="text-[10px] text-muted-foreground">Workdays</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 text-center">
            <Sun className="w-5 h-5 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-bold">{holidays}</p>
            <p className="text-[10px] text-muted-foreground">Holidays</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">{totalHours.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule table */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No schedule available yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your work schedule will appear here once your contract is set up</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s: any) => {
                    const d = new Date(s.schedule_date + "T00:00:00");
                    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                    return (
                      <TableRow key={s.id} className={cn(DAY_TYPE_STYLES[s.day_type] || "")}>
                        <TableCell className="font-mono text-xs">{s.schedule_date}</TableCell>
                        <TableCell className="text-xs">{dayName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{s.day_type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{s.start_time || "—"}</TableCell>
                        <TableCell className="text-xs font-mono">{s.end_time || "—"}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">{Number(s.scheduled_hours) || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.holiday_name_en || s.holiday_name_sv || ""}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
