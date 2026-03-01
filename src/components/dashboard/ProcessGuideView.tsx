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
  roleLabel?: string;
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

function StepCard({ step, index, total }: { step: WorkflowStep; index: number; total: number }) {
  const Icon = step.icon;
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 rounded-lg border border-border bg-card p-4 space-y-3">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleColors[step.role]}`}>
          {step.roleLabel ?? step.role}
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

  const newHireSteps: WorkflowStep[] = [
    { role: "HR MANAGER", roleLabel: t("guide.hrManager"), title: t("guide.sendInvitation"), desc: t("guide.sendInvitationDesc"), status: t("status.invited").toUpperCase(), icon: Send },
    { role: "CANDIDATE", roleLabel: t("guide.candidate"), title: t("guide.dataSubmission"), desc: t("guide.dataSubmissionDesc"), status: t("status.onboarding").toUpperCase(), icon: UserPlus },
    { role: "HR MANAGER", roleLabel: t("guide.hrManager"), title: t("guide.contractReview"), desc: t("guide.contractReviewDesc"), status: t("status.onboarding").toUpperCase(), icon: FileSignature },
    { role: "SYSTEM", roleLabel: t("guide.system"), title: t("guide.activation"), desc: t("guide.activationDesc"), status: t("status.active").toUpperCase(), icon: Zap },
  ];

  const renewalSteps: WorkflowStep[] = [
    { role: "HR MANAGER", roleLabel: t("guide.hrManager"), title: t("guide.selectCandidate"), desc: t("guide.selectCandidateDesc"), status: t("guide.seasonalPool").toUpperCase(), icon: Users },
    { role: "HR MANAGER", roleLabel: t("guide.hrManager"), title: t("guide.sendRenewalInvite"), desc: t("guide.sendRenewalInviteDesc"), status: t("guide.renewal").toUpperCase(), icon: Send },
    { role: "CANDIDATE", roleLabel: t("guide.candidate"), title: t("guide.dataVerification"), desc: t("guide.dataVerificationDesc"), status: t("guide.renewal").toUpperCase(), icon: CheckCircle },
    { role: "CANDIDATE", roleLabel: t("guide.candidate"), title: t("guide.contractSigning"), desc: t("guide.contractSigningDesc"), status: t("guide.renewal").toUpperCase(), icon: FileSignature },
    { role: "SYSTEM", roleLabel: t("guide.system"), title: t("guide.reactivation"), desc: t("guide.reactivationDesc"), status: t("status.active").toUpperCase(), icon: Zap },
  ];

  const terminationSteps: WorkflowStep[] = [
    { role: "HR MANAGER", roleLabel: t("guide.hrManager"), title: t("guide.terminationNotice"), desc: t("guide.terminationNoticeDesc"), status: t("status.active").toUpperCase(), icon: XCircle },
    { role: "SYSTEM", roleLabel: t("guide.system"), title: t("guide.exitProcessing"), desc: t("guide.exitProcessingDesc"), status: t("guide.termination").toUpperCase(), icon: ShieldCheck },
    { role: "SYSTEM", roleLabel: t("guide.system"), title: t("guide.archive"), desc: t("guide.archiveDesc"), status: t("status.inactive").toUpperCase(), icon: Archive },
  ];

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
