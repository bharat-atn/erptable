import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function VersionUpdateBanner() {
  const [initialVersion, setInitialVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const initialSet = useRef(false);

  const { data: latestVersion } = useQuery({
    queryKey: ["version-check"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_versions")
        .select("version_tag, release_type")
        .eq("status", "published")
        .order("release_date", { ascending: false })
        .order("sequence_number", { ascending: false })
        .limit(1)
        .single();
      if (error) return null;
      return data as { version_tag: string; release_type: string } | null;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Capture the version on first load
  useEffect(() => {
    if (latestVersion?.version_tag && !initialSet.current) {
      setInitialVersion(latestVersion.version_tag);
      initialSet.current = true;
    }
  }, [latestVersion]);

  const hasNewVersion =
    initialVersion !== null &&
    latestVersion?.version_tag !== null &&
    latestVersion?.version_tag !== initialVersion;

  if (!hasNewVersion || dismissed) return null;

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div className="w-full bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-center gap-3 text-sm animate-in slide-in-from-top-2 duration-300 z-50 relative">
      <RefreshCw className="w-4 h-4 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
      <span className="font-medium">
        A new version <span className="font-mono font-bold">{latestVersion?.version_tag}</span> is available.
      </span>
      <button
        onClick={handleUpdate}
        className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
      >
        Click here to update
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-primary-foreground/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
