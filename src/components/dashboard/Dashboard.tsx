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
import { KanbanBoardView } from "./KanbanBoardView";
import { GanttView } from "./GanttView";
import { ProjectSetupView } from "./ProjectSetupView";
import { ClientRegisterView } from "./ClientRegisterView";
import { ProjectIdSettingsView } from "./ProjectIdSettingsView";
import { CompGroupView } from "./CompGroupView";
import { ProjectDefaultsView } from "./ProjectDefaultsView";
import { TopVersionBadge } from "./TopVersionBadge";
import { PayrollDashboardView } from "./PayrollDashboardView";
import { PayrollRunsView } from "./payroll/PayrollRunsView";
import { SalarySlipsView } from "./payroll/SalarySlipsView";
import { TaxReportsView } from "./payroll/TaxReportsView";
import { TaxSettingsView } from "./payroll/TaxSettingsView";
import { SalaryTablesView } from "./payroll/SalaryTablesView";
import { DeductionsView } from "./payroll/DeductionsView";
import { PaymentMethodsView } from "./payroll/PaymentMethodsView";
import { AbsenceView } from "./payroll/AbsenceView";
import { HolidayView } from "./payroll/HolidayView";
import { AttestationView } from "./payroll/AttestationView";
import { PayrollReportsView } from "./payroll/PayrollReportsView";
import { SalaryEventsView } from "./payroll/SalaryEventsView";
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
  const [setupProjectId, setSetupProjectId] = useState<string | null>(null);
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
    // Payroll Management views
    if (appId === "payroll") {
      switch (activeView) {
        case "dashboard": return <PayrollDashboardView onNavigate={setActiveView} />;
        case "salary-events": return <SalaryEventsView />;
        case "absence": return <AbsenceView />;
        case "holiday": return <HolidayView />;
        case "attestation": return <AttestationView />;
        case "payroll-runs": return <PayrollRunsView />;
        case "salary-slips": return <SalarySlipsView />;
        case "tax-reports": return <TaxReportsView />;
        case "reports": return <PayrollReportsView />;
        case "deductions": return <DeductionsView />;
        case "salary-tables": return <SalaryTablesView />;
        case "tax-settings": return <TaxSettingsView />;
        case "payment-methods": return <PaymentMethodsView />;
        case "employee-register": return <EmployeeRegisterView />;
        case "audit-log": return <AuditLogView />;
        case "settings": return <SettingsView />;
        default: return <PayrollDashboardView onNavigate={setActiveView} />;
      }
    }

    // Forestry Project Manager views
    if (appId === "forestry-project") {
      switch (activeView) {
        case "dashboard": return <ForestryDashboardView onNavigate={setActiveView} onOpenSetup={(id) => { setSetupProjectId(id); setActiveView("project-setup"); }} />;
        case "forestry-projects": return <ForestryProjectsView onOpenSetup={(id) => { setSetupProjectId(id); setActiveView("project-setup"); }} />;
        case "project-setup": return <ProjectSetupView projectId={setupProjectId} onBack={() => setActiveView("forestry-projects")} />;
        case "forestry-objects": return <ForestryObjectsView />;
        case "employee-register": return <EmployeeRegisterView />;
        case "audit-log": return <AuditLogView />;
        case "settings": return <SettingsView />;
        case "process-guide": return <ForestryProcessGuideView />;
        case "contract-data": return <ContractDataRegistryView />;
        case "version-management": return <VersionManagementView />;
        case "iso-standards": return <IsoStandardsView />;
        case "gantt-view": return <GanttView />;
        case "kanban-board": return <KanbanBoardView />;
        case "client-register": return <ClientRegisterView />;
        case "project-id": return <ProjectIdSettingsView />;
        case "comp-groups": return <CompGroupView />;
        case "project-defaults": return <ProjectDefaultsView onBack={() => setActiveView("settings")} />;
        default: return <ForestryDashboardView onNavigate={setActiveView} onOpenSetup={(id) => { setSetupProjectId(id); setActiveView("project-setup"); }} />;
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
