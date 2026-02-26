import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Check,
  Bell,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  BarChart3,
  Wrench,
  Calendar,
  DollarSign,
  FileText,
  Globe,
  Calculator,
  Smartphone,
  Clock,
  MessageSquare,
  Shield,
  Send,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { type AppDefinition, getIcon, getColor } from "./AppLauncher";

/* ── page structure ─────────────────────────────────────────── */

interface FeatureHighlight {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface TeaserPage {
  headline: string;
  subtitle?: string;
  highlights: FeatureHighlight[];
}

interface TeaserContent {
  tagline: string;
  intro: string;
  pages: TeaserPage[];
  timeline: string;
}

/* ── content per app ────────────────────────────────────────── */

const TEASER: Record<string, TeaserContent> = {
  "forestry-project": {
    tagline: "Plan · Track · Deliver",
    intro:
      "A purpose-built project management platform for forestry operations — from initial land clearing through planting, maintenance, and financial close-out.",
    pages: [
      {
        headline: "Planning & Operations",
        subtitle: "Full lifecycle project management for every site",
        highlights: [
          {
            icon: MapPin,
            title: "GPS Area Mapping",
            description:
              "Define work zones on a map, measure hectares, and visualize real-time progress with satellite overlays.",
          },
          {
            icon: Calendar,
            title: "Weather-Aware Scheduling",
            description:
              "Automatically reschedule tasks when weather conditions fall outside defined thresholds.",
          },
          {
            icon: Wrench,
            title: "Equipment Allocation",
            description:
              "Assign machinery to projects, track utilization rates, and schedule preventive maintenance windows.",
          },
        ],
      },
      {
        headline: "Teams & Reporting",
        subtitle: "Keep crews aligned and stakeholders informed",
        highlights: [
          {
            icon: Users,
            title: "Crew Management",
            description:
              "Assign teams across multiple sites, manage certifications, and handle shift rotations.",
          },
          {
            icon: BarChart3,
            title: "Live Dashboards",
            description:
              "Monitor project status, budget burn-rate, and profitability with real-time visual reports.",
          },
          {
            icon: DollarSign,
            title: "Financial Tracking",
            description:
              "Track costs per project phase — labour, materials, equipment — against planned budgets.",
          },
        ],
      },
    ],
    timeline: "Expected availability: Q3 2026",
  },

  payroll: {
    tagline: "Calculate · Comply · Pay",
    intro:
      "Streamline your entire payroll cycle — from contract-driven rate imports and automated calculations through to payslip distribution and accounting exports.",
    pages: [
      {
        headline: "Salary & Calculations",
        subtitle: "Every rate model, handled automatically",
        highlights: [
          {
            icon: Calculator,
            title: "Flexible Rate Engine",
            description:
              "Support hourly, monthly, and piece-work rates with automatic overtime and premium calculations.",
          },
          {
            icon: FileText,
            title: "HR Contract Integration",
            description:
              "Import salary data directly from signed employment contracts — no duplicate entry required.",
          },
          {
            icon: Globe,
            title: "Multi-Currency Support",
            description:
              "Handle international workforces with automatic exchange-rate conversion and local compliance.",
          },
        ],
      },
      {
        headline: "Compliance & Distribution",
        subtitle: "Stay compliant and keep employees informed",
        highlights: [
          {
            icon: Shield,
            title: "Tax & Contributions",
            description:
              "Automatic deductions for income tax, social contributions, and pension according to local rules.",
          },
          {
            icon: Send,
            title: "Payslip Generation",
            description:
              "Generate, preview, and distribute digital payslips to employees via email or the Employee Hub.",
          },
          {
            icon: BarChart3,
            title: "Accounting Export",
            description:
              "One-click export to SIE, Fortnox, or other accounting systems with full audit trail.",
          },
        ],
      },
    ],
    timeline: "Expected availability: Q4 2026",
  },

  "time-reporting": {
    tagline: "Track · Approve · Report",
    intro:
      "A streamlined time reporting platform for team leaders and managers — log daily hours per project and object, approve timesheets, and generate attendance summaries.",
    pages: [
      {
        headline: "Daily Time Entry",
        subtitle: "Fast and accurate hour logging for every project",
        highlights: [
          {
            icon: Clock,
            title: "Clock In / Clock Out",
            description:
              "Start and stop timers per project and work object, or enter hours manually at the end of the day.",
          },
          {
            icon: MapPin,
            title: "Project & Object Allocation",
            description:
              "Assign hours to specific forestry projects, work areas, and cost objects for precise tracking.",
          },
          {
            icon: Calendar,
            title: "Weekly Overview",
            description:
              "View and edit the full work week in a clear grid — spot gaps, overtime, and missing entries at a glance.",
          },
        ],
      },
      {
        headline: "Approval & Reporting",
        subtitle: "Keep timesheets accurate and payroll-ready",
        highlights: [
          {
            icon: Check,
            title: "Timesheet Approval",
            description:
              "Team leaders review and approve crew timesheets before they flow to payroll processing.",
          },
          {
            icon: BarChart3,
            title: "Attendance Summaries",
            description:
              "Generate attendance reports by employee, project, or period — exportable for payroll and invoicing.",
          },
          {
            icon: Users,
            title: "Team Dashboard",
            description:
              "See who's clocked in, who's on leave, and total hours per crew member in real time.",
          },
        ],
      },
    ],
    timeline: "Expected availability: Q2 2027",
  },

  "employee-hub": {
    tagline: "Connect · Sign · Report",
    intro:
      "A mobile-first portal that puts employees in control of their personal data, contracts, time reporting, and direct communication with HR.",
    pages: [
      {
        headline: "Documents & Contracts",
        subtitle: "Everything in one pocket-sized portal",
        highlights: [
          {
            icon: Fingerprint,
            title: "Digital Contract Signing",
            description:
              "View, review, and sign employment contracts directly from your phone with legally binding e-signatures.",
          },
          {
            icon: FileText,
            title: "Document Vault",
            description:
              "Access payslips, company policies, Code of Conduct, and personal documents anytime.",
          },
          {
            icon: Smartphone,
            title: "Profile Management",
            description:
              "Update personal details, emergency contacts, and bank information securely on the go.",
          },
        ],
      },
      {
        headline: "Time & Communication",
        subtitle: "Stay connected and report effortlessly",
        highlights: [
          {
            icon: Clock,
            title: "Attendance & Time Reporting",
            description:
              "Clock in/out, log hours per project, and submit timesheets with a single tap.",
          },
          {
            icon: Calendar,
            title: "Leave Management",
            description:
              "Request vacation, sick leave, or parental leave and track approval status in real time.",
          },
          {
            icon: MessageSquare,
            title: "HR Messaging",
            description:
              "Direct, secure messaging channel with HR for questions, requests, and important updates.",
          },
        ],
      },
    ],
    timeline: "Expected availability: Q1 2027",
  },
};

/* ── component ──────────────────────────────────────────────── */

interface TeaserDialogProps {
  app: AppDefinition | null;
  open: boolean;
  onClose: () => void;
}

export function TeaserDialog({ app, open, onClose }: TeaserDialogProps) {
  const [pageIndex, setPageIndex] = useState(0);

  if (!app) return null;
  const content = TEASER[app.id];
  if (!content) return null;

  const Icon = getIcon(app.iconName);
  const color = getColor(app.colorIndex);
  const page = content.pages[pageIndex];
  const totalPages = content.pages.length;
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === totalPages - 1;

  const handleClose = () => {
    setPageIndex(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0 border-0 shadow-2xl">
        {/* ── Hero banner ── */}
        <div
          className={cn(
            "relative px-8 pt-8 pb-6",
            color.bg
          )}
        >
          {/* decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />

          <div className="relative flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center shadow-sm">
              <Icon className={cn("w-6 h-6", color.text)} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{app.name}</h2>
              <p className={cn("text-sm font-semibold tracking-wide", color.text)}>
                {content.tagline}
              </p>
            </div>
          </div>
          <p className="relative text-sm text-foreground/80 leading-relaxed">
            {content.intro}
          </p>
        </div>

        {/* ── Page content ── */}
        <div className="px-8 py-6 space-y-5">
          {/* page header */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{page.headline}</h3>
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {pageIndex + 1} / {totalPages}
              </span>
            </div>
            {page.subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{page.subtitle}</p>
            )}
          </div>

          {/* feature cards */}
          <div className="space-y-4">
            {page.highlights.map((h, i) => {
              const HIcon = h.icon;
              return (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div
                    className={cn(
                      "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center",
                      color.bg
                    )}
                  >
                    <HIcon className={cn("w-5 h-5", color.text)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{h.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                      {h.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-8 pb-6 pt-2 flex items-center justify-between border-t border-border">
          <p className="text-xs text-muted-foreground/70 italic">{content.timeline}</p>

          <div className="flex items-center gap-2">
            {/* pagination */}
            {totalPages > 1 && (
              <div className="flex gap-1 mr-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isFirst}
                  onClick={() => setPageIndex((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isLast}
                  onClick={() => setPageIndex((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={handleClose}>
              Close
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                toast({
                  title: "You'll be notified!",
                  description: `We'll let you know when ${app.name} becomes available.`,
                });
                handleClose();
              }}
            >
              <Bell className="w-4 h-4" />
              Notify Me
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
