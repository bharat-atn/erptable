import { useState, useEffect, useCallback } from "react";
import { Bug, ChevronLeft, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IssueCommentsThread } from "./IssueCommentsThread";
import { format } from "date-fns";

interface MyIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  org_id: string;
  admin_notes: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
};

interface MyIssuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyIssuesDialog({ open, onOpenChange }: MyIssuesDialogProps) {
  const [issues, setIssues] = useState<MyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MyIssue | null>(null);

  const fetchMyIssues = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }

    const { data } = await (supabase.from("issue_reports") as any)
      .select("id, title, description, status, priority, created_at, org_id, admin_notes")
      .eq("reporter_id", session.user.id)
      .order("created_at", { ascending: false });
    if (data) setIssues(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      setSelected(null);
      fetchMyIssues();
    }
  }, [open, fetchMyIssues]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selected ? (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(null)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Bug className="h-5 w-5" />
            )}
            {selected ? selected.title : "My Reported Issues"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          {selected ? (
            <div className="space-y-4 pr-2">
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[selected.status] || ""}>
                  {selected.status?.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(selected.created_at), "yyyy-MM-dd HH:mm")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
              <hr className="border-border" />
              <IssueCommentsThread
                issueId={selected.id}
                orgId={selected.org_id}
                isAdmin={false}
              />
            </div>
          ) : loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading your issues...</p>
          ) : issues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">You haven't reported any issues yet.</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {issues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelected(issue)}
                  className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{issue.title}</span>
                    <Badge className={`shrink-0 text-[10px] ${STATUS_COLORS[issue.status] || ""}`}>
                      {issue.status?.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{issue.description}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {format(new Date(issue.created_at), "MMM d, yyyy")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
