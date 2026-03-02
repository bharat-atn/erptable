import { useState, useEffect, useCallback } from "react";
import { Send, Lock, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

interface IssueComment {
  id: string;
  issue_id: string;
  org_id: string;
  author_id: string;
  author_email: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

interface IssueCommentsThreadProps {
  issueId: string;
  orgId: string;
  reporterEmail?: string | null;
  isAdmin?: boolean;
}

export function IssueCommentsThread({ issueId, orgId, reporterEmail, isAdmin = false }: IssueCommentsThreadProps) {
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("issue_comments") as any)
      .select("*")
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });
    if (!error && data) setComments(data);
    setLoading(false);
  }, [issueId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { toast.error("You must be logged in."); return; }

      const { error } = await (supabase.from("issue_comments") as any).insert({
        issue_id: issueId,
        org_id: orgId,
        author_id: session.user.id,
        author_email: session.user.email,
        body: body.trim(),
        is_internal: isAdmin ? isInternal : false,
      });
      if (error) throw error;

      // Send email notification if admin posts a non-internal comment
      if (isAdmin && !isInternal && reporterEmail) {
        supabase.functions.invoke("send-issue-response", {
          body: {
            issue_id: issueId,
            reporter_email: reporterEmail,
            responder_email: session.user.email,
            comment_body: body.trim(),
          },
        }).catch(() => {});
      }

      setBody("");
      setIsInternal(false);
      fetchComments();
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments.length})
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No comments yet. Start the conversation.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-3 text-sm ${
                c.is_internal
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-xs truncate">
                  {c.author_email || "Unknown"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {c.is_internal && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                      <Lock className="h-2.5 w-2.5" /> Internal
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(c.created_at), "MMM d, HH:mm")}
                  </span>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Compose */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isAdmin ? "Write a response..." : "Reply to this issue..."}
          rows={2}
          maxLength={2000}
        />
        <div className="flex items-center justify-between">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Switch
                id="internal-toggle"
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />
              <Label htmlFor="internal-toggle" className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Internal only
              </Label>
            </div>
          ) : (
            <span />
          )}
          <Button size="sm" onClick={handleSend} disabled={sending || !body.trim()}>
            <Send className="h-3.5 w-3.5 mr-1" />
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
