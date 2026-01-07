import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent";
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-6 shadow-soft transition-all duration-200 hover:shadow-medium",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-display text-3xl font-bold">{value}</h3>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            variant === "primary" && "bg-primary/10 text-primary",
            variant === "accent" && "bg-accent/10 text-accent",
            variant === "default" && "bg-secondary text-secondary-foreground"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {variant === "primary" && (
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5" />
      )}
    </div>
  );
}
