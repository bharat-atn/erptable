import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign, Users, FileText, Calendar, TrendingUp,
  Clock, AlertCircle, CheckCircle2, ArrowRight, Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

interface PayrollDashboardViewProps {
  onNavigate: (view: string) => void;
}

export function PayrollDashboardView({ onNavigate }: PayrollDashboardViewProps) {
  const { orgId } = useOrg();

  // Fetch active employees count
  const { data: employeeCount = 0 } = useQuery({
    queryKey: ["payroll-employee-count", orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId!)
        .eq("status", "ACTIVE");
      return count || 0;
    },
    enabled: !!orgId,
  });

  // Fetch projects in payroll_ready status
  const { data: payrollProjects = [] } = useQuery({
    queryKey: ["payroll-ready-projects", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_projects" as any)
        .select("*")
        .eq("org_id", orgId!)
        .in("status", ["payroll_ready", "completed", "in_progress"]);
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  const currentMonth = new Date().toLocaleString("sv-SE", { month: "long", year: "numeric" });
  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payroll Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Swedish payroll processing • Lönehantering
        </p>
      </div>

      {/* Current period banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Current Period</span>
            <h2 className="text-xl font-bold text-foreground mt-1 capitalize">{currentMonth}</h2>
            <span className="text-xs text-muted-foreground font-mono">{currentPeriod}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <Clock className="w-3 h-3 mr-1" /> Not started
            </Badge>
            <Button onClick={() => onNavigate("payroll-runs")}>
              Start Payroll Run <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Active Employees</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{employeeCount}</div>
            <span className="text-[10px] text-muted-foreground">eligible for payroll</span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Payroll Runs</span>
            </div>
            <div className="text-3xl font-bold text-foreground">0</div>
            <span className="text-[10px] text-muted-foreground">completed this year</span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Salary Slips</span>
            </div>
            <div className="text-3xl font-bold text-foreground">0</div>
            <span className="text-[10px] text-muted-foreground">generated this period</span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Pending Actions</span>
            </div>
            <div className="text-3xl font-bold text-foreground">0</div>
            <span className="text-[10px] text-muted-foreground">requiring attention</span>
          </CardContent>
        </Card>
      </div>

      {/* Salary components / Lönearter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Salary Components (Lönearter)</h3>
                <p className="text-[10px] text-muted-foreground">Standard Swedish payroll items</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { code: "011", desc: "Månadslön", descEn: "Monthly salary", type: "Earning", rate: "—" },
                  { code: "012", desc: "Timlön", descEn: "Hourly wage", type: "Earning", rate: "Per hour" },
                  { code: "030", desc: "Ackordslön", descEn: "Piece rate", type: "Earning", rate: "Per unit" },
                  { code: "050", desc: "Övertidstillägg", descEn: "Overtime supplement", type: "Supplement", rate: "+50/100%" },
                  { code: "060", desc: "OB-tillägg", descEn: "Unsocial hours", type: "Supplement", rate: "Per hour" },
                  { code: "090", desc: "Semesterlön", descEn: "Holiday pay", type: "Earning", rate: "12%" },
                  { code: "300", desc: "Traktamente", descEn: "Daily allowance", type: "Deduction-free", rate: "Per day" },
                  { code: "400", desc: "Skatteavdrag", descEn: "Tax deduction", type: "Deduction", rate: "Tax table" },
                ].map((item) => (
                  <TableRow key={item.code}>
                    <TableCell className="font-mono text-xs font-semibold">{item.code}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{item.desc}</span>
                        <span className="text-[10px] text-muted-foreground">{item.descEn}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">{item.rate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Employer contributions */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Employer Social Contributions</h3>
                <p className="text-[10px] text-muted-foreground">Arbetsgivaravgifter 2025–2027</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Ålderspensionsavgift", en: "Pension contribution", rate: 10.21 },
                { label: "Efterlevandepensionsavgift", en: "Survivors' pension", rate: 0.60 },
                { label: "Sjukförsäkringsavgift", en: "Sickness insurance", rate: 3.55 },
                { label: "Arbetsskadeavgift", en: "Work injury insurance", rate: 0.20 },
                { label: "Föräldraförsäkringsavgift", en: "Parental insurance", rate: 2.60 },
                { label: "Arbetsmarknadsavgift", en: "Labour market", rate: 2.64 },
                { label: "Allmän löneavgift", en: "General payroll tax", rate: 11.62 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div>
                    <span className="text-sm">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">({item.en})</span>
                  </div>
                  <span className="text-sm font-mono font-semibold">{item.rate.toFixed(2)}%</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 bg-primary/5 rounded-lg px-3 mt-2">
                <span className="font-semibold text-sm text-primary">Total Arbetsgivaravgift</span>
                <span className="font-bold text-lg text-primary">31.42%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Payroll Runs", desc: "Process monthly payroll", icon: Calendar, view: "payroll-runs" },
          { label: "Salary Slips", desc: "View & distribute", icon: FileText, view: "salary-slips" },
          { label: "Tax Reports", desc: "AGI & annual reports", icon: TrendingUp, view: "tax-reports" },
          { label: "Salary Tables", desc: "Collective agreement rates", icon: DollarSign, view: "salary-tables" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className="text-left p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <Icon className="w-5 h-5 text-primary mb-2" />
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="text-[10px] text-muted-foreground">{item.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
