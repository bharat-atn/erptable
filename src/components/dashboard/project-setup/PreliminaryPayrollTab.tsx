import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { differenceInCalendarDays, eachDayOfInterval, isWeekend, parseISO } from "date-fns";

interface Props {
  project: any;
  projectId: string;
  orgId: string;
  onSaveSetupData: (partial: Record<string, any>) => Promise<void>;
}

function formatSEK(val: number) {
  return new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + " sek";
}

export function PreliminaryPayrollTab({ project, projectId, orgId, onSaveSetupData }: Props) {
  const sd = (project?.setup_data || {}) as any;

  // Fetch team
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["project-team", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_project_members" as any)
        .select("*")
        .eq("project_id", projectId);
      return (data || []) as any[];
    },
  });

  // Fetch employees for names
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code")
        .eq("org_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const employeeMap = useMemo(() => {
    const map = new Map<string, any>();
    employees.forEach((e: any) => map.set(e.id, e));
    return map;
  }, [employees]);

  // Calculations
  const workDays = useMemo(() => {
    if (!project?.start_date || !project?.end_date) return 0;
    return eachDayOfInterval({
      start: parseISO(project.start_date),
      end: parseISO(project.end_date),
    }).filter((d) => !isWeekend(d)).length;
  }, [project]);

  const dailyHours = project?.daily_hours || 8;
  const totalHoursPerPerson = workDays * dailyHours;
  const dailyAllowance = sd.daily_allowance ?? 300;
  const totalNights = project?.start_date && project?.end_date
    ? differenceInCalendarDays(parseISO(project.end_date), parseISO(project.start_date))
    : 0;
  const rentPerNight = sd.rent_per_night ?? 500;
  const beddingPerNight = sd.bedding_per_night ?? 100;

  // Per-member costs
  const memberCosts = teamMembers.map((m: any) => {
    const emp = employeeMap.get(m.employee_id);
    const name = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "Unknown";
    const accommodation = totalNights * (rentPerNight + beddingPerNight);
    const dailyAllowanceTotal = workDays * dailyAllowance;
    const total = accommodation + dailyAllowanceTotal;
    return {
      id: m.id,
      name,
      code: emp?.employee_code || "—",
      role: m.role,
      starRating: m.star_rating,
      hours: totalHoursPerPerson,
      accommodation,
      dailyAllowance: dailyAllowanceTotal,
      total,
    };
  });

  const grandTotal = memberCosts.reduce((sum, m) => sum + m.total, 0);
  const projectCost = Number(project?.cost) || 0;
  const allInTotal = grandTotal + projectCost;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10"><UserCheck className="w-4 h-4 text-primary" /></div>
        <div>
          <h3 className="font-semibold text-foreground">Preliminary Payroll</h3>
          <p className="text-xs text-muted-foreground">Estimated costs per team member based on project parameters</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Team Size</span>
          <div className="text-2xl font-bold text-foreground mt-1">{teamMembers.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Hours / Person</span>
          <div className="text-2xl font-bold text-foreground mt-1">{totalHoursPerPerson}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Work Days</span>
          <div className="text-2xl font-bold text-foreground mt-1">{workDays}</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/30 p-4">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Nights</span>
          <div className="text-2xl font-bold text-foreground mt-1">{totalNights}</div>
        </div>
      </div>

      {/* Payroll table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Accommodation</TableHead>
                <TableHead className="text-right">Daily Allowance</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                    No team members assigned. Add members in the Team Members tab.
                  </TableCell>
                </TableRow>
              ) : (
                memberCosts.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-sm">{m.name}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{m.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {m.role === "leader" ? "Leader" : "Member"} ({m.starRating}★)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{m.hours}h</TableCell>
                    <TableCell className="text-right text-sm">{formatSEK(m.accommodation)}</TableCell>
                    <TableCell className="text-right text-sm">{formatSEK(m.dailyAllowance)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{formatSEK(m.total)}</TableCell>
                  </TableRow>
                ))
              )}
              {memberCosts.length > 0 && (
                <>
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell colSpan={6} className="text-right text-sm">Team Subtotal</TableCell>
                    <TableCell className="text-right text-sm font-bold text-primary">{formatSEK(grandTotal)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/10">
                    <TableCell colSpan={6} className="text-right text-sm">Project Costs (Transport + Consumption + Other)</TableCell>
                    <TableCell className="text-right text-sm">{formatSEK(projectCost)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-primary/5 font-bold">
                    <TableCell colSpan={6} className="text-right text-sm">Grand Total</TableCell>
                    <TableCell className="text-right text-sm text-primary">{formatSEK(allInTotal)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue vs cost summary */}
      {memberCosts.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="divide-y divide-border">
              <div className="flex justify-between py-2">
                <span className="text-sm">Total Revenue</span>
                <span className="text-sm font-semibold text-emerald-600">{formatSEK(Number(project?.revenue) || 0)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm">Total Estimated Cost</span>
                <span className="text-sm font-semibold text-destructive">{formatSEK(allInTotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-bold">Estimated Margin</span>
                <span className={`text-sm font-bold ${(Number(project?.revenue) || 0) - allInTotal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {formatSEK((Number(project?.revenue) || 0) - allInTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => {
            onSaveSetupData({ payroll_reviewed: true });
            toast.success("Payroll reviewed and saved");
          }}
          size="lg"
        >
          <CheckCircle2 className="w-4 h-4 mr-1" /> Mark as Reviewed
        </Button>
      </div>
    </div>
  );
}
