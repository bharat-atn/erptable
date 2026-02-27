import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadApps, getIcon, getColor } from "./AppLauncher";
import { SIDEBAR_ITEMS_BY_APP, DEFAULT_SIDEBAR_ACCESS } from "@/lib/sidebar-registry";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, UserCheck, Briefcase, Wallet, Users, User, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ROLES = [
  { value: "admin", label: "Super Admin", icon: Shield },
  { value: "org_admin", label: "Admin", icon: ShieldCheck },
  { value: "hr_manager", label: "HR Manager", icon: UserCheck },
  { value: "project_manager", label: "Project Manager", icon: Briefcase },
  { value: "payroll_manager", label: "Payroll Manager", icon: Wallet },
  { value: "team_leader", label: "Team Leader", icon: Users },
  { value: "user", label: "Standard User", icon: User },
];

const GROUP_LABELS: Record<string, string> = {
  main: "Main",
  settings: "Settings",
  others: "Others",
};

export function SidebarPermissionsTab() {
  const queryClient = useQueryClient();
  const apps = useMemo(() => loadApps().filter((a) => SIDEBAR_ITEMS_BY_APP[a.id]), []);
  const [selectedAppId, setSelectedAppId] = useState(apps[0]?.id ?? "hr-management");

  const sidebarItems = SIDEBAR_ITEMS_BY_APP[selectedAppId] ?? [];
  const selectedApp = apps.find((a) => a.id === selectedAppId);

  const { data: accessRows = [], isLoading } = useQuery({
    queryKey: ["role-sidebar-access"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("role_sidebar_access").select("*");
      if (error) throw error;
      return data as { id: string; role: string; app_id: string; menu_item_id: string }[];
    },
  });

  const accessSet = useMemo(() => {
    const set = new Set<string>();
    accessRows.forEach((r) => set.add(`${r.role}::${r.app_id}::${r.menu_item_id}`));
    return set;
  }, [accessRows]);

  const grantMutation = useMutation({
    mutationFn: async ({ role, appId, menuItemId }: { role: string; appId: string; menuItemId: string }) => {
      const { error } = await (supabase as any).from("role_sidebar_access").insert({ role, app_id: appId, menu_item_id: menuItemId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role-sidebar-access"] }),
    onError: () => toast({ title: "Failed to grant access", variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ role, appId, menuItemId }: { role: string; appId: string; menuItemId: string }) => {
      const { error } = await (supabase as any).from("role_sidebar_access").delete().eq("role", role).eq("app_id", appId).eq("menu_item_id", menuItemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role-sidebar-access"] }),
    onError: () => toast({ title: "Failed to revoke access", variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      // Delete all for selected app
      const { error: delErr } = await (supabase as any).from("role_sidebar_access").delete().eq("app_id", selectedAppId);
      if (delErr) throw delErr;
      // Re-insert defaults for this app
      const defaults = DEFAULT_SIDEBAR_ACCESS[selectedAppId];
      if (!defaults) return;
      const rows = Object.entries(defaults).flatMap(([role, items]) =>
        items.map((menuItemId) => ({ role, app_id: selectedAppId, menu_item_id: menuItemId }))
      );
      if (rows.length > 0) {
        const { error: insErr } = await (supabase as any).from("role_sidebar_access").insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-sidebar-access"] });
      toast({ title: "Sidebar permissions reset to defaults" });
    },
    onError: () => toast({ title: "Failed to reset permissions", variant: "destructive" }),
  });

  const handleToggle = (role: string, menuItemId: string, currentlyGranted: boolean) => {
    if (currentlyGranted) {
      revokeMutation.mutate({ role, appId: selectedAppId, menuItemId });
    } else {
      grantMutation.mutate({ role, appId: selectedAppId, menuItemId });
    }
  };

  const isMutating = grantMutation.isPending || revokeMutation.isPending;

  // Group items by group
  const groupedItems = useMemo(() => {
    const groups: { label: string; items: typeof sidebarItems }[] = [];
    const seen = new Set<string>();
    for (const item of sidebarItems) {
      if (!seen.has(item.group)) {
        seen.add(item.group);
        groups.push({ label: GROUP_LABELS[item.group] || item.group, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }
    return groups;
  }, [sidebarItems]);

  const AppIcon = selectedApp ? getIcon(selectedApp.iconName) : null;
  const appColor = selectedApp ? getColor(selectedApp.colorIndex) : null;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sidebar Permissions</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure which sidebar items each role can see per application</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAppId} onValueChange={setSelectedAppId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {apps.map((app) => {
                const Icon = getIcon(app.iconName);
                const color = getColor(app.colorIndex);
                return (
                  <SelectItem key={app.id} value={app.id}>
                    <span className="flex items-center gap-2">
                      <div className={cn("w-5 h-5 rounded flex items-center justify-center", color.bg)}>
                        <Icon className={cn("w-3 h-3", color.text)} />
                      </div>
                      {app.name}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
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
                    <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">Sidebar Item</TableHead>
                    {ROLES.map((role) => {
                      const RoleIcon = role.icon;
                      return (
                        <TableHead key={role.value} className="text-center min-w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <RoleIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium leading-tight">{role.label}</span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedItems.map((group) => (
                    <>
                      <TableRow key={`group-${group.label}`} className="bg-muted/30">
                        <TableCell colSpan={ROLES.length + 1} className="py-1.5 sticky left-0">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.label}
                          </span>
                        </TableCell>
                      </TableRow>
                      {group.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="sticky left-0 bg-background z-10">
                            <span className="font-medium text-sm">{item.label}</span>
                          </TableCell>
                          {ROLES.map((role) => {
                            const key = `${role.value}::${selectedAppId}::${item.id}`;
                            const granted = accessSet.has(key);
                            return (
                              <TableCell key={role.value} className="text-center">
                                <div className="flex justify-center">
                                  <Switch
                                    checked={granted}
                                    onCheckedChange={() => handleToggle(role.value, item.id, granted)}
                                    disabled={isMutating}
                                    aria-label={`${role.label} access to ${item.label}`}
                                  />
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
