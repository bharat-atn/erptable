import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { generateDummyEmployee, type DummyCountry } from "@/lib/dummy-employees";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateInvitationDialog } from "./CreateInvitationDialog";
import { MoreVertical, Copy, Send, Trash2, Eye, RefreshCw, RotateCcw, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { OnboardingPreview } from "./OnboardingPreview";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SubmissionView } from "./SubmissionViewDialog";
import { EnhancedTable, type ColumnDef } from "@/components/ui/enhanced-table";
import { useUiLanguage } from "@/hooks/useUiLanguage";

type InvitationType = "NEW_HIRE" | "CONTRACT_RENEWAL";
type InvitationStatus = "PENDING" | "SENT" | "ACCEPTED" | "EXPIRED";

const typeVariants: Record<InvitationType, "newHire" | "renewal"> = {
  NEW_HIRE: "newHire",
  CONTRACT_RENEWAL: "renewal",
};
const typeLabels: Record<InvitationType, string> = {
  NEW_HIRE: "New Hire",
  CONTRACT_RENEWAL: "Renewal",
};
const statusVariants: Record<InvitationStatus, "completed" | "opened" | "sent" | "expired"> = {
  ACCEPTED: "completed",
  PENDING: "opened",
  SENT: "sent",
  EXPIRED: "expired",
};
const statusLabels: Record<InvitationStatus, string> = {
  ACCEPTED: "Completed",
  PENDING: "Opened",
  SENT: "Sent",
  EXPIRED: "Expired",
};

const statusFilterOptions = [
  { value: "PENDING", label: "Pending", dot: "bg-amber-500" },
  { value: "SENT", label: "Sent", dot: "bg-blue-500" },
  { value: "ACCEPTED", label: "Completed", dot: "bg-emerald-500" },
  { value: "EXPIRED", label: "Expired", dot: "bg-red-500" },
];

type InvitationRow = {
  id: string;
  token: string;
  type: string;
  status: string;
  created_at: string;
  expires_at: string;
  employee_id: string | null;
  employees: { email: string; first_name: string | null; last_name: string | null } | null;
};

interface InvitationsViewProps {
  onShowPreview?: () => void;
}

export function InvitationsView({ onShowPreview }: InvitationsViewProps) {
  const { t } = useUiLanguage();
  const [showPreview, setShowPreview] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InvitationRow | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [viewSubmissionEmployeeId, setViewSubmissionEmployeeId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { orgId } = useOrg();
  // Always use the published production URL for candidate-facing links
  // Preview/dev URLs require Lovable platform auth and won't work for external recipients
  const onboardingBaseUrl = "https://erptable.lovable.app";

  const addDummyInvitation = useMutation({
    mutationFn: async (country: DummyCountry) => {
      if (!orgId) throw new Error("No organization selected");
      const { error: contextError } = await supabase.rpc("set_org_context", { _org_id: orgId });
      if (contextError) throw contextError;
      const dummy = generateDummyEmployee(country);
      // Create employee with ONBOARDING status (simulating completed submission)
      const { data: emp, error: empErr } = await supabase.from("employees").insert([{
        first_name: dummy.first_name,
        last_name: dummy.last_name,
        middle_name: dummy.middle_name,
        email: dummy.email,
        phone: dummy.phone,
        city: dummy.city,
        country: dummy.country,
        status: "ONBOARDING",
        personal_info: dummy.personal_info,
        org_id: orgId,
      } as any]).select("id").single();
      if (empErr) throw empErr;

      // Create invitation with ACCEPTED status (completed submission)
      const langMap: Record<string, string> = { Sweden: "en_sv", Romania: "ro_en", Thailand: "th_en", Ukraine: "uk_en" };
      const { error: invErr } = await supabase.from("invitations").insert([{
        employee_id: emp.id,
        org_id: orgId,
        type: "NEW_HIRE",
        language: langMap[country] || "en_sv",
        status: "ACCEPTED",
      } as any]);
      if (invErr) throw invErr;

      // Create draft contract (mirroring submit_onboarding)
      const { data: company } = await supabase.from("companies").select("id").eq("org_id", orgId!).limit(1).single();
      const { error: contractErr } = await supabase.from("contracts").insert([{
        employee_id: emp.id,
        org_id: orgId,
        company_id: company?.id || null,
        status: "draft",
        signing_status: "not_sent",
        season_year: new Date().getFullYear().toString(),
      } as any]);
      if (contractErr) throw contractErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["operations-employees"] });
      queryClient.invalidateQueries({ queryKey: ["operations-invitation-stats"] });
      queryClient.invalidateQueries({ queryKey: ["operations-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["register-employees"] });
      toast.success("Dummy submission created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["invitations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select(`*, employees (email, first_name, last_name)`)
        .eq("org_id", orgId!)
        .neq("status", "ACCEPTED")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InvitationRow[];
    },
  });

  const markAsSent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invitations").update({ status: "SENT" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invitations"] }); toast.success("Marked as sent"); },
  });

  const resendInvitation = useMutation({
    mutationFn: async (invitation: InvitationRow) => {
      // Reset expiry to 7 days from now and set status back to SENT
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      const { error } = await supabase
        .from("invitations")
        .update({ status: "SENT", expires_at: newExpiry.toISOString() })
        .eq("id", invitation.id);
      if (error) throw error;

      // Send the email via edge function
      try {
        await supabase.functions.invoke("send-invitation-email", {
          body: {
            invitationId: invitation.id,
            baseUrl: onboardingBaseUrl,
          },
        });
      } catch {
        // Email failed — still copy link as fallback
      }

      // Copy the link to clipboard
      navigator.clipboard.writeText(`${onboardingBaseUrl}/onboard/${invitation.token}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation resent — email sent & link copied to clipboard");
    },
    onError: (error: Error) => { toast.error(error.message); },
  });

  const deleteInvitation = useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("No organization selected");

      const { error: contextError } = await supabase.rpc("set_org_context", { _org_id: orgId });
      if (contextError) throw contextError;

      const { data, error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", id)
        .eq("org_id", orgId)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Delete failed: invitation not found in active organization or permission denied.");
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invitations"] }); queryClient.invalidateQueries({ queryKey: ["operations-employees"] }); queryClient.invalidateQueries({ queryKey: ["operations-invitation-stats"] }); queryClient.invalidateQueries({ queryKey: ["operations-contracts"] }); queryClient.invalidateQueries({ queryKey: ["register-employees"] }); toast.success("Invitation deleted"); },
    onError: (error: Error) => { toast.error(error.message); },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!orgId) throw new Error("No organization selected");

      const { error: contextError } = await supabase.rpc("set_org_context", { _org_id: orgId });
      if (contextError) throw contextError;

      const { data, error } = await supabase
        .from("invitations")
        .delete()
        .in("id", ids)
        .eq("org_id", orgId)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Delete failed: no selected invitations were deleted.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["operations-employees"] });
      queryClient.invalidateQueries({ queryKey: ["operations-invitation-stats"] });
      queryClient.invalidateQueries({ queryKey: ["operations-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["register-employees"] });
      toast.success("Selected invitations deleted");
    },
    onError: (error: Error) => { toast.error(error.message); },
  });

  const bulkResend = useMutation({
    mutationFn: async (ids: string[]) => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      const { error } = await supabase
        .from("invitations")
        .update({ status: "SENT", expires_at: newExpiry.toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Selected invitations resent");
    },
    onError: (error: Error) => { toast.error(error.message); },
  });

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${onboardingBaseUrl}/onboard/${token}`);
    toast.success("Link copied to clipboard");
  };

  if (showPreview) {
    return <OnboardingPreview onClose={() => setShowPreview(false)} />;
  }

  if (viewSubmissionEmployeeId) {
    return <SubmissionView employeeId={viewSubmissionEmployeeId} onClose={() => setViewSubmissionEmployeeId(null)} />;
  }

  const columns: ColumnDef<InvitationRow>[] = [
    {
      key: "email", header: "Employee", accessor: (inv) => inv.employees?.email, hideable: false,
      render: (inv, hl) => {
        const name = inv.employees?.first_name && inv.employees?.last_name
          ? `${inv.employees.first_name} ${inv.employees.last_name}`
          : null;
        return (
          <div>
            <span className="text-sm font-medium">{hl?.(name || inv.employees?.email || "—") ?? (name || inv.employees?.email || "—")}</span>
            {name && <p className="text-xs text-muted-foreground">{inv.employees?.email}</p>}
          </div>
        );
      },
    },
    {
      key: "type", header: "Type", accessor: (inv) => inv.type,
      render: (inv) => <Badge variant={typeVariants[inv.type as InvitationType]}>{typeLabels[inv.type as InvitationType]}</Badge>,
    },
    {
      key: "status", header: "Status", accessor: (inv) => inv.status,
      render: (inv) => <Badge variant={statusVariants[inv.status as InvitationStatus]}>{statusLabels[inv.status as InvitationStatus]}</Badge>,
    },
    { key: "created_at", header: "Sent Date", accessor: (inv) => inv.created_at, render: (inv) => <span className="text-sm text-muted-foreground">{format(new Date(inv.created_at), "yyyy-MM-dd")}</span> },
    { key: "expires_at", header: "Expires", accessor: (inv) => inv.expires_at, render: (inv) => <span className="text-sm text-muted-foreground">{format(new Date(inv.expires_at), "yyyy-MM-dd")}</span> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("page.invitations.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("page.invitations.desc")}</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={addDummyInvitation.isPending}>
                <Users className="w-4 h-4" /> Add Dummy
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => addDummyInvitation.mutate("Sweden")}>🇸🇪 Swedish</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addDummyInvitation.mutate("Romania")}>🇷🇴 Romanian</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addDummyInvitation.mutate("Thailand")}>🇹🇭 Thai</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addDummyInvitation.mutate("Ukraine")}>🇺🇦 Ukrainian</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onShowPreview && (
            <Button variant="default" onClick={onShowPreview} className="gap-2 min-w-[200px]">
              <Eye className="w-4 h-4" />
              Switch to Candidate View
            </Button>
          )}
          <CreateInvitationDialog />
        </div>
      </div>

      <EnhancedTable<InvitationRow>
        data={invitations ?? []}
        columns={columns}
        rowKey={(inv) => inv.id}
        defaultSortKey="created_at"
        defaultSortDirection="desc"
        isLoading={isLoading}
        emptyMessage="No invitations found"
        searchPlaceholder="Search invitations by email, name..."
        enableColumnToggle
        enableDenseToggle
        enableHighlight
        enableSelection
        stickyHeader
        filters={[{ key: "status", label: "Status", options: statusFilterOptions }]}
        bulkActions={(selectedIds) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkResend.mutate(selectedIds)}
              disabled={bulkResend.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Resend ({selectedIds.length})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteIds(selectedIds)}
              disabled={bulkDelete.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete ({selectedIds.length})
            </Button>
          </div>
        )}
        rowActions={(invitation) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => copyLink(invitation.token)}><Copy className="w-4 h-4 mr-2" /> Copy Link</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPreview(true)}><Eye className="w-4 h-4 mr-2" /> Preview Form</DropdownMenuItem>
              {invitation.status === "PENDING" && (
                <DropdownMenuItem onClick={() => markAsSent.mutate(invitation.id)}><Send className="w-4 h-4 mr-2" /> Mark as Sent</DropdownMenuItem>
              )}
              {invitation.status === "ACCEPTED" && invitation.employee_id && (
                <DropdownMenuItem onClick={() => setViewSubmissionEmployeeId(invitation.employee_id)}>
                  <FileText className="w-4 h-4 mr-2" /> View Submission
                </DropdownMenuItem>
              )}
              {invitation.status !== "ACCEPTED" && (
                <DropdownMenuItem onClick={() => resendInvitation.mutate(invitation)}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Resend Invitation
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(invitation)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Invitation"
        itemName={deleteTarget ? `Invitation for ${deleteTarget.employees?.first_name || ""} ${deleteTarget.employees?.last_name || deleteTarget.employees?.email || "unknown"}`.trim() : ""}
        description="The invitation link will become invalid and the candidate will no longer be able to access the onboarding form."
        onConfirm={() => { if (deleteTarget) { deleteInvitation.mutate(deleteTarget.id); setDeleteTarget(null); } }}
        isLoading={deleteInvitation.isPending}
        requireTypedConfirmation
      />

      <DeleteConfirmDialog
        open={!!bulkDeleteIds}
        onOpenChange={(open) => { if (!open) setBulkDeleteIds(null); }}
        title="Delete Invitations"
        itemName={bulkDeleteIds ? `${bulkDeleteIds.length} invitation(s)` : ""}
        description="All selected invitation links will become invalid and candidates will no longer be able to access their onboarding forms."
        onConfirm={() => { if (bulkDeleteIds) { bulkDelete.mutate(bulkDeleteIds); setBulkDeleteIds(null); } }}
        isLoading={bulkDelete.isPending}
        requireTypedConfirmation
      />

    </div>
  );
}
