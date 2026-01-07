import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User, Clock, CheckCircle, UserX } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  INVITED: { variant: "pending" as const, icon: Clock, label: "Invited" },
  ONBOARDING: { variant: "warning" as const, icon: User, label: "Onboarding" },
  ACTIVE: { variant: "success" as const, icon: CheckCircle, label: "Active" },
  INACTIVE: { variant: "expired" as const, icon: UserX, label: "Inactive" },
};

export function EmployeesView() {
  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Employees</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all employees in your organization
        </p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            All Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : employees?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No employees yet</p>
              <p className="text-sm">Create an invitation to add employees</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {employees?.map((employee) => {
                const status = statusConfig[employee.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {employee.first_name ? (
                          <span className="font-semibold text-primary">
                            {employee.first_name[0]}
                            {employee.last_name?.[0] || ""}
                          </span>
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {employee.first_name && employee.last_name
                            ? `${employee.first_name} ${employee.last_name}`
                            : employee.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Added {format(new Date(employee.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={status.variant}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
