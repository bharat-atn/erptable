import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, GitBranch, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useOrg } from "@/contexts/OrgContext";

type ReleaseType = "alpha" | "beta" | "rc" | "release";

interface AppVersion {
  id: string;
  version_tag: string;
  release_type: string;
  release_date: string;
  release_time_utc: string;
  sequence_number: number;
  status: string;
  notes: string;
  created_by: string | null;
  created_at: string;
}

const releaseTypeBadge: Record<ReleaseType, { label: string; className: string }> = {
  alpha: { label: "Alpha", className: "bg-amber-500/10 text-amber-600 border-transparent" },
  beta: { label: "Beta", className: "bg-blue-500/10 text-blue-600 border-transparent" },
  rc: { label: "RC", className: "bg-orange-500/10 text-orange-600 border-transparent" },
  release: { label: "Release", className: "bg-emerald-500/10 text-emerald-600 border-transparent" },
};

function formatTimeGMT(utc: string) {
  return new Date(utc).toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " GMT";
}

function formatTimeLocal(utc: string) {
  const d = new Date(utc);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return d.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ` (${tz.split("/").pop()})`;
}

export function VersionManagementView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [releaseType, setReleaseType] = useState<ReleaseType>("alpha");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { orgId } = useOrg();
  const { data: versions = [], isLoading } = useQuery<AppVersion[]>({
    queryKey: ["app-versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_versions")
        .select("*")
        .order("release_date", { ascending: false })
        .order("sequence_number", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AppVersion[];
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      // Count existing versions for today to get next sequence
      const { count, error: countError } = await supabase
        .from("app_versions")
        .select("id", { count: "exact", head: true })
        .eq("release_date", today);
      if (countError) throw countError;

      const seq = (count ?? 0) + 1;
      const tag = `v${today}-${String(seq).padStart(3, "0")}`;

      const { error } = await supabase.from("app_versions").insert({
        version_tag: tag,
        release_type: releaseType,
        release_date: today,
        sequence_number: seq,
        status: "published",
        notes,
        org_id: orgId,
      } as any);
      if (error) throw error;
      return tag;
    },
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ["app-versions"] });
      queryClient.invalidateQueries({ queryKey: ["latest-version"] });
      toast.success(`Version ${tag} published`, {
        description: "Remember: You must also publish your app in Lovable for changes to take effect in the production environment.",
        duration: 8000,
      });
      setDialogOpen(false);
      setNotes("");
      // Show a second reminder after a short delay
      setTimeout(() => {
        toast.info("🚀 Don't forget to publish!", {
          description: "This version tag is registered, but your app changes won't be live until you click 'Publish' in the top-right corner of Lovable.",
          duration: 10000,
        });
      }, 1500);
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to publish version");
    },
  });

  const nextTag = (() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayVersions = versions.filter((v) => v.release_date === today);
    const seq = todayVersions.length + 1;
    return `v${today}-${String(seq).padStart(3, "0")}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GitBranch className="w-6 h-6" />
            Version Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage application releases. Each version is tagged with a date-based identifier and release stage.
          </p>
        </div>
        <Button onClick={() => {
          // Default release type to the most recent version's type
          const lastType = versions[0]?.release_type as ReleaseType | undefined;
          if (lastType && ["alpha", "beta", "rc", "release"].includes(lastType)) {
            setReleaseType(lastType);
          }
          setDialogOpen(true);
        }} className="gap-2">
          <Plus className="w-4 h-4" />
          New Release
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Release History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Version</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Release Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time (GMT)</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time (Local)</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Release Notes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                ) : versions.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No versions published yet. Click "New Release" to create one.</td></tr>
                ) : (
                  versions.map((v) => {
                    const badgeInfo = releaseTypeBadge[v.release_type as ReleaseType] ?? releaseTypeBadge.alpha;
                    return (
                      <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-foreground">{v.version_tag}</td>
                        <td className="px-4 py-3">
                          <Badge className={badgeInfo.className}>{badgeInfo.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{format(new Date(v.release_date), "MMM d, yyyy")}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatTimeGMT(v.release_time_utc)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatTimeLocal(v.release_time_utc)}</td>
                        <td className="px-4 py-3 text-muted-foreground">#{String(v.sequence_number).padStart(3, "0")}</td>
                        <td className="px-4 py-3">
                          <Badge variant={v.status === "published" ? "success" : "secondary"}>
                            {v.status === "published" ? "Published" : "Draft"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[300px] truncate">{v.notes || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Release Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              New Release
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Version Tag (auto-generated)</Label>
              <div className="mt-1 px-3 py-2 rounded-md bg-muted font-mono text-sm font-semibold">{nextTag}</div>
            </div>
            <div>
              <Label>Release Type</Label>
              <Select value={releaseType} onValueChange={(v) => setReleaseType(v as ReleaseType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="rc">Release Candidate (RC)</SelectItem>
                  <SelectItem value="release">Release</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Release Notes</Label>
              <Textarea
                className="mt-1"
                placeholder="Describe what changed in this release..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
