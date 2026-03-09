import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Info, Loader2, ChevronDown, ChevronUp, MinusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

const DEDUCTION_TYPE_LABELS: Record<string, { sv: string; en: string; code: string }> = {
  accommodation: { sv: "Hyresavdrag", en: "Accommodation", code: "440" },
  car: { sv: "Bilkostnader", en: "Car costs", code: "470" },
  travel: { sv: "Resekostnader", en: "Travel costs", code: "480" },
  immigration: { sv: "Migrationsavgifter", en: "Immigration fees", code: "490" },
  other: { sv: "Annat avdrag", en: "Other", code: "499" },
};

export function SalarySlipsView() {
  const { orgId } = useOrg();
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["payroll-slips-employees", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, employee_code, status")
        .eq("org_id", orgId!)
        .eq("status", "ACTIVE")
        .order("last_name");
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch active deductions
  const { data: deductions = [] } = useQuery({
    queryKey: ["payroll-slips-deductions", orgId],
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

  // Fetch SINK status
  const { data: sinkMap = new Map<string, boolean>() } = useQuery({
    queryKey: ["payroll-slips-sink", orgId, employees.map(e => e.id).join(",")],
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

  const deductionsByEmployee = deductions.reduce<Record<string, any[]>>((acc, d: any) => {
    if (!acc[d.employee_id]) acc[d.employee_id] = [];
    acc[d.employee_id].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Salary Slips</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Lönespecifikationer • Employee pay statements</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Salary Slip Generation</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Salary slips are generated after a payroll run is completed. Each slip includes gross salary,
            contract deductions (rent, travel, immigration fees), tax withholding, net pay, and employer social contribution details.
          </p>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
            <div>
              <h3 className="font-semibold text-sm">Employee Salary Slips</h3>
              <p className="text-[10px] text-muted-foreground">Generated from completed payroll runs • Click to see deductions</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : employees.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No active employees found. Salary slips will appear here once payroll runs are processed.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Code</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tax Method</TableHead>
                  <TableHead className="text-right">Monthly Deductions</TableHead>
                  <TableHead className="text-right">One-time Deductions</TableHead>
                  <TableHead>Latest Slip</TableHead>
                  <TableHead className="text-center">Slips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp: any) => {
                  const isSink = sinkMap instanceof Map ? sinkMap.get(emp.id) : false;
                  const empDeductions = deductionsByEmployee[emp.id] || [];
                  const monthlyTotal = empDeductions
                    .filter((d: any) => d.frequency === "monthly")
                    .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
                  const oneTimeTotal = empDeductions
                    .filter((d: any) => d.frequency === "one-time")
                    .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
                  const isExpanded = expandedEmployee === emp.id;

                  return (
                    <>
                      <TableRow
                        key={emp.id}
                        className={empDeductions.length > 0 ? "cursor-pointer hover:bg-muted/50" : ""}
                        onClick={() => empDeductions.length > 0 && setExpandedEmployee(isExpanded ? null : emp.id)}
                      >
                        <TableCell className="font-mono text-xs font-semibold">{emp.employee_code || "—"}</TableCell>
                        <TableCell className="text-sm font-medium">{emp.first_name} {emp.last_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{emp.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${isSink ? "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-900/20" : ""}`}
                          >
                            {isSink ? "SINK 25%" : "Tax Table"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {monthlyTotal > 0 ? (
                            <span className="text-destructive flex items-center justify-end gap-1">
                              -{formatCurrency(monthlyTotal, "SEK")}
                              {empDeductions.length > 0 && (isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {oneTimeTotal > 0 ? (
                            <span className="text-destructive">-{formatCurrency(oneTimeTotal, "SEK")}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">No slips yet</Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm font-mono">0</TableCell>
                      </TableRow>
                      {isExpanded && empDeductions.length > 0 && (
                        <TableRow key={`${emp.id}-deductions`} className="bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={7}>
                            <div className="py-2 space-y-1.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                                <MinusCircle className="w-3 h-3" /> Contract Deductions / Avdrag från avtal
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
