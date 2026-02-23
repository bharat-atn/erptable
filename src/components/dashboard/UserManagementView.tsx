import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { Shield, UserCheck, Clock, Trash2, RefreshCw, UserPlus, Mail, Copy, Eye, EyeOff } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: AppRole;
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

// ─── Invite User Dialog ─────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function InviteUserDialog({ open, onClose, onSuccess }: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("user");
  const [tempPassword] = useState(generateTempPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: email.trim(), full_name: fullName.trim(), role, temp_password: tempPassword },
      });
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
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite New User
          </DialogTitle>
        </DialogHeader>

        {result?.success ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">User created successfully!</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Temp Password:</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{tempPassword}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium">{ROLE_OPTIONS.find(r => r.value === role)?.label}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Share these credentials securely with the user. They should change their password after first login, or sign in with Google if available.
            </p>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={copyCredentials} className="gap-2">
                <Copy className="w-4 h-4" /> Copy Credentials
              </Button>
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
            <div className="space-y-1.5">
              <Label>Temporary Password</Label>
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
              <p className="text-xs text-muted-foreground">Auto-generated. The user should change it after first login.</p>
            </div>

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

// ─── Main View ──────────────────────────────────────────────────────

export function UserManagementView() {
  const queryClient = useQueryClient();
  const [deleteUser, setDeleteUser] = useState<{ user_id: string; email: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

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

  const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));

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

  const pendingCount = profiles.filter((p) => !roleMap.has(p.user_id)).length;
  const loading = loadingProfiles || loadingRoles;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage user access and roles.
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">{pendingCount} pending approval</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
              queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Assign Role</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => {
                const currentRole = roleMap.get(profile.user_id) ?? null;
                const isPending = !currentRole;

                return (
                  <TableRow key={profile.id} className={isPending ? "bg-amber-50/50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-foreground">{profile.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{profile.user_id.slice(0, 8)}…</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isPending ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Approved</Badge>
                      )}
                    </TableCell>
                    <TableCell>{roleBadge(currentRole)}</TableCell>
                    <TableCell>
                      <Select
                        value={currentRole ?? ""}
                        onValueChange={(val) => assignRoleMutation.mutate({ userId: profile.user_id, role: val as AppRole })}
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
                    </TableCell>
                    <TableCell>
                      {currentRole && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteUser({ user_id: profile.user_id, email: profile.full_name || profile.user_id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
          queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
        }}
      />

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
