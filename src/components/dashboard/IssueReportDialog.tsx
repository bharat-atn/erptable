import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { Loader2, Camera, Paperclip, X, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface IssueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueReportDialog({ open, onOpenChange }: IssueReportDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-capture screenshot when dialog opens
  useEffect(() => {
    if (open) {
      captureScreenshot();
    } else {
      // Reset form on close
      setTitle("");
      setDescription("");
      setScreenshotBlob(null);
      setScreenshotPreview(null);
      setAttachments([]);
    }
  }, [open]);

  async function captureScreenshot() {
    setCapturing(true);
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
        ignoreElements: (el) => el.getAttribute("role") === "dialog",
      });
      canvas.toBlob((blob) => {
        if (blob) {
          setScreenshotBlob(blob);
          setScreenshotPreview(URL.createObjectURL(blob));
        }
        setCapturing(false);
      }, "image/png");
    } catch {
      setCapturing(false);
    }
  }

  function removeScreenshot() {
    setScreenshotBlob(null);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(null);
  }

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

      // Get org_id
      const { data: profile } = await supabase.from("profiles").select("current_org_id").eq("user_id", session.user.id).single();
      const orgId = profile?.current_org_id;
      if (!orgId) { toast.error("No organization context."); setSubmitting(false); return; }

      // Upload screenshot
      let screenshotUrl: string | null = null;
      if (screenshotBlob) {
        screenshotUrl = await uploadFile(screenshotBlob, "screenshot.png");
      }

      // Upload attachments
      const attachmentUrls: string[] = [];
      for (const file of attachments) {
        const url = await uploadFile(file, file.name);
        if (url) attachmentUrls.push(url);
      }

      // Insert report - use .from() with explicit any cast since types.ts is read-only
      const { error } = await (supabase.from("issue_reports") as any).insert({
        reporter_id: session.user.id,
        reporter_email: session.user.email,
        org_id: orgId,
        title: title.trim(),
        description: description.trim(),
        screenshot_url: screenshotUrl,
        attachment_urls: attachmentUrls,
        current_page: window.location.pathname + window.location.hash,
        browser_info: navigator.userAgent,
      });

      if (error) throw error;

      // Send email notification (fire-and-forget)
      supabase.functions.invoke("send-issue-notification", {
        body: {
          title: title.trim(),
          description: description.trim(),
          reporter_email: session.user.email,
          current_page: window.location.pathname + window.location.hash,
          screenshot_url: screenshotUrl,
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
            Describe the problem you encountered. A screenshot has been captured automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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

          {/* Screenshot preview */}
          <div className="space-y-2">
            <Label>Screenshot</Label>
            {capturing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Capturing...
              </div>
            ) : screenshotPreview ? (
              <div className="relative group">
                <img
                  src={screenshotPreview}
                  alt="Auto-captured screenshot"
                  className="rounded-md border border-border max-h-40 w-full object-cover"
                />
                <div className="absolute top-1 right-1 flex gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6 bg-background/80" onClick={captureScreenshot}>
                    <Camera className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 bg-background/80" onClick={removeScreenshot}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={captureScreenshot}>
                <Camera className="h-4 w-4 mr-1" /> Capture Screenshot
              </Button>
            )}
          </div>

          {/* Additional attachments */}
          <div className="space-y-2">
            <Label>Additional Attachments</Label>
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
