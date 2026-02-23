import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: "green" | "red" | "yellow" | "default";
  icon: LucideIcon;
  iconColor?: "blue" | "yellow" | "green" | "red";
}

export function StatsCard({
  title,
  value,
  subtitle,
  subtitleColor = "default",
  icon: Icon,
  iconColor = "blue",
}: StatsCardProps) {
  const iconBgColors = {
    blue: "bg-primary/10 text-primary",
    yellow: "bg-warning/10 text-warning",
    green: "bg-success/10 text-success",
    red: "bg-destructive/10 text-destructive",
  };

  const subtitleColors = {
    green: "text-success",
    red: "text-destructive",
    yellow: "text-warning",
    default: "text-muted-foreground",
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {subtitle && (
            <p className={cn("text-xs", subtitleColors[subtitleColor])}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgColors[iconColor])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
