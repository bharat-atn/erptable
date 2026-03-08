import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Zap, Calendar, Info, Loader2, Users,
  ArrowUpDown, Clock, CheckCircle2
} from "lucide-react";

const EVENT_TEMPLATES = [
  { id: "new_hire", label: "Nyanställd", en: "New hire", desc: "Set up salary, tax table, benefits, and employment details" },
  { id: "salary_change", label: "Löneändring", en: "Salary change", desc: "Update monthly or hourly salary from a specific date" },
  { id: "tax_table_change", label: "Skattetabellsbyte", en: "Tax table change", desc: "Change employee's tax table or tax rate" },
  { id: "overtime", label: "Övertid", en: "Overtime", desc: "Register overtime hours (50% or 100% supplement)" },
  { id: "ob_supplement", label: "OB-tillägg", en: "Unsocial hours", desc: "Register unsocial hours supplement" },
  { id: "bonus", label: "Bonus", en: "Bonus", desc: "One-time or recurring bonus payment" },
  { id: "benefit_start", label: "Förmån start", en: "Benefit start", desc: "Start a new taxable benefit (car, housing, etc.)" },
  { id: "benefit_end", label: "Förmån slut", en: "Benefit end", desc: "End an existing taxable benefit" },
  { id: "deduction_start", label: "Avdrag start", en: "Deduction start", desc: "Start a new recurring deduction (union fee, garnishment)" },
  { id: "termination", label: "Avslut", en: "Termination", desc: "Process final salary, holiday compensation, and deregistration" },
  { id: "retroactive", label: "Retroaktiv lön", en: "Retroactive pay", desc: "Adjust salary retroactively for a previous period" },
  { id: "expense", label: "Utlägg", en: "Expense reimbursement", desc: "Reimburse employee expenses (tax-free)" },
];

export function SalaryEventsView() {
  const { orgId } = useOrg();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["events-employees", orgId],
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Salary Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Lönehändelser • Register and manage payroll events</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Event
        </Button>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Real-time Salary Impact</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every event you register is immediately reflected in the salary calculation.
            No need to wait for a payroll run — changes are visible in real-time on each employee's salary overview.
          </p>
        </div>
      </div>

      {/* Event templates grid */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10"><Zap className="w-4 h-4 text-primary" /></div>
            <div>
              <h3 className="font-semibold text-sm">Event Templates — Händelsemallar</h3>
              <p className="text-[10px] text-muted-foreground">Quick-start templates for common payroll events</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {EVENT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTemplate(t.id); setCreateOpen(true); }}
                className="text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-semibold">{t.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{t.en}</span>
                <p className="text-xs text-muted-foreground mt-1.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent events */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Clock className="w-4 h-4 text-amber-600" /></div>
            <div>
              <h3 className="font-semibold text-sm">Recent Events</h3>
              <p className="text-[10px] text-muted-foreground">Latest registered salary events</p>
            </div>
          </div>
          <div className="text-center py-12">
            <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No events registered yet</p>
            <p className="text-xs text-muted-foreground mt-1">Use the templates above to create your first event</p>
          </div>
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Salary Event — Ny lönehändelse</DialogTitle>
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
              <Label className="text-xs">Event Type — Händelsetyp</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {EVENT_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label} — {t.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Effective Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label className="text-xs">Amount (SEK)</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Salary Component — Löneart</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select löneart..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="011">011 — Månadslön</SelectItem>
                  <SelectItem value="012">012 — Timlön</SelectItem>
                  <SelectItem value="030">030 — Ackordslön</SelectItem>
                  <SelectItem value="050">050 — Övertidstillägg 50%</SelectItem>
                  <SelectItem value="051">051 — Övertidstillägg 100%</SelectItem>
                  <SelectItem value="060">060 — OB-tillägg</SelectItem>
                  <SelectItem value="090">090 — Semesterlön</SelectItem>
                  <SelectItem value="200">200 — Bonus</SelectItem>
                  <SelectItem value="300">300 — Traktamente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Note — Anteckning</Label>
              <Textarea placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => setCreateOpen(false)}>Register Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}