import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  DollarSign,
  TreePine,
  Smartphone,
  ArrowRight,
  Layers,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  DollarSign,
  TreePine,
  Smartphone,
  Layers,
};

const COLOR_OPTIONS = [
  { label: "Emerald", bg: "bg-emerald-100", text: "text-emerald-600" },
  { label: "Blue", bg: "bg-blue-100", text: "text-blue-600" },
  { label: "Orange", bg: "bg-orange-100", text: "text-orange-600" },
  { label: "Green", bg: "bg-green-100", text: "text-green-600" },
  { label: "Purple", bg: "bg-purple-100", text: "text-purple-600" },
];

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  iconName: string;
  colorIndex: number;
  enabled: boolean;
  available: boolean;
}

const defaultApps: AppDefinition[] = [
  {
    id: "hr-management",
    name: "HR Management System",
    description: "Manage employee records, handle recruitment, onboarding, contracts, and oversee all human resources operations.",
    iconName: "Users",
    colorIndex: 0,
    enabled: true,
    available: true,
  },
  {
    id: "forestry-project",
    name: "Forestry Project Manager",
    description: "Manage forestry projects, track clearing and planting operations, team assignments, and financial planning.",
    iconName: "TreePine",
    colorIndex: 2,
    enabled: true,
    available: false,
  },
  {
    id: "payroll",
    name: "Payroll Management",
    description: "Process payroll, manage employee compensation, track deductions, and handle salary administration.",
    iconName: "DollarSign",
    colorIndex: 3,
    enabled: true,
    available: false,
  },
  {
    id: "employee-hub",
    name: "Employee Hub",
    description: "Mobile app for employees to manage personal information, view contracts, and report daily attendance.",
    iconName: "Smartphone",
    colorIndex: 4,
    enabled: true,
    available: false,
  },
];

function loadApps(): AppDefinition[] {
  try {
    const saved = localStorage.getItem("app-launcher-apps");
    if (!saved) return defaultApps;
    return JSON.parse(saved);
  } catch {
    return defaultApps;
  }
}

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Layers;
}

function getColor(colorIndex: number) {
  return COLOR_OPTIONS[colorIndex % COLOR_OPTIONS.length];
}

interface AppLauncherProps {
  onLaunchApp: (appId: string) => void;
}

export function AppLauncher({ onLaunchApp }: AppLauncherProps) {
  const [apps] = useState<AppDefinition[]>(loadApps);
  const visibleApps = apps.filter((a) => a.enabled);

  const handleLaunch = (app: AppDefinition) => {
    if (!app.available) {
      toast({ title: `${app.name} is coming soon`, description: "This application is not yet available." });
      return;
    }
    onLaunchApp(app.id);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center p-6 pt-16">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Application Launcher</h1>
            <p className="text-muted-foreground">Choose an application to continue</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "https://scandi-forest-zen.lovable.app";
            }}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {visibleApps.map((app) => {
            const Icon = getIcon(app.iconName);
            const color = getColor(app.colorIndex);

            return (
              <div
                key={app.id}
                onClick={() => handleLaunch(app)}
                className={cn(
                  "group relative bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col items-center text-center transition-all duration-200",
                  app.available && "cursor-pointer hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
                  !app.available && "cursor-default"
                )}
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", color.bg)}>
                  <Icon className={cn("w-6 h-6", color.text)} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{app.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{app.description}</p>
                <div className="mt-auto">
                  {app.available ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:underline">
                      Launch App <ArrowRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground/60">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            All applications share common employee data and resources.
          </p>
        </div>
      </div>
    </div>
  );
}
