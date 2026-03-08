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
  Play, CheckCircle2, Clock, AlertCircle, FileText, Users,
  Calendar, ArrowRight, Loader2, DollarSign
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

export function PayrollRunsView() {
  const { orgId } = useOrg();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));

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

  const months = [
    "Januari", "Februari", "Mars", "April", "Maj", "Juni",
    "Juli", "Augusti", "September", "Oktober", "November", "December",
  ];

  const period = `${selectedYear}-${selectedMonth.padStart(2, "0")}`;

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold">{formatCurrency(0, "SEK")}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30"><AlertCircle className="w-4 h-4 text-rose-600" /></div>
              <span className="text-xs font-medium text-muted-foreground">Employer Cost</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(0, "SEK")}</div>
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
                  <TableHead>Tax Table</TableHead>
                  <TableHead className="text-right">Gross Salary</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead className="text-right">Employer Cost</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp: any) => {
                  const grossSalary = 0;
                  const taxRate = 0.30; // Default 30% preliminary tax
                  const tax = Math.round(grossSalary * taxRate);
                  const net = grossSalary - tax;
                  const employerCost = Math.round(grossSalary * 0.3142);
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-xs font-semibold">{emp.employee_code || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{emp.first_name} {emp.last_name}</span>
                          <span className="text-[10px] text-muted-foreground">{emp.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">Table 30</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(grossSalary, "SEK")}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-rose-600">{formatCurrency(tax, "SEK")}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(net, "SEK")}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(employerCost, "SEK")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          <Clock className="w-3 h-3 mr-0.5" /> Pending
                        </Badge>
                      </TableCell>
                    </TableRow>
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
