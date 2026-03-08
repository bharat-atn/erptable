import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function EmployeeHubPayslipsView() {
  return (
    <div className="space-y-4 px-1 pt-3 pb-8 max-w-lg mx-auto">
      <h1 className="text-xl font-bold px-2">My Payslips — Lönespecifikationer</h1>
      <p className="text-xs text-muted-foreground px-2">View and download your monthly salary slips</p>

      <Card className="border-border/60 mx-2">
        <CardContent className="pt-6 pb-6">
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No payslips available yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your salary slips will appear here after payroll is processed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info about payslip contents */}
      <Card className="border-border/60 mx-2">
        <CardContent className="pt-5 pb-4 space-y-3">
          <h3 className="font-semibold text-sm">What's included in your payslip</h3>
          <div className="space-y-2">
            {[
              { label: "Gross Salary", desc: "Bruttolön — Total earnings before deductions" },
              { label: "Tax Deduction", desc: "Skatteavdrag — Preliminary income tax withheld" },
              { label: "Net Salary", desc: "Nettolön — Amount paid to your bank account" },
              { label: "Employer Contributions", desc: "Arbetsgivaravgifter — Social fees (31.42%)" },
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
