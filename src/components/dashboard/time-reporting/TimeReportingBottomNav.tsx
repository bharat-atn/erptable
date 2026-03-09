import { LayoutDashboard, CheckSquare, TrendingUp, ClipboardCheck, BookOpen, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeReportingBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  t: (key: string) => string;
}

const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, labelKey: "tr.nav.home" },
  { id: "weekly-attendance", icon: CheckSquare, labelKey: "tr.nav.attendance" },
  { id: "guide", icon: BookOpen, labelKey: "tr.nav.guide" },
  { id: "approvals", icon: ClipboardCheck, labelKey: "tr.nav.approvals" },
  { id: "profile", icon: UserCircle, labelKey: "tr.nav.profile" },
];

export function TimeReportingBottomNav({ activeTab, onTabChange, t }: TimeReportingBottomNavProps) {
  return (
    <div className="bg-background border-t border-border/40 shrink-0 z-10">
      <div className="flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[48px] h-14 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-0.5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium leading-tight">{t(item.labelKey)}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </button>
          );
        })}
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </div>
  );
}
