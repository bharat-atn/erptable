import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, CheckCircle2, Clock, AlertCircle,
  TrendingUp, Users, FolderKanban, Loader2
} from "lucide-react";
import { useUiLanguage } from "@/hooks/useUiLanguage";

interface TimeReportingDashboardViewProps {
  onNavigate: (view: string) => void;
}

export function TimeReportingDashboardView({ onNavigate }: TimeReportingDashboardViewProps) {
  const { orgId } = useOrg();
  const { t } = useUiLanguage();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["time-reporting-stats", orgId],
    queryFn: async () => {
      const now = new Date();
      const year = now.getFullYear();

      // Get weekly reports
      const { data: reports } = await supabase
        .from("weekly_reports")
        .select("id, status, week_number, year, project_id")
        .eq("org_id", orgId!)
        .eq("year", year);

      // Get active projects
      const { data: projects } = await supabase
        .from("forestry_projects")
        .select("id, name, status, project_id_display")
        .eq("org_id", orgId!)
        .in("status", ["in_progress", "planning"]);

      // Get active employees
      const { data: employees } = await supabase
        .from("employees")
        .select("id")
        .eq("org_id", orgId!)
        .eq("status", "ACTIVE");

      const allReports = reports || [];
      const draftCount = allReports.filter(r => r.status === "draft").length;
      const submittedCount = allReports.filter(r => r.status === "submitted").length;
      const approvedCount = allReports.filter(r => r.status === "approved").length;

      return {
        totalReports: allReports.length,
        draftCount,
        submittedCount,
        approvedCount,
        activeProjects: (projects || []).length,
        activeEmployees: (employees || []).length,
        projects: projects || [],
      };
    },
    enabled: !!orgId,
  });

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Time & Status Reporting</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tid- & statusrapportering • Weekly attendance and project progress
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => onNavigate("weekly-attendance")}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Draft Reports</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.draftCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => onNavigate("approvals")}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Pending Approval</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.submittedCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Approved</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.approvedCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Active Employees</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.activeEmployees || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Weekly Attendance</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Report daily attendance for each team member per project. Simple checkbox per workday (Mon–Fri).
                </p>
                <Button size="sm" onClick={() => onNavigate("weekly-attendance")}>
                  Open Attendance →
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Progress Reporting</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Report completion % per object. Auto-calculates project-level progress based on object areas.
                </p>
                <Button size="sm" onClick={() => onNavigate("progress-reporting")}>
                  Open Progress →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active projects */}
          {stats?.projects && stats.projects.length > 0 && (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <FolderKanban className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Active Projects</h3>
                </div>
                <div className="space-y-2">
                  {stats.projects.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/30 border border-border/40">
                      <div>
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{p.project_id_display}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize">{p.status?.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
