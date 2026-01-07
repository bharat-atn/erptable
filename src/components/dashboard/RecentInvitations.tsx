import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  PENDING: { variant: "pending" as const, icon: Clock, label: "Pending" },
  SENT: { variant: "warning" as const, icon: Mail, label: "Sent" },
  ACCEPTED: { variant: "success" as const, icon: CheckCircle, label: "Accepted" },
  EXPIRED: { variant: "expired" as const, icon: XCircle, label: "Expired" },
};

export function RecentInvitations() {
  const { data: invitations, isLoading } = useQuery({
    queryKey: ["recent-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          employees (
            email,
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Recent Invitations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : invitations?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No invitations yet</p>
            <p className="text-sm">Create your first invitation to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations?.map((invitation) => {
              const status = statusConfig[invitation.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <StatusIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {invitation.employees?.first_name && invitation.employees?.last_name
                          ? `${invitation.employees.first_name} ${invitation.employees.last_name}`
                          : invitation.employees?.email || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invitation.type.replace("_", " ")} •{" "}
                        {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
