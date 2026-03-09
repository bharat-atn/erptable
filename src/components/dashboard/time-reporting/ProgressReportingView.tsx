import { useState, useEffect } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calendar, Loader2, Save, Send, ChevronLeft, ChevronRight, TrendingUp, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, addDays, getISOWeek } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function ProgressReportingView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [localProgress, setLocalProgress] = useState<Record<string, { pct: number; notes: string }>>({});

  const weekNumber = getISOWeek(currentWeekStart);
  const year = currentWeekStart.getFullYear();

  const { data: projects = [] } = useQuery({
    queryKey: ["time-projects", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_projects")
        .select("id, name, project_id_display, status")
        .eq("org_id", orgId!)
        .in("status", ["in_progress", "planning"])
        .order("name");
      return data || [];
    },
    enabled: !!orgId,
  });

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: objects = [] } = useQuery({
    queryKey: ["project-objects", selectedProjectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_objects")
        .select("id, name, object_id_display, sla_class, area_hectares, status")
        .eq("project_id", selectedProjectId)
        .order("object_id_display");
      return data || [];
    },
    enabled: !!selectedProjectId,
  });

  const { data: existingReport } = useQuery({
    queryKey: ["weekly-report", orgId, selectedProjectId, currentWeekStart.toISOString()],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_reports")
        .select("*, progress_entries(*)")
        .eq("org_id", orgId!)
        .eq("project_id", selectedProjectId)
        .eq("week_start", format(currentWeekStart, "yyyy-MM-dd"))
        .maybeSingle();
      return data;
    },
    enabled: !!orgId && !!selectedProjectId,
  });

  useEffect(() => {
    if (existingReport?.progress_entries) {
      const map: Record<string, { pct: number; notes: string }> = {};
      (existingReport.progress_entries as any[]).forEach((e: any) => {
        map[e.object_id] = { pct: Number(e.completion_pct), notes: e.notes || "" };
      });
      setLocalProgress(map);
    } else {
      setLocalProgress({});
    }
  }, [existingReport]);

  const totalArea = objects.reduce((sum: number, o: any) => sum + (Number(o.area_hectares) || 1), 0);
  const weightedProgress = totalArea > 0
    ? objects.reduce((sum: number, o: any) => {
        const pct = localProgress[o.id]?.pct || 0;
        const area = Number(o.area_hectares) || 1;
        return sum + (pct * area);
      }, 0) / totalArea
    : 0;

  const saveMutation = useMutation({
    mutationFn: async (submit: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let reportId = existingReport?.id;

      if (!reportId) {
        const { data: newReport, error } = await supabase
          .from("weekly_reports")
          .insert({
            org_id: orgId!,
            project_id: selectedProjectId,
            submitted_by: user.id,
            week_start: format(currentWeekStart, "yyyy-MM-dd"),
            week_number: weekNumber,
            year,
            status: submit ? "submitted" : "draft",
            submitted_at: submit ? new Date().toISOString() : null,
          })
          .select("id")
          .single();
        if (error) throw error;
        reportId = newReport.id;
      } else {
        await supabase
          .from("weekly_reports")
          .update({
            status: submit ? "submitted" : existingReport?.status === "approved" ? "approved" : "draft",
            submitted_at: submit ? new Date().toISOString() : null,
          })
          .eq("id", reportId);

        await supabase.from("progress_entries").delete().eq("report_id", reportId);
      }

      const entries = objects.map((o: any) => ({
        report_id: reportId,
        object_id: o.id,
        completion_pct: localProgress[o.id]?.pct || 0,
        notes: localProgress[o.id]?.notes || null,
      }));

      if (entries.length > 0) {
        const { error } = await supabase.from("progress_entries").insert(entries);
        if (error) throw error;
      }
    },
    onSuccess: (_, submit) => {
      toast.success(submit ? "Progress submitted" : "Progress saved");
      queryClient.invalidateQueries({ queryKey: ["weekly-report"] });
      queryClient.invalidateQueries({ queryKey: ["time-reporting-stats"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isSubmitted = existingReport?.status === "submitted" || existingReport?.status === "approved";

  const updatePct = (objectId: string, pct: number) => {
    setLocalProgress(prev => ({
      ...prev,
      [objectId]: { ...prev[objectId], pct, notes: prev[objectId]?.notes || "" },
    }));
  };

  const updateNotes = (objectId: string, notes: string) => {
    setLocalProgress(prev => ({
      ...prev,
      [objectId]: { ...prev[objectId], pct: prev[objectId]?.pct || 0, notes },
    }));
  };

  return (
    <div className="space-y-4 md:space-y-6 pt-2 md:pt-4 pb-24 md:pb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Progress Reporting</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Framstegsrapportering • Completion % per object</p>
      </div>

      {/* Week + Project selector */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-1">
          <Button variant="outline" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 sm:px-3 sm:py-1.5 bg-accent rounded-md text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Week {weekNumber}, {year}
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-full sm:w-[250px] h-10 sm:h-8 text-sm">
            <SelectValue placeholder="Select project..." />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.project_id_display} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project-level progress */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Project Completion</span>
            <span className="text-lg font-bold text-primary">{Math.round(weightedProgress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(weightedProgress, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Area-weighted across all objects</p>
        </CardContent>
      </Card>

      {/* Objects */}
      {objects.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No objects registered for this project.</p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* Mobile: card per object */
        <div className="space-y-3">
          {objects.map((obj: any) => {
            const progress = localProgress[obj.id] || { pct: 0, notes: "" };
            return (
              <Card key={obj.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {obj.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{obj.object_id_display}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{obj.sla_class}</Badge>
                      {obj.area_hectares && (
                        <span className="text-xs text-muted-foreground font-mono">{obj.area_hectares} ha</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Slider
                      value={[progress.pct]}
                      onValueChange={([val]) => updatePct(obj.id, val)}
                      max={100}
                      step={5}
                      disabled={isSubmitted}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold w-12 text-right">{progress.pct}%</span>
                  </div>
                  <Input
                    value={progress.notes}
                    onChange={(e) => updateNotes(obj.id, e.target.value)}
                    placeholder="Notes..."
                    className="h-9 text-sm"
                    disabled={isSubmitted}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Desktop: table */
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Object</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="text-right">Area (ha)</TableHead>
                  <TableHead className="min-w-[200px]">Completion %</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {objects.map((obj: any) => {
                  const progress = localProgress[obj.id] || { pct: 0, notes: "" };
                  return (
                    <TableRow key={obj.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {obj.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{obj.object_id_display}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{obj.sla_class}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {obj.area_hectares || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[progress.pct]}
                            onValueChange={([val]) => updatePct(obj.id, val)}
                            max={100}
                            step={5}
                            disabled={isSubmitted}
                            className="flex-1"
                          />
                          <span className="text-sm font-bold w-10 text-right">{progress.pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={progress.notes}
                          onChange={(e) => updateNotes(obj.id, e.target.value)}
                          placeholder="Notes..."
                          className="h-7 text-xs"
                          disabled={isSubmitted}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Actions — sticky bottom on mobile */}
      {objects.length > 0 && !isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 md:static md:bottom-auto bg-background/95 backdrop-blur-sm border-t md:border-t-0 border-border p-4 md:p-0 flex items-center gap-3 z-30">
          <Button
            variant="outline"
            className="flex-1 md:flex-none h-12 md:h-9"
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-1.5" /> Save Draft
          </Button>
          <Button
            className="flex-1 md:flex-none h-12 md:h-9"
            onClick={() => saveMutation.mutate(true)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
            Submit Report
          </Button>
        </div>
      )}
    </div>
  );
}
