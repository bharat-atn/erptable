import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedTable, ColumnDef, FilterOption } from "@/components/ui/enhanced-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { Shield, UserCheck, Clock, Trash2, RefreshCw, UserPlus, Mail, Copy, Eye, EyeOff, ChevronDown, Info, Settings2 } from "lucide-react";
import { loadApps, type AppDefinition } from "./AppLauncher";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

interface UserAppAccess {
  user_id: string;
  app_id: string;
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Super Admin" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "hr_staff", label: "HR Staff" },
  { value: "user", label: "User" },
];

const roleBadge = (role: AppRole | null) => {
  switch (role) {
    case "admin": return <Badge variant="destructive" className="gap-1"><Shield className="w-3 h-3" />Super Admin</Badge>;
    case "hr_admin": return <Badge className="gap-1 bg-blue-600"><UserCheck className="w-3 h-3" />HR Admin</Badge>;
    case "hr_staff": return <Badge className="gap-1 bg-emerald-600"><UserCheck className="w-3 h-3" />HR Staff</Badge>;
    case "user": return <Badge variant="secondary" className="gap-1">User</Badge>;
    default: return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50"><Clock className="w-3 h-3" />Pending</Badge>;
  }
};

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const specials = "!@#$%";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  pw += specials[Math.floor(Math.random() * specials.length)];
  return pw;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── App Access Dialog ──────────────────────────────────────────────

interface AppAccessDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentAccess: string[];
  apps: AppDefinition[];
}

function AppAccessDialog({ open, onClose, userId, userName, currentAccess, apps }: AppAccessDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set(currentAccess));
  const [saving, setSaving] = useState(false);

  const toggle = (appId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing
      await supabase.from("user_app_access").delete().eq("user_id", userId);
      // Insert new
      const rows = Array.from(selected).map((app_id) => ({ user_id: userId, app_id }));
      if (rows.length > 0) {
        const { error } = await supabase.from("user_app_access").insert(rows);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-app-access"] });
      toast({ title: "App access updated" });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            App Access — {userName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">Toggle which applications this user can access.</p>
          {apps.filter(a => a.enabled).map((app) => (
            <label key={app.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
              <Checkbox
                checked={selected.has(app.id)}
                onCheckedChange={() => toggle(app.id)}
              />
              <div>
                <p className="text-sm font-medium">{app.name}</p>
                <p className="text-xs text-muted-foreground">{app.description?.slice(0, 60)}…</p>
              </div>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invite User Dialog ─────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apps: AppDefinition[];
}

function InviteUserDialog({ open, onClose, onSuccess, apps }: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("user");
  const [tempPassword] = useState(generateTempPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set(apps.filter(a => a.enabled).map(a => a.id)));

  const toggleApp = (appId: string) => {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const body: any = {
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        app_access: Array.from(selectedApps),
      };
      // Only send temp_password if fallback is expanded (user wants it)
      if (showFallback) {
        body.temp_password = tempPassword;
      }
      const { data, error } = await supabase.functions.invoke("invite-user", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({ success: true, message: data.message });
      toast({ title: "User invited successfully" });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Failed to invite user", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = `Login Credentials\nEmail: ${email}\nTemporary Password: ${tempPassword}\nPlease sign in and change your password.`;
    navigator.clipboard.writeText(text);
    toast({ title: "Credentials copied to clipboard" });
  };

  const handleClose = () => {
    setEmail("");
    setFullName("");
    setRole("user");
    setResult(null);
    setShowFallback(false);
    setSelectedApps(new Set(apps.filter(a => a.enabled).map(a => a.id)));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite New User
          </DialogTitle>
        </DialogHeader>

        {result?.success ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">User invited successfully!</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium">{ROLE_OPTIONS.find(r => r.value === role)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sign-in method:</span>
                  <span className="font-medium">Google</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                The user can now sign in with their Google account ({email}). No further action needed.
              </p>
            </div>
            {showFallback && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Fallback credentials (if Google unavailable):</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Temp Password:</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{tempPassword}</span>
                </div>
                <Button variant="outline" size="sm" onClick={copyCredentials} className="gap-2 w-full">
                  <Copy className="w-4 h-4" /> Copy Credentials
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@company.com"
                  type="email"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Full Name (optional)</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assign Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* App Access */}
            <div className="space-y-2">
              <Label>Application Access</Label>
              <div className="rounded-lg border border-border p-3 space-y-2">
                {apps.filter(a => a.enabled).map((app) => (
                  <label key={app.id} className="flex items-center gap-3 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedApps.has(app.id)}
                      onCheckedChange={() => toggleApp(app.id)}
                    />
                    <span className="text-sm">{app.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Google-first messaging */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                The user will sign in with their Google account. No password needed.
              </p>
            </div>

            {/* Fallback password - collapsed by default */}
            <Collapsible open={showFallback} onOpenChange={setShowFallback}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className={`w-3 h-3 transition-transform ${showFallback ? "rotate-180" : ""}`} />
                  Advanced: Set fallback password
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Temporary Password (fallback only)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={tempPassword}
                        readOnly
                        type={showPassword ? "text" : "password"}
                        className="font-mono text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Only use if the user cannot sign in with Google.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleInvite} disabled={isLoading} className="gap-2">
                {isLoading ? "Creating…" : <><UserPlus className="w-4 h-4" /> Invite User</>}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Merged User Row Type ───────────────────────────────────────────

interface UserRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: AppRole | null;
  status: "Approved" | "Pending";
  created_at: string;
  last_sign_in_at: string | null;
  appCount: number;
}

// ─── Main View ──────────────────────────────────────────────────────

export function UserManagementView() {
  const queryClient = useQueryClient();
  const [deleteUser, setDeleteUser] = useState<{ user_id: string; email: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [accessDialog, setAccessDialog] = useState<{ userId: string; name: string; access: string[] } | null>(null);
  const apps = useMemo(() => loadApps(), []);

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const { data: appAccess = [] } = useQuery({
    queryKey: ["admin-app-access"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_app_access").select("user_id, app_id");
      if (error) throw error;
      return data as UserAppAccess[];
    },
  });

  const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));
  const accessMap = useMemo(() => {
    const m = new Map<string, string[]>();
    appAccess.forEach((a) => {
      const list = m.get(a.user_id) || [];
      list.push(a.app_id);
      m.set(a.user_id, list);
    });
    return m;
  }, [appAccess]);

  const userRows: UserRow[] = useMemo(() =>
    profiles.map((p) => {
      const currentRole = roleMap.get(p.user_id) ?? null;
      return {
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name || "—",
        email: p.email || p.user_id.slice(0, 8) + "…",
        role: currentRole,
        status: currentRole ? "Approved" : "Pending",
        created_at: p.created_at,
        last_sign_in_at: p.last_sign_in_at,
        appCount: accessMap.get(p.user_id)?.length ?? 0,
      };
    }),
  [profiles, roleMap, accessMap]);

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const existing = roleMap.get(userId);
      if (existing) {
        const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
      await supabase.from("profiles").update({ role: "approved" }).eq("user_id", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: "Role updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update role", description: err.message, variant: "destructive" });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (error) throw error;
      await supabase.from("profiles").update({ role: "pending" }).eq("user_id", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: "User role removed" });
      setDeleteUser(null);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to remove role", description: err.message, variant: "destructive" });
      setDeleteUser(null);
    },
  });

  const pendingCount = userRows.filter((u) => u.status === "Pending").length;
  const loading = loadingProfiles || loadingRoles;

  const columns: ColumnDef<UserRow>[] = [
    {
      key: "full_name",
      header: "Name",
      sortable: true,
      render: (row, hl) => (
        <div>
          <p className="font-medium text-sm text-foreground">{hl ? hl(row.full_name) : row.full_name}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (row, hl) => (
        <span className="text-sm text-muted-foreground">{hl ? hl(row.email) : row.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      accessor: (row) => row.role || "pending",
      render: (row) => roleBadge(row.role),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) =>
        row.status === "Pending" ? (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending</Badge>
        ) : (
          <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Approved</Badge>
        ),
    },
    {
      key: "appCount",
      header: "Apps",
      sortable: true,
      align: "center",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation();
            setAccessDialog({
              userId: row.user_id,
              name: row.full_name,
              access: accessMap.get(row.user_id) || [],
            });
          }}
        >
          <Settings2 className="w-3 h-3" />
          {row.appCount}
        </Button>
      ),
    },
    {
      key: "last_sign_in_at",
      header: "Last Active",
      sortable: true,
      defaultVisible: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">{timeAgo(row.last_sign_in_at)}</span>
      ),
    },
    {
      key: "assign",
      header: "Assign Role",
      hideable: false,
      render: (row) => (
        <Select
          value={row.role ?? ""}
          onValueChange={(val) => assignRoleMutation.mutate({ userId: row.user_id, role: val as AppRole })}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Select role…" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  const filters: FilterOption[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "Approved", label: "Approved", dot: "bg-emerald-500" },
        { value: "Pending", label: "Pending", dot: "bg-amber-500" },
      ],
    },
    {
      key: "role",
      label: "Role",
      options: [
        { value: "admin", label: "Super Admin" },
        { value: "hr_admin", label: "HR Admin" },
        { value: "hr_staff", label: "HR Staff" },
        { value: "user", label: "User" },
        { value: "pending", label: "No Role" },
      ],
    },
  ];

  const rowActions = (row: UserRow) => (
    row.role ? (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setDeleteUser({ user_id: row.user_id, email: row.full_name })}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    ) : null
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-app-access"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage user access, roles, and application permissions.
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">{pendingCount} pending approval</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={invalidateAll}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4" />
            Invite User
          </Button>
        </div>
      </div>

      <EnhancedTable
        data={userRows}
        columns={columns}
        rowKey={(row) => row.id}
        isLoading={loading}
        emptyMessage="No users found"
        enableSearch
        searchPlaceholder="Search by name or email…"
        enableHighlight
        enablePagination
        defaultPageSize={20}
        filters={filters}
        enableColumnToggle
        enableDenseToggle
        stickyHeader
        rowActions={rowActions}
        defaultSortKey="created_at"
        defaultSortDirection="asc"
      />

      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={invalidateAll}
        apps={apps}
      />

      {accessDialog && (
        <AppAccessDialog
          open
          onClose={() => setAccessDialog(null)}
          userId={accessDialog.userId}
          userName={accessDialog.name}
          currentAccess={accessDialog.access}
          apps={apps}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        title="Remove User Role"
        itemName={deleteUser?.email ?? ""}
        description="This will remove the user's role and set them back to pending status. They will lose access to the system."
        onConfirm={() => deleteUser && removeRoleMutation.mutate(deleteUser.user_id)}
        isLoading={removeRoleMutation.isPending}
        requireTypedConfirmation
      />
    </div>
  );
}
