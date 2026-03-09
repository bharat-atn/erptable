import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Play, Clock, AlertCircle, Users,
  Loader2, DollarSign, MinusCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

const DEDUCTION_TYPE_LABELS: Record<string, { sv: string; en: string; code: string }> = {
  accommodation: { sv: "Hyresavdrag", en: "Accommodation", code: "440" },
  car: { sv: "Bilkostnader", en: "Car costs", code: "470" },
  travel: { sv: "Resekostnader", en: "Travel costs", code: "480" },
  immigration: { sv: "Migrationsavgifter", en: "Immigration fees", code: "490" },
  other: { sv: "Annat avdrag", en: "Other", code: "499" },
};

export function PayrollRunsView() {
  const { orgId } = useOrg();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["payroll-employees", orgId],
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

  // Fetch active deductions for all employees
  const { data: deductions = [] } = useQuery({
    queryKey: ["payroll-deductions", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_deductions")
        .select("id, employee_id, deduction_type, amount, frequency, note, is_active")
        .eq("org_id", orgId!)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch SINK status from latest contracts
  const { data: sinkMap = new Map<string, boolean>() } = useQuery({
    queryKey: ["payroll-sink", orgId, employees.map(e => e.id).join(",")],
    queryFn: async () => {
      if (employees.length === 0) return new Map<string, boolean>();
      const { data: contracts } = await supabase
        .from("contracts")
        .select("employee_id, form_data")
        .in("employee_id", employees.map(e => e.id))
        .order("updated_at", { ascending: false });
      const map = new Map<string, boolean>();
      contracts?.forEach((c: any) => {
        if (!map.has(c.employee_id)) {
          const fd = c.form_data as Record<string, any> | null;
          map.set(c.employee_id, !!fd?.sinkEnabled);
        }
      });
      return map;
    },
    enabled: !!orgId && employees.length > 0,
  });

  // Group deductions by employee
  const deductionsByEmployee = deductions.reduce<Record<string, any[]>>((acc, d: any) => {
    if (!acc[d.employee_id]) acc[d.employee_id] = [];
    acc[d.employee_id].push(d);
    return acc;
  }, {});

  const months = [
    "Januari", "Februari", "Mars", "April", "Maj", "Juni",
    "Juli", "Augusti", "September", "Oktober", "November", "December",
  ];

  const period = `${selectedYear}-${selectedMonth.padStart(2, "0")}`;

  // Calculate totals
  let totalGross = 0;
  let totalDeductions = 0;
  let totalTax = 0;
  let totalNet = 0;
  let totalEmployerCost = 0;

  const employeeRows = employees.map((emp: any) => {
    const isSink = sinkMap instanceof Map ? sinkMap.get(emp.id) : false;
    const grossSalary = 0; // Will come from time reporting
    const empDeductions = deductionsByEmployee[emp.id] || [];
    const monthlyDeductions = empDeductions
      .filter((d: any) => d.frequency === "monthly")
      .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
    const oneTimeDeductions = empDeductions
      .filter((d: any) => d.frequency === "one-time")
      .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
    const totalDeductionAmount = monthlyDeductions + oneTimeDeductions;
    const taxRate = isSink ? 0.25 : 0.30;
    const taxLabel = isSink ? "SINK 25%" : "Table 30";
    const tax = Math.round(grossSalary * taxRate);
    const net = grossSalary - tax - totalDeductionAmount;
    const employerCost = Math.round(grossSalary * 0.3142);

    totalGross += grossSalary;
    totalDeductions += totalDeductionAmount;
    totalTax += tax;
    totalNet += net;
    totalEmployerCost += employerCost;

    return { emp, isSink, grossSalary, taxLabel, tax, net, employerCost, empDeductions, monthlyDeductions, oneTimeDeductions, totalDeductionAmount };
  });

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payroll Runs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Lönekörningar • Process monthly payroll</p>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="font-mono text-xs">{period}</Badge>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10"><Users className="w-4 h-4 text-primary" /></div>
              <span className="text-xs font-medium text-muted-foreground">Employees</span>
            </div>
            <div className="text-2xl font-bold">{employees.length}</div>
            <span className="text-[10px] text-muted-foreground">active this period</span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Clock className="w-4 h-4 text-amber-600" /></div>
              <span className="text-xs font-medium text-muted-foreground">Status</span>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">Not started</Badge>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
              <span className="text-xs font-medium text-muted-foreground">Gross Total</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalGross, "SEK")}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30"><MinusCircle className="w-4 h-4 text-orange-600" /></div>
              <span className="text-xs font-medium text-muted-foreground">Deductions</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalDeductions, "SEK")}</div>
            <span className="text-[10px] text-muted-foreground">contract deductions</span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30"><AlertCircle className="w-4 h-4 text-rose-600" /></div>
              <span className="text-xs font-medium text-muted-foreground">Employer Cost</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalEmployerCost, "SEK")}</div>
            <span className="text-[10px] text-muted-foreground">incl. 31.42% social fees</span>
          </CardContent>
        </Card>
      </div>

      {/* Employee payroll table */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Employee Payroll — {months[Number(selectedMonth) - 1]} {selectedYear}</h3>
            <Button size="sm" disabled={employees.length === 0}>
              <Play className="w-3.5 h-3.5 mr-1" /> Start Run
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : employees.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No active employees found for this organization.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Code</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Tax Amt</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead className="text-right">Employer Cost</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeRows.map(({ emp, taxLabel, grossSalary, tax, net, employerCost, empDeductions, totalDeductionAmount }) => (
                  <>
                    <TableRow
                      key={emp.id}
                      className={empDeductions.length > 0 ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => empDeductions.length > 0 && setExpandedEmployee(expandedEmployee === emp.id ? null : emp.id)}
                    >
                      <TableCell className="font-mono text-xs font-semibold">{emp.employee_code || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{emp.first_name} {emp.last_name}</span>
                          <span className="text-[10px] text-muted-foreground">{emp.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${taxLabel.startsWith("SINK") ? "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-900/20" : ""}`}
                        >
                          {taxLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(grossSalary, "SEK")}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {totalDeductionAmount > 0 ? (
                          <span className="text-destructive flex items-center justify-end gap-1">
                            -{formatCurrency(totalDeductionAmount, "SEK")}
                            {empDeductions.length > 0 && (
                              expandedEmployee === emp.id
                                ? <ChevronUp className="w-3 h-3" />
                                : <ChevronDown className="w-3 h-3" />
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-rose-600">{formatCurrency(tax, "SEK")}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(net, "SEK")}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(employerCost, "SEK")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          <Clock className="w-3 h-3 mr-0.5" /> Pending
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expandedEmployee === emp.id && empDeductions.length > 0 && (
                      <TableRow key={`${emp.id}-deductions`} className="bg-muted/30">
                        <TableCell />
                        <TableCell colSpan={8}>
                          <div className="py-2 space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              Contract Deductions / Avdrag från avtal
                            </p>
                            {empDeductions.map((d: any) => {
                              const typeInfo = DEDUCTION_TYPE_LABELS[d.deduction_type] || DEDUCTION_TYPE_LABELS.other;
                              return (
                                <div key={d.id} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-muted-foreground w-8">{typeInfo.code}</span>
                                    <span className="font-medium">{typeInfo.sv}</span>
                                    <span className="text-muted-foreground">/ {typeInfo.en}</span>
                                    <Badge variant="outline" className="text-[9px] capitalize">{d.frequency}</Badge>
                                    {d.note && <span className="text-muted-foreground italic">({d.note})</span>}
                                  </div>
                                  <span className="font-mono font-semibold text-destructive">
                                    -{formatCurrency(Number(d.amount), "SEK")}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
