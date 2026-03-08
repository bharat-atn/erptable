import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Download, Printer, Info, Calendar,
  FileSpreadsheet, Building2, Users, Shield, CheckCircle2
} from "lucide-react";

export function PayrollReportsView() {
  const currentYear = new Date().getFullYear();
  const [selectedPeriod, setSelectedPeriod] = useState(`${currentYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);

  const reportPackage = [
    { id: "lonebesked", name: "Lönebesked", en: "Pay slip", desc: "Individual salary specification per employee", format: "PDF", frequency: "Monthly" },
    { id: "utbetalningslista", name: "Utbetalningslista", en: "Payment list", desc: "Summary of all payments for the period", format: "PDF/CSV", frequency: "Monthly" },
    { id: "agi", name: "AGI (XML)", en: "Employer declaration", desc: "Monthly employer declaration to Skatteverket", format: "XML", frequency: "Monthly" },
    { id: "sie4", name: "SIE 4", en: "Accounting file", desc: "Standard bookkeeping import file for accounting systems", format: "SIE", frequency: "Monthly" },
    { id: "fora", name: "Fora / Collectum", en: "Pension report", desc: "Report to pension and insurance providers (ITP/SAF-LO)", format: "CSV/XML", frequency: "Monthly" },
    { id: "semesterskuld", name: "Semesterskuld", en: "Holiday liability", desc: "Outstanding vacation pay liability per employee", format: "PDF/CSV", frequency: "Monthly/Yearly" },
    { id: "lonelista", name: "Lönelista", en: "Salary register", desc: "Complete salary register with all components", format: "PDF/CSV", frequency: "Monthly" },
    { id: "arbetsgivaravgift", name: "Arbetsgivaravgifter", en: "Social contributions", desc: "Detailed employer social fee breakdown", format: "PDF", frequency: "Monthly" },
  ];

  const annualReports = [
    { id: "ku10", name: "Kontrolluppgift KU10", en: "Income statement", desc: "Annual income statement per employee to Skatteverket", deadline: "Jan 31", format: "XML" },
    { id: "ku13", name: "Kontrolluppgift KU13", en: "SINK income statement", desc: "For non-resident employees taxed under SINK", deadline: "Jan 31", format: "XML" },
    { id: "ku14", name: "Kontrolluppgift KU14", en: "Artists & athletes", desc: "For foreign artists and athletes", deadline: "Jan 31", format: "XML" },
    { id: "sku", name: "Sammandrag KU", en: "KU summary", desc: "Summary of all issued KU forms", deadline: "Jan 31", format: "XML" },
    { id: "aga-year", name: "ÅGA Årsavstämning", en: "Annual reconciliation", desc: "Annual reconciliation of employer contributions", deadline: "Feb 28", format: "PDF" },
    { id: "arsredovisning", name: "Löneårsredovisning", en: "Annual payroll report", desc: "Complete annual payroll summary for accounting", deadline: "Mar 31", format: "PDF/SIE" },
  ];

  const statisticsReports = [
    { id: "franvaro", name: "Frånvarostatistik", en: "Absence statistics", desc: "Sick leave, vacation, and other absences per employee" },
    { id: "overtime", name: "Övertidsrapport", en: "Overtime report", desc: "Overtime hours and cost per employee and project" },
    { id: "headcount", name: "Personalstatistik", en: "Headcount statistics", desc: "Employee count, FTE, average salary, and demographics" },
    { id: "cost-center", name: "Kostnadsställerapport", en: "Cost center report", desc: "Salary costs broken down by cost center / project" },
    { id: "budget-vs-actual", name: "Budget vs utfall", en: "Budget vs actual", desc: "Comparison of budgeted vs actual payroll costs" },
  ];

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Rapporter • Payroll reports, exports, and declarations</p>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const m = i + 1;
              const period = `${currentYear}-${String(m).padStart(2, "0")}`;
              const label = new Date(currentYear, i).toLocaleString("sv-SE", { month: "long", year: "numeric" });
              return <SelectItem key={period} value={period}>{label}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="font-mono text-xs">{selectedPeriod}</Badge>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Reports</TabsTrigger>
          <TabsTrigger value="annual">Annual Reports</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4 mt-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Report Package — Rapportpaket</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                After a payroll run is attested, these reports become available for download.
                Configure which reports are included in your default package under Settings.
              </p>
            </div>
          </div>
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-sm">Monthly Report Package</h3>
                    <p className="text-[10px] text-muted-foreground">{reportPackage.length} reports available</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled>
                  <Download className="w-3.5 h-3.5 mr-1" /> Download All
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportPackage.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{r.name}</span>
                          <span className="text-[10px] text-muted-foreground">{r.en}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[250px]">{r.desc}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.format}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          No data yet
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 px-2" disabled>
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" disabled>
                            <Printer className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annual" className="space-y-4 mt-4">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Calendar className="w-4 h-4 text-amber-600" /></div>
                <div>
                  <h3 className="font-semibold text-sm">Annual Reports & Declarations — {currentYear}</h3>
                  <p className="text-[10px] text-muted-foreground">Mandatory annual reporting to Skatteverket and pension providers</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {annualReports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{r.name}</span>
                          <span className="text-[10px] text-muted-foreground">{r.en}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[250px]">{r.desc}</TableCell>
                      <TableCell className="font-mono text-xs">{r.deadline}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.format}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Not generated</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-7 px-2" disabled>
                          <Download className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4 mt-4">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30"><FileSpreadsheet className="w-4 h-4 text-purple-600" /></div>
                <div>
                  <h3 className="font-semibold text-sm">Statistics & Analysis</h3>
                  <p className="text-[10px] text-muted-foreground">HR and payroll analytics</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {statisticsReports.map((r) => (
                  <div key={r.id} className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                    <h4 className="text-sm font-semibold">{r.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.en}</p>
                    <p className="text-xs text-muted-foreground mt-2">{r.desc}</p>
                    <Button size="sm" variant="outline" className="mt-3 h-7" disabled>
                      <FileSpreadsheet className="w-3 h-3 mr-1" /> Generate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}