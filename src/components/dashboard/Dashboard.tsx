import { useState } from "react";
import { Sidebar } from "./Sidebar";
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
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export function Dashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [showPreview, setShowPreview] = useState(false);
  const [resumeContractId, setResumeContractId] = useState<string | null>(null);

  const handleContinueContract = (contractId: string) => {
    setResumeContractId(contractId);
    setActiveView("contract-template");
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "operations":
        return <OperationsView />;
      case "employee-register":
        return <EmployeeRegisterView />;
      case "invitations":
        return <InvitationsView />;
      case "contracts":
        return <ContractsView onContinueContract={handleContinueContract} />;
      case "settings":
        return <SettingsView />;
      case "contract-template":
        return <ContractTemplateView resumeContractId={resumeContractId} />;
      case "company-register":
        return <CompanyRegisterView />;
      case "process-guide":
        return <ProcessGuideView />;
      case "employee-id-settings":
        return <EmployeeIdSettingsView />;
      case "contract-id-settings":
        return <ContractIdSettingsView />;
      default:
        return <DashboardView />;
    }
  };

  if (showPreview) {
    return <OnboardingPreview onClose={() => setShowPreview(false)} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
      
      {/* Floating button - Switch to Candidate View */}
      <Button
        variant="default"
        className="fixed bottom-6 right-6 shadow-lg gap-2"
        onClick={() => setShowPreview(true)}
      >
        <Eye className="w-4 h-4" />
        Switch to Candidate View
      </Button>
    </div>
  );
}
