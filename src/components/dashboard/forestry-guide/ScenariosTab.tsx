import { useState } from "react";
import {
  Building2,
  MapPin,
  DollarSign,
  Users,
  Hash,
  Settings,
  FolderKanban,
  Box,
  Calendar,
  UserPlus,
  Wallet,
  BarChart3,
  CheckSquare,
  ClipboardList,
  Activity,
  FileText,
  BookOpen,
  Star,
  ArrowDown,
  Shield,
  Target,
  Lock,
  TrendingUp,
  Database,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  TreePine,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ─── Arrow Connector ─────────────────────────────────────────── */

function ArrowConnector({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {label && <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>}
      <ArrowDown className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

/* ─── Phase Card ──────────────────────────────────────────────── */

interface PhaseCard {
  icon: React.ElementType;
  title: string;
  desc: string;
  note?: string;
}

function PhaseGrid({ title, badge, cards, cols = 2 }: { title: string; badge: string; cards: PhaseCard[]; cols?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{badge}</Badge>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-foreground">{card.title}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{card.desc}</p>
                  {card.note && <p className="text-[10px] text-primary/70 mt-1 italic">{card.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Star Rating Display ─────────────────────────────────────── */

function StarRating({ count, size = "sm" }: { count: number; size?: "sm" | "md" }) {
  const s = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className={`${s} fill-amber-400 text-amber-400`} />
      ))}
    </span>
  );
}

/* ─── Star Avatar ─────────────────────────────────────────────── */

function StarAvatar({ name, stars }: { name: string; stars: number }) {
  const colors: Record<number, string> = {
    5: "bg-amber-500",
    4: "bg-blue-500",
    3: "bg-sky-500",
    2: "bg-orange-700",
    1: "bg-stone-500",
  };
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return (
    <div className={`w-10 h-10 rounded-full ${colors[stars] || "bg-muted"} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initials}
    </div>
  );
}

/* ─── Stat Mini Card ──────────────────────────────────────────── */

function StatMini({ label, value, color }: { label: string; value: string; color?: "primary" | "success" | "destructive" | "warning" | "default" }) {
  const textColors: Record<string, string> = {
    primary: "text-primary",
    success: "text-success",
    destructive: "text-destructive",
    warning: "text-warning",
    default: "text-foreground",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm font-bold ${textColors[color || "default"]}`}>{value}</p>
    </div>
  );
}

/* ─── Phase Data ──────────────────────────────────────────────── */

const foundationCards: PhaseCard[] = [
  { icon: Building2, title: "Client Register", desc: "Register all forestry clients with contact details, contract terms, and billing information." },
  { icon: MapPin, title: "Object Register", desc: "Define work parcels with GPS coordinates, area (ha), plant types, and SLA classifications." },
  { icon: DollarSign, title: "Compensation Groups", desc: "Set up hourly and piece work rate tables linked to SLA classes and star levels." },
  { icon: Users, title: "Employee Register", desc: "Shared with HR Manager — onboard forestry workers with skills, star ratings, certifications, and contact data." },
  { icon: Hash, title: "Project Numbers", desc: "Configure auto-numbering format for project and object IDs (prefix, padding, separator)." },
  { icon: Settings, title: "Project Defaults", desc: "Set default values for new projects: season year, budget templates, working hours." },
];

const planningCards: PhaseCard[] = [
  { icon: FolderKanban, title: "Create Project", desc: "Define project scope, client, type (planting/clearing/mixed), dates, and budget.", note: "Start date triggers timeline" },
  { icon: Box, title: "Add Project Objects", desc: "Link work parcels to the project. Set SLA class, quantity, and compensation type per object.", note: "Objects inherit project client" },
  { icon: Calendar, title: "Set Duration & Timing", desc: "Define start/end dates, working days, holidays. System calculates available work days.", note: "Syncs with Gantt view" },
  { icon: UserPlus, title: "Assign Team", desc: "Allocate employees to objects based on star rating, availability, and skill match.", note: "Star level affects output" },
  { icon: Wallet, title: "Financial Planning", desc: "Set budget, estimate revenue from compensation rates × expected output × days.", note: "Auto-calculates margins" },
];

const executionCards: PhaseCard[] = [
  { icon: BarChart3, title: "Gantt View", desc: "Visual timeline of all projects and objects. Drag to reschedule. Track progress vs plan." },
  { icon: CheckSquare, title: "Kanban Board", desc: "Object status workflow: Not Started → In Progress → Quality Check → Completed." },
  { icon: ClipboardList, title: "Task Management", desc: "Create and assign tasks within objects. Track completion and blockers." },
  { icon: Activity, title: "Activity Log", desc: "System-wide audit trail of all changes, assignments, and status updates." },
];

const reportingCards: PhaseCard[] = [
  { icon: Wallet, title: "Preliminary Payroll", desc: "Generate pay reports based on actual output × compensation rates. Export to payroll system." },
  { icon: BarChart3, title: "Analytics", desc: "Performance dashboards: output per employee, cost per hectare, budget variance." },
  { icon: FileText, title: "Documentation", desc: "Generate project reports, completion certificates, and financial summaries." },
];

/* ─── Distribution Options ────────────────────────────────────── */

function DistributionOptions() {
  return (
    <Card className="border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-600" />
          <CardTitle className="text-base">Team Compensation Distribution Options</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">Option 1</Badge>
              <h5 className="text-xs font-semibold text-foreground">Individual Performance-Based</h5>
            </div>
            <ul className="space-y-1.5">
              {["Each worker paid based on their own output", "Star rating determines expected daily output", "Higher performers earn proportionally more"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-success mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border-2 border-success/30 bg-success/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-success text-success-foreground text-[10px]">Option 2</Badge>
              <h5 className="text-xs font-semibold text-foreground">Equal Team Distribution</h5>
            </div>
            <ul className="space-y-1.5">
              {["Total team output divided equally among workers", "Encourages teamwork and knowledge sharing", "Simpler payroll calculation for project managers"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-success mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-md border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h5 className="text-xs font-semibold text-foreground">Project Manager Decision</h5>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              The distribution method is chosen per project object. Mixed projects can use different methods for different objects.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Best Practices ──────────────────────────────────────────── */

const bestPractices = [
  { icon: Shield, title: "Foundation First", desc: "Set up all registers (clients, objects, compensation) before creating projects." },
  { icon: Box, title: "Standardize Objects", desc: "Use consistent naming and SLA classification across all projects for reliable analytics." },
  { icon: Target, title: "Verify SLA Classes", desc: "Visit the terrain before assigning SLA classes. Misclassification affects pay and margins." },
  { icon: Star, title: "Assign Correct Stars", desc: "Star ratings should reflect actual field performance. Review ratings each season." },
  { icon: Activity, title: "Track Project Status", desc: "Move projects through status stages: Setup → Active → Quality Check → Completed." },
  { icon: CheckSquare, title: "Review Before Execution", desc: "Check budget, team, and object assignments before marking a project active." },
  { icon: BarChart3, title: "Use Gantt & Kanban", desc: "Gantt for timeline overview, Kanban for daily operational status tracking." },
  { icon: Lock, title: "Lock Completed Projects", desc: "Once all objects are verified, lock the project to prevent accidental changes." },
  { icon: TrendingUp, title: "Leverage Analytics", desc: "Compare planned vs actual output and costs. Use insights for next season's planning." },
];

function BestPracticesGrid() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Best Practices for Project Managers</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bestPractices.map((bp) => {
            const Icon = bp.icon;
            return (
              <div key={bp.title} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-foreground">{bp.title}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{bp.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Shared Database Note ────────────────────────────────────── */

function SharedDatabaseNote() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/10 p-4">
      <Database className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
      <div>
        <h5 className="text-xs font-semibold text-foreground">Shared Database</h5>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
          The Employee Register and Company Register (employer: <strong>Ljungan Skogsvård AB</strong>) are shared across the entire ERP Table platform.
          Employees onboarded through the HR Manager are available for assignment in the Forestry Project Manager — no duplicate data entry needed.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENARIO 1 — FOREST CLEARING PROJECT
   ═══════════════════════════════════════════════════════════════════ */

const s1Team = [
  { name: "Anna Lindqvist", stars: 5, role: "Team Leader", hourly: 198, total: 3792, haHour: 0.85, haDay: 6.80, totalHa: 20.40, earnings: 51000 },
  { name: "Niran Chairat", stars: 3, role: "Clearing Operator", hourly: 162, total: 3103, haHour: 0.65, haDay: 5.20, totalHa: 15.60, earnings: 39000 },
  { name: "Andrei Popescu", stars: 2, role: "Clearing Operator", hourly: 144, total: 2758, haHour: 0.55, haDay: 4.40, totalHa: 13.20, earnings: 33000 },
  { name: "Somchai Rattanakul", stars: 2, role: "Clearing Operator", hourly: 144, total: 2758, haHour: 0.55, haDay: 4.40, totalHa: 13.20, earnings: 33000 },
];

const s1Objects = [
  { id: "D330474", type: "Forest Clearing", sla: "107", compensation: "Piece Work", qty: "16.9 ha" },
  { id: "D330473", type: "Forest Clearing", sla: "107", compensation: "Piece Work", qty: "14.2 ha" },
  { id: "D330472", type: "Forest Clearing", sla: "107", compensation: "Piece Work", qty: "18.7 ha" },
];

function ScenarioOne() {
  const [distMethod, setDistMethod] = useState<"individual" | "equal">("individual");

  return (
    <div className="space-y-6">
      {/* Live data banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15 p-4">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          This scenario reflects the current state of project <strong className="text-foreground">PJ-26-0001</strong>.
          All data shown is based on actual project configuration and team assignments.
        </p>
      </div>

      {/* ── 1. Project Setup ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Project Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Project Number", value: "PJ-26-0001" },
              { label: "Client", value: "Swedish Forestry Corporation" },
              { label: "Location", value: "Värmland, Sweden" },
              { label: "Coordinates", value: "59.3293° N, 13.4877° E" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border p-3">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-xs font-semibold text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 2. Project Objects ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Project Objects (3)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {s1Objects.map((obj) => (
              <div key={obj.id} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground">{obj.id}</span>
                  <Badge variant="outline" className="text-[9px]">{obj.qty}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{obj.type}</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary text-[9px] border-0">SLA {obj.sla}</Badge>
                  <Badge className="bg-success/10 text-success text-[9px] border-0">{obj.compensation}</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
              <p className="text-lg font-bold text-primary">3</p>
              <p className="text-[10px] text-muted-foreground">Total Objects</p>
            </div>
            <div className="rounded-lg bg-success/5 border border-success/10 p-3 text-center">
              <p className="text-lg font-bold text-success">49.8</p>
              <p className="text-[10px] text-muted-foreground">Total Hectares</p>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 text-center">
              <p className="text-lg font-bold text-amber-600">Piece Work</p>
              <p className="text-[10px] text-muted-foreground">Compensation</p>
            </div>
            <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3 text-center">
              <p className="text-lg font-bold text-blue-600">Class 107</p>
              <p className="text-[10px] text-muted-foreground">SLA Difficulty</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 3. Team Assignment ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Team Assignment (4 Members)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {s1Team.map((m) => (
              <div key={m.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <StarAvatar name={m.name} stars={m.stars} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{m.name}</span>
                    {m.role === "Team Leader" && <Badge className="bg-primary/10 text-primary text-[9px] border-0">Team Leader</Badge>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <StarRating count={m.stars} />
                    <span className="text-[10px] text-muted-foreground ml-1">— {m.role}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-foreground">{m.hourly} SEK/h</p>
                  <p className="text-[10px] text-muted-foreground">{m.total.toLocaleString()} SEK total</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 4. Project Timeline ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Project Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Working Days" value="3" color="primary" />
            <StatMini label="Total Hours" value="19.2" color="default" />
            <StatMini label="Hours/Day" value="8" color="default" />
          </div>

          <div className="rounded-md bg-muted/50 border border-border p-3">
            <p className="text-[10px] text-muted-foreground">
              <strong className="text-foreground">Calculation:</strong> 49.8 ha ÷ team capacity (16.4 ha/day combined) = 3.04 working days ≈ <strong className="text-foreground">3 Working Days</strong>. 
              3 days × 6.4 h avg effective = 19.2 total hours.
            </p>
          </div>

          {/* Object Type Breakdown */}
          <div>
            <h5 className="text-xs font-semibold text-foreground mb-2">Object Type Breakdown</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 flex items-center gap-3">
                <TreePine className="w-5 h-5 text-success shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Young Forest Type 1</p>
                  <p className="text-[10px] text-muted-foreground">Primary clearing category</p>
                </div>
              </div>
              <div className="rounded-lg border border-border p-3 flex items-center gap-3">
                <TreePine className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Undergrowth Type 2</p>
                  <p className="text-[10px] text-muted-foreground">Secondary clearing category</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Project Timeline - Scenario 1 ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Project Timeline — Scenario 1</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h5 className="text-xs font-semibold text-foreground">Planning Phase</h5>
              </div>
              <p className="text-xs text-muted-foreground">Apr 1 — May 31, 2026</p>
              <p className="text-[10px] text-muted-foreground mt-1">60 days</p>
            </div>
            <div className="rounded-lg border-2 border-success/30 bg-success/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-success" />
                <h5 className="text-xs font-semibold text-foreground">Execution Phase</h5>
              </div>
              <p className="text-xs text-muted-foreground">May 15 — May 31, 2026</p>
              <p className="text-[10px] text-muted-foreground mt-1">16 days (3 working days)</p>
            </div>
          </div>

          {/* Timeline Overview Bar */}
          <div>
            <h5 className="text-xs font-semibold text-foreground mb-2">Timeline Overview</h5>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-end gap-1 h-20">
                {[
                  { month: "Feb", h: 0 },
                  { month: "Mar", h: 0 },
                  { month: "Apr", h: 40, color: "bg-primary/30" },
                  { month: "May", h: 80, color: "bg-success" },
                  { month: "Jun", h: 15, color: "bg-muted" },
                  { month: "Jul", h: 0 },
                ].map((bar) => (
                  <div key={bar.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-t ${bar.color || "bg-transparent"}`} style={{ height: `${bar.h}%`, minHeight: bar.h ? 4 : 0 }} />
                    <span className="text-[9px] text-muted-foreground">{bar.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/30" /> Planning</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-success" /> Execution</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Timeline & Planning ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Timeline & Planning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs font-semibold text-foreground">April 2026</p>
              <p className="text-[10px] text-muted-foreground">Planning Phase</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <Activity className="w-5 h-5 text-success mx-auto mb-1" />
              <p className="text-xs font-semibold text-foreground">May 15–31</p>
              <p className="text-[10px] text-muted-foreground">Execution Period</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs font-semibold text-foreground">8 hours</p>
              <p className="text-[10px] text-muted-foreground">Daily Schedule</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 7. Timeline Match Analysis ── */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15 p-4">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h5 className="text-xs font-semibold text-foreground">Timeline Match Analysis</h5>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            The team of 4 members can complete 49.8 hectares of clearing in <strong className="text-foreground">3 working days</strong>.
            This fits well within the 16-day execution window (May 15–31), allowing buffer for weather delays and quality checks.
          </p>
        </div>
      </div>

      <ArrowConnector />

      {/* ── 8. Performance & Duration Calculation ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Performance & Duration Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatMini label="Working Days" value="3" color="primary" />
            <StatMini label="Team Members" value="4" color="default" />
            <StatMini label="Clearing Days" value="3" color="success" />
            <StatMini label="Avg Team Rating" value="3.0★" color="warning" />
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 9. Team Performance Breakdown ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Team Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {s1Team.map((m) => (
              <div key={m.name} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <StarAvatar name={m.name} stars={m.stars} />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{m.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating count={m.stars} />
                      <span className="text-[10px] text-muted-foreground ml-1">{m.role}</span>
                    </div>
                  </div>
                </div>

                {/* Clearing Performance */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Clearing Performance</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center rounded bg-muted/50 p-1.5">
                      <p className="text-xs font-bold text-foreground">{m.haHour}</p>
                      <p className="text-[9px] text-muted-foreground">ha/hour</p>
                    </div>
                    <div className="text-center rounded bg-muted/50 p-1.5">
                      <p className="text-xs font-bold text-foreground">{m.haDay.toFixed(2)}</p>
                      <p className="text-[9px] text-muted-foreground">ha/day</p>
                    </div>
                    <div className="text-center rounded bg-muted/50 p-1.5">
                      <p className="text-xs font-bold text-foreground">{m.totalHa.toFixed(2)}</p>
                      <p className="text-[9px] text-muted-foreground">total ha</p>
                    </div>
                  </div>
                </div>

                {/* Compensation Breakdown */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Compensation</p>
                  <div className="rounded bg-success/5 border border-success/10 p-2 text-center">
                    <p className="text-sm font-bold text-success">{m.earnings.toLocaleString()} SEK</p>
                    <p className="text-[9px] text-muted-foreground">{m.totalHa.toFixed(2)} ha × 2,500 SEK/ha</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 10. Project Compensation Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Project Compensation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Individual Distribution */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-foreground">Individual Distribution</h5>
              {s1Team.map((m) => (
                <div key={m.name} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <StarRating count={m.stars} />
                    <span className="text-foreground font-medium">{m.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{m.earnings.toLocaleString()} SEK</span>
                </div>
              ))}
            </div>

            {/* Project Financial Overview */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-foreground">Project Financial Overview</h5>
              <div className="space-y-2">
                <div className="flex justify-between rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Total Compensation</span>
                  <span className="text-xs font-bold text-primary">156,000 SEK</span>
                </div>
                <div className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Clearing Rate</span>
                  <span className="text-xs font-bold text-foreground">2,500 SEK/hectare</span>
                </div>
                <div className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Avg per Person</span>
                  <span className="text-xs font-bold text-foreground">39,000 SEK</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 11. Key Insights ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Key Insights & Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              { text: "Team Leader Anna (5★) contributes 41% of total clearing output despite being 1 of 4 members.", highlight: "41%" },
              { text: "The average team rating of 3.0★ results in a combined daily clearing capacity of 16.4 ha/day.", highlight: "16.4 ha/day" },
              { text: "SLA Class 107 terrain requires experienced operators — star ratings directly impact productivity.", highlight: "Class 107" },
              { text: "At 2,500 SEK/hectare, the piece work rate creates clear incentive for individual performance.", highlight: "2,500 SEK" },
            ].map((insight) => (
              <li key={insight.text} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 12. Compensation Breakdown ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Compensation Breakdown — Scenario 1</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Distribution method toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDistMethod("individual")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${distMethod === "individual" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              Individual Performance
            </button>
            <button
              onClick={() => setDistMethod("equal")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${distMethod === "equal" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              Equal Distribution
            </button>
          </div>

          {/* SLA Pricing */}
          <div className="rounded-md bg-muted/50 border border-border p-3">
            <p className="text-[10px] text-muted-foreground">
              <strong className="text-foreground">SLA Class 107 Pricing Rates:</strong> 3,500 SEK/hectare (clearing). 
              Client invoicing rate. Worker compensation rate: 2,500 SEK/hectare.
            </p>
          </div>

          {/* Individual earnings cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {s1Team.map((m) => {
              const equalShare = 156000 / 4;
              const shownEarnings = distMethod === "individual" ? m.earnings : equalShare;
              return (
                <div key={m.name} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <StarAvatar name={m.name} stars={m.stars} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">{m.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRating count={m.stars} />
                        <Badge variant="outline" className="text-[9px]">{m.role}</Badge>
                      </div>
                    </div>
                  </div>
                  {distMethod === "individual" && (
                    <div className="text-[10px] text-muted-foreground">
                      Clearing Contribution: {m.totalHa.toFixed(2)} ha ({((m.totalHa / 49.8) * 100).toFixed(0)}% of total)
                    </div>
                  )}
                  {distMethod === "equal" && (
                    <div className="text-[10px] text-muted-foreground">
                      Equal share: 156,000 SEK ÷ 4 members
                    </div>
                  )}
                  <div className="rounded bg-success/5 border border-success/10 p-2 text-center">
                    <p className="text-sm font-bold text-success">{shownEarnings.toLocaleString()} SEK</p>
                    <p className="text-[9px] text-muted-foreground">Total Earnings</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector label="Final Summary" />

      {/* ── 13. Project Financial Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Project Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Total Labor Cost</p>
              <p className="text-lg font-bold text-destructive">218,400 SEK</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Gross Revenue</p>
              <p className="text-lg font-bold text-foreground">174,300 SEK</p>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Gross Profit</p>
              <p className="text-lg font-bold text-destructive">-44,100 SEK</p>
              <p className="text-[10px] text-destructive">-25.3% margin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENARIO 2 — FOREST PLANTING PROJECT
   ═══════════════════════════════════════════════════════════════════ */

const s2Team = [
  { name: "Elena Ionescu", stars: 5, role: "Team Leader", plantsHour: 200, plantsDay: 1600, totalPlants: 56_000_000, earnings: 14_000_000 },
  { name: "Niran Chairat", stars: 3, role: "Worker", plantsHour: 180, plantsDay: 1440, totalPlants: 50_400_000, earnings: 12_600_000 },
  { name: "Apinya Wongchai", stars: 3, role: "Worker", plantsHour: 180, plantsDay: 1440, totalPlants: 50_400_000, earnings: 12_600_000 },
  { name: "Ana Dumitru", stars: 4, role: "Worker", plantsHour: 190, plantsDay: 1520, totalPlants: 53_200_000, earnings: 13_300_000 },
  { name: "Yash Gandhi", stars: 1, role: "Worker", plantsHour: 160, plantsDay: 1280, totalPlants: 44_800_000, earnings: 11_200_000 },
];

const s2Objects = [
  { id: "D440580", type: "Forest Plant Type 1 (Jackpot)", sla: "107", qty: "45.2 thousand plants" },
  { id: "D440581", type: "Forest Plant Type 1 (Jackpot)", sla: "107", qty: "38.5 thousand plants" },
  { id: "D440582", type: "Forest Plant Type 2 (Powerpot)", sla: "107", qty: "52.8 thousand plants" },
  { id: "D440583", type: "Forest Plant Type 2 (Powerpot)", sla: "107", qty: "41.3 thousand plants" },
  { id: "D440584", type: "Forest Plant Type 2 (Powerpot)", sla: "107", qty: "47.6 thousand plants" },
  { id: "D440585", type: "Forest Plant Type 3 (Superpot)", sla: "107", qty: "29.4 thousand plants" },
];

const totalPlants2 = 254_800;
const totalLabor2 = 63_700_000;
const grossRevenue2 = 63_700;
const avgTeamRating2 = 3.2;

function ScenarioTwo() {
  const [distMethod, setDistMethod] = useState<"individual" | "equal">("individual");

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-background p-5 space-y-1">
        <h3 className="text-lg font-bold text-foreground">Scenario 2: Forest Planting Project</h3>
        <p className="text-sm text-muted-foreground">A piece work project with 6 forest planting objects in Dalarna Region</p>
      </div>

      {/* ── 1. Project Setup ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Hash className="w-4 h-4" /> Project Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Hash, label: "Project Number", value: "PJ-26-002" },
              { icon: Building2, label: "Client", value: "Nordic Green Solutions AB" },
              { icon: MapPin, label: "Location", value: "Dalarna Region, Sweden" },
              { icon: Target, label: "Coordinates", value: "60.6028° N, 15.6266° E" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{item.value}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 2. Project Objects (6) ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Box className="w-4 h-4" /> Project Objects (6)</CardTitle>
            <span className="text-[10px] text-muted-foreground">All objects: Piece Work</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {s2Objects.map((obj) => (
              <div key={obj.id} className="rounded-lg border border-border p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Object ID</p>
                  <p className="text-sm font-mono font-bold text-foreground">{obj.id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Type</p>
                  <p className="text-xs font-medium text-foreground">{obj.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">SLA Class</p>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] border-0">SLA Class {obj.sla}</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Compensation</p>
                  <Badge className="bg-success/10 text-success text-[10px] border-0">$ Piece Work</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Quantity</p>
                  <p className="text-xs font-semibold text-foreground">{obj.qty}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
              <p className="text-lg font-bold text-primary">6</p>
              <p className="text-[10px] text-muted-foreground">Total Objects</p>
            </div>
            <div className="rounded-lg bg-success/5 border border-success/10 p-3 text-center">
              <p className="text-lg font-bold text-success">254.8k</p>
              <p className="text-[10px] text-muted-foreground">Total Plants</p>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 text-center">
              <p className="text-lg font-bold text-amber-600">Piece Work</p>
              <p className="text-[10px] text-muted-foreground">Compensation</p>
            </div>
            <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-3 text-center">
              <p className="text-lg font-bold text-destructive">Class 107</p>
              <p className="text-[10px] text-muted-foreground">SLA Difficulty</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 3. Team Assignment ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Team Assignment (5 Members)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {s2Team.map((m) => (
              <div key={m.name} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StarAvatar name={m.name} stars={m.stars} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{m.name}</span>
                        {m.role === "Team Leader" && <Badge className="bg-primary/10 text-primary text-[9px] border-0">Team Leader</Badge>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{m.role}</span>
                    </div>
                  </div>
                  <StarRating count={m.stars} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 p-2">
                    <p className="text-[9px] text-muted-foreground">Hourly Rate</p>
                    <p className="text-xs font-bold text-blue-600">{m.stars === 5 ? 198 : m.stars === 4 ? 180 : m.stars === 3 ? 162 : m.stars === 2 ? 144 : 126} SEK</p>
                  </div>
                  <div className="rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 p-2">
                    <p className="text-[9px] text-muted-foreground">Total Earnings</p>
                    <p className="text-xs font-bold text-success">{(m.stars === 5 ? 55440 : m.stars === 4 ? 50400 : m.stars === 3 ? 45360 : m.stars === 2 ? 40320 : 35280).toLocaleString()} SEK</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 4. Project Timeline ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Project Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Working Days" value="35" color="primary" />
            <StatMini label="Total Hours" value="280.0" color="success" />
            <StatMini label="Hours per Day" value="8" color="default" />
          </div>

          <div className="rounded-md bg-muted/50 border border-border p-3">
            <p className="text-[10px] text-muted-foreground">
              <strong className="text-foreground">Calculation:</strong> Based on SLA Class 107 performance rates and team skill levels.
              Higher star ratings perform more units per hour, reducing project duration.
            </p>
          </div>

          {/* Object Type Breakdown */}
          <div>
            <h5 className="text-xs font-semibold text-foreground mb-2">Object Type Breakdown</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border-2 border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-foreground">Jackpot Plants (Type 1)</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D440580</span><span className="font-medium text-foreground">45.2k plants</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D440581</span><span className="font-medium text-foreground">38.5k plants</span></div>
                  <div className="flex justify-between text-[10px] font-bold border-t border-border pt-1 mt-1"><span className="text-foreground">Subtotal:</span><span className="text-foreground">83.7k plants</span></div>
                </div>
              </div>
              <div className="rounded-lg border-2 border-cyan-200/50 bg-cyan-50/30 dark:bg-cyan-950/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-4 h-4 text-cyan-600" />
                  <p className="text-xs font-semibold text-foreground">Powerpot Plants (Type 2)</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D440582</span><span className="font-medium text-foreground">52.8k plants</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D440583</span><span className="font-medium text-foreground">41.3k plants</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D440584</span><span className="font-medium text-foreground">47.6k plants</span></div>
                  <div className="flex justify-between text-[10px] font-bold border-t border-border pt-1 mt-1"><span className="text-foreground">Subtotal:</span><span className="text-foreground">141.7k plants</span></div>
                </div>
              </div>
              <div className="rounded-lg border-2 border-violet-200/50 bg-violet-50/30 dark:bg-violet-950/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-4 h-4 text-violet-600" />
                  <p className="text-xs font-semibold text-foreground">Superpot Plants (Type 3)</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D440585</span><span className="font-medium text-foreground">29.4k plants</span></div>
                  <div className="flex justify-between text-[10px] font-bold border-t border-border pt-1 mt-1"><span className="text-foreground">Subtotal:</span><span className="text-foreground">29.4k plants</span></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 5. Project Timeline - Scenario 2 ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Project Timeline — Scenario 2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Planning Phase */}
            <div className="rounded-lg border-2 border-blue-300/30 bg-blue-50/30 dark:bg-blue-950/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"><Calendar className="w-4 h-4 text-white" /></div>
                <div>
                  <h5 className="text-xs font-bold text-blue-600">Planning Phase</h5>
                  <p className="text-[10px] text-muted-foreground">Project preparation & setup</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded border border-border bg-card p-2"><p className="text-[10px] text-muted-foreground">Start Date</p><p className="text-xs font-semibold">May 1, 2026</p></div>
                <div className="rounded border border-border bg-card p-2"><p className="text-[10px] text-muted-foreground">Target End Date</p><p className="text-xs font-semibold">June 30, 2026</p></div>
                <div className="rounded border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-2"><p className="text-[10px] text-blue-600">Duration</p><p className="text-xs font-bold text-foreground">60 days</p></div>
              </div>
            </div>
            {/* Execution Phase */}
            <div className="rounded-lg border-2 border-emerald-300/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center"><Clock className="w-4 h-4 text-white" /></div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-600">Execution Phase</h5>
                  <p className="text-[10px] text-muted-foreground">Active work on site</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded border border-border bg-card p-2"><p className="text-[10px] text-muted-foreground">Start Date</p><p className="text-xs font-semibold">June 10, 2026</p></div>
                <div className="rounded border border-border bg-card p-2"><p className="text-[10px] text-muted-foreground">Target End Date</p><p className="text-xs font-semibold">June 30, 2026</p></div>
                <div className="rounded border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-2"><p className="text-[10px] text-emerald-600">Available Window</p><p className="text-xs font-bold text-foreground">20 days</p></div>
              </div>
            </div>
          </div>

          {/* Timeline Overview */}
          <div className="rounded-lg border border-border p-4">
            <h5 className="text-xs font-semibold text-foreground mb-1">Timeline Overview</h5>
            <p className="text-[9px] text-muted-foreground mb-3">Yearly Timeline (2 months before → 2 months after)</p>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-0 text-center mb-2">
                {["Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"].map((m) => (
                  <p key={m} className="text-[9px] text-muted-foreground font-medium border-b border-border pb-1">{m}</p>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-0 items-center h-6 mb-1">
                <div /><div />
                <div className="col-span-2 rounded-full bg-blue-400/80 text-[9px] text-white text-center py-0.5 font-medium">May 1 → Jun 30, 2026</div>
                <div /><div />
              </div>
              <div className="grid grid-cols-6 gap-0 items-center mb-2 text-[9px] text-muted-foreground">
                <div /><div /><div /><div /><div /><div />
              </div>
              <div className="grid grid-cols-6 gap-0 items-center h-6">
                <div /><div /><div />
                <div className="rounded-full bg-emerald-500/80 text-[9px] text-white text-center py-0.5 font-medium">Jun 10 → Jun 30</div>
                <div /><div />
              </div>
              <div className="grid grid-cols-6 gap-0 mt-1">
                <div /><div /><span className="text-[9px] text-muted-foreground">Planning</span><span className="text-[9px] text-muted-foreground">Execution</span><div /><div />
              </div>
            </div>
          </div>

          {/* Planning & Execution notes */}
          <div className="rounded-md bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 p-3 text-[10px] text-muted-foreground space-y-1">
            <p>🗓️ <strong className="text-foreground">Planning:</strong> Project setup and team assignment from May 1 to June 30, 2026</p>
            <p>⚡ <strong className="text-foreground">Execution:</strong> Active on-site work scheduled between June 10 and June 30, 2026</p>
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Timeline & Planning ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Project Timeline & Planning — Scenario 2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Planning Phase</p>
              <p className="text-xs text-muted-foreground">Project finalization target</p>
            </div>
            <div className="rounded-lg border-2 border-emerald-200/50 bg-emerald-50/20 p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Execution Period</p>
              <p className="text-sm font-bold text-foreground">Jun 10 — Jun 30, 2026</p>
              <p className="text-[9px] text-muted-foreground">Actual work execution window</p>
            </div>
            <div className="rounded-lg border-2 border-amber-200/50 bg-amber-50/20 p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Daily Schedule</p>
              <p className="text-sm font-bold text-amber-600">8 hours</p>
              <p className="text-[9px] text-muted-foreground">Working hours per day</p>
            </div>
          </div>

          {/* Timeline Match Analysis */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15 p-4">
            <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-semibold text-foreground">Timeline Match Analysis</h5>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Based on team performance and SLA Class 107 rates, this project requires <strong className="text-foreground">35,000 working days</strong> to complete.
                The execution window (Jun 10 — Jun 30) provides sufficient time for completion. Each team member will work 8 hours per day.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 7. Performance & Duration Calculation ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Performance & Duration Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatMini label="Working Days" value="35,000" color="primary" />
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Team Members</p>
              <p className="text-sm font-bold text-blue-600">5</p>
              <p className="text-[9px] text-muted-foreground">1 leader(s)</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Planting Days</p>
              <p className="text-sm font-bold text-success">35,000</p>
              <p className="text-[9px] text-muted-foreground">7 plants/day</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Avg Team Rating</p>
              <p className="text-sm font-bold text-amber-600">3.2<Star className="w-3 h-3 inline fill-amber-400 text-amber-400 ml-0.5" /></p>
              <p className="text-[9px] text-muted-foreground">Skill level</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 8. Team Performance Breakdown ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Team Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {s2Team.map((m) => (
              <div key={m.name} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StarAvatar name={m.name} stars={m.stars} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{m.name}</span>
                        {m.role === "Team Leader" && <Badge className="bg-primary/10 text-primary text-[9px] border-0">Team Leader</Badge>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{m.stars}-Star Rating</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">280000h</p>
                    <p className="text-[9px] text-muted-foreground">Total Hours</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Planting Performance */}
                  <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/30 p-3">
                    <p className="text-[10px] font-semibold text-foreground mb-2">🌱 Planting Performance</p>
                    <ul className="space-y-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                      <li>• {m.plantsHour} plants/hour</li>
                      <li>• {m.plantsDay.toLocaleString()} plants/day</li>
                    </ul>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2">Total: {m.totalPlants.toLocaleString()} plants</p>
                  </div>
                  {/* Compensation Breakdown */}
                  <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 p-3">
                    <p className="text-[10px] font-semibold text-foreground mb-2">$ Compensation Breakdown</p>
                    <p className="text-[10px] text-muted-foreground">• Planting: {m.totalPlants.toLocaleString()} plants × 0.25 SEK</p>
                    <p className="text-xs font-bold text-success mt-2">Total: {m.earnings.toLocaleString()} SEK</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 9. Project Compensation Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Project Compensation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Individual Compensation Distribution */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-foreground">Individual Compensation Distribution</h5>
              {s2Team.map((m) => (
                <div key={m.name} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <StarAvatar name={m.name} stars={m.stars} />
                    <span className="text-foreground font-medium">{m.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-success">{m.earnings.toLocaleString()} SEK</span>
                    <p className="text-[9px] text-muted-foreground">{m.stars}-star rate</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Project Financial Overview */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-foreground">Project Financial Overview</h5>
              <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 p-4">
                <p className="text-[10px] text-muted-foreground">Total Labor Compensation</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalLabor2.toLocaleString()} SEK</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Based on SLA Class 107 rates (Piece Work)</p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Compensation Method</span>
                  <span />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">🌱 Planting Rate:</span>
                  <span className="font-bold text-success">0.25 SEK/plant</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Average per person:</span>
                  <span className="font-bold text-success">12,740,000 SEK</span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-md bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 p-3">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> Higher-skilled workers (4-5★) earn more due to completing more units per day. This piece work model rewards productivity and experience.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 10. Key Insights & Performance Analysis ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Key Insights & Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              { text: <>• <strong>Timeline Match:</strong> The project is planned for with execution from <u>Jun 10 to Jun 30</u>. Based on team performance, completion requires <u>35000 working days</u>, which fits within the execution window.</> },
              { text: <>• <strong>Team Efficiency:</strong> The team's average skill rating is <strong className="text-success">3.2 stars</strong>, which determines their collective productivity rate. Each member contributes based on their individual skill level.</> },
              { text: <>• <strong>Performance Variation:</strong> A 5-star team member can complete up to <strong className="text-success">88% more work</strong> than a 1-star member per hour (SLA Class 107 rates). This directly impacts individual compensation and project completion speed.</> },
              { text: <>• <strong>Piece Work Compensation:</strong> Each team member earns based on actual units completed. Total project labor cost is <strong className="text-destructive">63,700,000 SEK</strong>, with individual earnings ranging from <strong className="text-destructive">11,200,000 SEK</strong> to <strong className="text-success">14,000,000 SEK</strong> based on skill level.</> },
              { text: <>• <strong>SLA Class 107 Rates:</strong> This project uses standard difficulty rates: <strong className="text-success">0.25 SEK per plant (planting)</strong>. These rates ensure fair compensation while maintaining project profitability.</> },
            ].map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 11. Compensation Breakdown ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Compensation Breakdown — Scenario 2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Distribution method toggle */}
          <div>
            <h5 className="text-xs font-semibold text-foreground mb-2">Compensation Distribution Method</h5>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDistMethod("individual")}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${distMethod === "individual" ? "bg-amber-500 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                <Users className="w-3.5 h-3.5" /> Individual Performance
              </button>
              <button
                onClick={() => setDistMethod("equal")}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${distMethod === "equal" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Equal Distribution
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {distMethod === "individual"
                ? "💡 Each worker is paid based on their actual work output (units completed × rate per unit)"
                : "💡 Total compensation divided equally among all team members regardless of individual output"
              }
            </p>
          </div>

          {/* SLA Pricing */}
          <div className="rounded-md bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 p-3">
            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-1">SLA Class 107 — Pricing Rates</p>
            <div className="rounded bg-card border border-border p-2">
              <p className="text-[9px] text-muted-foreground">Forest Planting</p>
              <p className="text-sm font-bold text-success">0.25 SEK/plant</p>
              <p className="text-[9px] text-muted-foreground">Gross rate per plant</p>
            </div>
          </div>

          {/* Individual earnings cards */}
          <div>
            <h5 className="text-xs font-semibold text-foreground mb-2">Individual Earnings</h5>
            <div className="space-y-3">
              {s2Team.map((m) => {
                const equalShare = totalLabor2 / 5;
                const shownEarnings = distMethod === "individual" ? m.earnings : equalShare;
                return (
                  <div key={m.name} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StarAvatar name={m.name} stars={m.stars} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{m.name}</span>
                            {m.role === "Team Leader" && <Badge className="bg-primary/10 text-primary text-[9px] border-0">Team Leader</Badge>}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{m.stars}-Star Rating</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-success">{shownEarnings.toLocaleString()} SEK</p>
                        <p className="text-[9px] text-muted-foreground">Total Earnings</p>
                      </div>
                    </div>

                    {distMethod === "individual" && (
                      <div className="rounded-lg bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-200/30 p-3">
                        <p className="text-[10px] font-semibold text-foreground mb-1">Planting Contribution</p>
                        <ul className="space-y-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">
                          <li>• {m.totalPlants.toLocaleString()} plants completed</li>
                          <li>• 0.25 SEK per plant</li>
                        </ul>
                        <p className="text-xs font-bold text-foreground mt-1">= {m.earnings.toLocaleString()} SEK</p>
                      </div>
                    )}
                    {distMethod === "equal" && (
                      <div className="rounded-lg bg-blue-50/30 dark:bg-blue-950/10 border border-blue-200/30 p-3">
                        <p className="text-[10px] text-muted-foreground">
                          Equal share: {totalLabor2.toLocaleString()} SEK ÷ 5 members = {equalShare.toLocaleString()} SEK
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector label="Final Summary" />

      {/* ── 12. Project Financial Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Project Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Total Labor Cost</p>
              <p className="text-lg font-bold text-destructive">{totalLabor2.toLocaleString()} SEK</p>
            </div>
            <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Gross Revenue</p>
              <p className="text-lg font-bold text-success">{grossRevenue2.toLocaleString()} SEK</p>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Gross Profit</p>
              <p className="text-lg font-bold text-destructive">{(grossRevenue2 - totalLabor2).toLocaleString()} SEK</p>
              <p className="text-[10px] text-destructive">({(((grossRevenue2 - totalLabor2) / grossRevenue2) * 100).toFixed(1)}% margin)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENARIO 3 — MIXED PROJECT
   ═══════════════════════════════════════════════════════════════════ */

const s3Team = [
  {
    name: "Anna Lindqvist", stars: 5, role: "Team Leader",
    clearHaHour: 0.85, clearHaDay: 6.80, totalHa: 55202.40,
    plantsHour: 200, plantsDay: 1600, totalPlants: 12988800,
    clearEarnings: 138006000, plantEarnings: 3247200, totalEarnings: 141253200,
  },
  {
    name: "Elena Ionescu", stars: 5, role: "Worker",
    clearHaHour: 0.85, clearHaDay: 6.80, totalHa: 55202.40,
    plantsHour: 200, plantsDay: 1600, totalPlants: 12988800,
    clearEarnings: 138006000, plantEarnings: 3247200, totalEarnings: 141253200,
  },
  {
    name: "Ana Dumitru", stars: 4, role: "Worker",
    clearHaHour: 0.75, clearHaDay: 6.00, totalHa: 48708.00,
    plantsHour: 190, plantsDay: 1520, totalPlants: 12339360,
    clearEarnings: 121770000, plantEarnings: 3084840, totalEarnings: 124854840,
  },
  {
    name: "Niran Chairat", stars: 3, role: "Worker",
    clearHaHour: 0.65, clearHaDay: 5.20, totalHa: 42213.60,
    plantsHour: 180, plantsDay: 1440, totalPlants: 11689920,
    clearEarnings: 105534000, plantEarnings: 2922480, totalEarnings: 108456480,
  },
];

const s3Objects = [
  { id: "D550690", type: "Forest Plant Type 1 (Jackpot)", sla: "107", qty: "55 thousand plants", category: "planting" },
  { id: "D550691", type: "Forest Plant Type 3 (Superpot)", sla: "107", qty: "45 thousand plants", category: "planting" },
  { id: "D550692", type: "Young Forest Clearing", sla: "107", qty: "22.5 hectares", category: "clearing" },
  { id: "D550693", type: "Forest Clearing Type 2 (Undergrowth)", sla: "107", qty: "18.3 hectares", category: "clearing" },
];

const totalLabor3 = 515817720;
const grossRevenue3 = 127000;
const avgTeamRating3 = 4.3;

function ScenarioThree() {
  const [distMethod, setDistMethod] = useState<"individual" | "equal">("individual");

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl border-2 border-violet-400/30 bg-gradient-to-br from-violet-50/60 to-white dark:from-violet-950/20 dark:to-background p-5 space-y-1">
        <h3 className="text-lg font-bold text-foreground">Scenario 3: Mixed Project</h3>
        <p className="text-sm text-muted-foreground">A piece work mixed project with 4 objects (2 Planting + 2 Clearing) in Gävleborg Region</p>
      </div>

      {/* ── 1. Project Setup ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Hash className="w-4 h-4" /> Project Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Hash, label: "Project Number", value: "PJ-26-003" },
              { icon: Building2, label: "Client", value: "Scandinavian Forest Alliance" },
              { icon: MapPin, label: "Location", value: "Gävleborg Region, Sweden" },
              { icon: Target, label: "Coordinates", value: "61.3011° N, 16.1584° E" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{item.value}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 2. Project Objects (4) ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Box className="w-4 h-4" /> Project Objects (4)</CardTitle>
            <span className="text-[10px] text-muted-foreground">Mixed: Planting + Clearing</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {s3Objects.map((obj) => (
              <div key={obj.id} className={`rounded-lg border p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 items-center ${obj.category === "planting" ? "border-emerald-200/50 bg-emerald-50/10 dark:bg-emerald-950/5" : "border-amber-200/50 bg-amber-50/10 dark:bg-amber-950/5"}`}>
                <div>
                  <p className="text-[10px] text-muted-foreground">Object ID</p>
                  <p className="text-sm font-mono font-bold text-foreground">{obj.id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Type</p>
                  <p className="text-xs font-medium text-foreground">{obj.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">SLA Class</p>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] border-0">SLA Class {obj.sla}</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Compensation</p>
                  <Badge className="bg-success/10 text-success text-[10px] border-0">$ Piece Work</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Quantity</p>
                  <p className="text-xs font-semibold text-foreground">{obj.qty}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
              <p className="text-lg font-bold text-primary">4</p>
              <p className="text-[10px] text-muted-foreground">Total Objects</p>
            </div>
            <div className="rounded-lg bg-success/5 border border-success/10 p-3 text-center">
              <p className="text-lg font-bold text-success">100.0k</p>
              <p className="text-[10px] text-muted-foreground">Total Plants</p>
            </div>
            <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-3 text-center">
              <p className="text-lg font-bold text-cyan-600">40.8</p>
              <p className="text-[10px] text-muted-foreground">Total Hectares</p>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 text-center">
              <p className="text-lg font-bold text-amber-600">Piece Work</p>
              <p className="text-[10px] text-muted-foreground">Compensation</p>
            </div>
            <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-3 text-center">
              <p className="text-lg font-bold text-destructive">Class 107</p>
              <p className="text-[10px] text-muted-foreground">SLA Difficulty</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 3. Team Assignment ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Team Assignment (4 Members)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {s3Team.map((m) => (
              <div key={m.name} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StarAvatar name={m.name} stars={m.stars} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{m.name}</span>
                        {m.role === "Team Leader" && <Badge className="bg-primary/10 text-primary text-[9px] border-0">Team Leader</Badge>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{m.role}</span>
                    </div>
                  </div>
                  <StarRating count={m.stars} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 p-2">
                    <p className="text-[9px] text-muted-foreground">Hourly Rate</p>
                    <p className="text-xs font-bold text-blue-600">{m.stars === 5 ? 198 : m.stars === 4 ? 180 : 162} SEK</p>
                  </div>
                  <div className="rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 p-2">
                    <p className="text-[9px] text-muted-foreground">Total Earnings</p>
                    <p className="text-xs font-bold text-success">{(m.stars === 5 ? 28320 : m.stars === 4 ? 25746 : 23171).toLocaleString()} SEK</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 4. Project Timeline ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Project Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Working Days" value="18" color="primary" />
            <StatMini label="Total Hours" value="143.0" color="success" />
            <StatMini label="Hours per Day" value="8" color="default" />
          </div>

          <div className="rounded-md bg-muted/50 border border-border p-3">
            <p className="text-[10px] text-muted-foreground">
              <strong className="text-foreground">Calculation:</strong> Based on SLA Class 107 performance rates and team skill levels.
              Higher star ratings perform more units per hour, reducing project duration.
            </p>
          </div>

          {/* Object Type Breakdown */}
          <div>
            <h5 className="text-xs font-semibold text-foreground mb-2">Object Type Breakdown</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border-2 border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px]">🌱</span>
                  <p className="text-xs font-semibold text-foreground">Planting Objects</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D550690</span><span className="font-medium text-foreground">55k plants</span></div>
                  <div className="text-[9px] text-muted-foreground ml-4">Forest Plant Type 1 (Jackpot)</div>
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D550691</span><span className="font-medium text-foreground">45k plants</span></div>
                  <div className="text-[9px] text-muted-foreground ml-4">Forest Plant Type 3 (Superpot)</div>
                  <div className="flex justify-between text-[10px] font-bold border-t border-border pt-1 mt-1"><span className="text-foreground">Subtotal:</span><span className="text-foreground">100.0k plants</span></div>
                </div>
              </div>
              <div className="rounded-lg border-2 border-cyan-200/50 bg-cyan-50/30 dark:bg-cyan-950/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-4 h-4 text-cyan-600" />
                  <span className="text-[10px]">🪓</span>
                  <p className="text-xs font-semibold text-foreground">Clearing Objects</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D550692</span><span className="font-medium text-foreground">22.5 hectares</span></div>
                  <div className="text-[9px] text-muted-foreground ml-4">Young Forest Clearing</div>
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">D550693</span><span className="font-medium text-foreground">18.3 hectares</span></div>
                  <div className="text-[9px] text-muted-foreground ml-4">Forest Clearing Type 2 (Undergrowth)</div>
                  <div className="flex justify-between text-[10px] font-bold border-t border-border pt-1 mt-1"><span className="text-foreground">Subtotal:</span><span className="text-foreground">40.8 hectares</span></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 5. Project Timeline — Scenario 3 ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Project Timeline — Scenario 3</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Planning Phase */}
            <div className="rounded-lg border-2 border-blue-300/30 bg-blue-50/30 dark:bg-blue-950/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"><Calendar className="w-4 h-4 text-white" /></div>
                <div>
                  <h5 className="text-xs font-bold text-blue-600">Planning Phase</h5>
                  <p className="text-[10px] text-muted-foreground">Project preparation & setup</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded border border-border bg-card p-2"><p className="text-[10px] text-muted-foreground">Start Date</p><p className="text-xs font-semibold">June 1, 2026</p></div>
                <div className="rounded border border-border bg-card p-2"><p className="text-[10px] text-muted-foreground">Target End Date</p><p className="text-xs font-semibold">July 31, 2026</p></div>
                <div className="rounded border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-2"><p className="text-[10px] text-blue-600">Duration</p><p className="text-xs font-bold text-foreground">60 days</p></div>
              </div>
            </div>
            {/* Execution Phase */}
            <div className="rounded-lg border-2 border-emerald-300/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center"><Clock className="w-4 h-4 text-white" /></div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-600">Execution Phase</h5>
                  <p className="text-[10px] text-muted-foreground">Active work on site</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded border border-border bg-card p-2"><p className="text-[10px] text-muted-foreground">Start Date</p><p className="text-xs font-semibold">July 5, 2026</p></div>
                <div className="rounded border border-border bg-card p-2"><p className="text-[10px] text-muted-foreground">Target End Date</p><p className="text-xs font-semibold">July 31, 2026</p></div>
                <div className="rounded border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-2"><p className="text-[10px] text-emerald-600">Available Window</p><p className="text-xs font-bold text-foreground">26 days</p></div>
              </div>
            </div>
          </div>

          {/* Timeline Overview */}
          <div className="rounded-lg border border-border p-4">
            <h5 className="text-xs font-semibold text-foreground mb-1">Timeline Overview</h5>
            <p className="text-[9px] text-muted-foreground mb-3">Yearly Timeline (2 months before → 2 months after)</p>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-0 text-center mb-2">
                {["Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026"].map((m) => (
                  <p key={m} className="text-[9px] text-muted-foreground font-medium border-b border-border pb-1">{m}</p>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0 items-center mb-2">
                <div /><div />
                <div className="col-span-2 flex items-center">
                  <span className="text-[9px] text-muted-foreground mr-2">Planning</span>
                  <div className="flex-1 rounded-full bg-blue-400/80 text-[9px] text-white text-center py-0.5 font-medium">Jun 1 → Jul 31, 2026</div>
                </div>
                <div /><div /><div />
              </div>
              <div className="grid grid-cols-7 gap-0 items-center">
                <div /><div /><div />
                <div className="flex items-center">
                  <span className="text-[9px] text-muted-foreground mr-2">Execution</span>
                  <div className="flex-1 rounded-full bg-emerald-500/80 text-[9px] text-white text-center py-0.5 font-medium">Jul 5 → Jul 31, 2026</div>
                </div>
                <div /><div /><div />
              </div>
            </div>
          </div>

          {/* Planning & Execution notes */}
          <div className="rounded-md bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 p-3 text-[10px] text-muted-foreground space-y-1">
            <p>🗓️ <strong className="text-foreground">Planning:</strong> Project setup and team assignment from June 1 to July 31, 2026</p>
            <p>⚡ <strong className="text-foreground">Execution:</strong> Active on-site work scheduled between July 5 and July 31, 2026</p>
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Timeline & Planning ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Project Timeline & Planning — Scenario 3</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Planning Phase</p>
              <p className="text-xs text-muted-foreground">Project finalization target</p>
            </div>
            <div className="rounded-lg border-2 border-emerald-200/50 bg-emerald-50/20 p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Execution Period</p>
              <p className="text-sm font-bold text-foreground">Jul 05 — Jul 31, 2026</p>
              <p className="text-[9px] text-muted-foreground">Actual work execution window</p>
            </div>
            <div className="rounded-lg border-2 border-amber-200/50 bg-amber-50/20 p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Daily Schedule</p>
              <p className="text-sm font-bold text-amber-600">8 hours</p>
              <p className="text-[9px] text-muted-foreground">Working hours per day</p>
            </div>
          </div>

          {/* Timeline Match Analysis */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15 p-4">
            <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-semibold text-foreground">Timeline Match Analysis</h5>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Based on team performance and SLA Class 107 rates, this project requires <strong className="text-foreground">16,236 working days</strong> to complete.
                The execution window (Jul 05 — Jul 31) provides sufficient time for completion. Each team member will work 8 hours per day.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 7. Performance & Duration Calculation ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Performance & Duration Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatMini label="Working Days" value="16,236" color="primary" />
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Team Members</p>
              <p className="text-sm font-bold text-blue-600">4</p>
              <p className="text-[9px] text-muted-foreground">1 leader(s)</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Clearing Days</p>
              <p className="text-sm font-bold text-success">2</p>
              <p className="text-[9px] text-muted-foreground">24.80 ha/day</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Planting Days</p>
              <p className="text-sm font-bold text-success">16,234</p>
              <p className="text-[9px] text-muted-foreground">6 plants/day</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center w-fit">
            <p className="text-[10px] text-muted-foreground mb-1">Avg Team Rating</p>
            <p className="text-sm font-bold text-amber-600">{avgTeamRating3}<Star className="w-3 h-3 inline fill-amber-400 text-amber-400 ml-0.5" /></p>
            <p className="text-[9px] text-muted-foreground">Skill level</p>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 8. Team Performance Breakdown ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Team Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {s3Team.map((m) => (
              <div key={m.name} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StarAvatar name={m.name} stars={m.stars} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{m.name}</span>
                        {m.role === "Team Leader" && <Badge className="bg-primary/10 text-primary text-[9px] border-0">Team Leader</Badge>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{m.stars}-Star Rating</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">129888h</p>
                    <p className="text-[9px] text-muted-foreground">Total Hours</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Clearing Performance */}
                  <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 p-3">
                    <p className="text-[10px] font-semibold text-foreground mb-2">🪓 Clearing Performance</p>
                    <ul className="space-y-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                      <li>• {m.clearHaHour} ha/hour</li>
                      <li>• {m.clearHaDay.toFixed(2)} ha/day</li>
                    </ul>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-2">Total: {m.totalHa.toFixed(2)} hectares</p>
                  </div>
                  {/* Planting Performance */}
                  <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/30 p-3">
                    <p className="text-[10px] font-semibold text-foreground mb-2">🌱 Planting Performance</p>
                    <ul className="space-y-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">
                      <li>• {m.plantsHour} plants/hour</li>
                      <li>• {m.plantsDay.toLocaleString()} plants/day</li>
                    </ul>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2">Total: {m.totalPlants.toLocaleString()} plants</p>
                  </div>
                </div>

                {/* Compensation Breakdown */}
                <div className="rounded-lg bg-amber-50/30 dark:bg-amber-950/5 border border-amber-200/20 p-3">
                  <p className="text-[10px] font-semibold text-foreground mb-2">$ Compensation Breakdown</p>
                  <ul className="space-y-0.5 text-[10px] text-muted-foreground">
                    <li>• Clearing: {m.totalHa.toFixed(2)} ha × 2,500 SEK</li>
                    <li>• Planting: {m.totalPlants.toLocaleString()} plants × 0.25 SEK</li>
                    <li>• Clearing: {m.totalHa.toFixed(2)} ha × 2,500 SEK = {m.clearEarnings.toLocaleString()} SEK</li>
                    <li>• Planting: {m.totalPlants.toLocaleString()} plants × 0.25 SEK = {m.plantEarnings.toLocaleString()} SEK</li>
                  </ul>
                  <p className="text-sm font-bold text-success mt-2">Total: {m.totalEarnings.toLocaleString()} SEK</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 9. Project Compensation Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Project Compensation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Individual Compensation Distribution */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-foreground">Individual Compensation Distribution</h5>
              {s3Team.map((m) => (
                <div key={m.name} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <StarAvatar name={m.name} stars={m.stars} />
                    <span className="text-foreground font-medium">{m.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-success">{m.totalEarnings.toLocaleString()} SEK</span>
                    <p className="text-[9px] text-muted-foreground">{m.stars}-star rate</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Project Financial Overview */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-foreground">Project Financial Overview</h5>
              <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 p-4">
                <p className="text-[10px] text-muted-foreground">Total Labor Compensation</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalLabor3.toLocaleString()} SEK</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Based on SLA Class 107 rates (Piece Work)</p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Compensation Method</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">🪓 Clearing Rate:</span>
                  <span className="font-bold text-success">2,500 SEK/hectare</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">🌱 Planting Rate:</span>
                  <span className="font-bold text-success">0.25 SEK/plant</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Average per person:</span>
                  <span className="font-bold text-success">128,954,430 SEK</span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-md bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 p-3">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> Higher-skilled workers (4-5★) earn more due to completing more units per day. This piece work model rewards productivity and experience.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 10. Key Insights & Performance Analysis ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Key Insights & Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              { text: <>• <strong>Timeline Match:</strong> The project is planned for with execution from <u>Jul 05 to Jul 31</u>. Based on team performance, completion requires <u>16236 working days</u>, which fits within the execution window.</> },
              { text: <>• <strong>Team Efficiency:</strong> The team's average skill rating is <strong className="text-success">{avgTeamRating3} stars</strong>, which determines their collective productivity rate. Each member contributes based on their individual skill level.</> },
              { text: <>• <strong>Performance Variation:</strong> A 5-star team member can complete up to <strong className="text-success">88% more work</strong> than a 1-star member per hour (SLA Class 107 rates). This directly impacts individual compensation and project completion speed.</> },
              { text: <>• <strong>Piece Work Compensation:</strong> Each team member earns based on actual units completed. Total project labor cost is <strong className="text-destructive">{totalLabor3.toLocaleString()} SEK</strong>, with individual earnings ranging from <strong className="text-destructive">108,456,480 SEK</strong> to <strong className="text-success">141,253,200 SEK</strong> based on skill level.</> },
              { text: <>• <strong>SLA Class 107 Rates:</strong> This project uses standard difficulty rates: <strong className="text-success">2,500 SEK per hectare (clearing)</strong><strong className="text-success">0.25 SEK per plant (planting)</strong><strong className="text-success">2,500 SEK/ha (clearing)</strong> and <strong className="text-success">0.25 SEK/plant (planting)</strong>. These rates ensure fair compensation while maintaining project profitability.</> },
            ].map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ArrowConnector />

      {/* ── 11. Compensation Breakdown ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Compensation Breakdown — Scenario 3</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Distribution method toggle */}
          <div>
            <h5 className="text-xs font-semibold text-foreground mb-2">Compensation Distribution Method</h5>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDistMethod("individual")}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${distMethod === "individual" ? "bg-amber-500 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                <Users className="w-3.5 h-3.5" /> Individual Performance
              </button>
              <button
                onClick={() => setDistMethod("equal")}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${distMethod === "equal" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Equal Distribution
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {distMethod === "individual"
                ? "💡 Each worker is paid based on their actual work output (units completed × rate per unit)"
                : "💡 Total compensation divided equally among all team members regardless of individual output"
              }
            </p>
          </div>

          {/* SLA Pricing */}
          <div className="rounded-md bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 p-3">
            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-2">SLA Class 107 — Pricing Rates</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-card border border-border p-2">
                <p className="text-[9px] text-muted-foreground">Forest Clearing</p>
                <p className="text-sm font-bold text-success">2,500 SEK/hectare</p>
                <p className="text-[9px] text-muted-foreground">Gross rate per hectare</p>
              </div>
              <div className="rounded bg-card border border-border p-2">
                <p className="text-[9px] text-muted-foreground">Forest Planting</p>
                <p className="text-sm font-bold text-success">0.25 SEK/plant</p>
                <p className="text-[9px] text-muted-foreground">Gross rate per plant</p>
              </div>
            </div>
          </div>

          {/* Individual earnings cards */}
          <div>
            <h5 className="text-xs font-semibold text-foreground mb-2">Individual Earnings</h5>
            <div className="space-y-3">
              {s3Team.map((m) => {
                const equalShare = totalLabor3 / 4;
                const shownEarnings = distMethod === "individual" ? m.totalEarnings : equalShare;
                return (
                  <div key={m.name} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StarAvatar name={m.name} stars={m.stars} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{m.name}</span>
                            {m.role === "Team Leader" && <Badge className="bg-primary/10 text-primary text-[9px] border-0">Team Leader</Badge>}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{m.stars}-Star Rating</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-success">{shownEarnings.toLocaleString()} SEK</p>
                        <p className="text-[9px] text-muted-foreground">Total Earnings</p>
                      </div>
                    </div>

                    {distMethod === "individual" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-lg bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/30 p-3">
                          <p className="text-[10px] font-semibold text-foreground mb-1">Clearing Contribution</p>
                          <ul className="space-y-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                            <li>• {m.totalHa.toFixed(2)} hectares completed</li>
                            <li>• 2,500 SEK per hectare</li>
                          </ul>
                          <p className="text-xs font-bold text-foreground mt-1">= {m.clearEarnings.toLocaleString()} SEK</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-200/30 p-3">
                          <p className="text-[10px] font-semibold text-foreground mb-1">Planting Contribution</p>
                          <ul className="space-y-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">
                            <li>• {m.totalPlants.toLocaleString()} plants completed</li>
                            <li>• 0.25 SEK per plant</li>
                          </ul>
                          <p className="text-xs font-bold text-foreground mt-1">= {m.plantEarnings.toLocaleString()} SEK</p>
                        </div>
                      </div>
                    )}
                    {distMethod === "equal" && (
                      <div className="rounded-lg bg-blue-50/30 dark:bg-blue-950/10 border border-blue-200/30 p-3">
                        <p className="text-[10px] text-muted-foreground">
                          Equal share: {totalLabor3.toLocaleString()} SEK ÷ 4 members = {equalShare.toLocaleString()} SEK
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <ArrowConnector label="Final Summary" />

      {/* ── 12. Project Financial Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Project Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Total Labor Cost</p>
              <p className="text-lg font-bold text-destructive">{totalLabor3.toLocaleString()} SEK</p>
            </div>
            <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Gross Revenue</p>
              <p className="text-lg font-bold text-success">{grossRevenue3.toLocaleString()} SEK</p>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Gross Profit</p>
              <p className="text-lg font-bold text-destructive">{(grossRevenue3 - totalLabor3).toLocaleString()} SEK</p>
              <p className="text-[10px] text-destructive">({(((grossRevenue3 - totalLabor3) / grossRevenue3) * 100).toFixed(1)}% margin)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export function ScenariosTab() {
  const [activeScenario, setActiveScenario] = useState(1);

  return (
    <div className="space-y-6">
      <SharedDatabaseNote />

      {/* Phase grids */}
      <PhaseGrid title="Foundation Setup" badge="Phase 1" cards={foundationCards} />
      <PhaseGrid title="Project Planning" badge="Phase 2" cards={planningCards} />
      <PhaseGrid title="Execution & Monitoring" badge="Phase 3" cards={executionCards} />
      <PhaseGrid title="Compensation & Reporting" badge="Phase 4" cards={reportingCards} cols={3} />

      {/* ─── Scenario Section ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Real-World Scenarios</h3>
        </div>

        {/* Scenario selector */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: "Forest Clearing Project" },
            { num: 2, label: "Forest Planting Project" },
            { num: 3, label: "Mixed Project" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveScenario(s.num)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${activeScenario === s.num ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              Scenario {s.num}: {s.label}
            </button>
          ))}
        </div>

        {/* Scenario content */}
        {activeScenario === 1 && <ScenarioOne />}
        {activeScenario === 2 && <ScenarioTwo />}
        {activeScenario === 3 && <ScenarioThree />}
      </div>

      <DistributionOptions />
      <BestPracticesGrid />
    </div>
  );
}
