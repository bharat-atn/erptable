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
        <div className={`grid grid-cols-1 ${cols === 3 ? "sm:grid-cols-3" : cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2"} gap-3`}>
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

/* ─── Phase Data ──────────────────────────────────────────────── */

const foundationCards: PhaseCard[] = [
  { icon: Building2, title: "Client Register", desc: "Register all forestry clients with contact details, contract terms, and billing information." },
  { icon: MapPin, title: "Object Register", desc: "Define work parcels with GPS coordinates, area (ha), plant types, and SLA classifications." },
  { icon: DollarSign, title: "Compensation Groups", desc: "Set up hourly and piece work rate tables linked to SLA classes and star levels." },
  { icon: Users, title: "Employee Register", desc: "Onboard forestry workers with skills, star ratings, certifications, and contact data." },
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

function Scenario({ num, title, subtitle, setup, objects, team, calculation, result }: {
  num: number;
  title: string;
  subtitle: string;
  setup: { label: string; value: string }[];
  objects: { id: string; type: string; sla: string; qty: string }[];
  team: { name: string; star: number; role: string }[];
  calculation: string;
  result: string;
}) {
  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground text-[10px]">Scenario {num}</Badge>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Setup */}
        <div>
          <h5 className="text-xs font-semibold text-foreground mb-2">Project Setup</h5>
          <div className="grid grid-cols-2 gap-2">
            {setup.map((s) => (
              <div key={s.label} className="flex justify-between rounded-md bg-muted/50 px-3 py-1.5 text-[10px]">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

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

        {/* Team */}
        <div>
          <h5 className="text-xs font-semibold text-foreground mb-2">Team Assignment</h5>
          <div className="space-y-1">
            {team.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-[10px] rounded-md bg-muted/50 px-3 py-1.5">
                <span className="text-foreground font-medium">{t.name}</span>
                <span className="text-muted-foreground">{"★".repeat(t.star)} — {t.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation & Result */}
        <div className="rounded-md bg-primary/5 border border-primary/10 p-3 space-y-2">
          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Calculation:</strong> {calculation}</p>
          <p className="text-xs text-foreground font-semibold">{result}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */

export function ScenariosTab() {
  return (
    <div className="space-y-6">
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
          result="Expected total cost: ~72,000 kr over 15 working days. Budget margin: +13,000 kr (15%)"
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
          result="Expected total cost: ~285,000 kr over 30 working days. Budget margin: +35,000 kr (11%)"
        />
      </div>
    </div>
  );
}
