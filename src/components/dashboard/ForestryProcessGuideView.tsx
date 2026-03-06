import {
  FolderKanban,
  MapPin,
  Layers,
  ClipboardList,
  FileText,
  Users,
  Zap,
  BarChart3,
  CheckCircle,
  ArrowRight,
  TreePine,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ─── Terminology ─────────────────────────────────────────────── */

const terminology = [
  { icon: FolderKanban, title: "Project", desc: "A forestry contract or assignment with a defined scope, timeline, client, and budget. Projects contain one or more Objects." },
  { icon: MapPin, title: "Object", desc: "A specific forest parcel, cutting area, planting site, or work zone within a project. Each object is classified by an SLA class." },
  { icon: Layers, title: "SLA Class", desc: "Difficulty classification for an object — Easy, Standard, Difficult, or Extreme — which determines pricing and resource requirements." },
  { icon: ClipboardList, title: "Work Order", desc: "Task assignments for field crews linked to specific objects. (Future feature)" },
  { icon: FileText, title: "Field Report", desc: "Documentation of completed work on an object, including volumes, hours, and conditions. (Future feature)" },
  { icon: TreePine, title: "Season", desc: "The operational period (typically a calendar year) during which projects are planned and executed." },
];

/* ─── Workflow Steps ──────────────────────────────────────────── */

interface WorkflowStep {
  role: "PROJECT MANAGER" | "SYSTEM";
  title: string;
  desc: string;
  status: string;
  icon: React.ElementType;
}

const roleColors: Record<string, string> = {
  "PROJECT MANAGER": "bg-primary/10 text-primary",
  SYSTEM: "bg-[hsl(280,65%,60%)]/10 text-[hsl(280,65%,60%)]",
};

function StepCard({ step, index, total }: { step: WorkflowStep; index: number; total: number }) {
  const Icon = step.icon;
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 rounded-lg border border-border bg-card p-4 space-y-3">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleColors[step.role]}`}>
          {step.role}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            {index + 1}. {step.title}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
        <Badge variant="outline" className="text-[10px]">{step.status}</Badge>
      </div>
      {index < total - 1 && (
        <ArrowRight className="w-4 h-4 text-muted-foreground mt-8 shrink-0 hidden md:block" />
      )}
    </div>
  );
}

function WorkflowSection({ title, steps }: { title: string; steps: WorkflowStep[] }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-2 items-start"
          style={{ gridTemplateColumns: `repeat(${steps.length * 2 - 1}, auto)` }}
        >
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} total={steps.length} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Flow 1: New Project Setup ───────────────────────────────── */

const newProjectSteps: WorkflowStep[] = [
  {
    role: "PROJECT MANAGER",
    title: "Create Project",
    desc: "Define the project name, type (clearing/planting/mixed), client, location, start and end dates, and budget.",
    status: "SETUP",
    icon: FolderKanban,
  },
  {
    role: "PROJECT MANAGER",
    title: "Register Objects",
    desc: "Add forest parcels, cutting areas, or planting sites to the project. Assign SLA classes (Easy, Standard, Difficult, Extreme) and specify area in hectares.",
    status: "PLANNING",
    icon: MapPin,
  },
  {
    role: "PROJECT MANAGER",
    title: "Assign Teams",
    desc: "Link employees and field crews to specific objects. Ensure each object has the appropriate resources based on its SLA class.",
    status: "PLANNING",
    icon: Users,
  },
  {
    role: "SYSTEM",
    title: "Activate Operations",
    desc: "When all objects are planned and teams assigned, the project transitions to active operations. Field work can begin.",
    status: "IN PROGRESS",
    icon: Zap,
  },
  {
    role: "PROJECT MANAGER",
    title: "Monitor & Report",
    desc: "Track progress on each object, update statuses as work is completed, and monitor financial performance against budget.",
    status: "IN PROGRESS",
    icon: BarChart3,
  },
  {
    role: "SYSTEM",
    title: "Complete & Archive",
    desc: "When all objects are completed and financials reconciled, the project is marked as completed and archived for reporting.",
    status: "COMPLETED",
    icon: CheckCircle,
  },
];

/* ─── Summary ─────────────────────────────────────────────────── */

const summaryFlows = [
  {
    num: 1,
    label: "New Project Setup",
    steps: ["Setup", "Planning", "In Progress", "Completed"],
  },
];

/* ─── Component ───────────────────────────────────────────────── */

export function ForestryProcessGuideView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Forestry Process Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Workflow reference for setting up and managing forestry projects, objects, and field operations.
        </p>
      </div>

      {/* Terminology */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">System Terminology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {terminology.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Flow 1: New Project Setup */}
      <WorkflowSection title="Flow 1 — New Project Setup" steps={newProjectSteps} />

      {/* Flow Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Flow Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summaryFlows.map((f) => (
            <div key={f.num} className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="text-[10px] shrink-0">Flow {f.num}</Badge>
              <span className="text-xs font-medium text-foreground">{f.label}:</span>
              {f.steps.map((s, i) => (
                <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                  {i > 0 && <ArrowRight className="w-3 h-3" />}
                  {s}
                </span>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
