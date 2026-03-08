import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, DollarSign, Info } from "lucide-react";

export function SalaryTablesView() {
  // Standard Swedish salary components (Lönearter)
  const salaryComponents = [
    { code: "011", desc: "Månadslön", descEn: "Monthly salary", type: "Earning", unit: "Monthly", taxable: true, socialFees: true },
    { code: "012", desc: "Timlön", descEn: "Hourly wage", type: "Earning", unit: "Per hour", taxable: true, socialFees: true },
    { code: "013", desc: "Dagslön", descEn: "Daily wage", type: "Earning", unit: "Per day", taxable: true, socialFees: true },
    { code: "030", desc: "Ackordslön", descEn: "Piece rate", type: "Earning", unit: "Per unit", taxable: true, socialFees: true },
    { code: "031", desc: "Prestationslön", descEn: "Performance pay", type: "Earning", unit: "Variable", taxable: true, socialFees: true },
    { code: "040", desc: "Provision", descEn: "Commission", type: "Earning", unit: "Variable", taxable: true, socialFees: true },
    { code: "050", desc: "Övertidstillägg 50%", descEn: "Overtime supplement 50%", type: "Supplement", unit: "Per hour", taxable: true, socialFees: true },
    { code: "051", desc: "Övertidstillägg 100%", descEn: "Overtime supplement 100%", type: "Supplement", unit: "Per hour", taxable: true, socialFees: true },
    { code: "060", desc: "OB-tillägg", descEn: "Unsocial hours supplement", type: "Supplement", unit: "Per hour", taxable: true, socialFees: true },
    { code: "070", desc: "Beredskapsersättning", descEn: "Standby compensation", type: "Supplement", unit: "Per period", taxable: true, socialFees: true },
    { code: "080", desc: "Skifttillägg", descEn: "Shift supplement", type: "Supplement", unit: "Per hour", taxable: true, socialFees: true },
    { code: "090", desc: "Semesterlön", descEn: "Holiday pay", type: "Earning", unit: "12%", taxable: true, socialFees: true },
    { code: "091", desc: "Semesterersättning", descEn: "Holiday compensation", type: "Earning", unit: "12%", taxable: true, socialFees: true },
    { code: "100", desc: "Sjuklön dag 1 (karensdag)", descEn: "Sick pay day 1 (waiting day)", type: "Deduction", unit: "80%", taxable: true, socialFees: true },
    { code: "101", desc: "Sjuklön dag 2–14", descEn: "Sick pay days 2–14", type: "Earning", unit: "80%", taxable: true, socialFees: true },
    { code: "200", desc: "Bonus", descEn: "Bonus", type: "Earning", unit: "Variable", taxable: true, socialFees: true },
    { code: "300", desc: "Traktamente (inrikes)", descEn: "Daily allowance (domestic)", type: "Reimbursement", unit: "Per day", taxable: false, socialFees: false },
    { code: "301", desc: "Traktamente (utrikes)", descEn: "Daily allowance (foreign)", type: "Reimbursement", unit: "Per day", taxable: false, socialFees: false },
    { code: "310", desc: "Milersättning", descEn: "Mileage allowance", type: "Reimbursement", unit: "Per km", taxable: false, socialFees: false },
    { code: "320", desc: "Utlägg / Expense", descEn: "Expense reimbursement", type: "Reimbursement", unit: "Actual cost", taxable: false, socialFees: false },
    { code: "400", desc: "Skatteavdrag", descEn: "Tax deduction", type: "Deduction", unit: "Tax table", taxable: false, socialFees: false },
    { code: "410", desc: "Fackföreningsavgift", descEn: "Union fee", type: "Deduction", unit: "Per month", taxable: false, socialFees: false },
    { code: "500", desc: "Förmånsbil", descEn: "Company car benefit", type: "Benefit", unit: "Monthly value", taxable: true, socialFees: true },
    { code: "510", desc: "Fritt boende", descEn: "Free accommodation benefit", type: "Benefit", unit: "Monthly value", taxable: true, socialFees: true },
  ];

  const typeColors: Record<string, string> = {
    Earning: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Supplement: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Deduction: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    Reimbursement: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Benefit: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Salary Tables</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Lönearter • Standard Swedish payroll components</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Lönearter (Salary Components)</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Standard Swedish payroll item codes following Skatteverket and collective agreement (Skogsavtalet) conventions.
            Each code defines whether the item is taxable, subject to social fees, and how it's calculated.
          </p>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
            <div>
              <h3 className="font-semibold text-sm">Complete Salary Component Registry</h3>
              <p className="text-[10px] text-muted-foreground">{salaryComponents.length} registered components</p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-center">Taxable</TableHead>
                <TableHead className="text-center">Social Fees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryComponents.map((item) => (
                <TableRow key={item.code}>
                  <TableCell className="font-mono text-xs font-semibold">{item.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{item.desc}</span>
                      <span className="text-[10px] text-muted-foreground">{item.descEn}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${typeColors[item.type] || ""}`}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{item.unit}</TableCell>
                  <TableCell className="text-center">
                    {item.taxable ? (
                      <span className="text-emerald-600 text-xs font-semibold">Yes</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.socialFees ? (
                      <span className="text-emerald-600 text-xs font-semibold">Yes</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
