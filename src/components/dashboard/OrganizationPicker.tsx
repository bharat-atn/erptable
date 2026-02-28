import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Crown,
} from "lucide-react";
import { toast } from "sonner";

interface OrganizationPickerProps {
  onOrgSelected: () => void;
  isAdmin?: boolean;
}

export function OrganizationPicker({ onOrgSelected, isAdmin }: OrganizationPickerProps) {
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

      // Add creator as owner
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Select Organization</h1>
          <p className="text-muted-foreground">Choose which organization you want to work in</p>
        </div>

        <div className="grid gap-3">
          {orgs.map((org) => {
            const config = orgTypeConfig[org.org_type as keyof typeof orgTypeConfig] || orgTypeConfig.production;
            const Icon = config.icon;
            return (
              <button
                key={org.id}
                onClick={() => handleSelect(org.id)}
                className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 text-left w-full"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">{org.name}</span>
                    <Badge variant="secondary" className={`text-xs ${config.color}`}>
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {org.member_count || 0} member{(org.member_count || 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs opacity-60">/{org.slug}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Organization
            </Button>
          </div>
        )}

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
    </div>
  );
}
