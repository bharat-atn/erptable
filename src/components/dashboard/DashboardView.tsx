import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "./StatsCard";
import { OnboardingActivityChart } from "./OnboardingActivityChart";
import { OnboardingStatusChart } from "./OnboardingStatusChart";
import { RecentInvitationsTable } from "./RecentInvitationsTable";
import { CreateInvitationDialog } from "./CreateInvitationDialog";
import { Users, Mail, FileCheck, AlertCircle, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardViewProps {
  onNavigate?: (view: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [employees, invitations] = await Promise.all([
        supabase.from("employees").select("id, status"),
        supabase.from("invitations").select("id, status, expires_at"),
      ]);

      const now = new Date();
      const expiringSoon = invitations.data?.filter((i) => {
        const expiresAt = new Date(i.expires_at);
        const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return i.status === "SENT" && daysUntilExpiry <= 3 && daysUntilExpiry > 0;
      }).length || 0;

      const totalEmployees = employees.data?.length || 0;
      const activeEmployees = employees.data?.filter((e) => e.status === "ACTIVE").length || 0;
      const pendingInvites = invitations.data?.filter((i) => i.status === "PENDING" || i.status === "SENT").length || 0;
      const completedOnboarding = invitations.data?.filter((i) => i.status === "ACCEPTED").length || 0;
      const failedExpired = invitations.data?.filter((i) => i.status === "EXPIRED").length || 0;

      // Fetch signed contracts count
      const { count: signedContracts } = await supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .in("signing_status", ["employer_signed", "signed"]);

      return {
        totalEmployees,
        activeEmployees,
        pendingInvites,
        completedOnboarding: (completedOnboarding || 0) + (signedContracts || 0),
        failedExpired,
        expiringSoon,
        signedContracts: signedContracts || 0,
      };
    },
  });

  const { data: pendingSignatures } = useQuery({
    queryKey: ["pending-signatures-details"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, contract_code, employees(first_name, last_name)")
        .eq("signing_status", "employee_signed");
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of onboarding metrics and activities.
          </p>
        </div>
        <CreateInvitationDialog />
      </div>

      {/* Pending Employer Signatures Banner */}
      {pendingSignatures && pendingSignatures.length > 0 && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <PenTool className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {pendingSignatures.length} contract{pendingSignatures.length > 1 ? "s" : ""} awaiting your signature
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {pendingSignatures.map((c: any) => {
                  const name = c.employees?.first_name ? `${c.employees.first_name} ${c.employees.last_name}` : "Unknown";
                  return `${c.contract_code || "Draft"} (${name})`;
                }).join(", ")}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
              onClick={() => onNavigate?.("contracts")}
            >
              Go to Contracts
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          subtitle={`${stats?.activeEmployees || 0} active`}
          subtitleColor={stats?.activeEmployees ? "green" : "default"}
          icon={Users}
          iconColor="blue"
        />
        <StatsCard
          title="Pending Invites"
          value={stats?.pendingInvites || 0}
          subtitle={`${stats?.expiringSoon || 0} expiring soon`}
          icon={Mail}
          iconColor="yellow"
        />
        <StatsCard
          title="Signed Contracts"
          value={stats?.signedContracts || 0}
          subtitle={stats?.signedContracts ? `${stats.signedContracts} completed` : "No contracts signed yet"}
          subtitleColor={stats?.signedContracts ? "green" : "default"}
          icon={FileCheck}
          iconColor="green"
        />
        <StatsCard
          title="Failed/Expired"
          value={stats?.failedExpired || 0}
          subtitle={stats?.failedExpired ? "Requires attention" : "All good"}
          subtitleColor={stats?.failedExpired ? "red" : "default"}
          icon={AlertCircle}
          iconColor="red"
        />
      </div>

      {/* Charts */}
      <div className="flex gap-4">
        <OnboardingActivityChart />
        <OnboardingStatusChart />
      </div>

      {/* Recent Invitations Table */}
      <RecentInvitationsTable />
    </div>
  );
}
