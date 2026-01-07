import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardView } from "./DashboardView";
import { EmployeesView } from "./EmployeesView";
import { InvitationsView } from "./InvitationsView";
import { ContractsView } from "./ContractsView";

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
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto animate-fade-up">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
