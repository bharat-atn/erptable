import {
  Mail,
  ClipboardList,
  FileText,
  Archive,
  RefreshCw,
  XCircle,
  Send,
  UserPlus,
  CheckCircle,
  Zap,
  Users,
  FileSignature,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUiLanguage } from "@/hooks/useUiLanguage";

const terminology = [
  { icon: Mail, title: "Invitation", desc: "Email link sent to a candidate to start the onboarding process." },
  { icon: ClipboardList, title: "Onboarding Wizard", desc: "Digital form collecting personal, bank, and ID information." },
  { icon: FileText, title: "Contract", desc: "Auto-generated employment agreement for signing." },
  { icon: Archive, title: "Seasonal Pool", desc: "Archive of past employees available for quick renewal." },
  { icon: RefreshCw, title: "Renewal", desc: "Re-engagement process to rehire a previous employee." },
  { icon: XCircle, title: "Termination", desc: "Exit process, final paperwork, and archival." },
];

interface WorkflowStep {
  role: "HR MANAGER" | "CANDIDATE" | "SYSTEM";
  title: string;
  desc: string;
  status: string;
  icon: React.ElementType;
}

const roleColors: Record<string, string> = {
  "HR MANAGER": "bg-primary/10 text-primary",
  CANDIDATE: "bg-success/10 text-success",
  SYSTEM: "bg-[hsl(280,65%,60%)]/10 text-[hsl(280,65%,60%)]",
};

const newHireSteps: WorkflowStep[] = [
  { role: "HR MANAGER", title: "Send Invitation", desc: "Create and send onboarding email link.", status: "INVITED", icon: Send },
  { role: "CANDIDATE", title: "Data Submission", desc: "Fill in personal, bank & ID info via wizard.", status: "ONBOARDING", icon: UserPlus },
  { role: "HR MANAGER", title: "Contract Review", desc: "Review submitted data and generate contract.", status: "ONBOARDING", icon: FileSignature },
  { role: "SYSTEM", title: "Activation", desc: "Employee record set to active duty.", status: "ACTIVE", icon: Zap },
];

const renewalSteps: WorkflowStep[] = [
  { role: "HR MANAGER", title: "Select Candidate", desc: "Pick returning employee from seasonal pool.", status: "SEASONAL_POOL", icon: Users },
  { role: "HR MANAGER", title: "Send Renewal Invite", desc: "Send renewal link to update information.", status: "RENEWAL", icon: Send },
  { role: "CANDIDATE", title: "Data Verification", desc: "Review and update personal details.", status: "RENEWAL", icon: CheckCircle },
  { role: "CANDIDATE", title: "Contract Signing", desc: "Sign the new employment agreement.", status: "RENEWAL", icon: FileSignature },
  { role: "SYSTEM", title: "Reactivation", desc: "Employee reactivated for the new season.", status: "ACTIVE", icon: Zap },
];

const terminationSteps: WorkflowStep[] = [
  { role: "HR MANAGER", title: "Termination Notice", desc: "Initiate the termination process.", status: "ACTIVE", icon: XCircle },
  { role: "SYSTEM", title: "Exit Processing", desc: "Revoke access and finalize paperwork.", status: "TERMINATING", icon: ShieldCheck },
  { role: "SYSTEM", title: "Archive", desc: "Move to seasonal pool or permanent archive.", status: "TERMINATED", icon: Archive },
];

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
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-2 items-start"
          style={{ gridTemplateColumns: `repeat(${steps.length * 2 - 1}, auto)` }}>
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} total={steps.length} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const summaryFlows = [
  { num: 1, label: "New Hire", steps: ["Pending Invites", "Onboarding", "Active Duty"] },
  { num: 2, label: "Seasonal Renewal", steps: ["Seasonal Pool", "Data Update", "Active Duty"] },
  { num: 3, label: "Termination", steps: ["Active", "Terminating", "Terminated / Seasonal Pool"] },
];

export function ProcessGuideView() {
  const { t } = useUiLanguage();

  const localTerminology = [
    { icon: Mail, title: t("guide.invitation"), desc: t("guide.invitationDesc") },
    { icon: ClipboardList, title: t("guide.onboardingWizard"), desc: t("guide.onboardingWizardDesc") },
    { icon: FileText, title: t("guide.contract"), desc: t("guide.contractDesc") },
    { icon: Archive, title: t("guide.seasonalPool"), desc: t("guide.seasonalPoolDesc") },
    { icon: RefreshCw, title: t("guide.renewal"), desc: t("guide.renewalDesc") },
    { icon: XCircle, title: t("guide.termination"), desc: t("guide.terminationDesc") },
  ];

  const localSummaryFlows = [
    { num: 1, label: t("guide.newHire"), steps: [t("stats.pendingInvites"), t("ops.onboarding"), t("ops.activeDuty")] },
    { num: 2, label: t("guide.seasonalRenewal"), steps: [t("guide.seasonalPool"), t("guide.dataVerification"), t("ops.activeDuty")] },
    { num: 3, label: t("guide.termination"), steps: [t("status.active"), t("guide.exitProcessing"), t("guide.archive")] },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("page.processGuide.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("page.processGuide.desc")}
        </p>
      </div>

      {/* Terminology */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("guide.systemTerminology")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {localTerminology.map((item) => {
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

      {/* Workflows */}
      <WorkflowSection title={t("guide.flow1")} steps={newHireSteps} />
      <WorkflowSection title={t("guide.flow2")} steps={renewalSteps} />
      <WorkflowSection title={t("guide.flow3")} steps={terminationSteps} />

      {/* Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("guide.flowSummary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {localSummaryFlows.map((f) => (
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
