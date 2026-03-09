import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { EmployeeHubDashboardView } from "./EmployeeHubDashboardView";
import { EmployeeHubProfileView } from "./EmployeeHubProfileView";
import { EmployeeHubContractView } from "./EmployeeHubContractView";
import { EmployeeHubScheduleView } from "./EmployeeHubScheduleView";
import { EmployeeHubPayslipsView } from "./EmployeeHubPayslipsView";
import { EmployeeHubLeaveView } from "./EmployeeHubLeaveView";
import { EmployeeHubProcessGuideView } from "./EmployeeHubProcessGuideView";
import { EmployeeHubBottomNav } from "./EmployeeHubBottomNav";
import { useUiLanguage } from "@/hooks/useUiLanguage";

interface EmployeeHubAppProps {
  onBackToLauncher?: () => void;
}

export function EmployeeHubApp({ onBackToLauncher }: EmployeeHubAppProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { lang, setLang, t } = useUiLanguage();

  const renderView = () => {
    switch (activeTab) {
      case "dashboard": return <EmployeeHubDashboardView />;
      case "contract": return <EmployeeHubContractView />;
      case "schedule": return <EmployeeHubScheduleView />;
      case "payslips": return <EmployeeHubPayslipsView />;
      case "leave": return <EmployeeHubLeaveView />;
      case "profile": return <EmployeeHubProfileView t={t} lang={lang} onLanguageChange={setLang} />;
      case "guide": return <EmployeeHubProcessGuideView />;
      default: return <EmployeeHubDashboardView />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div
        className="relative flex flex-col bg-background overflow-hidden rounded-[2.5rem] shadow-2xl border border-border/30"
        style={{ width: "min(430px, 100vw)", height: "min(900px, 100svh)" }}
      >
        {/* Status bar / top handle */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 bg-background z-10 shrink-0">
          <button
            onClick={onBackToLauncher}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Apps</span>
          </button>
          <div className="w-20 h-1.5 bg-foreground/10 rounded-full" />
          <div className="w-16" />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderView()}
        </div>

        {/* Bottom navigation */}
        <EmployeeHubBottomNav activeTab={activeTab} onTabChange={setActiveTab} t={t} />
      </div>
    </div>
  );
}
