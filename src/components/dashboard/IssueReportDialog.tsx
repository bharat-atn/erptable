import { useState, useEffect, useRef } from "react";
import { Loader2, Paperclip, X, ImageIcon, Monitor, Apple } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface IssueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueReportDialog({ open, onOpenChange }: IssueReportDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setAttachments([]);
    }
  }, [open]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024 && f.type.startsWith("image/"));
    if (valid.length < files.length) toast.error("Only image files under 5MB are accepted.");
    setAttachments(prev => [...prev, ...valid].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(idx: number) {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  }

  async function uploadFile(file: Blob, name: string): Promise<string | null> {
    const path = `${Date.now()}-${name}`;
    const { error } = await supabase.storage.from("issue-screenshots").upload(path, file, { contentType: file.type || "image/png" });
    if (error) return null;
    const { data } = supabase.storage.from("issue-screenshots").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { toast.error("You must be logged in."); setSubmitting(false); return; }

      const { data: profile } = await supabase.from("profiles").select("current_org_id").eq("user_id", session.user.id).single();
      const orgId = profile?.current_org_id;
      if (!orgId) { toast.error("No organization context."); setSubmitting(false); return; }

      // Upload attachments
      const attachmentUrls: string[] = [];
      for (const file of attachments) {
        const url = await uploadFile(file, file.name);
        if (url) attachmentUrls.push(url);
      }

      const { error } = await (supabase.from("issue_reports") as any).insert({
        reporter_id: session.user.id,
        reporter_email: session.user.email,
        org_id: orgId,
        title: title.trim(),
        description: description.trim(),
        screenshot_url: attachmentUrls[0] || null,
        attachment_urls: attachmentUrls,
        current_page: window.location.pathname + window.location.hash,
        browser_info: navigator.userAgent,
      });

      if (error) throw error;

      supabase.functions.invoke("send-issue-notification", {
        body: {
          title: title.trim(),
          description: description.trim(),
          reporter_email: session.user.email,
          current_page: window.location.pathname + window.location.hash,
          screenshot_url: attachmentUrls[0] || null,
          org_id: orgId,
        },
      }).catch(() => {});

      toast.success("Issue reported successfully! The admin team has been notified.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Describe the problem you encountered and attach a screenshot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Screenshot instructions */}
          <Alert className="bg-muted/50 border-border">
            <AlertDescription className="text-xs space-y-1.5">
              <p className="font-medium text-sm text-foreground">📸 How to capture a screenshot</p>
              <div className="flex items-center gap-2">
                <Apple className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span><kbd className="px-1 py-0.5 rounded bg-background border border-border text-[10px] font-mono">⇧</kbd> <kbd className="px-1 py-0.5 rounded bg-background border border-border text-[10px] font-mono">⌘</kbd> <kbd className="px-1 py-0.5 rounded bg-background border border-border text-[10px] font-mono">4</kbd> — drag to select an area</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span><kbd className="px-1 py-0.5 rounded bg-background border border-border text-[10px] font-mono">Win</kbd> + <kbd className="px-1 py-0.5 rounded bg-background border border-border text-[10px] font-mono">Shift</kbd> + <kbd className="px-1 py-0.5 rounded bg-background border border-border text-[10px] font-mono">S</kbd> — opens Snipping Tool</span>
              </div>
              <p className="text-muted-foreground">Then attach the screenshot below using <strong>Attach Image</strong>.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="issue-title">Title *</Label>
            <Input
              id="issue-title"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-desc">Description *</Label>
            <Textarea
              id="issue-desc"
              placeholder="Steps to reproduce, expected vs actual behavior..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex flex-wrap gap-2">
              {attachments.map((f, i) => (
                <div key={i} className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1">
                  <ImageIcon className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {attachments.length < 5 && (
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-1" /> Attach Image
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
