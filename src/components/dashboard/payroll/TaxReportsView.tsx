import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Calendar, Download, Info, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function TaxReportsView() {
  const currentYear = new Date().getFullYear();

  const agiReports = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const isPast = month < new Date().getMonth() + 1;
    const isCurrent = month === new Date().getMonth() + 1;
    return {
      period: `${currentYear}-${String(month).padStart(2, "0")}`,
      monthName: new Date(currentYear, i).toLocaleString("sv-SE", { month: "long" }),
      deadline: `${currentYear}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, "0")}-12`,
      status: isPast ? "not_submitted" : isCurrent ? "current" : "upcoming",
      employees: 0,
      grossTotal: 0,
      taxTotal: 0,
      socialTotal: 0,
    };
  });

  const annualReports = [
    { id: "agi-annual", name: "Arbetsgivardeklaration (AGI)", desc: "Monthly employer declaration to Skatteverket", frequency: "Monthly", deadline: "12th of following month" },
    { id: "ku10", name: "Kontrolluppgift KU10", desc: "Annual income statement per employee", frequency: "Annually", deadline: "January 31" },
    { id: "ku13", name: "Kontrolluppgift KU13", desc: "Income statement for non-residents (SINK)", frequency: "Annually", deadline: "January 31" },
    { id: "ku14", name: "Kontrolluppgift KU14", desc: "Income statement for artists/athletes", frequency: "Annually", deadline: "January 31" },
    { id: "sku", name: "Sammandrag KU", desc: "Summary of all KU forms for the year", frequency: "Annually", deadline: "January 31" },
    { id: "aga", name: "Arbetsgivaravgifter (ÅGA)", desc: "Annual reconciliation of employer contributions", frequency: "Annually", deadline: "February 28" },
  ];

  const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    submitted: { label: "Submitted", color: "text-emerald-600 border-emerald-300", icon: CheckCircle2 },
    not_submitted: { label: "Not submitted", color: "text-rose-600 border-rose-300", icon: AlertCircle },
    current: { label: "Current period", color: "text-amber-600 border-amber-300", icon: Clock },
    upcoming: { label: "Upcoming", color: "text-muted-foreground border-border", icon: Calendar },
  };

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tax Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Skatterapporter • AGI declarations and annual reporting</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Reporting Requirements</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Swedish employers must submit monthly AGI declarations (Arbetsgivardeklaration) to Skatteverket
            by the 12th of the following month. Annual KU forms are due by January 31.
          </p>
        </div>
      </div>

      {/* Report types overview */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
            <div>
              <h3 className="font-semibold text-sm">Required Tax Reports</h3>
              <p className="text-[10px] text-muted-foreground">Mandatory reporting to Skatteverket</p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {annualReports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-sm">{r.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.desc}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{r.frequency}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{r.deadline}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly AGI tracker */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Calendar className="w-4 h-4 text-amber-600" /></div>
              <div>
                <h3 className="font-semibold text-sm">Monthly AGI Status — {currentYear}</h3>
                <p className="text-[10px] text-muted-foreground">Arbetsgivardeklaration per månad</p>
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Gross Total</TableHead>
                <TableHead className="text-right">Tax Withheld</TableHead>
                <TableHead className="text-right">Social Fees</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agiReports.map((r) => {
                const cfg = statusConfig[r.status];
                const StatusIcon = cfg.icon;
                return (
                  <TableRow key={r.period}>
                    <TableCell className="font-mono text-xs font-semibold">{r.period}</TableCell>
                    <TableCell className="text-sm capitalize">{r.monthName}</TableCell>
                    <TableCell className="text-xs font-mono">{r.deadline}</TableCell>
                    <TableCell className="text-right text-sm">{r.employees}</TableCell>
                    <TableCell className="text-right font-mono text-sm">0 SEK</TableCell>
                    <TableCell className="text-right font-mono text-sm">0 SEK</TableCell>
                    <TableCell className="text-right font-mono text-sm">0 SEK</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3 mr-0.5" /> {cfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
