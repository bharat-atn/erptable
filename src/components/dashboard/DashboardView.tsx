import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "./StatsCard";
import { OnboardingActivityChart } from "./OnboardingActivityChart";
import { OnboardingStatusChart } from "./OnboardingStatusChart";
import { RecentInvitationsTable } from "./RecentInvitationsTable";
import { CreateInvitationDialog } from "./CreateInvitationDialog";
import { Users, Mail, FileCheck, AlertCircle } from "lucide-react";

export function DashboardView() {
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

      return {
        totalEmployees: employees.data?.filter((e) => e.status === "ACTIVE").length || 0,
        pendingInvites: invitations.data?.filter((i) => i.status === "PENDING" || i.status === "SENT").length || 0,
        completedOnboarding: invitations.data?.filter((i) => i.status === "ACCEPTED").length || 0,
        failedExpired: invitations.data?.filter((i) => i.status === "EXPIRED").length || 0,
        expiringSoon,
      };
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Active Employees"
          value={stats?.totalEmployees || 0}
          subtitle="+12% from last month"
          subtitleColor="green"
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
          title="Completed Onboarding"
          value={stats?.completedOnboarding || 0}
          subtitle="+4 this week"
          subtitleColor="green"
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
