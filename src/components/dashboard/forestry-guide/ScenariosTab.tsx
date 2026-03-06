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
            { num: 1, label: "Forest Clearing" },
            { num: 2, label: "Complex Clearing" },
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
        {activeScenario === 2 && (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Scenario 2: Complex Clearing — Coming in next iteration</p>
            </CardContent>
          </Card>
        )}
        {activeScenario === 3 && (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Scenario 3: Mixed Project — Coming in next iteration</p>
            </CardContent>
          </Card>
        )}
      </div>

      <DistributionOptions />
      <BestPracticesGrid />
    </div>
  );
}
