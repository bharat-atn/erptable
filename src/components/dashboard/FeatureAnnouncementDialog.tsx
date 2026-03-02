import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bug, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ANNOUNCEMENT_ID = "issue-reporter-v1";

interface FeatureAnnouncementDialogProps {
  open: boolean;
  onDismiss: () => void;
  userId: string;
}

export function FeatureAnnouncementDialog({ open, onDismiss, userId }: FeatureAnnouncementDialogProps) {
  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      // Fetch current dismissed list, append this ID
      const { data } = await supabase
        .from("profiles")
        .select("dismissed_announcements")
        .eq("user_id", userId)
        .single();

      const current = (data as any)?.dismissed_announcements ?? [];
      const updated = Array.isArray(current) ? [...current, ANNOUNCEMENT_ID] : [ANNOUNCEMENT_ID];

      await (supabase as any)
        .from("profiles")
        .update({ dismissed_announcements: updated })
        .eq("user_id", userId);
    } catch (err) {
      console.error("Failed to dismiss announcement:", err);
    }
    sessionStorage.setItem("announcement_dismissed", "1");
    setDismissing(false);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleDismiss(); }}>
      <DialogContent className="max-w-sm" hideDefaultClose onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            New: Issue Reporter
          </DialogTitle>
          <DialogDescription>
            We've added a built-in bug reporting tool to help you report any issues you encounter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <Bug className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                Look for this button
                <ArrowDownRight className="inline ml-1 h-4 w-4 text-muted-foreground" />
              </p>
              <p className="text-muted-foreground">
                You'll find a red bug icon in the <strong>bottom-right corner</strong> of every screen. Click it to report any issues, bugs, or suggestions — we'll take care of the rest.
              </p>
            </div>
          </div>

          <Button className="w-full" onClick={handleDismiss} disabled={dismissing}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ANNOUNCEMENT_ID };
