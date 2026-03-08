import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Calendar, Clock, AlertTriangle, CheckCircle2,
  Baby, Thermometer, Umbrella, Info, Users, Loader2
} from "lucide-react";

type AbsenceType = "sick" | "vacation" | "parental" | "vab" | "leave_of_absence" | "comp_time";

const ABSENCE_TYPES: { value: AbsenceType; label: string; labelSv: string; icon: typeof Thermometer; color: string }[] = [
  { value: "sick", label: "Sick Leave", labelSv: "Sjukfrånvaro", icon: Thermometer, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30" },
  { value: "vacation", label: "Vacation", labelSv: "Semester", icon: Umbrella, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  { value: "parental", label: "Parental Leave", labelSv: "Föräldraledighet", icon: Baby, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
  { value: "vab", label: "VAB (Child sick)", labelSv: "VAB", icon: Baby, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  { value: "leave_of_absence", label: "Leave of Absence", labelSv: "Tjänstledighet", icon: Calendar, color: "text-slate-600 bg-slate-100 dark:bg-slate-900/30" },
  { value: "comp_time", label: "Comp Time", labelSv: "Komptid", icon: Clock, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
];

interface AbsenceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  days: number;
  extent: number; // percentage 25/50/75/100
  status: "registered" | "approved" | "rejected" | "ongoing";
  sickPayRule: string;
  note: string;
}

// Demo data for illustration
const demoAbsences: AbsenceRecord[] = [];

export function AbsenceView() {
  const { orgId } = useOrg();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [newType, setNewType] = useState<AbsenceType>("sick");
  const [newExtent, setNewExtent] = useState("100");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["absence-employees", orgId],
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

  const sickPayRules = [
    { period: "Day 1 (Karensdag)", rate: "0% (20% deduction)", rule: "Karensavdrag = 20% of average weekly salary" },
    { period: "Day 2–14", rate: "80% of salary", rule: "Employer pays sjuklön" },
    { period: "Day 15–364", rate: "~77.6%", rule: "Försäkringskassan pays sjukpenning" },
    { period: "Day 365+", rate: "~72.7%", rule: "Extended sjukpenning / rehab" },
  ];

  const parentalRules = [
    { type: "Föräldrapenning", days: "480 days total (shared)", rate: "~77.6% (390 days) / 180 SEK (90 days)" },
    { type: "Tillfällig föräldrapenning (VAB)", days: "120 days/year", rate: "~77.6% of SGI" },
    { type: "Graviditetspenning", days: "From day 60 before due date", rate: "~77.6% of SGI" },
    { type: "Pappadagar (10 days)", days: "10 days at birth", rate: "~77.6% of SGI" },
  ];

  const currentMonth = new Date().toLocaleString("sv-SE", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Absence Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Frånvarohantering • Track and manage employee absences</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Register Absence
        </Button>
      </div>

      {/* Absence type summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ABSENCE_TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setSelectedType(selectedType === t.value ? "all" : t.value)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selectedType === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${t.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold">{t.labelSv}</div>
              <div className="text-[10px] text-muted-foreground">{t.label}</div>
              <div className="text-lg font-bold mt-1">0</div>
            </button>
          );
        })}
      </div>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current Period</TabsTrigger>
          <TabsTrigger value="rules">Swedish Rules</TabsTrigger>
          <TabsTrigger value="parental">Parental Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4 mt-4">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10"><Calendar className="w-4 h-4 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-sm">Absence Register — {currentMonth}</h3>
                    <p className="text-[10px] text-muted-foreground">All registered absences for the period</p>
                  </div>
                </div>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : demoAbsences.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No absences registered for this period</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Register Absence" to add a new entry</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Code</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                      <TableHead className="text-center">Extent</TableHead>
                      <TableHead>Pay Rule</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demoAbsences.map((a) => {
                      const typeInfo = ABSENCE_TYPES.find(t => t.value === a.type);
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs font-semibold">{a.employeeCode}</TableCell>
                          <TableCell className="text-sm">{a.employeeName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{typeInfo?.labelSv}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{a.startDate} → {a.endDate}</TableCell>
                          <TableCell className="text-center text-sm">{a.days}</TableCell>
                          <TableCell className="text-center text-xs">{a.extent}%</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.sickPayRule}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Sjuklöneregler (Sick Pay Rules)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Swedish employers are required to pay sick pay (sjuklön) for the first 14 days of sick leave.
                After that, Försäkringskassan takes over with sjukpenning.
              </p>
            </div>
          </div>
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-4">Sick Leave Payment Structure</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Compensation Rate</TableHead>
                    <TableHead>Rule / Payer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sickPayRules.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{r.period}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.rate}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.rule}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-4">Karensavdrag Calculation</h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm"><span className="font-semibold">Formula:</span> Karensavdrag = (Monthly salary × 12) / 52 / 5 × 20%</p>
                <p className="text-xs text-muted-foreground">
                  Example: 30,000 SEK/month → (30,000 × 12) / 52 / 5 × 0.20 = <span className="font-semibold text-foreground">277 SEK deduction</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Since 2019, karensavdrag replaces the old "karensdag" system. The deduction equals 20% of one week's average salary.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parental" className="space-y-4 mt-4">
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-xl p-4 flex items-start gap-3">
            <Baby className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Föräldraledighet (Parental Leave)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Swedish parents share 480 days of parental leave. 390 days at income-based rate (~77.6% of SGI, max ~1,116 SEK/day),
                90 days at flat rate (180 SEK/day). Each parent has 90 reserved days.
              </p>
            </div>
          </div>
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-4">Parental Leave Types</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Compensation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parentalRules.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{r.type}</TableCell>
                      <TableCell className="text-xs">{r.days}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.rate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Register Absence Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register Absence — Registrera frånvaro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Employee</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} ({e.employee_code || e.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Absence Type — Frånvarotyp</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as AbsenceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ABSENCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.labelSv} ({t.label})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Extent — Omfattning</Label>
              <Select value={newExtent} onValueChange={setNewExtent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newType === "sick" && (
              <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-lg p-3">
                <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Sjuklöneregler applies:</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Day 1: Karensavdrag (20% deduction). Days 2–14: Employer pays 80% sjuklön. Day 15+: Försäkringskassan.
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs">Note — Anteckning</Label>
              <Textarea placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancel</Button>
            <Button onClick={() => setRegisterOpen(false)}>Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}