import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Umbrella, Calendar, Info, Users, Loader2,
  TrendingUp, AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

export function HolidayView() {
  const { orgId } = useOrg();
  const currentYear = new Date().getFullYear();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["holiday-employees", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, employee_code, status, personal_info")
        .eq("org_id", orgId!)
        .eq("status", "ACTIVE")
        .order("last_name");
      return data || [];
    },
    enabled: !!orgId,
  });

  // Swedish holiday entitlement rules
  const holidayRules = [
    { rule: "Standard entitlement", desc: "25 semesterdagar per year (Semesterlagen §4)", days: 25 },
    { rule: "Earning year (Intjänandeår)", desc: `April 1 ${currentYear - 1} – March 31 ${currentYear}`, days: null },
    { rule: "Vacation year (Semesterår)", desc: `April 1 ${currentYear} – March 31 ${currentYear + 1}`, days: null },
    { rule: "Semesterlön", desc: "12% of total earned income during earning year", days: null },
    { rule: "Semesterersättning", desc: "Paid out when employment ends instead of taking days", days: null },
    { rule: "Sparade dagar", desc: "Up to 5 days/year can be saved, max 5 years", days: null },
  ];

  const semesterlonCalculation = [
    { item: "Sammalöneregeln", desc: "Current monthly salary + holiday supplement (semestertillägg)", formula: "Monthly salary + 0.43% × monthly salary × earned days" },
    { item: "Procentregeln", desc: "12% of total variable earnings during earning year", formula: "12% × total variable earnings" },
    { item: "Semestertillägg", desc: "Extra supplement per vacation day", formula: "0.43% × monthly salary per day (collective agreement)" },
  ];

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Holiday Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Semesterhantering • Vacation tracking and holiday pay</p>
      </div>

      {/* Period info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 flex items-start gap-3">
        <Umbrella className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Semesterår {currentYear}/{currentYear + 1}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Earning year: April 1, {currentYear - 1} – March 31, {currentYear} •
            Vacation year: April 1, {currentYear} – March 31, {currentYear + 1}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Users className="w-4 h-4 text-blue-600" /></div>
              <span className="text-xs font-medium text-muted-foreground">Employees</span>
            </div>
            <div className="text-2xl font-bold">{employees.length}</div>
            <span className="text-[10px] text-muted-foreground">with holiday entitlement</span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><Calendar className="w-4 h-4 text-emerald-600" /></div>
              <span className="text-xs font-medium text-muted-foreground">Days Earned</span>
            </div>
            <div className="text-2xl font-bold">{employees.length * 25}</div>
            <span className="text-[10px] text-muted-foreground">total for all employees</span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Clock className="w-4 h-4 text-amber-600" /></div>
              <span className="text-xs font-medium text-muted-foreground">Days Taken</span>
            </div>
            <div className="text-2xl font-bold">0</div>
            <span className="text-[10px] text-muted-foreground">this vacation year</span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30"><TrendingUp className="w-4 h-4 text-rose-600" /></div>
              <span className="text-xs font-medium text-muted-foreground">Holiday Liability</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(0, "SEK")}</div>
            <span className="text-[10px] text-muted-foreground">semesterskuld</span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Holiday Balances</TabsTrigger>
          <TabsTrigger value="rules">Swedish Rules</TabsTrigger>
          <TabsTrigger value="calculation">Calculation</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Umbrella className="w-4 h-4 text-blue-600" /></div>
                <div>
                  <h3 className="font-semibold text-sm">Employee Holiday Balances — Semestersaldo</h3>
                  <p className="text-[10px] text-muted-foreground">Vacation year {currentYear}/{currentYear + 1}</p>
                </div>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : employees.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">No active employees found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Code</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Entitled</TableHead>
                      <TableHead className="text-center">Earned</TableHead>
                      <TableHead className="text-center">Taken</TableHead>
                      <TableHead className="text-center">Saved</TableHead>
                      <TableHead className="text-center">Remaining</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="text-right">Liability (SEK)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp: any) => {
                      const entitled = 25;
                      const earned = 25;
                      const taken = 0;
                      const saved = 0;
                      const remaining = earned - taken;
                      const usagePct = earned > 0 ? Math.round((taken / earned) * 100) : 0;
                      return (
                        <TableRow key={emp.id}>
                          <TableCell className="font-mono text-xs font-semibold">{emp.employee_code || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{emp.first_name} {emp.last_name}</span>
                              <span className="text-[10px] text-muted-foreground">{emp.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">{entitled}</TableCell>
                          <TableCell className="text-center text-sm font-semibold">{earned}</TableCell>
                          <TableCell className="text-center text-sm">{taken}</TableCell>
                          <TableCell className="text-center text-sm">{saved}</TableCell>
                          <TableCell className="text-center text-sm font-semibold text-primary">{remaining}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={usagePct} className="h-1.5 w-16" />
                              <span className="text-[10px] text-muted-foreground">{usagePct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(0, "SEK")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Semesterlagen (Swedish Annual Leave Act)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All employees are entitled to a minimum of 25 vacation days per year.
                The law distinguishes between semesterår (vacation year) and intjänandeår (earning year).
              </p>
            </div>
          </div>
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-4">Holiday Entitlement Rules</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidayRules.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{r.rule}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.desc}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {r.days !== null ? r.days : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4 mt-4">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-4">Semesterlön Calculation Methods</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Formula</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semesterlonCalculation.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{c.item}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.desc}</TableCell>
                      <TableCell className="text-xs font-mono bg-muted/50 rounded px-2 py-1">{c.formula}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-4">Semesterskuld (Holiday Liability) Calculation</h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold">For monthly-salaried employees:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Semesterskuld = (Remaining days × daily salary) + semestertillägg + social fees (31.42%)
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold">Daily salary:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monthly salary / 21 (average working days per month)
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold">Example:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    30,000 SEK/month, 15 remaining days:
                    (30,000 / 21 × 15) + social fees = 21,429 + 0.43% supplement + 31.42% = ~<span className="font-semibold text-foreground">28,386 SEK</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}