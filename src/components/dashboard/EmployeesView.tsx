import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, User, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

type EmployeeStatus = "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE";

const statusVariants: Record<EmployeeStatus, "pending" | "warning" | "success" | "expired"> = {
  INVITED: "pending",
  ONBOARDING: "warning",
  ACTIVE: "success",
  INACTIVE: "expired",
};

export function EmployeesView() {
  const [search, setSearch] = useState("");

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

  const filteredEmployees = employees?.filter((emp) =>
    emp.email?.toLowerCase().includes(search.toLowerCase()) ||
    emp.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-muted-foreground text-sm">
          View and manage all employees in your organization
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            All Employees
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-[180px]"
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td colSpan={4} className="py-4 px-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredEmployees?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees?.map((employee) => (
                    <tr key={employee.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {employee.first_name ? (
                              <span className="text-xs font-medium text-primary">
                                {employee.first_name[0]}{employee.last_name?.[0] || ""}
                              </span>
                            ) : (
                              <User className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {employee.first_name && employee.last_name
                              ? `${employee.first_name} ${employee.last_name}`
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{employee.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusVariants[employee.status as EmployeeStatus]}>
                          {employee.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(employee.created_at), "yyyy-MM-dd")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
