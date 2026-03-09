import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TimeReportingDashboardView } from "./TimeReportingDashboardView";
import { WeeklyAttendanceView } from "./WeeklyAttendanceView";
import { ProgressReportingView } from "./ProgressReportingView";
import { ApprovalsView } from "./ApprovalsView";
import { TimeReportsView } from "./TimeReportsView";
import { TimeReportingBottomNav } from "./TimeReportingBottomNav";

interface TimeReportingMobileAppProps {
  onBackToLauncher?: () => void;
}

export function TimeReportingMobileApp({ onBackToLauncher }: TimeReportingMobileAppProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderView = () => {
    switch (activeTab) {
      case "dashboard": return <TimeReportingDashboardView onNavigate={setActiveTab} />;
      case "weekly-attendance": return <WeeklyAttendanceView />;
      case "progress-reporting": return <ProgressReportingView />;
      case "approvals": return <ApprovalsView />;
      case "reports": return <TimeReportsView />;
      default: return <TimeReportingDashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-0 sm:p-4">
      <div
        className="relative flex flex-col bg-background overflow-hidden sm:rounded-[2.5rem] sm:shadow-2xl sm:border sm:border-border/30 w-full h-[100svh] sm:w-[min(430px,100vw)] sm:h-[min(900px,100svh)]"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2 bg-background z-10 shrink-0 border-b border-border/20">
          <button
            onClick={onBackToLauncher}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Apps</span>
          </button>
          <span className="text-sm font-semibold text-foreground">Time & Status</span>
          <div className="w-14" />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
          {renderView()}
        </div>

        {/* Bottom navigation */}
        <TimeReportingBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
