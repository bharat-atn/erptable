import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bug, Trash2, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/dashboard/DeleteConfirmDialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface IssueRow {
  id: string;
  title: string;
  reporter_email: string | null;
  status: string;
  priority: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
};

export function IssueManagementSettings() {
  const { orgId } = useOrg();
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchIssues = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await (supabase.from("issue_reports") as any)
      .select("id, title, reporter_email, status, priority, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (!error && data) setIssues(data);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Clear selection when data changes
  useEffect(() => {
    setSelected(new Set());
  }, [issues]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === issues.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(issues.map((i) => i.id)));
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selected.size === 0) return;
    setActionLoading(true);
    try {
      const updates: any = { status };
      if (status === "resolved") {
        const { data: { session } } = await supabase.auth.getSession();
        updates.resolved_by = session?.user?.id;
        updates.resolved_at = new Date().toISOString();
      }
      const { error } = await (supabase.from("issue_reports") as any)
        .update(updates)
        .in("id", Array.from(selected));
      if (error) throw error;
      toast.success(`${selected.size} issue(s) marked as ${status.replace("_", " ")}`);
      fetchIssues();
    } catch (e: any) {
      toast.error(e.message || "Failed to update issues");
    } finally {
      setActionLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    setActionLoading(true);
    try {
      // First delete related comments
      const { error: commentErr } = await (supabase.from("issue_comments") as any)
        .delete()
        .in("issue_id", Array.from(selected));
      if (commentErr) throw commentErr;

      // Then delete related updates
      const { error: updateErr } = await (supabase.from("issue_updates") as any)
        .delete()
        .in("issue_id", Array.from(selected));
      if (updateErr) throw updateErr;

      // Finally delete the issues
      const { error } = await (supabase.from("issue_reports") as any)
        .delete()
        .in("id", Array.from(selected));
      if (error) throw error;
      toast.success(`${selected.size} issue(s) deleted`);
      setDeleteOpen(false);
      fetchIssues();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete issues");
    } finally {
      setActionLoading(false);
    }
  };

  const openCount = issues.filter((i) => i.status === "open").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved" || i.status === "closed").length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bug className="w-4 h-4 text-destructive" />
            Issue Management
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {issues.length} total
            </Badge>
            {openCount > 0 && (
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-[10px]">
                {openCount} open
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review, resolve, or clean up reported issues. Select multiple issues for bulk actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border animate-fade-in">
              <span className="text-sm font-medium text-foreground">
                {selected.size} selected
              </span>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => bulkUpdateStatus("resolved")}
                disabled={actionLoading}
              >
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                Resolve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => bulkUpdateStatus("closed")}
                disabled={actionLoading}
              >
                <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={actionLoading}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading issues...
            </div>
          ) : issues.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No issues reported yet.</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground">
                <Checkbox
                  checked={selected.size === issues.length && issues.length > 0}
                  onCheckedChange={toggleAll}
                  className="shrink-0"
                />
                <span className="flex-1">Title</span>
                <span className="w-28 hidden sm:block">Reporter</span>
                <span className="w-20 text-center">Status</span>
                <span className="w-24 hidden sm:block text-right">Date</span>
              </div>
              {/* Rows */}
              <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                      selected.has(issue.id) ? "bg-primary/5" : "hover:bg-muted/20"
                    }`}
                  >
                    <Checkbox
                      checked={selected.has(issue.id)}
                      onCheckedChange={() => toggleSelect(issue.id)}
                      className="shrink-0"
                    />
                    <span className="flex-1 truncate font-medium">{issue.title}</span>
                    <span className="w-28 hidden sm:block text-xs text-muted-foreground truncate">
                      {issue.reporter_email || "—"}
                    </span>
                    <span className="w-20 flex justify-center">
                      <Badge className={`text-[10px] ${STATUS_COLORS[issue.status] || ""}`}>
                        {issue.status?.replace("_", " ")}
                      </Badge>
                    </span>
                    <span className="w-24 hidden sm:block text-xs text-muted-foreground text-right">
                      {format(new Date(issue.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer with refresh */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {resolvedCount} resolved / {issues.length} total
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={fetchIssues}
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Issues"
        itemName={`${selected.size} issue(s)`}
        description="This will permanently delete the selected issues and all their comments. This action cannot be undone."
        onConfirm={bulkDelete}
        isLoading={actionLoading}
        requireTypedConfirmation={selected.size > 3}
      />
    </>
  );
}
