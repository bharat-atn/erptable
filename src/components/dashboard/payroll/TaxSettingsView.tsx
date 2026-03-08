import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Info, Calculator, FileText } from "lucide-react";

export function TaxSettingsView() {
  // Swedish tax tables for 2025 – Skatteverket standard
  const taxTables = [
    { id: 29, kolumn: 1, desc: "Kommun 29.00–29.99%", monthlyThreshold: "0 SEK", rate: "~29%" },
    { id: 30, kolumn: 1, desc: "Kommun 30.00–30.99%", monthlyThreshold: "0 SEK", rate: "~30%" },
    { id: 31, kolumn: 1, desc: "Kommun 31.00–31.99%", monthlyThreshold: "0 SEK", rate: "~31%" },
    { id: 32, kolumn: 1, desc: "Kommun 32.00–32.99%", monthlyThreshold: "0 SEK", rate: "~32%" },
    { id: 33, kolumn: 1, desc: "Kommun 33.00–33.99%", monthlyThreshold: "0 SEK", rate: "~33%" },
    { id: 34, kolumn: 1, desc: "Kommun 34.00–34.99%", monthlyThreshold: "0 SEK", rate: "~34%" },
    { id: 35, kolumn: 1, desc: "Kommun 35.00–35.99%", monthlyThreshold: "0 SEK", rate: "~35%" },
  ];

  const specialRules = [
    { rule: "SINK-skatt", desc: "Special income tax for non-residents", rate: "25%", applies: "Foreign workers < 6 months" },
    { rule: "A-skatt (Normal)", desc: "Preliminary tax from tax table (skattetabell)", rate: "Table-based", applies: "Permanent employees" },
    { rule: "F-skatt", desc: "Self-employed tax — employer does not withhold", rate: "0% (self-paid)", applies: "Contractors with F-skattsedel" },
    { rule: "Jämkning", desc: "Adjusted tax — reduced preliminary tax by Skatteverket decision", rate: "Variable", applies: "On individual request" },
    { rule: "Statlig inkomstskatt", desc: "State income tax on high earnings", rate: "20%", applies: "Income > 598 500 SEK/year (2025)" },
  ];

  const employerContributions = [
    { label: "Ålderspensionsavgift", en: "Pension contribution", rate: 10.21 },
    { label: "Efterlevandepensionsavgift", en: "Survivors' pension", rate: 0.60 },
    { label: "Sjukförsäkringsavgift", en: "Sickness insurance", rate: 3.55 },
    { label: "Arbetsskadeavgift", en: "Work injury insurance", rate: 0.20 },
    { label: "Föräldraförsäkringsavgift", en: "Parental insurance", rate: 2.60 },
    { label: "Arbetsmarknadsavgift", en: "Labour market", rate: 2.64 },
    { label: "Allmän löneavgift", en: "General payroll tax", rate: 11.62 },
  ];

  const ageReductions = [
    { age: "< 18 years", rate: "10.21%", note: "Only pension contribution" },
    { age: "18–65 years", rate: "31.42%", note: "Full employer contribution" },
    { age: "66+ years (born 1959 or later)", rate: "10.21%", note: "Reduced — only pension" },
  ];

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tax Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Skatteinställningar • Swedish tax tables and rules</p>
      </div>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Tax Year 2025</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tax tables are based on Skatteverket's published rates for income year 2025.
            Employer social contributions (arbetsgivaravgifter) follow the 2025–2027 collective agreement period.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax tables */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10"><Calculator className="w-4 h-4 text-primary" /></div>
              <div>
                <h3 className="font-semibold text-sm">Tax Tables (Skattetabeller)</h3>
                <p className="text-[10px] text-muted-foreground">Kolumn 1 — standard monthly income</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Table</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Approx. Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxTables.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs font-semibold">{t.id}</TableCell>
                    <TableCell className="text-sm">{t.desc}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{t.rate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Special tax rules */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30"><FileText className="w-4 h-4 text-amber-600" /></div>
              <div>
                <h3 className="font-semibold text-sm">Tax Types & Special Rules</h3>
                <p className="text-[10px] text-muted-foreground">SINK, A-skatt, F-skatt, Jämkning</p>
              </div>
            </div>
            <div className="space-y-2">
              {specialRules.map((r) => (
                <div key={r.rule} className="flex items-start justify-between py-2.5 border-b border-border/40 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.rule}</span>
                      <Badge variant="outline" className="text-[9px]">{r.rate}</Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{r.desc}</span>
                    <div className="text-[10px] text-primary/70 mt-0.5">Applies to: {r.applies}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employer contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10"><TrendingUp className="w-4 h-4 text-primary" /></div>
              <div>
                <h3 className="font-semibold text-sm">Employer Social Contributions</h3>
                <p className="text-[10px] text-muted-foreground">Arbetsgivaravgifter 2025</p>
              </div>
            </div>
            <div className="space-y-2">
              {employerContributions.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div>
                    <span className="text-sm">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">({item.en})</span>
                  </div>
                  <span className="text-sm font-mono font-semibold">{item.rate.toFixed(2)}%</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 bg-primary/5 rounded-lg px-3 mt-2">
                <span className="font-semibold text-sm text-primary">Total Arbetsgivaravgift</span>
                <span className="font-bold text-lg text-primary">31.42%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age-based reductions */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
              <div>
                <h3 className="font-semibold text-sm">Age-Based Contribution Reductions</h3>
                <p className="text-[10px] text-muted-foreground">Nedsättning av arbetsgivaravgifter</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Age Group</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ageReductions.map((r) => (
                  <TableRow key={r.age}>
                    <TableCell className="text-sm font-medium">{r.age}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{r.rate}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
