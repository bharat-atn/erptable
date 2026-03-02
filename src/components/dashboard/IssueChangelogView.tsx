import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Bug, Sparkles, Info, AlertTriangle, Wrench, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { EnhancedTable, type ColumnDef, type FilterOption } from "@/components/ui/enhanced-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/dashboard/DeleteConfirmDialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface IssueUpdate {
  id: string;
  org_id: string;
  issue_id: string | null;
  title: string;
  description: string;
  update_type: string;
  visibility: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  fix: { icon: Bug, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", label: "Fix" },
  improvement: { icon: Sparkles, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", label: "Improvement" },
  info: { icon: Info, color: "bg-muted text-muted-foreground", label: "Info" },
  known_issue: { icon: AlertTriangle, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", label: "Known Issue" },
  workaround: { icon: Wrench, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", label: "Workaround" },
};

const EMPTY_FORM = { title: "", description: "", update_type: "info", visibility: "internal", issue_id: "" };

export function IssueChangelogView() {
  const { orgId } = useOrg();
  const [entries, setEntries] = useState<IssueUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IssueUpdate | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IssueUpdate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await (supabase.from("issue_updates") as any)
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(entry: IssueUpdate) {
    setEditing(entry);
    setForm({
      title: entry.title,
      description: entry.description,
      update_type: entry.update_type,
      visibility: entry.visibility,
      issue_id: entry.issue_id || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        update_type: form.update_type,
        visibility: form.visibility,
        issue_id: form.issue_id || null,
      };

      if (editing) {
        const { error } = await (supabase.from("issue_updates") as any)
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Entry updated.");
      } else {
        payload.org_id = orgId;
        payload.created_by = session?.user?.id;
        const { error } = await (supabase.from("issue_updates") as any).insert(payload);
        if (error) throw error;
        toast.success("Entry created.");
      }
      setDialogOpen(false);
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await (supabase.from("issue_updates") as any)
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete.");
    } else {
      toast.success("Entry deleted.");
      setDeleteTarget(null);
      fetchEntries();
    }
    setDeleting(false);
  }

  const columns: ColumnDef<IssueUpdate>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: "update_type",
      header: "Type",
      sortable: true,
      render: (row) => {
        const cfg = TYPE_CONFIG[row.update_type] || TYPE_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <Badge className={cfg.color}>
            <Icon className="h-3 w-3 mr-1" />
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: "visibility",
      header: "Visibility",
      sortable: true,
      render: (row) => (
        <Badge variant={row.visibility === "public" ? "default" : "secondary"}>
          {row.visibility}
        </Badge>
      ),
    },
    {
      key: "issue_id",
      header: "Linked Issue",
      render: (row) => row.issue_id ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link2 className="h-3 w-3" /> {row.issue_id.slice(0, 8)}…
        </span>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (row) => <span className="text-sm">{format(new Date(row.created_at), "yyyy-MM-dd HH:mm")}</span>,
    },
  ];

  const filters: FilterOption[] = [
    { key: "update_type", label: "Type", options: [
      { label: "Fix", value: "fix" },
      { label: "Improvement", value: "improvement" },
      { label: "Info", value: "info" },
      { label: "Known Issue", value: "known_issue" },
      { label: "Workaround", value: "workaround" },
    ]},
    { key: "visibility", label: "Visibility", options: [
      { label: "Internal", value: "internal" },
      { label: "Public", value: "public" },
    ]},
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Add Entry
        </Button>
      </div>

      <EnhancedTable
        data={entries}
        columns={columns}
        rowKey={(r) => r.id}
        isLoading={loading}
        enableSearch
        searchPlaceholder="Search changelog..."
        filters={filters}
        emptyMessage="No changelog entries yet."
        defaultPageSize={20}
        enablePagination
        rowActions={(row) => (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(row)} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(row)} title="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Changelog Entry" : "New Changelog Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} maxLength={200} />
            </div>
            <div className="space-y-1">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} maxLength={2000} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.update_type} onValueChange={(v) => setForm(f => ({ ...f, update_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fix">Fix</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="known_issue">Known Issue</SelectItem>
                    <SelectItem value="workaround">Workaround</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm(f => ({ ...f, visibility: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Linked Issue ID (optional)</Label>
              <Input value={form.issue_id} onChange={(e) => setForm(f => ({ ...f, issue_id: e.target.value }))} placeholder="UUID of related issue" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Changelog Entry"
        itemName={deleteTarget?.title || ""}
        onConfirm={handleDelete}
        isLoading={deleting}
      />
    </div>
  );
}
