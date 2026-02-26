import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadApps, getIcon, getColor, type AppDefinition } from "./AppLauncher";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, UserCheck, Briefcase, Wallet, Users, User, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "admin", label: "Super Admin", icon: Shield },
  { value: "org_admin", label: "Admin", icon: ShieldCheck },
  { value: "hr_manager", label: "HR Manager", icon: UserCheck },
  { value: "project_manager", label: "Project Manager", icon: Briefcase },
  { value: "payroll_manager", label: "Payroll Manager", icon: Wallet },
  { value: "team_leader", label: "Team Leader", icon: Users },
  { value: "user", label: "Standard User", icon: User },
];

const DEFAULT_ACCESS: Record<string, string[]> = {
  "hr-management": ["admin", "org_admin", "hr_manager"],
  "user-management": ["admin"],
  "forestry-project": ["admin", "org_admin", "project_manager"],
  "payroll": ["admin", "org_admin", "payroll_manager"],
  "employee-hub": ["admin", "org_admin", "hr_manager", "project_manager", "payroll_manager", "team_leader", "user"],
};

export function RolePermissionMatrix() {
  const queryClient = useQueryClient();
  const apps = useMemo(() => loadApps(), []);

  const { data: accessRows = [], isLoading } = useQuery({
    queryKey: ["role-app-access"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_app_access").select("*");
      if (error) throw error;
      return data as { id: string; role: string; app_id: string }[];
    },
  });

  const accessSet = useMemo(() => {
    const set = new Set<string>();
    accessRows.forEach((r) => set.add(`${r.role}::${r.app_id}`));
    return set;
  }, [accessRows]);

  const grantMutation = useMutation({
    mutationFn: async ({ role, appId }: { role: string; appId: string }) => {
      const { error } = await supabase.from("role_app_access").insert({ role, app_id: appId });
      if (error) throw error;
    },
    onSuccess: (_, { role, appId }) => {
      queryClient.invalidateQueries({ queryKey: ["role-app-access"] });
      const roleName = ROLES.find((r) => r.value === role)?.label ?? role;
      const appName = apps.find((a) => a.id === appId)?.name ?? appId;
      toast({ title: `${roleName} can now access ${appName}` });
    },
    onError: () => toast({ title: "Failed to grant access", variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ role, appId }: { role: string; appId: string }) => {
      const { error } = await supabase.from("role_app_access").delete().eq("role", role).eq("app_id", appId);
      if (error) throw error;
    },
    onSuccess: (_, { role, appId }) => {
      queryClient.invalidateQueries({ queryKey: ["role-app-access"] });
      const roleName = ROLES.find((r) => r.value === role)?.label ?? role;
      const appName = apps.find((a) => a.id === appId)?.name ?? appId;
      toast({ title: `${roleName} access to ${appName} removed` });
    },
    onError: () => toast({ title: "Failed to revoke access", variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      // Delete all, then re-insert defaults
      const { error: delErr } = await supabase.from("role_app_access").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (delErr) throw delErr;
      const rows = Object.entries(DEFAULT_ACCESS).flatMap(([appId, roles]) =>
        roles.map((role) => ({ role, app_id: appId }))
      );
      const { error: insErr } = await supabase.from("role_app_access").insert(rows);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-app-access"] });
      toast({ title: "Permissions reset to defaults" });
    },
    onError: () => toast({ title: "Failed to reset permissions", variant: "destructive" }),
  });

  const handleToggle = (role: string, appId: string, currentlyGranted: boolean) => {
    // Prevent lockout: Super Admin must always have User Management access
    if (role === "admin" && appId === "user-management" && currentlyGranted) {
      toast({ title: "Cannot remove Super Admin access to User Management", variant: "destructive" });
      return;
    }
    if (currentlyGranted) {
      revokeMutation.mutate({ role, appId });
    } else {
      grantMutation.mutate({ role, appId });
    }
  };

  const isMutating = grantMutation.isPending || revokeMutation.isPending;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Role Permission Matrix</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure which roles can access each application</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => resetMutation.mutate()}
          disabled={resetMutation.isPending}
          className="gap-2"
        >
          {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Reset to Defaults
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px] sticky left-0 bg-background z-10">Role</TableHead>
                    {apps.map((app) => {
                      const Icon = getIcon(app.iconName);
                      const color = getColor(app.colorIndex);
                      return (
                        <TableHead key={app.id} className="text-center min-w-[120px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color.bg)}>
                              <Icon className={cn("w-4 h-4", color.text)} />
                            </div>
                            <span className="text-xs font-medium leading-tight">{app.name.replace(" Management", "").replace(" Manager", "").replace(" System", "")}</span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLES.map((role) => {
                    const RoleIcon = role.icon;
                    return (
                      <TableRow key={role.value}>
                        <TableCell className="sticky left-0 bg-background z-10">
                          <div className="flex items-center gap-2.5">
                            <RoleIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm">{role.label}</span>
                          </div>
                        </TableCell>
                        {apps.map((app) => {
                          const key = `${role.value}::${app.id}`;
                          const granted = accessSet.has(key);
                          const isLocked = role.value === "admin" && app.id === "user-management";
                          return (
                            <TableCell key={app.id} className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={granted}
                                  onCheckedChange={() => handleToggle(role.value, app.id, granted)}
                                  disabled={isMutating || isLocked}
                                  aria-label={`${role.label} access to ${app.name}`}
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
