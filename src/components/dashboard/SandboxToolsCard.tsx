import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Database, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function SandboxToolsCard() {
  const { orgId, orgType } = useOrg();
  const { role } = useUserRole();
  const [restoring, setRestoring] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isSuperAdmin = role === "admin";
  const isSandbox = orgType === "sandbox";

  if (!isSuperAdmin || !isSandbox || !orgId) return null;

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("restore-sandbox-from-audit", {
        body: { sandboxOrgId: orgId },
      });
      if (error) throw error;
      toast.success(`Restored: ${data.restored.employees} employees, ${data.restored.invitations} invitations, ${data.restored.contracts} contracts`);
      if (data.skipped?.length > 0) {
        toast.info(`${data.skipped.length} records skipped (see console)`);
        console.log("Skipped records:", data.skipped);
      }
    } catch (err: any) {
      toast.error(err.message || "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-sandbox-data", {
        body: { sandboxOrgId: orgId, resetFirst: false },
      });
      if (error) throw error;
      toast.success(`Seeded: ${data.employees} employees, ${data.invitations} invitations, ${data.contracts} contracts, ${data.projects || 0} projects`);
    } catch (err: any) {
      toast.error(err.message || "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-sandbox-data", {
        body: { sandboxOrgId: orgId, resetFirst: true },
      });
      if (error) throw error;
      toast.success(`Reset complete: ${data.employees} employees, ${data.projects || 0} projects, ${data.objects || 0} objects`);
    } catch (err: any) {
      toast.error(err.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Card className="border-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            Sandbox Tools
            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">Super Admin</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">Manage sandbox test data. These actions only affect the sandbox organization.</p>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRestore} disabled={restoring} className="gap-1.5">
            {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Restore from Audit
          </Button>
          <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding} className="gap-1.5">
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            Seed New Dataset
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowResetConfirm(true)} disabled={resetting} className="gap-1.5">
            {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Reset & Reseed
          </Button>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Sandbox Data"
        itemName="all sandbox data"
        description="This will DELETE all sandbox employees, invitations, contracts, projects, and objects, then seed fresh test records."
        onConfirm={handleReset}
        isLoading={resetting}
        requireTypedConfirmation={false}
      />
    </>
  );
}
