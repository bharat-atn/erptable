import { useState, useEffect } from "react";
import { Sidebar, screenSizes, type ScreenSizeOption } from "./Sidebar";
import { DashboardView } from "./DashboardView";
import { EmployeeRegisterView } from "./EmployeeRegisterView";
import { InvitationsView } from "./InvitationsView";
import { ContractsView, type ResumeMode } from "./ContractsView";
import { SettingsView } from "./SettingsView";
import { ContractTemplateView } from "./ContractTemplateView";
import { CompanyRegisterView } from "./CompanyRegisterView";
import { OnboardingPreview } from "./OnboardingPreview";
import { OperationsView } from "./OperationsView";
import { ProcessGuideView } from "./ProcessGuideView";
import { EmployeeIdSettingsView } from "./EmployeeIdSettingsView";
import { ContractIdSettingsView } from "./ContractIdSettingsView";
import { InvitationTemplateView } from "./InvitationTemplateView";
import { ContractDataRegistryView } from "./ContractDataRegistryView";
import { IsoStandardsView } from "./IsoStandardsView";
import { AuditLogView } from "./AuditLogView";
import { BankListView } from "./BankListView";
import { UserManagementView } from "./UserManagementView";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

import { type AppDefinition } from "./AppLauncher";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface DashboardProps {
  onBackToLauncher?: () => void;
  appId?: string | null;
  apps?: AppDefinition[];
  onSwitchApp?: (appId: string) => void;
  userRole?: AppRole | null;
}

const TABLET_THRESHOLD = 1100;

export function Dashboard({ onBackToLauncher, appId, apps, onSwitchApp, userRole }: DashboardProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [showPreview, setShowPreview] = useState(false);
  const [resumeContractId, setResumeContractId] = useState<string | null>(null);
  const [resumeMode, setResumeMode] = useState<ResumeMode>("resume");
  const [preselectedEmployeeId, setPreselectedEmployeeId] = useState<string | null>(null);
  const [screenSize, setScreenSize] = useState<ScreenSizeOption>(screenSizes[screenSizes.length - 1]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar when simulated screen is tablet-sized or smaller
  useEffect(() => {
    if (screenSize.width !== null && screenSize.width <= TABLET_THRESHOLD) {
      setSidebarCollapsed(true);
    }
  }, [screenSize]);

  const handleContinueContract = (contractId: string, mode: ResumeMode = "resume") => {
    setResumeContractId(contractId);
    setResumeMode(mode);
    setActiveView("contract-template");
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <DashboardView onNavigate={setActiveView} />;
      case "operations": return <OperationsView onNavigate={(view, empId) => {
        if (empId) setPreselectedEmployeeId(empId);
        setActiveView(view);
      }} />;
      case "employee-register": return <EmployeeRegisterView />;
      case "invitations": return <InvitationsView />;
      case "contracts": return <ContractsView onContinueContract={handleContinueContract} />;
      case "settings": return <SettingsView />;
      case "contract-template": return <ContractTemplateView resumeContractId={resumeContractId} preselectedEmployeeId={preselectedEmployeeId} resumeMode={resumeMode} />;
      case "company-register": return <CompanyRegisterView />;
      case "process-guide": return <ProcessGuideView />;
      case "employee-id-settings": return <EmployeeIdSettingsView />;
      case "contract-id-settings": return <ContractIdSettingsView />;
      case "invitation-template": return <InvitationTemplateView />;
      case "contract-data": return <ContractDataRegistryView />;
      case "bank-list": return <BankListView />;
      case "iso-standards": return <IsoStandardsView />;
      case "audit-log": return <AuditLogView />;
      case "user-management": return <UserManagementView />;
      default: return <DashboardView />;
    }
  };

  if (showPreview) {
    return <OnboardingPreview onClose={() => setShowPreview(false)} />;
  }

  const isConstrained = screenSize.width !== null;

  return (
    <div className={cn("flex min-h-screen", isConstrained ? "justify-center bg-muted/30" : "")}>
      <div
        className={cn(
          "flex min-h-screen bg-background transition-all duration-300 ease-out",
          isConstrained && "shadow-xl border-x border-border/50"
        )}
        style={{ width: isConstrained ? `${screenSize.width}px` : "100%", maxWidth: "100%" }}
      >
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          activeScreenSize={screenSize}
          onScreenSizeChange={setScreenSize}
          onBackToLauncher={onBackToLauncher}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          appId={appId}
          apps={apps}
          onSwitchApp={onSwitchApp}
          userRole={userRole}
        />
        <main className="flex-1 min-w-0 p-6 overflow-auto">
          <div className={cn("mx-auto", isConstrained && "max-w-full")}>
            {renderView()}
          </div>
        </main>
        
        {(activeView === "invitations" || activeView === "invitation-template") && (
          <Button
            variant="default"
            className="fixed top-4 right-6 shadow-lg gap-2 z-40"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4" />
            Switch to Candidate View
          </Button>
        )}
      </div>
    </div>
  );
}
