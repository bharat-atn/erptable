import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { MinusCircle, Info, Calculator, Users, Filter, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

const DEDUCTION_TYPE_LABELS: Record<string, { sv: string; en: string; code: string }> = {
  accommodation: { sv: "Hyresavdrag", en: "Accommodation deduction", code: "440" },
  car: { sv: "Bilkostnader", en: "Car costs", code: "470" },
  travel: { sv: "Resekostnader", en: "Travel costs", code: "480" },
  immigration: { sv: "Migrationsavgifter", en: "Immigration fees", code: "490" },
  other: { sv: "Annat avdrag", en: "Other deduction", code: "499" },
};

const STANDARD_DEDUCTIONS = [
  { code: "400", label: "Skatteavdrag", en: "Preliminary tax", method: "Tax table", mandatory: true, desc: "Withheld per Skatteverket tax table or SINK rate" },
  { code: "410", label: "Fackföreningsavgift", en: "Union fee", method: "Fixed monthly", mandatory: false, desc: "Deducted if employee is union member" },
  { code: "420", label: "Utmätning", en: "Wage garnishment", method: "Kronofogden order", mandatory: true, desc: "Court-ordered deduction by Kronofogden" },
  { code: "430", label: "Pensionsavdrag", en: "Pension contribution (employee)", method: "Percentage", mandatory: false, desc: "Voluntary additional pension savings" },
  { code: "440", label: "Hyresavdrag", en: "Accommodation deduction", method: "Fixed monthly", mandatory: false, desc: "Deducted for employer-provided housing" },
  { code: "450", label: "Förskottslön", en: "Salary advance repayment", method: "Fixed amount", mandatory: false, desc: "Repayment of advance salary payment" },
  { code: "460", label: "Sjuklöneavdrag", en: "Sick day deduction", method: "Karensdag formula", mandatory: true, desc: "Waiting day deduction (first sick day = 20% deduction)" },
];

const BENEFITS = [
  { code: "500", label: "Förmånsbil", en: "Company car", monthlyValue: "Varies", tax: "Yes", social: "Yes", desc: "Taxable benefit based on car model and usage" },
  { code: "510", label: "Fritt boende", en: "Free accommodation", monthlyValue: "Varies", tax: "Yes", social: "Yes", desc: "Taxable benefit for employer-provided housing" },
  { code: "520", label: "Drivmedelsförmån", en: "Fuel benefit", monthlyValue: "Varies", tax: "Yes", social: "Yes", desc: "If employer pays for private fuel use" },
  { code: "530", label: "Kostförmån", en: "Meal benefit", monthlyValue: "110 SEK/day", tax: "Yes", social: "Yes", desc: "Standard Skatteverket value for free meals" },
  { code: "540", label: "Friskvårdsbidrag", en: "Wellness allowance", monthlyValue: "≤5000 SEK/year", tax: "No", social: "No", desc: "Tax-free wellness benefit up to threshold" },
];

export function DeductionsView() {
  const { orgId } = useOrg();
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [view, setView] = useState<"employees" | "reference">("employees");

  const { data: deductions = [], isLoading } = useQuery({
    queryKey: ["employee-deductions", orgId, showActiveOnly],
    queryFn: async () => {
      let query = supabase
        .from("employee_deductions")
        .select("*, employees!inner(first_name, last_name, employee_code, email)")
        .eq("org_id", orgId!);
      if (showActiveOnly) query = query.eq("is_active", true);
      const { data } = await query.order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  // Group by employee
  const byEmployee = deductions.reduce((acc: Record<string, any[]>, d: any) => {
    const key = d.employee_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const totalMonthly = deductions
    .filter((d: any) => d.frequency === "monthly" && d.is_active)
    .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deductions & Benefits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Avdrag & Förmåner • Payroll deductions from employment contracts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "employees" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("employees")}
          >
            <Users className="w-4 h-4 mr-1" /> Employee Deductions
          </Button>
          <Button
            variant={view === "reference" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("reference")}
          >
            <Info className="w-4 h-4 mr-1" /> Reference Tables
          </Button>
        </div>
      </div>

      {view === "employees" && (
        <>
          {/* Summary card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Active Deductions</p>
                <p className="text-2xl font-bold text-foreground">{deductions.filter((d: any) => d.is_active).length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Employees with Deductions</p>
                <p className="text-2xl font-bold text-foreground">{Object.keys(byEmployee).length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Monthly Deductions</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalMonthly)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={showActiveOnly} onCheckedChange={setShowActiveOnly} />
              Show active only
            </label>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : deductions.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-12 text-center">
                <MinusCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No deductions found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deductions are automatically created when employment contracts with Section 13 data are fully signed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount (SEK)</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions.map((d: any) => {
                      const emp = d.employees;
                      const typeInfo = DEDUCTION_TYPE_LABELS[d.deduction_type] || DEDUCTION_TYPE_LABELS.other;
                      return (
                        <TableRow key={d.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{emp?.first_name} {emp?.last_name}</span>
                              <span className="text-[10px] text-muted-foreground">{emp?.employee_code || emp?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">{typeInfo.code}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{typeInfo.sv}</span>
                              <span className="text-[10px] text-muted-foreground">{typeInfo.en}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">
                            {formatCurrency(Number(d.amount))}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">{d.frequency}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                            {d.note || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            {d.is_active ? (
                              <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Inactive</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {view === "reference" && (
        <>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Swedish Payroll Deductions</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mandatory and voluntary deductions applied during payroll processing. All deductions follow
                Skatteverket regulations and applicable collective agreements.
              </p>
            </div>
          </div>

          {/* Standard deductions */}
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30"><MinusCircle className="w-4 h-4 text-rose-600" /></div>
                <div>
                  <h3 className="font-semibold text-sm">Standard Deductions (Avdrag)</h3>
                  <p className="text-[10px] text-muted-foreground">Mandatory and voluntary payroll deductions</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-center">Mandatory</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STANDARD_DEDUCTIONS.map((d) => (
                    <TableRow key={d.code}>
                      <TableCell className="font-mono text-xs font-semibold">{d.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{d.label}</span>
                          <span className="text-[10px] text-muted-foreground">{d.en}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{d.method}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {d.mandatory ? (
                          <Badge variant="secondary" className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">Required</Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Optional</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">{d.desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Taxable benefits */}
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Calculator className="w-4 h-4 text-purple-600" /></div>
                <div>
                  <h3 className="font-semibold text-sm">Taxable Benefits (Förmåner)</h3>
                  <p className="text-[10px] text-muted-foreground">Benefits that affect tax and social contributions</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Code</TableHead>
                    <TableHead>Benefit</TableHead>
                    <TableHead>Monthly Value</TableHead>
                    <TableHead className="text-center">Taxable</TableHead>
                    <TableHead className="text-center">Social Fees</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BENEFITS.map((b) => (
                    <TableRow key={b.code}>
                      <TableCell className="font-mono text-xs font-semibold">{b.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{b.label}</span>
                          <span className="text-[10px] text-muted-foreground">{b.en}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{b.monthlyValue}</TableCell>
                      <TableCell className="text-center">
                        {b.tax === "Yes" ? (
                          <span className="text-rose-600 text-xs font-semibold">Yes</span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-semibold">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {b.social === "Yes" ? (
                          <span className="text-rose-600 text-xs font-semibold">Yes</span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-semibold">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">{b.desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
