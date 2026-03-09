import {
  Mail, ClipboardList, FileText, Archive, RefreshCw, XCircle,
  Send, UserPlus, CheckCircle, Zap, Users, FileSignature,
  ShieldCheck, ArrowRight, BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const terminology = [
  { icon: Mail, title: "Invitation", desc: "Email link sent to a candidate to start onboarding." },
  { icon: ClipboardList, title: "Onboarding Wizard", desc: "Digital form for personal, bank, and ID info." },
  { icon: FileText, title: "Contract", desc: "Auto-generated employment agreement for signing." },
  { icon: Archive, title: "Seasonal Pool", desc: "Archive of past employees for quick renewal." },
  { icon: RefreshCw, title: "Renewal", desc: "Re-engagement to rehire a previous employee." },
  { icon: XCircle, title: "Termination", desc: "Exit process, final paperwork, and archival." },
];

interface WStep {
  role: "HR" | "YOU" | "SYSTEM";
  title: string;
  desc: string;
  status: string;
  icon: React.ElementType;
}

const roleBg: Record<string, string> = {
  HR: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  YOU: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  SYSTEM: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};

function StepCard({ step, index }: { step: WStep; index: number }) {
  const Icon = step.icon;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${roleBg[step.role]}`}>
          {index + 1}
        </div>
        <div className="w-0.5 flex-1 bg-border/60 mt-1" />
      </div>
      <div className="pb-5 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{step.role}</Badge>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{step.status}</Badge>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
          <h4 className="text-sm font-semibold">{step.title}</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

function FlowSection({ title, steps, emoji }: { title: string; steps: WStep[]; emoji: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h3>
      <div>
        {steps.map((step, i) => (
          <StepCard key={i} step={step} index={i} />
        ))}
      </div>
    </div>
  );
}

const newHireSteps: WStep[] = [
  { role: "HR", title: "Send Invitation", desc: "HR creates a link and emails it to the new candidate.", status: "INVITED", icon: Send },
  { role: "YOU", title: "Submit Your Data", desc: "You fill out personal info, bank details, and upload your ID.", status: "ONBOARDING", icon: UserPlus },
  { role: "HR", title: "Contract Review", desc: "HR reviews your information and prepares the contract.", status: "REVIEW", icon: FileSignature },
  { role: "SYSTEM", title: "Activation", desc: "Once signed, you become an active employee automatically.", status: "ACTIVE", icon: Zap },
];

const renewalSteps: WStep[] = [
  { role: "HR", title: "Select from Pool", desc: "HR picks you from the seasonal pool for a new season.", status: "POOL", icon: Users },
  { role: "HR", title: "Send Renewal Invite", desc: "A new invitation is sent to verify your info is still correct.", status: "RENEWAL", icon: Send },
  { role: "YOU", title: "Verify Data", desc: "Review and update any changed personal information.", status: "VERIFY", icon: CheckCircle },
  { role: "YOU", title: "Sign Contract", desc: "Sign your new season contract digitally.", status: "SIGNING", icon: FileSignature },
  { role: "SYSTEM", title: "Reactivation", desc: "Your status is set back to active for the new season.", status: "ACTIVE", icon: Zap },
];

const terminationSteps: WStep[] = [
  { role: "HR", title: "Termination Notice", desc: "HR initiates the exit process for the employee.", status: "ACTIVE", icon: XCircle },
  { role: "SYSTEM", title: "Exit Processing", desc: "Final pay, paperwork, and compliance checks are completed.", status: "EXITING", icon: ShieldCheck },
  { role: "SYSTEM", title: "Archive", desc: "Employee moves to inactive or the seasonal pool.", status: "ARCHIVED", icon: Archive },
];

const summaryFlows = [
  { num: 1, label: "New Hire", steps: ["Invited", "Onboarding", "Active"] },
  { num: 2, label: "Renewal", steps: ["Pool", "Verify", "Active"] },
  { num: 3, label: "Exit", steps: ["Active", "Exiting", "Archived"] },
];

export function EmployeeHubProcessGuideView() {
  return (
    <div className="space-y-5 px-4 pt-2 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6" />
        <div className="relative">
          <BookOpen className="w-6 h-6 mb-2 opacity-80" />
          <h1 className="text-lg font-bold">Process Guide</h1>
          <p className="text-xs text-white/80 mt-1">
            Understand the employee lifecycle — from invitation to exit.
          </p>
        </div>
      </div>

      {/* Terminology */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3">📖 Key Terms</h3>
        <div className="space-y-2.5">
          {terminology.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflows */}
      <FlowSection title="Flow 1 — New Hire" steps={newHireSteps} emoji="🆕" />
      <FlowSection title="Flow 2 — Seasonal Renewal" steps={renewalSteps} emoji="🔄" />
      <FlowSection title="Flow 3 — Termination" steps={terminationSteps} emoji="🚪" />

      {/* Summary */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3">📋 Flow Summary</h3>
        <div className="space-y-2.5">
          {summaryFlows.map((f) => (
            <div key={f.num} className="flex items-center gap-2 flex-wrap">
              <Badge className="text-[9px] bg-emerald-600 hover:bg-emerald-700 shrink-0">
                Flow {f.num}
              </Badge>
              <span className="text-xs font-medium">{f.label}:</span>
              {f.steps.map((s, i) => (
                <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {i > 0 && <ArrowRight className="w-3 h-3" />}
                  {s}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
