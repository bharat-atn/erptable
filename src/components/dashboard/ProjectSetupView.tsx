import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText, MapPin, Clock, Users, DollarSign, UserCheck,
  ChevronLeft, CheckCircle2, Loader2
} from "lucide-react";
import { BasicInfoTab } from "./project-setup/BasicInfoTab";
import { ProjectObjectsTab } from "./project-setup/ProjectObjectsTab";
import { DurationTimingTab } from "./project-setup/DurationTimingTab";
import { TeamMembersTab } from "./project-setup/TeamMembersTab";
import { FinancialPlanningTab } from "./project-setup/FinancialPlanningTab";
import { PreliminaryPayrollTab } from "./project-setup/PreliminaryPayrollTab";

const TABS = [
  { id: "basic", label: "Basic Information", icon: FileText },
  { id: "objects", label: "Project Objects", icon: MapPin },
  { id: "timing", label: "Duration & Timing", icon: Clock },
  { id: "team", label: "Team Members", icon: Users },
  { id: "financial", label: "Financial Planning", icon: DollarSign },
  { id: "payroll", label: "Preliminary Payroll", icon: UserCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface ProjectSetupViewProps {
  projectId: string | null;
  onBack: () => void;
}

export function ProjectSetupView({ projectId, onBack }: ProjectSetupViewProps) {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch project
  const { data: project, isLoading } = useQuery({
    queryKey: ["forestry-project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("forestry_projects" as any)
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!projectId,
  });

  // Fetch objects count
  const { data: objectsCount = 0 } = useQuery({
    queryKey: ["forestry-objects-count", projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const { count, error } = await supabase
        .from("forestry_objects" as any)
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!projectId,
  });

  // Fetch team count
  const { data: teamCount = 0 } = useQuery({
    queryKey: ["project-team-count", projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const { count, error } = await supabase
        .from("forestry_project_members" as any)
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!projectId,
  });

  // Calculate progress
  const progress = useMemo(() => {
    if (!project) return 0;
    let score = 0;
    const total = 6;
    // Basic info
    if (project.name && project.type && project.location) score++;
    // Objects
    if (objectsCount > 0) score++;
    // Timing
    if (project.start_date && project.end_date) score++;
    // Team
    if (teamCount > 0) score++;
    // Financial
    const sd = project.setup_data as any;
    if (sd?.financial_saved) score++;
    // Payroll
    if (sd?.payroll_reviewed) score++;
    return Math.round((score / total) * 100);
  }, [project, objectsCount, teamCount]);

  // Save project field
  const saveField = useCallback(async (updates: Record<string, any>) => {
    if (!projectId) return;
    setSaving(true);
    const { error } = await supabase
      .from("forestry_projects" as any)
      .update(updates as any)
      .eq("id", projectId);
    setSaving(false);
    if (error) {
      toast.error("Save failed: " + error.message);
      return;
    }
    setLastSaved(new Date());
    queryClient.invalidateQueries({ queryKey: ["forestry-project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["forestry-projects"] });
  }, [projectId, queryClient]);

  // Save setup_data merge
  const saveSetupData = useCallback(async (partial: Record<string, any>) => {
    if (!projectId || !project) return;
    const current = (project.setup_data || {}) as any;
    const merged = { ...current, ...partial };
    await saveField({ setup_data: merged });
  }, [projectId, project, saveField]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>Project not found.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>Back to Project List</Button>
      </div>
    );
  }

  const timeSince = lastSaved
    ? `${Math.max(0, Math.round((Date.now() - lastSaved.getTime()) / 1000))}s ago`
    : null;

  const tabIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <div className="space-y-5 pt-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Setup</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plan and configure a new forestry project</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Project List
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="bg-muted/40 border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Setup Progress</span>
            {timeSince && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> Auto-saved {timeSince}
              </span>
            )}
            {saving && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
          </div>
          <span className={`text-2xl font-bold ${progress >= 80 ? "text-emerald-600" : progress >= 50 ? "text-amber-600" : "text-destructive"}`}>
            {progress}%
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[500px]">
        {activeTab === "basic" && (
          <BasicInfoTab project={project} onSave={saveField} orgId={orgId} />
        )}
        {activeTab === "objects" && (
          <ProjectObjectsTab projectId={projectId!} orgId={orgId!} />
        )}
        {activeTab === "timing" && (
          <DurationTimingTab project={project} onSave={saveField} />
        )}
        {activeTab === "team" && (
          <TeamMembersTab projectId={projectId!} orgId={orgId!} project={project} />
        )}
        {activeTab === "financial" && (
          <FinancialPlanningTab project={project} projectId={projectId!} orgId={orgId!} onSave={saveField} onSaveSetupData={saveSetupData} />
        )}
        {activeTab === "payroll" && (
          <PreliminaryPayrollTab project={project} projectId={projectId!} orgId={orgId!} onSaveSetupData={saveSetupData} />
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t border-border pt-4 pb-2">
        <Button variant="outline" onClick={() => {
          if (tabIndex > 0) setActiveTab(TABS[tabIndex - 1].id);
          else onBack();
        }}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          {tabIndex < TABS.length - 1 ? (
            <Button onClick={() => setActiveTab(TABS[tabIndex + 1].id)}>
              Continue
            </Button>
          ) : (
            <Button onClick={() => {
              saveSetupData({ payroll_reviewed: true });
              toast.success("Project setup complete!");
              onBack();
            }}>
              Finalize Project
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
