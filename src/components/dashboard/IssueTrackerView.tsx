import { useState, useEffect, useCallback } from "react";
import { Bug, Eye, MessageSquare, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { EnhancedTable, type ColumnDef, type FilterOption } from "@/components/ui/enhanced-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface IssueReport {
  id: string;
  reporter_email: string | null;
  title: string;
  description: string;
  screenshot_url: string | null;
  attachment_urls: string[];
  current_page: string | null;
  browser_info: string | null;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function IssueTrackerView() {
  const { orgId } = useOrg();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IssueReport | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchIssues = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await (supabase.from("issue_reports") as any)
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (!error && data) setIssues(data);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  function openDetail(issue: IssueReport) {
    setSelected(issue);
    setEditStatus(issue.status);
    setEditPriority(issue.priority);
    setEditNotes(issue.admin_notes || "");
  }

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    const updates: any = {
      status: editStatus,
      priority: editPriority,
      admin_notes: editNotes || null,
    };
    if (editStatus === "resolved" && selected.status !== "resolved") {
      const { data: { session } } = await supabase.auth.getSession();
      updates.resolved_by = session?.user?.id;
      updates.resolved_at = new Date().toISOString();
    }
    const { error } = await (supabase.from("issue_reports") as any)
      .update(updates)
      .eq("id", selected.id);
    if (error) {
      toast.error("Failed to update issue.");
    } else {
      toast.success("Issue updated.");
      setSelected(null);
      fetchIssues();
    }
    setSaving(false);
  }

  const columns: ColumnDef<IssueReport>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (row) => (
        <button className="text-left font-medium text-primary hover:underline" onClick={() => openDetail(row)}>
          {row.title}
        </button>
      ),
    },
    {
      key: "reporter_email",
      header: "Reporter",
      sortable: true,
      render: (row) => <span className="text-sm">{row.reporter_email || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <Badge className={STATUS_COLORS[row.status] || ""}>{row.status?.replace("_", " ")}</Badge>,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (row) => <Badge className={PRIORITY_COLORS[row.priority] || ""}>{row.priority}</Badge>,
    },
    {
      key: "current_page",
      header: "Page",
      sortable: true,
      render: (row) => <span className="text-xs text-muted-foreground font-mono">{row.current_page || "—"}</span>,
    },
    {
      key: "created_at",
      header: "Reported",
      sortable: true,
      render: (row) => <span className="text-sm">{format(new Date(row.created_at), "yyyy-MM-dd HH:mm")}</span>,
    },
  ];

  const filters: FilterOption[] = [
    { key: "status", label: "Status", options: [
      { label: "Open", value: "open" },
      { label: "In Progress", value: "in_progress" },
      { label: "Resolved", value: "resolved" },
      { label: "Closed", value: "closed" },
    ]},
    { key: "priority", label: "Priority", options: [
      { label: "Critical", value: "critical" },
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" },
    ]},
  ];

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center gap-3">
        <Bug className="h-6 w-6 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold">Issue Tracker</h1>
          <p className="text-sm text-muted-foreground">Review and manage reported issues from your team.</p>
        </div>
      </div>

      <EnhancedTable
        data={issues}
        columns={columns}
        rowKey={(r) => r.id}
        isLoading={loading}
        enableSearch
        searchPlaceholder="Search issues..."
        filters={filters}
        emptyMessage="No issues reported yet."
        defaultPageSize={20}
        enablePagination
        rowActions={(row) => (
          <Button size="icon" variant="ghost" onClick={() => openDetail(row)} title="View details">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" /> {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Description</Label>
                <p className="text-sm whitespace-pre-wrap mt-1">{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Reporter</Label>
                  <p className="text-sm">{selected.reporter_email || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Reported At</Label>
                  <p className="text-sm">{format(new Date(selected.created_at), "yyyy-MM-dd HH:mm")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Page</Label>
                  <p className="text-sm font-mono">{selected.current_page || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Browser</Label>
                  <p className="text-xs text-muted-foreground truncate" title={selected.browser_info || ""}>
                    {selected.browser_info?.slice(0, 60) || "—"}
                  </p>
                </div>
              </div>

              {/* Screenshot */}
              {selected.screenshot_url && (
                <div>
                  <Label className="text-muted-foreground text-xs">Screenshot</Label>
                  <a href={selected.screenshot_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                    <img
                      src={selected.screenshot_url}
                      alt="Issue screenshot"
                      className="rounded-md border border-border max-h-48 w-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              )}

              {/* Attachments */}
              {selected.attachment_urls?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs">Attachments</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {selected.attachment_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-border" />

              {/* Admin controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <Select value={editPriority} onValueChange={setEditPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Admin Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Internal notes, resolution steps..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={saveChanges} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
