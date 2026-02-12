import { useState } from "react";
import { Sidebar, screenSizes, type ScreenSizeOption } from "./Sidebar";
import { DashboardView } from "./DashboardView";
import { EmployeeRegisterView } from "./EmployeeRegisterView";
import { InvitationsView } from "./InvitationsView";
import { ContractsView } from "./ContractsView";
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
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  onBackToLauncher?: () => void;
}

export function Dashboard({ onBackToLauncher }: DashboardProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [showPreview, setShowPreview] = useState(false);
  const [resumeContractId, setResumeContractId] = useState<string | null>(null);
  const [screenSize, setScreenSize] = useState<ScreenSizeOption>(screenSizes[screenSizes.length - 1]);

  const handleContinueContract = (contractId: string) => {
    setResumeContractId(contractId);
    setActiveView("contract-template");
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <DashboardView />;
      case "operations": return <OperationsView />;
      case "employee-register": return <EmployeeRegisterView />;
      case "invitations": return <InvitationsView />;
      case "contracts": return <ContractsView onContinueContract={handleContinueContract} />;
      case "settings": return <SettingsView />;
      case "contract-template": return <ContractTemplateView resumeContractId={resumeContractId} />;
      case "company-register": return <CompanyRegisterView />;
      case "process-guide": return <ProcessGuideView />;
      case "employee-id-settings": return <EmployeeIdSettingsView />;
      case "contract-id-settings": return <ContractIdSettingsView />;
      case "invitation-template": return <InvitationTemplateView />;
      case "contract-data": return <ContractDataRegistryView />;
      default: return <DashboardView />;
    }
  };

  if (showPreview) {
    return <OnboardingPreview onClose={() => setShowPreview(false)} />;
  }

  const isConstrained = screenSize.width !== null;

  return (
    <div className="flex justify-center min-h-screen bg-muted/30">
      <div
        className={cn(
          "flex min-h-screen bg-background w-full transition-all duration-300 ease-out",
          isConstrained && "shadow-xl border-x border-border/50"
        )}
        style={{ maxWidth: isConstrained ? `${screenSize.width}px` : undefined }}
      >
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          activeScreenSize={screenSize}
          onScreenSizeChange={setScreenSize}
          onBackToLauncher={onBackToLauncher}
        />
        <main className="flex-1 min-w-0 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
        
        {(activeView === "invitations" || activeView === "invitation-template") && (
          <Button
            variant="default"
            className="fixed bottom-6 right-6 shadow-lg gap-2 z-40"
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
