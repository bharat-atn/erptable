import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Info, Loader2 } from "lucide-react";

export function SalarySlipsView() {
  const { orgId } = useOrg();

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
            deductions, tax withholding, net pay, and employer social contribution details.
          </p>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
            <div>
              <h3 className="font-semibold text-sm">Employee Salary Slips</h3>
              <p className="text-[10px] text-muted-foreground">Generated from completed payroll runs</p>
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
                  <TableHead>Latest Slip</TableHead>
                  <TableHead className="text-center">Slips Generated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp: any) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-xs font-semibold">{emp.employee_code || "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{emp.first_name} {emp.last_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{emp.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">No slips yet</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm font-mono">0</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
