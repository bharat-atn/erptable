import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmployeeHubPayslipsView() {
  // Future: fetch real payslips from database
  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold">My Payslips</h1>
      <p className="text-sm text-muted-foreground">Lönespecifikationer — View and download your monthly salary slips</p>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No payslips available yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your salary slips will appear here after payroll is processed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info about payslip contents */}
      <Card className="border-border/60">
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-sm">What's included in your payslip</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Gross Salary", desc: "Bruttolön — Your total earnings before deductions" },
              { label: "Tax Deduction", desc: "Skatteavdrag — Preliminary income tax withheld" },
              { label: "Net Salary", desc: "Nettolön — Amount paid to your bank account" },
              { label: "Employer Contributions", desc: "Arbetsgivaravgifter — Social fees paid by employer (31.42%)" },
              { label: "Holiday Pay", desc: "Semesterersättning — Accrued vacation compensation" },
              { label: "Pension", desc: "Tjänstepension — Occupational pension contribution" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
