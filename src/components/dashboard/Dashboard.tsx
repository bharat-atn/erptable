import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardView } from "./DashboardView";
import { EmployeesView } from "./EmployeesView";
import { InvitationsView } from "./InvitationsView";
import { ContractsView } from "./ContractsView";
import { SettingsView } from "./SettingsView";
import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";

export function Dashboard() {
  const [activeView, setActiveView] = useState("dashboard");

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "employees":
        return <EmployeesView />;
      case "invitations":
        return <InvitationsView />;
      case "contracts":
        return <ContractsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

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
        variant="outline"
        className="fixed bottom-4 right-4 shadow-lg"
        onClick={() => window.open("/onboard/demo", "_blank")}
      >
        <LayoutGrid className="w-4 h-4 mr-2" />
        Switch to Candidate View
      </Button>
    </div>
  );
}
