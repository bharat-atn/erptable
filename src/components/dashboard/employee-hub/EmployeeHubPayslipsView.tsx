import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function EmployeeHubPayslipsView() {
  return (
    <div className="space-y-4 px-2 pt-2 pb-24 max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-5 text-white shadow-xl mb-6">
        <h1 className="text-2xl font-bold">My Payslips</h1>
        <p className="text-sm text-white/80">Lönespecifikationer</p>
      </div>

      <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-8 text-center shadow-sm">
        <FileText className="w-12 h-12 text-emerald-600/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">No payslips available yet</p>
        <p className="text-xs text-muted-foreground mt-2">
          Your salary slips will appear here after payroll is processed
        </p>
      </div>

      {/* Info about payslip contents */}
      <div className="bg-white dark:bg-card rounded-2xl border-2 border-emerald-600/20 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-500">What's included in your payslip</h3>
        <div className="space-y-2">
          {[
            { label: "Gross Salary", desc: "Bruttolön — Total earnings before deductions" },
            { label: "Tax Deduction", desc: "Skatteavdrag — Preliminary income tax withheld" },
            { label: "Net Salary", desc: "Nettolön — Amount paid to your bank account" },
            { label: "Employer Contributions", desc: "Arbetsgivaravgifter — Social fees (31.42%)" },
            { label: "Holiday Pay", desc: "Semesterersättning — Accrued vacation compensation" },
            { label: "Pension", desc: "Tjänstepension — Occupational pension contribution" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-600/20">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-500">{item.label}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
