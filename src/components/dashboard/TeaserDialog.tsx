import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { type AppDefinition, getIcon, getColor } from "./AppLauncher";

interface TeaserContent {
  intro: string;
  features: string[];
  timeline: string;
}

const TEASER_CONTENT: Record<string, TeaserContent> = {
  "forestry-project": {
    intro:
      "A comprehensive project management tool designed specifically for forestry operations — from initial clearing to planting and ongoing maintenance.",
    features: [
      "Project planning and tracking for clearing and planting operations",
      "Team assignment and crew management across multiple sites",
      "GPS-based area mapping and progress visualization",
      "Financial planning with cost tracking per project phase",
      "Equipment and machinery allocation",
      "Weather-dependent scheduling and calendar integration",
      "Reporting dashboards for project status and profitability",
    ],
    timeline: "Expected availability: Q3 2026",
  },
  payroll: {
    intro:
      "Streamline your entire payroll process with automated calculations, tax handling, and seamless integration with your HR contracts.",
    features: [
      "Automated salary calculation based on hourly, monthly, or piece-work rates",
      "Integration with HR contracts for seamless rate importing",
      "Tax deduction and social contribution handling",
      "Payslip generation and distribution",
      "Overtime and premium pay calculations",
      "Multi-currency support for international workforce",
      "Export to accounting systems",
    ],
    timeline: "Expected availability: Q4 2026",
  },
  "employee-hub": {
    intro:
      "A mobile-first portal where employees can manage their information, sign documents, report attendance, and stay connected with HR.",
    features: [
      "Personal profile and document management",
      "View and digitally sign employment contracts",
      "Daily attendance and time reporting",
      "Leave requests and approval tracking",
      "Push notifications for important updates",
      "Access to company policies and Code of Conduct",
      "Direct messaging with HR department",
    ],
    timeline: "Expected availability: Q1 2027",
  },
};

interface TeaserDialogProps {
  app: AppDefinition | null;
  open: boolean;
  onClose: () => void;
}

export function TeaserDialog({ app, open, onClose }: TeaserDialogProps) {
  if (!app) return null;
  const content = TEASER_CONTENT[app.id];
  if (!content) return null;

  const Icon = getIcon(app.iconName);
  const color = getColor(app.colorIndex);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                color.bg
              )}
            >
              <Icon className={cn("w-5 h-5", color.text)} />
            </div>
            <DialogTitle className="text-xl">{app.name}</DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {content.intro}
        </p>

        <div className="space-y-2 py-2">
          <p className="text-sm font-semibold text-foreground">
            Planned Features
          </p>
          <ul className="space-y-2">
            {content.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground/70 italic">
          {content.timeline}
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              toast({
                title: "You'll be notified!",
                description: `We'll let you know when ${app.name} becomes available.`,
              });
              onClose();
            }}
          >
            <Bell className="w-4 h-4" />
            Notify Me
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
