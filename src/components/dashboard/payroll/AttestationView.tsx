import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, Clock, AlertCircle, ArrowRight, Shield,
  Users, FileText, Loader2, Info, Play, XCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

type AttestStep = "calculation" | "review" | "approval";

const STEPS: { step: AttestStep; label: string; labelSv: string; desc: string }[] = [
  { step: "calculation", label: "Calculation", labelSv: "Beräkning", desc: "Salary calculated based on events, absences, and time reporting" },
  { step: "review", label: "Review", labelSv: "Granskning", desc: "Manager reviews and verifies all salary items per employee" },
  { step: "approval", label: "Approval", labelSv: "Attestering", desc: "Final approval before payment is processed" },
];

export function AttestationView() {
  const { orgId } = useOrg();
  const [activeStep, setActiveStep] = useState<AttestStep>("calculation");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["attest-employees", orgId],
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

  const currentMonth = new Date().toLocaleString("sv-SE", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attestation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Attestflöde • 3-step payroll approval workflow</p>
      </div>

      {/* 3-step progress indicator */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Payroll Workflow — {currentMonth}</span>
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="w-3 h-3 mr-1" /> Step 1 of 3
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isActive = s.step === activeStep;
            const isPast = STEPS.findIndex(x => x.step === activeStep) > i;
            return (
              <div key={s.step} className="flex-1 flex items-center gap-2">
                <button
                  onClick={() => setActiveStep(s.step)}
                  className={`flex-1 rounded-lg p-3 border transition-all text-left ${
                    isActive
                      ? "border-primary bg-primary/10"
                      : isPast
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10"
                        : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPast ? "bg-emerald-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className="text-xs font-semibold">{s.labelSv}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </button>
                {i < STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      <Tabs value={activeStep} onValueChange={(v) => setActiveStep(v as AttestStep)}>
        <TabsList>
          <TabsTrigger value="calculation">1. Beräkning</TabsTrigger>
          <TabsTrigger value="review">2. Granskning</TabsTrigger>
          <TabsTrigger value="approval">3. Attestering</TabsTrigger>
        </TabsList>

        {/* Step 1: Calculation */}
        <TabsContent value="calculation" className="space-y-4 mt-4">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10"><Play className="w-4 h-4 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-sm">Salary Calculation — Löneberäkning</h3>
                    <p className="text-[10px] text-muted-foreground">Auto-calculated from events, absence, and time data</p>
                  </div>
                </div>
                <Button size="sm" disabled={employees.length === 0}>
                  <Play className="w-3.5 h-3.5 mr-1" /> Calculate All
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">How it works:</span> The system aggregates all salary events
                  (lönearter), registered absences (frånvaro), time reports, and benefits for each employee. Tax is calculated
                  based on the assigned tax table or SINK rate. Employer contributions (31.42%) are applied automatically.
                </p>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : employees.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">No active employees found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Code</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead className="text-right">Employer Cost</TableHead>
                      <TableHead>Calc. Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp: any) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono text-xs font-semibold">{emp.employee_code || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{emp.first_name} {emp.last_name}</span>
                            <span className="text-[10px] text-muted-foreground">{emp.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(0, "SEK")}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(0, "SEK")}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-rose-600">{formatCurrency(0, "SEK")}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(0, "SEK")}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(0, "SEK")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                            <Clock className="w-3 h-3 mr-0.5" /> Not calculated
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Review */}
        <TabsContent value="review" className="space-y-4 mt-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Review Required — Granskning krävs</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review each employee's salary breakdown before sending to final approval.
                Check for discrepancies in hours, absences, supplements, and deductions.
              </p>
            </div>
          </div>
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Salary Review — Lönegranskning</h3>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-rose-600">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Return to Calc
                  </Button>
                  <Button size="sm">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve All
                  </Button>
                </div>
              </div>
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No calculations to review yet</p>
                <p className="text-xs text-muted-foreground mt-1">Complete Step 1 (Calculation) first</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Approval */}
        <TabsContent value="approval" className="space-y-4 mt-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Final Approval — Slutattest</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Once approved, salaries move to the payment queue. Generate reports: lönebesked, AGI,
                SIE file, Fora report, utbetalningslista, and semesterskuld.
              </p>
            </div>
          </div>
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Final Attestation — Slutattest</h3>
                <Button size="sm" disabled>
                  <Shield className="w-3.5 h-3.5 mr-1" /> Attest & Generate Reports
                </Button>
              </div>
              <div className="text-center py-12">
                <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No salaries pending approval</p>
                <p className="text-xs text-muted-foreground mt-1">Complete Steps 1 & 2 first</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}