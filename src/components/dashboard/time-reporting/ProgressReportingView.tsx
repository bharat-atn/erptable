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

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function ProgressReportingView() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [localProgress, setLocalProgress] = useState<Record<string, { pct: number; notes: string }>>({});

  const weekNumber = getISOWeek(currentWeekStart);
  const year = currentWeekStart.getFullYear();

  // Fetch projects
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

  // Fetch objects for selected project
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

  // Fetch existing report
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

  // Initialize from existing data
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

  // Calculate project-level progress (weighted by area)
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

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Progress Reporting</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Framstegsrapportering • Completion % per object per week</p>
      </div>

      {/* Week + Project selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-3 py-1.5 bg-accent rounded-md text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Week {weekNumber}, {year}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[250px] h-8 text-sm">
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

      {/* Project-level progress indicator */}
      <Card className="border-border/60">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Project Completion (area-weighted)</span>
            <span className="text-lg font-bold text-primary">{Math.round(weightedProgress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(weightedProgress, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Objects progress table */}
      {objects.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No objects registered for this project.</p>
          </CardContent>
        </Card>
      ) : (
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
                            onValueChange={([val]) => {
                              setLocalProgress(prev => ({
                                ...prev,
                                [obj.id]: { ...prev[obj.id], pct: val, notes: prev[obj.id]?.notes || "" },
                              }));
                            }}
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
                          onChange={(e) => {
                            setLocalProgress(prev => ({
                              ...prev,
                              [obj.id]: { ...prev[obj.id], pct: prev[obj.id]?.pct || 0, notes: e.target.value },
                            }));
                          }}
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

      {/* Actions */}
      {objects.length > 0 && !isSubmitted && (
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-1" /> Save Draft
          </Button>
          <Button onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Submit Report
          </Button>
        </div>
      )}
    </div>
  );
}
