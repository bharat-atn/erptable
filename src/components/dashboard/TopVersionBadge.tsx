import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Tag, Calendar, Clock } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

const releaseTypeColors: Record<string, string> = {
  alpha: "text-amber-600",
  beta: "text-blue-600",
  rc: "text-orange-600",
  release: "text-emerald-600",
};

const releaseTypeBg: Record<string, string> = {
  alpha: "bg-amber-500/10 text-amber-600",
  beta: "bg-blue-500/10 text-blue-600",
  rc: "bg-orange-500/10 text-orange-600",
  release: "bg-emerald-500/10 text-emerald-600",
};

const releaseTypeLabels: Record<string, string> = {
  alpha: "alpha",
  beta: "beta",
  rc: "RC",
  release: "release",
};

export function TopVersionBadge() {
  const { data: latestVersion } = useQuery({
    queryKey: ["latest-version"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_versions")
        .select("*")
        .eq("status", "published")
        .order("release_date", { ascending: false })
        .order("sequence_number", { ascending: false })
        .limit(1)
        .single();
      if (error) return null;
      return data as any;
    },
    refetchInterval: 60000,
  });

  if (!latestVersion) return null;

  const typeLabel = releaseTypeLabels[latestVersion.release_type] ?? latestVersion.release_type;
  const typeBg = releaseTypeBg[latestVersion.release_type] ?? "bg-muted text-muted-foreground";
  const timeGMT = new Date(latestVersion.release_time_utc).toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" }) + " GMT";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeLocal = new Date(latestVersion.release_time_utc).toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  const tzShort = tz.split("/").pop()?.replace("_", " ") ?? tz;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer text-xs">
          <span className={cn("font-semibold px-1.5 py-0.5 rounded text-[10px]", typeBg)}>{typeLabel}</span>
          <span className="font-mono font-semibold text-foreground">{latestVersion.version_tag}</span>
          <span className="text-muted-foreground">{timeGMT}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="end" sideOffset={8} className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Version Information</h4>
            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", typeBg)}>{typeLabel}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Version:</span>
            <span className="font-mono font-semibold text-foreground">{latestVersion.version_tag}</span>
            <span className="text-muted-foreground font-medium">Status:</span>
            <span className="text-foreground">{typeLabel}</span>
            <span className="text-muted-foreground font-medium">Released:</span>
            <span className="text-foreground">{latestVersion.release_date}</span>
            <span className="text-muted-foreground font-medium">Time (GMT):</span>
            <span className="text-foreground">{timeGMT.replace(" GMT", "")}</span>
            <span className="text-muted-foreground font-medium">Time (Your Local):</span>
            <span className="text-foreground">{timeLocal}</span>
          </div>
          {latestVersion.notes && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Release Notes:</p>
              <p className="text-xs text-foreground leading-relaxed">{latestVersion.notes}</p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
