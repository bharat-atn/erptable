import { useState, useEffect } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  Users,
  FlaskConical,
  ArrowRight,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import erpLogo from "@/assets/erp-table-logo.png";

interface OrganizationPickerProps {
  onOrgSelected: () => void;
  isAdmin?: boolean;
  userEmail?: string | null;
}

export function OrganizationPicker({ onOrgSelected, isAdmin, userEmail }: OrganizationPickerProps) {
  const { orgs, switchOrg, loading, refreshOrgs } = useOrg();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState<"production" | "sandbox">("production");
  const [creating, setCreating] = useState(false);

  const handleSelect = async (orgId: string) => {
    await switchOrg(orgId);
    onOrgSelected();
  };

  const handleSignOut = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.rpc("log_auth_event", {
        _action: "LOGOUT",
        _user_id: session.user.id,
        _user_email: session.user.email ?? null,
        _summary: `${session.user.email} logged out from org picker`,
      });
    }
    await supabase.auth.signOut();
  };

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut();
    // After sign-out, the auth state change will show the login screen
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: org, error } = await supabase
        .from("organizations")
        .insert({
          name: newName.trim(),
          slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          org_type: newType,
          created_by: user.id,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("org_members").insert({
        org_id: org.id,
        user_id: user.id,
        role: "owner",
      } as any);

      toast.success(`Organization "${newName}" created!`);
      setCreateOpen(false);
      setNewName("");
      setNewSlug("");
      await refreshOrgs();
      await switchOrg(org.id);
      onOrgSelected();
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const orgTypeConfig = {
    production: { label: "Production", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Building2 },
    sandbox: { label: "Sandbox", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: FlaskConical },
    demo: { label: "Demo", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400", icon: FlaskConical },
  };

  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-xl ring-1 ring-border/50 overflow-hidden">
          {/* Header with logo */}
          <div className="flex flex-col items-center pt-8 pb-4 px-6 border-b border-border bg-muted/20">
            <img src={erpLogo} alt="ERP Table" className="h-14 w-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-1">Select Organization</h1>
            <p className="text-sm text-muted-foreground">Choose which organization to work in</p>
          </div>

          {/* User strip */}
          <div className="flex items-center gap-3 px-6 py-3 bg-muted/10 border-b border-border">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userEmail || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-muted-foreground hover:text-destructive">
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>

          {/* Org list */}
          <div className="p-4 space-y-2 max-h-[340px] overflow-y-auto">
            {orgs.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <p className="font-medium text-foreground mb-1">No Organizations Available</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {isAdmin
                    ? "Create your first organization to get started."
                    : "Contact your administrator to get access to an organization."}
                </p>
              </div>
            ) : (
              orgs.map((org) => {
                const config = orgTypeConfig[org.org_type as keyof typeof orgTypeConfig] || orgTypeConfig.production;
                const Icon = config.icon;
                return (
                  <button
                    key={org.id}
                    onClick={() => handleSelect(org.id)}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all duration-200 text-left w-full"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">{org.name}</span>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {org.member_count || 0} member{(org.member_count || 0) !== 1 ? "s" : ""}
                        <span className="opacity-50">/{org.slug}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-4 flex flex-col gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => setCreateOpen(true)}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Organization
              </Button>
            )}
            <button
              onClick={handleSwitchAccount}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-1"
            >
              <RefreshCw className="w-3 h-3" />
              Switch Account
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-3 bg-muted/10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure Enterprise Login
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug || newSlug === newName.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }
                }}
                placeholder="My Company"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="my-company"
              />
            </div>
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={newType === "production" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewType("production")}
                  className="gap-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  Production
                </Button>
                <Button
                  variant={newType === "sandbox" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewType("sandbox")}
                  className="gap-1.5"
                >
                  <FlaskConical className="w-4 h-4" />
                  Sandbox
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
