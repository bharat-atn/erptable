import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { differenceInCalendarDays, eachDayOfInterval, isWeekend, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/format-currency";

const EMPLOYER_SOCIAL_FEE_RATE = 0.3142; // 31.42% Swedish employer social contributions

interface Props {
  project: any;
  projectId: string;
  orgId: string;
  onSaveSetupData: (partial: Record<string, any>) => Promise<void>;
}

export function PreliminaryPayrollTab({ project, projectId, orgId, onSaveSetupData }: Props) {
  const sd = (project?.setup_data || {}) as any;

  // Fetch team members
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

  // Fetch objects to know SLA classes for wage lookup
  const { data: objects = [] } = useQuery({
    queryKey: ["forestry-objects", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_objects" as any)
        .select("*")
        .eq("project_id", projectId);
      return (data || []) as any[];
    },
  });

  // Fetch comp group classes for star-based rates
  const { data: compClasses = [] } = useQuery({
    queryKey: ["comp-group-classes", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("comp_group_classes")
        .select("*, comp_groups!inner(name, category, method)")
        .eq("org_id", orgId);
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  const employeeMap = useMemo(() => {
    const map = new Map<string, any>();
    employees.forEach((e: any) => map.set(e.id, e));
    return map;
  }, [employees]);

  // Use the primary SLA class from the project objects (most common)
  const primarySlaClass = useMemo(() => {
    if (objects.length === 0) return null;
    const counts = new Map<string, number>();
    objects.forEach((obj: any) => {
      counts.set(obj.sla_class, (counts.get(obj.sla_class) || 0) + 1);
    });
    let best = "";
    let bestCount = 0;
    counts.forEach((count, sla) => {
      if (count > bestCount) { best = sla; bestCount = count; }
    });
    return best;
  }, [objects]);

  // Find the comp class row matching the primary SLA
  const slaCompClass = useMemo(() => {
    if (!primarySlaClass) return null;
    return compClasses.find((cc: any) => cc.sla_class_id === primarySlaClass) || null;
  }, [compClasses, primarySlaClass]);

  // Time calculations
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

  // Per-member costs including wages
  const memberCosts = useMemo(() => {
    return teamMembers.map((m: any) => {
      const emp = employeeMap.get(m.employee_id);
      const name = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "Unknown";
      const starRating = m.star_rating || 1;

      // Get hourly rate from comp class based on star rating
      let hourlyRate = 0;
      if (slaCompClass) {
        const starKey = `star_${starRating}`;
        hourlyRate = Number(slaCompClass[starKey]) || 0;
      }

      const grossWage = hourlyRate * totalHoursPerPerson;
      const socialFees = grossWage * EMPLOYER_SOCIAL_FEE_RATE;
      const totalLaborCost = grossWage + socialFees;
      const accommodation = totalNights * (rentPerNight + beddingPerNight);
      const dailyAllowanceTotal = workDays * dailyAllowance;
      const totalPerPerson = totalLaborCost + accommodation + dailyAllowanceTotal;

      return {
        id: m.id,
        name,
        code: emp?.employee_code || "—",
        role: m.role,
        starRating,
        hours: totalHoursPerPerson,
        hourlyRate,
        grossWage,
        socialFees,
        totalLaborCost,
        accommodation,
        dailyAllowance: dailyAllowanceTotal,
        total: totalPerPerson,
      };
    });
  }, [teamMembers, employeeMap, slaCompClass, totalHoursPerPerson, totalNights, rentPerNight, beddingPerNight, workDays, dailyAllowance]);

  const totals = useMemo(() => {
    return memberCosts.reduce(
      (acc, m) => ({
        grossWage: acc.grossWage + m.grossWage,
        socialFees: acc.socialFees + m.socialFees,
        totalLabor: acc.totalLabor + m.totalLaborCost,
        accommodation: acc.accommodation + m.accommodation,
        dailyAllowance: acc.dailyAllowance + m.dailyAllowance,
        grand: acc.grand + m.total,
      }),
      { grossWage: 0, socialFees: 0, totalLabor: 0, accommodation: 0, dailyAllowance: 0, grand: 0 }
    );
  }, [memberCosts]);

  const projectCost = Number(project?.cost) || 0;
  const allInTotal = totals.grand + projectCost;
  const projectRevenue = Number(project?.revenue) || 0;
  const estimatedMargin = projectRevenue - allInTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10"><UserCheck className="w-4 h-4 text-primary" /></div>
        <div>
          <h3 className="font-semibold text-foreground">Preliminary Payroll</h3>
          <p className="text-xs text-muted-foreground">
            Estimated gross/net payroll per team member • SLA {primarySlaClass || "—"} rates
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Social Fee</span>
          <div className="text-lg font-bold text-foreground mt-1">{(EMPLOYER_SOCIAL_FEE_RATE * 100).toFixed(2)}%</div>
        </div>
      </div>

      {/* Payroll table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Star</TableHead>
                <TableHead className="text-right">Rate/h</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Gross Wage</TableHead>
                <TableHead className="text-right">Social Fees</TableHead>
                <TableHead className="text-right">Accommodation</TableHead>
                <TableHead className="text-right">Allowance</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                    No team members assigned. Add members in the Team Members tab.
                  </TableCell>
                </TableRow>
              ) : (
                memberCosts.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{m.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{m.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {m.starRating}★
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {m.hourlyRate > 0 ? formatCurrency(m.hourlyRate, undefined, 0) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">{m.hours}h</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(m.grossWage)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(m.socialFees)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(m.accommodation)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(m.dailyAllowance)}</TableCell>
                    <TableCell className="text-right text-sm font-bold">{formatCurrency(m.total)}</TableCell>
                  </TableRow>
                ))
              )}
              {memberCosts.length > 0 && (
                <>
                  <TableRow className="bg-muted/30 font-semibold border-t-2">
                    <TableCell colSpan={4} className="text-right text-sm">Payroll Subtotal</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(totals.grossWage)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(totals.socialFees)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(totals.accommodation)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(totals.dailyAllowance)}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-primary">{formatCurrency(totals.grand)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/10">
                    <TableCell colSpan={8} className="text-right text-sm">Project Costs (Transport + Consumption + Other)</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(projectCost)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-primary/5 font-bold">
                    <TableCell colSpan={8} className="text-right text-sm">Grand Total</TableCell>
                    <TableCell className="text-right text-sm text-primary">{formatCurrency(allInTotal)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Margin analysis */}
      {memberCosts.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-sm mb-3">Margin Analysis</h4>
            <div className="divide-y divide-border">
              <div className="flex justify-between py-2">
                <span className="text-sm">Total Revenue (from Financial Planning)</span>
                <span className="text-sm font-semibold text-emerald-600">{formatCurrency(projectRevenue)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm">Total Payroll Cost</span>
                <span className="text-sm font-semibold">{formatCurrency(totals.grand)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm">Total Project Costs</span>
                <span className="text-sm font-semibold">{formatCurrency(projectCost)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm">Total Estimated Cost</span>
                <span className="text-sm font-semibold text-destructive">{formatCurrency(allInTotal)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm font-bold">Estimated Margin</span>
                <div className="flex items-center gap-2">
                  {projectRevenue > 0 && (
                    <Badge variant={estimatedMargin >= 0 ? "default" : "destructive"} className="text-[10px]">
                      {((estimatedMargin / projectRevenue) * 100).toFixed(1)}%
                    </Badge>
                  )}
                  <span className={`text-sm font-bold ${estimatedMargin >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {formatCurrency(estimatedMargin)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!slaCompClass && teamMembers.length > 0 && (
        <p className="text-xs text-amber-600">
          ⚠ No compensation rates found for SLA {primarySlaClass || "—"}. Configure comp groups to see wage calculations.
        </p>
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
