import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Info, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface ProjectIdConfig {
  id: string;
  prefix: string;
  separator: string;
  include_year: boolean;
  padding: number;
  next_number: number;
}

interface YearCounter {
  id: string;
  year: number;
  next_number: number;
  issued_count: number;
}

const separatorOptions = [
  { value: "-", label: "Hyphen ( - )" },
  { value: "/", label: "Slash ( / )" },
  { value: ".", label: "Dot ( . )" },
  { value: "_", label: "Underscore ( _ )" },
];

const paddingOptions = [
  { value: 3, label: "3 digits (001)" },
  { value: 4, label: "4 digits (0001)" },
  { value: 5, label: "5 digits (00001)" },
];

export function ProjectIdSettingsView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [resetTarget, setResetTarget] = useState<YearCounter | null>(null);

  // Fetch or auto-create settings
  const { data: config, isLoading } = useQuery({
    queryKey: ["project-id-settings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("project_id_settings" as any)
        .select("*")
        .eq("org_id", orgId)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as any as ProjectIdConfig;

      // Auto-create default settings
      const { data: created, error: createErr } = await supabase
        .from("project_id_settings" as any)
        .insert({ org_id: orgId, prefix: "PJ", separator: "-", include_year: true, padding: 4, next_number: 1 })
        .select()
        .single();
      if (createErr) throw createErr;
      return created as any as ProjectIdConfig;
    },
    enabled: !!orgId,
  });

  // Fetch year counters
  const { data: yearCounters = [] } = useQuery({
    queryKey: ["project-year-counters", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const currentYear = new Date().getFullYear();
      // Ensure 6 years exist
      for (let y = currentYear; y <= currentYear + 5; y++) {
        await supabase
          .from("project_id_year_counters" as any)
          .insert({ org_id: orgId, year: y, next_number: 1, issued_count: 0 })
          .select()
          .maybeSingle();
      }
      const { data, error } = await supabase
        .from("project_id_year_counters" as any)
        .select("*")
        .eq("org_id", orgId)
        .order("year", { ascending: true });
      if (error) throw error;
      return (data || []) as any as YearCounter[];
    },
    enabled: !!orgId,
  });

  // Fetch actual project counts per year
  const { data: projects = [] } = useQuery({
    queryKey: ["forestry-projects-for-id", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("forestry_projects")
        .select("project_id_display")
        .eq("org_id", orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const [form, setForm] = useState({
    prefix: "PJ",
    separator: "-",
    include_year: true,
    padding: 4,
  });

  useEffect(() => {
    if (config) {
      setForm({
        prefix: config.prefix,
        separator: config.separator,
        include_year: config.include_year,
        padding: config.padding,
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      if (!config) return;
      const { error } = await supabase
        .from("project_id_settings" as any)
        .update(values)
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-id-settings"] });
      toast.success("Project ID settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetYearMutation = useMutation({
    mutationFn: async (counter: YearCounter) => {
      const { error } = await supabase
        .from("project_id_year_counters" as any)
        .update({ next_number: 1, issued_count: 0 })
        .eq("id", counter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-year-counters"] });
      toast.success("Year counter reset");
      setResetTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const currentYear = new Date().getFullYear();

  // Count projects per year from project_id_display (e.g. PJ-26-0001 -> year 2026)
  const projectCountsByYear = useMemo(() => {
    const counts: Record<number, number> = {};
    projects.forEach((p: any) => {
      const match = p.project_id_display?.match(/\d{2}/);
      if (match) {
        const year = 2000 + parseInt(match[0], 10);
        counts[year] = (counts[year] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

  const currentYearCount = projectCountsByYear[currentYear] ?? 0;
  const previewNext = currentYearCount + 1;
  const shortYear = String(currentYear).slice(-2);
  const preview = form.include_year
    ? `${form.prefix}${form.separator}${shortYear}${form.separator}${String(previewNext).padStart(form.padding, "0")}`
    : `${form.prefix}${form.separator}${String(previewNext).padStart(form.padding, "0")}`;

  if (isLoading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6" /> Settings
          </h1>
          <p className="text-sm text-muted-foreground">Configure project ID format for upcoming years</p>
        </div>
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* ID Format Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" /> ID Format
          </CardTitle>
          <CardDescription>Project IDs reset each year automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Prefix</Label>
              <Input
                value={form.prefix}
                onChange={(e) => setForm((p) => ({ ...p, prefix: e.target.value }))}
                placeholder="PJ"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Separator</Label>
              <Select value={form.separator} onValueChange={(v) => setForm((p) => ({ ...p, separator: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {separatorOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Number Padding</Label>
              <Select value={String(form.padding)} onValueChange={(v) => setForm((p) => ({ ...p, padding: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paddingOptions.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={form.include_year}
              onCheckedChange={(v) => setForm((p) => ({ ...p, include_year: v }))}
            />
            <Label>Include Year</Label>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Preview — next project ID:</p>
            <p className="text-xl font-bold font-mono">{preview}</p>
          </div>
        </CardContent>
      </Card>

      {/* Year Counters */}
      {form.include_year && yearCounters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Year Counters</CardTitle>
            <CardDescription>Each year has its own independent numbering sequence.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {yearCounters.map((counter) => {
                const actualCount = projectCountsByYear[counter.year] ?? 0;
                const nextNum = actualCount + 1;
                return (
                  <div
                    key={counter.id}
                    className={`relative p-4 rounded-lg border ${
                      counter.year === currentYear
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-lg">{counter.year}</span>
                      <div className="flex items-center gap-1">
                        {counter.year === currentYear && (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        )}
                        {actualCount > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setResetTarget(counter)}
                            title="Reset counter"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {actualCount} project{actualCount !== 1 ? "s" : ""} issued → next:{" "}
                      <span className="font-mono font-semibold">
                        {form.prefix}{form.separator}{String(counter.year).slice(-2)}{form.separator}
                        {String(nextNum).padStart(form.padding, "0")}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        title="Reset Year Counter"
        itemName={resetTarget ? `${resetTarget.year} counter` : ""}
        description={`This will reset the ${resetTarget?.year} counter back to 1. Existing project IDs will not be changed.`}
        onConfirm={() => resetTarget && resetYearMutation.mutate(resetTarget)}
        isLoading={resetYearMutation.isPending}
        requireTypedConfirmation
      />
    </div>
  );
}
