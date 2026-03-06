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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function StarRating({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
      ))}
    </span>
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

/* ─── Scenario Component ─────────────────────────────────────── */

interface ScenarioProps {
  num: number;
  title: string;
  subtitle: string;
  setup: { label: string; value: string }[];
  objects: { id: string; type: string; sla: string; qty: string }[];
  team: { name: string; star: number; role: string }[];
  calculation: string;
  result: { duration: string; totalCost: string; costColor: "destructive" | "default"; revenue: string; revenueNote: string };
}

function Scenario({ num, title, subtitle, setup, objects, team, calculation, result }: ScenarioProps) {
  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground text-[10px]">Scenario {num}</Badge>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Setup */}
        <div>
          <h5 className="text-xs font-semibold text-foreground mb-2">Project Setup</h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {setup.map((s) => (
              <div key={s.label} className="flex justify-between rounded-md bg-muted/50 px-3 py-1.5 text-[10px]">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <ArrowConnector />

        {/* Objects Table */}
        <div>
          <h5 className="text-xs font-semibold text-foreground mb-2">Project Objects</h5>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Object ID</TableHead>
                <TableHead className="text-[10px]">Type</TableHead>
                <TableHead className="text-[10px]">SLA</TableHead>
                <TableHead className="text-[10px]">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objects.map((obj) => (
                <TableRow key={obj.id}>
                  <TableCell className="text-[10px] font-mono">{obj.id}</TableCell>
                  <TableCell className="text-[10px]">{obj.type}</TableCell>
                  <TableCell className="text-[10px] font-mono">{obj.sla}</TableCell>
                  <TableCell className="text-[10px]">{obj.qty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <ArrowConnector />

        {/* Team */}
        <div>
          <h5 className="text-xs font-semibold text-foreground mb-2">Team Assignment</h5>
          <div className="space-y-1">
            {team.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-[10px] rounded-md bg-muted/50 px-3 py-1.5">
                <span className="text-foreground font-medium">{t.name}</span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <StarRating count={t.star} />
                  <span>— {t.role}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <ArrowConnector />

        {/* Calculation */}
        <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Calculation:</strong> {calculation}</p>
        </div>

        <ArrowConnector label="Expected Results" />

        {/* Results */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-border p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Duration</p>
            <p className="text-sm font-bold text-foreground">{result.duration}</p>
          </div>
          <div className="rounded-md border border-border p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Total Cost</p>
            <p className={`text-sm font-bold ${result.costColor === "destructive" ? "text-destructive" : "text-foreground"}`}>{result.totalCost}</p>
          </div>
          <div className="rounded-md border border-border p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Revenue</p>
            <p className="text-sm font-bold text-green-600">{result.revenue}</p>
            <p className="text-[9px] text-muted-foreground">{result.revenueNote}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
          {/* Option 1 */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">Option 1</Badge>
              <h5 className="text-xs font-semibold text-foreground">Individual Performance-Based</h5>
            </div>
            <ul className="space-y-1.5">
              {[
                "Each worker paid based on their own output",
                "Star rating determines expected daily output",
                "Higher performers earn proportionally more",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="rounded-md bg-muted/50 p-2 text-[10px]">
              <strong className="text-foreground">Example:</strong>{" "}
              <span className="text-muted-foreground">★3 planter: 2,100 plants/day × 0.52 kr = 1,092 kr/day. ★1 planter: 1,200 plants/day × 0.52 kr = 624 kr/day.</span>
            </div>
          </div>

          {/* Option 2 */}
          <div className="rounded-lg border-2 border-green-500/30 bg-green-50/30 dark:bg-green-950/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white text-[10px]">Option 2</Badge>
              <h5 className="text-xs font-semibold text-foreground">Equal Team Distribution</h5>
            </div>
            <ul className="space-y-1.5">
              {[
                "Total team output divided equally among workers",
                "Encourages teamwork and knowledge sharing",
                "Simpler payroll calculation for project managers",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="rounded-md bg-green-100/50 dark:bg-green-900/20 p-2 text-[10px]">
              <strong className="text-foreground">Example:</strong>{" "}
              <span className="text-muted-foreground">Team of 4 plants 7,200 total → 1,800 plants each × 0.52 kr = 936 kr/day per person.</span>
            </div>
          </div>
        </div>

        {/* PM Decision Note */}
        <div className="flex items-start gap-3 rounded-md border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h5 className="text-xs font-semibold text-foreground">Project Manager Decision</h5>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              The distribution method is chosen per project object. Mixed projects can use different methods for different objects.
              The choice affects both daily pay calculations and final payroll reports.
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

/* ─── Main Component ──────────────────────────────────────────── */

export function ScenariosTab() {
  return (
    <div className="space-y-6">
      {/* Shared DB Note */}
      <SharedDatabaseNote />

      {/* Phase 1: Foundation Setup */}
      <PhaseGrid title="Foundation Setup" badge="Phase 1" cards={foundationCards} />

      {/* Phase 2: Project Planning */}
      <PhaseGrid title="Project Planning" badge="Phase 2" cards={planningCards} />

      {/* Phase 3: Execution & Monitoring */}
      <PhaseGrid title="Execution & Monitoring" badge="Phase 3" cards={executionCards} />

      {/* Phase 4: Compensation & Reporting */}
      <PhaseGrid title="Compensation & Reporting" badge="Phase 4" cards={reportingCards} cols={3} />

      {/* Real-World Scenarios */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Real-World Scenarios</h3>
        </div>

        <Scenario
          num={1}
          title="Beginner Planting Project"
          subtitle="Simple single-client planting job with new employees"
          setup={[
            { label: "Client", value: "Sveaskog AB" },
            { label: "Type", value: "Planting" },
            { label: "Season", value: "2025" },
            { label: "Duration", value: "3 weeks" },
            { label: "Budget", value: "85,000 kr" },
            { label: "Location", value: "Ånge kommun" },
            { label: "Terrain", value: "Easy (SLA 101–104)" },
            { label: "Employer", value: "Ljungan Skogsvård AB" },
          ]}
          objects={[
            { id: "D330470", type: "Powerpot (Type 2)", sla: "104", qty: "12,000 plants" },
            { id: "D330471", type: "Täckrot (Type 5)", sla: "101", qty: "8,000 plants" },
          ]}
          team={[
            { name: "Erik Johansson", star: 2, role: "Planter" },
            { name: "Maria Andersson", star: 3, role: "Planter" },
            { name: "Ion Popescu", star: 1, role: "Planter (trainee)" },
          ]}
          calculation="Object D330470: ★2 planter → 1,800 plants/day × 0.52 kr/plant = 936 kr/day. ★3 planter → 2,100 plants/day × 0.52 = 1,092 kr/day. Object D330471: easier terrain (SLA 101), higher output."
          result={{
            duration: "15 days",
            totalCost: "72,000 kr",
            costColor: "destructive",
            revenue: "85,000 kr",
            revenueNote: "+13,000 kr margin (15%)",
          }}
        />

        <Scenario
          num={2}
          title="Complex Clearing Project"
          subtitle="Multi-object clearing job with difficult terrain and mixed SLA levels"
          setup={[
            { label: "Client", value: "Holmen Skog" },
            { label: "Type", value: "Clearing" },
            { label: "Season", value: "2025" },
            { label: "Duration", value: "6 weeks" },
            { label: "Budget", value: "320,000 kr" },
            { label: "Location", value: "Sundsvall / Timrå" },
            { label: "Terrain", value: "Hard (SLA 107–113)" },
            { label: "Employer", value: "Ljungan Skogsvård AB" },
          ]}
          objects={[
            { id: "R550100", type: "Ungskog (Type 1)", sla: "107", qty: "18 ha" },
            { id: "R550101", type: "Kraftledning (Type 3)", sla: "110", qty: "12 ha" },
            { id: "R550102", type: "Sly/Underväxt (Type 2)", sla: "113", qty: "6 ha" },
            { id: "R550103", type: "Lövröjning (Type 5)", sla: "104", qty: "22 ha" },
          ]}
          team={[
            { name: "Anders Lindberg", star: 4, role: "Clearing team lead" },
            { name: "Vasile Munteanu", star: 3, role: "Clearing operator" },
            { name: "Olof Eriksson", star: 5, role: "Senior clearing specialist" },
            { name: "Mihai Dragomir", star: 2, role: "Clearing operator" },
          ]}
          calculation="Object R550102 (SLA 113, ★3): 1.2 ha/day × 880 kr/ha = 1,056 kr/day. Object R550103 (SLA 104, ★4): 2.6 ha/day × 520 kr/ha = 1,352 kr/day. Higher SLA objects take longer but pay more per unit."
          result={{
            duration: "30 days",
            totalCost: "285,000 kr",
            costColor: "destructive",
            revenue: "320,000 kr",
            revenueNote: "+35,000 kr margin (11%)",
          }}
        />

        <Scenario
          num={3}
          title="Mixed Project (Clearing + Planting)"
          subtitle="Combined clearing and planting job with moderate terrain and mixed team"
          setup={[
            { label: "Client", value: "SCA Skog" },
            { label: "Type", value: "Mixed" },
            { label: "Season", value: "2025" },
            { label: "Duration", value: "4 weeks" },
            { label: "Budget", value: "180,000 kr" },
            { label: "Location", value: "Dalarna" },
            { label: "Terrain", value: "Medium (SLA 107)" },
            { label: "Employer", value: "Ljungan Skogsvård AB" },
          ]}
          objects={[
            { id: "D556732", type: "Undergrowth clearing (Type 2)", sla: "107", qty: "20 ha" },
            { id: "D556733", type: "Jackpot plants (Type 1)", sla: "107", qty: "30,000 plants" },
          ]}
          team={[
            { name: "Karl Svensson", star: 4, role: "Team lead (clearing + planting)" },
            { name: "Andrei Popescu", star: 3, role: "Clearing operator" },
            { name: "Somchai Rattanapong", star: 3, role: "Planter" },
            { name: "Dmytro Kovalenko", star: 2, role: "Planter" },
            { name: "Nils Bergström", star: 2, role: "Clearing operator" },
          ]}
          calculation="Phase 1 — Clearing: 20 ha ÷ ~3.6 ha/day (team avg) = ~5.6 days. Phase 2 — Planting: 30,000 plants ÷ ~5,400 plants/day (team avg) = ~5.6 days. Sequential phases with partial team overlap."
          result={{
            duration: "20 days",
            totalCost: "152,000 kr",
            costColor: "destructive",
            revenue: "180,000 kr",
            revenueNote: "+28,000 kr margin (16%)",
          }}
        />
      </div>

      {/* Distribution Options */}
      <DistributionOptions />

      {/* Best Practices */}
      <BestPracticesGrid />
    </div>
  );
}
