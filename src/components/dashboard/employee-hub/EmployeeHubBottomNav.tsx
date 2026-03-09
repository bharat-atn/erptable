import { Home, FileText, Calendar, User, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeHubBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: "dashboard", icon: Home, label: "Home" },
  { id: "contract", icon: FileText, label: "Contract" },
  { id: "schedule", icon: Calendar, label: "Schedule" },
  { id: "payslips", icon: CreditCard, label: "Payslips" },
  { id: "profile", icon: User, label: "Profile" },
];

export function EmployeeHubBottomNav({ activeTab, onTabChange }: EmployeeHubBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/40 safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] h-14 rounded-xl transition-all",
                isActive
                  ? "text-emerald-600"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-0.5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
