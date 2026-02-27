import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedTable, ColumnDef, FilterOption } from "@/components/ui/enhanced-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, UserCheck, Trash2, RefreshCw, UserPlus, Mail, Copy, Eye, EyeOff, ChevronDown, Info, Pencil, User, CircleDot, ShieldOff, Users, Briefcase, Wallet, Eraser, Send, Clock } from "lucide-react";
import { loadApps, type AppDefinition } from "./AppLauncher";
import type { Database } from "@/integrations/supabase/types";

type AppRole = string;

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

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "admin", label: "Super Admin" },
  { value: "org_admin", label: "Admin" },
  { value: "user", label: "Standard User" },
  { value: "team_leader", label: "Team Leader" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "project_manager", label: "Project Manager" },
  { value: "payroll_manager", label: "Payroll Manager" },
];

const roleBadge = (role: string | null) => {
  const badge = (Icon: React.ComponentType<{ className?: string }>, label: string, colorClass: string) => (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
      {label}
    </span>
  );
  switch (role) {
    case "admin": return badge(Shield, "Super Admin", "text-indigo-600");
    case "org_admin": return badge(ShieldCheck, "Admin", "text-blue-600");
    case "hr_manager": return badge(UserCheck, "HR Manager", "text-sky-500");
    case "project_manager": return badge(Briefcase, "Project Manager", "text-amber-600");
    case "payroll_manager": return badge(Wallet, "Payroll Manager", "text-emerald-600");
    case "team_leader": return badge(Users, "Team Leader", "text-purple-500");
    case "user": return badge(User, "Standard User", "text-muted-foreground");
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <CircleDot className="w-3.5 h-3.5" />
          No Role
        </span>
      );
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

// ─── Edit Name Dialog ───────────────────────────────────────────────

interface EditNameDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentName: string;
}

function EditNameDialog({ open, onClose, userId, currentName }: EditNameDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(currentName === "—" ? "" : currentName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name.trim() })
        .eq("user_id", userId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Name updated" });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to update name", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Edit User Name
          </DialogTitle>
          <DialogDescription>Update the display name for this user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Full Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
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
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());

  // Fetch role-based app access and auto-set when role changes
  const { data: roleAppAccess } = useQuery({
    queryKey: ["role-app-access", role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_app_access")
        .select("app_id")
        .eq("role", role);
      if (error) throw error;
      return data.map((r) => r.app_id);
    },
    enabled: open,
  });

  // Auto-set selectedApps whenever role's app access data arrives
  useEffect(() => {
    if (roleAppAccess) {
      setSelectedApps(new Set(roleAppAccess));
    }
  }, [roleAppAccess]);

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
    setSelectedApps(new Set());
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

interface PendingInvitation {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  app_access: string[] | null;
  invited_by: string | null;
  created_at: string;
}

interface UserRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: AppRole | null;
  status: "Approved" | "Pending" | "Invited";
  created_at: string;
  last_sign_in_at: string | null;
  appCount: number;
  isPendingInvitation?: boolean;
}

// ─── Main View ──────────────────────────────────────────────────────

export function UserManagementView() {
  const queryClient = useQueryClient();
  const [deleteUser, setDeleteUser] = useState<{ user_id: string; email: string } | null>(null);
  const [deletePendingUser, setDeletePendingUser] = useState<{ user_id: string; email: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState<string | null>(null);
  
  const [editNameDialog, setEditNameDialog] = useState<{ userId: string; currentName: string } | null>(null);
  const apps = useMemo(() => loadApps(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

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

  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ["admin-pending-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pending_role_assignments").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as PendingInvitation[];
    },
  });

  const roleMap = useMemo(() => {
    const priority = ["admin", "org_admin", "hr_manager", "project_manager", "payroll_manager", "team_leader", "user"];
    const m = new Map<string, string>();
    roles.forEach((r) => {
      const existing = m.get(r.user_id);
      if (!existing || priority.indexOf(r.role) < priority.indexOf(existing)) {
        m.set(r.user_id, r.role);
      }
    });
    return m;
  }, [roles]);
  const accessMap = useMemo(() => {
    const m = new Map<string, string[]>();
    appAccess.forEach((a) => {
      const list = m.get(a.user_id) || [];
      list.push(a.app_id);
      m.set(a.user_id, list);
    });
    return m;
  }, [appAccess]);

  const userRows: UserRow[] = useMemo(() => {
    const profileRows: UserRow[] = profiles.map((p) => {
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
        appCount: 0,
      };
    });

    // Add pending invitations (users who haven't signed in yet)
    const existingEmails = new Set(profiles.map((p) => p.email?.toLowerCase()));
    const invitedRows: UserRow[] = pendingInvitations
      .filter((inv) => !existingEmails.has(inv.email.toLowerCase()))
      .map((inv) => ({
        id: `pending-${inv.id}`,
        user_id: inv.id,
        full_name: inv.full_name || "—",
        email: inv.email,
        role: inv.role,
        status: "Invited" as const,
        created_at: inv.created_at,
        last_sign_in_at: null,
        appCount: inv.app_access?.length ?? 0,
        isPendingInvitation: true,
      }));

    return [...profileRows, ...invitedRows];
  },
  [profiles, roleMap, accessMap, pendingInvitations]);

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Use secure RPC function to assign role (avoids RLS race condition)
      const { error } = await supabase.rpc("assign_user_role", {
        _target_user_id: userId,
        _new_role: role as any,
      });
      if (error) throw error;
      await supabase.from("profiles").update({ role: "approved" }).eq("user_id", userId);

      // Find user info for email notification
      const user = userRows.find((u) => u.user_id === userId);
      if (user?.email) {
        try {
          await supabase.functions.invoke("send-role-notification", {
            body: {
              email: user.email,
              userName: user.full_name !== "—" ? user.full_name : user.email,
              role,
              loginUrl: "https://erptable.lovable.app",
            },
          });
        } catch (emailErr) {
          console.error("Role notification email failed:", emailErr);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: "Role updated — notification email sent" });
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
      toast({ title: "Access revoked — user set back to pending" });
      setDeleteUser(null);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to revoke access", description: err.message, variant: "destructive" });
      setDeleteUser(null);
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete the profile (pending user with no role)
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "User deleted from system" });
      setDeletePendingUser(null);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete user", description: err.message, variant: "destructive" });
      setDeletePendingUser(null);
    },
  });

  const deletePendingInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.from("pending_role_assignments").delete().eq("id", invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Pending invitation removed" });
      setDeletePendingUser(null);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to remove invitation", description: err.message, variant: "destructive" });
      setDeletePendingUser(null);
    },
  });

  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const handleResendInvite = async (row: UserRow) => {
    setResendingEmail(row.email);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: row.email,
          full_name: row.full_name !== "—" ? row.full_name : row.email,
          role: row.role,
          resend_only: true,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: data.email_sent ? "Invite email resent" : "Resend failed",
        description: data.message,
        variant: data.email_sent ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Failed to resend invite", description: err.message, variant: "destructive" });
    } finally {
      setResendingEmail(null);
    }
  };

  const handleCleanupOrphan = async (email: string) => {
    setCleaningUp(email);
    try {
      const { data, error } = await supabase.functions.invoke("cleanup-orphan-user", {
        body: { email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Orphan cleaned up", description: data.message });
      invalidateAll();
    } catch (err: any) {
      toast({ title: "Cleanup failed", description: err.message, variant: "destructive" });
    } finally {
      setCleaningUp(null);
    }
  };

  const pendingCount = userRows.filter((u) => u.status === "Pending").length;
  const invitedCount = userRows.filter((u) => u.status === "Invited").length;
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
      render: (row) => {
        const dotColor = row.status === "Invited" ? "bg-blue-500" : row.status === "Pending" ? "bg-amber-500" : "bg-emerald-500";
        const textClass = row.status === "Approved" ? "text-foreground" : "text-muted-foreground";
        return (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span className={textClass}>
              {row.status === "Invited" ? "Invited" : row.status}
            </span>
          </span>
        );
      },
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
      render: (row) => {
        if (row.isPendingInvitation) {
          return <span className="text-xs text-muted-foreground italic">Awaiting sign-in</span>;
        }
        const isSelf = row.user_id === currentUserId;
        return (
          <Select
            value={row.role ?? ""}
            onValueChange={(val) => assignRoleMutation.mutate({ userId: row.user_id, role: val as AppRole })}
            disabled={isSelf}
          >
            <SelectTrigger className={`w-[140px] h-8 text-xs ${isSelf ? "opacity-50 cursor-not-allowed" : ""}`} title={isSelf ? "You cannot change your own role" : undefined}>
              <SelectValue placeholder="Select role…" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
  ];

  const filters: FilterOption[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "Approved", label: "Approved", dot: "bg-emerald-500" },
        { value: "Pending", label: "Pending", dot: "bg-amber-500" },
        { value: "Invited", label: "Invited", dot: "bg-blue-500" },
      ],
    },
    {
      key: "role",
      label: "Role",
      options: [
        { value: "admin", label: "Super Admin" },
        { value: "org_admin", label: "Admin" },
        { value: "user", label: "Standard User" },
        { value: "team_leader", label: "Team Leader" },
        { value: "hr_manager", label: "HR Manager" },
        { value: "project_manager", label: "Project Manager" },
        { value: "payroll_manager", label: "Payroll Manager" },
        { value: "pending", label: "No Role" },
      ],
    },
  ];

  const rowActions = (row: UserRow) => {
    const isSelf = row.user_id === currentUserId;

    // Pending invitation rows get resend + delete
    if (row.isPendingInvitation) {
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => handleResendInvite(row)}
            disabled={resendingEmail === row.email}
            title="Resend invite email"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeletePendingUser({ user_id: row.user_id, email: row.email })}
            title="Remove pending invitation"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    // Orphan: has a role + approved status but never signed in
    const isOrphan = row.role && !row.last_sign_in_at && !isSelf;

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setEditNameDialog({ userId: row.user_id, currentName: row.full_name })}
          title="Edit name"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        {isOrphan && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            onClick={() => handleCleanupOrphan(row.email)}
            disabled={cleaningUp === row.email}
            title="Clean up orphan (delete auth user, preserve role as pending)"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        )}
        {row.role ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteUser({ user_id: row.user_id, email: row.email })}
            title="Revoke access"
          >
            <ShieldOff className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeletePendingUser({ user_id: row.user_id, email: row.email })}
            title="Delete pending user"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-app-access"] });
    queryClient.invalidateQueries({ queryKey: ["admin-pending-invitations"] });
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
            {invitedCount > 0 && (
              <span className="ml-2 text-blue-600 font-medium">{invitedCount} invited</span>
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

      {editNameDialog && (
        <EditNameDialog
          open
          onClose={() => setEditNameDialog(null)}
          userId={editNameDialog.userId}
          currentName={editNameDialog.currentName}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        title="Revoke User Access"
        itemName={deleteUser?.email ?? ""}
        description="This will remove the user's role and set them back to pending status. They will lose all access to the system but their profile will remain."
        onConfirm={() => deleteUser && removeRoleMutation.mutate(deleteUser.user_id)}
        isLoading={removeRoleMutation.isPending}
        requireTypedConfirmation
      />

      <DeleteConfirmDialog
        open={!!deletePendingUser}
        onOpenChange={(open) => !open && setDeletePendingUser(null)}
        title={deletePendingUser && userRows.find(u => u.user_id === deletePendingUser.user_id)?.isPendingInvitation ? "Remove Pending Invitation" : "Delete Pending User"}
        itemName={deletePendingUser?.email ?? ""}
        description={
          deletePendingUser && userRows.find(u => u.user_id === deletePendingUser.user_id)?.isPendingInvitation
            ? "This will remove the pending invitation. The user will no longer be auto-approved when they sign in."
            : "This will permanently remove this pending user's profile from the system. This action cannot be undone."
        }
        onConfirm={() => {
          if (!deletePendingUser) return;
          const row = userRows.find(u => u.user_id === deletePendingUser.user_id);
          if (row?.isPendingInvitation) {
            deletePendingInvitationMutation.mutate(deletePendingUser.user_id);
          } else {
            deleteProfileMutation.mutate(deletePendingUser.user_id);
          }
        }}
        isLoading={deleteProfileMutation.isPending || deletePendingInvitationMutation.isPending}
        requireTypedConfirmation
      />
    </div>
  );
}
