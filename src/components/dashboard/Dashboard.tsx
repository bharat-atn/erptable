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
import { RolePermissionMatrix } from "./RolePermissionMatrix";
import { VersionManagementView } from "./VersionManagementView";
import { IssueTrackerView } from "./IssueTrackerView";
import { DataHandlingView } from "./DataHandlingView";
import { ForestryDashboardView } from "./ForestryDashboardView";
import { ForestryProjectsView } from "./ForestryProjectsView";
import { ForestryObjectsView } from "./ForestryObjectsView";
import { ForestryProcessGuideView } from "./ForestryProcessGuideView";
import { ClientRegisterView } from "./ClientRegisterView";
import { TopVersionBadge } from "./TopVersionBadge";
import { VersionUpdateBanner } from "./VersionUpdateBanner";
import { IssueReportButton } from "./IssueReportButton";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

import { cn } from "@/lib/utils";

import { type AppDefinition } from "./AppLauncher";

type AppRole = string;

interface DashboardProps {
  onBackToLauncher?: () => void;
  appId?: string | null;
  apps?: AppDefinition[];
  onSwitchApp?: (appId: string) => void;
  userRole?: AppRole | null;
}

const TABLET_THRESHOLD = 1100;

export function Dashboard({ onBackToLauncher, appId, apps, onSwitchApp, userRole }: DashboardProps) {
  const getDefaultView = (id?: string | null) => id === "user-management" ? "user-management" : "dashboard";
  const [activeView, setActiveView] = useState(getDefaultView(appId));

  // When app changes via the switcher, reset to the first/default view
  useEffect(() => {
    setActiveView(getDefaultView(appId));
  }, [appId]);
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
    // Forestry Project Manager views
    if (appId === "forestry-project") {
      switch (activeView) {
        case "dashboard": return <ForestryDashboardView onNavigate={setActiveView} />;
        case "forestry-projects": return <ForestryProjectsView />;
        case "forestry-objects": return <ForestryObjectsView />;
        case "employee-register": return <EmployeeRegisterView />;
        case "audit-log": return <AuditLogView />;
        case "settings": return <SettingsView />;
        case "process-guide": return <ForestryProcessGuideView />;
        case "contract-data": return <ContractDataRegistryView />;
        case "version-management": return <VersionManagementView />;
        case "iso-standards": return <IsoStandardsView />;
        case "gantt-view":
        case "kanban-board":
        case "client-register":
        case "project-id":
        case "comp-groups":
        case "project-defaults":
          return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Settings className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground max-w-md">
                This module is currently under development and will be available in a future release.
              </p>
            </div>
          );
        default: return <ForestryDashboardView onNavigate={setActiveView} />;
      }
    }

    switch (activeView) {
      case "dashboard": return <DashboardView onNavigate={setActiveView} />;
      case "operations": return <OperationsView onNavigate={(view, empId) => {
        if (empId) setPreselectedEmployeeId(empId);
        setActiveView(view);
      }} />;
      case "employee-register": return <EmployeeRegisterView />;
      case "invitations": return <InvitationsView onShowPreview={() => setShowPreview(true)} />;
      case "contracts": return <ContractsView onContinueContract={handleContinueContract} />;
      case "settings": return <SettingsView />;
      case "contract-template": return <ContractTemplateView resumeContractId={resumeContractId} preselectedEmployeeId={preselectedEmployeeId} resumeMode={resumeMode} />;
      case "company-register": return <CompanyRegisterView />;
      case "process-guide": return <ProcessGuideView />;
      case "employee-id-settings": return <EmployeeIdSettingsView />;
      case "contract-id-settings": return <ContractIdSettingsView />;
      case "invitation-template": return <InvitationTemplateView onShowPreview={() => setShowPreview(true)} />;
      case "contract-data": return <ContractDataRegistryView />;
      case "bank-list": return <BankListView />;
      case "iso-standards": return <IsoStandardsView />;
      case "audit-log": return <AuditLogView />;
      case "user-management": return <UserManagementView />;
      case "role-permissions": return <RolePermissionMatrix />;
      case "version-management": return <VersionManagementView />;
      case "issue-tracker": return <IssueTrackerView />;
      case "data-handling": return <DataHandlingView />;
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
        <main className="flex-1 min-w-0 overflow-auto flex flex-col">
          <VersionUpdateBanner />
          <div className="flex items-center justify-end px-6 pt-4 pb-0">
            <TopVersionBadge />
          </div>
          <div className={cn("mx-auto px-6 pb-6 flex-1 w-full", isConstrained && "max-w-full")}>
            {renderView()}
          </div>
        </main>
        <IssueReportButton />
      </div>
    </div>
  );
}
