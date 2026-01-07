import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "./StatsCard";
import { RecentInvitations } from "./RecentInvitations";
import { Users, Mail, FileText, CheckCircle } from "lucide-react";

export function DashboardView() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [employees, invitations, contracts] = await Promise.all([
        supabase.from("employees").select("id, status"),
        supabase.from("invitations").select("id, status"),
        supabase.from("contracts").select("id, signed_at"),
      ]);

      return {
        totalEmployees: employees.data?.length || 0,
        activeEmployees: employees.data?.filter((e) => e.status === "ACTIVE").length || 0,
        pendingInvitations: invitations.data?.filter((i) => i.status === "PENDING" || i.status === "SENT").length || 0,
        signedContracts: contracts.data?.filter((c) => c.signed_at).length || 0,
      };
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your onboarding activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          subtitle="In your organization"
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Active Employees"
          value={stats?.activeEmployees || 0}
          subtitle="Completed onboarding"
          icon={CheckCircle}
          variant="default"
        />
        <StatsCard
          title="Pending Invitations"
          value={stats?.pendingInvitations || 0}
          subtitle="Awaiting response"
          icon={Mail}
          variant="accent"
        />
        <StatsCard
          title="Signed Contracts"
          value={stats?.signedContracts || 0}
          subtitle="This period"
          icon={FileText}
          variant="default"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentInvitations />
      </div>
    </div>
  );
}
