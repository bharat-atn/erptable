import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Star, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  differenceInCalendarDays, eachDayOfInterval, isWeekend, parseISO
} from "date-fns";

interface Props {
  projectId: string;
  orgId: string;
  project: any;
}

const STAR_RATINGS = [1, 2, 3, 4, 5] as const;

function parseNotes(notes: string | null | undefined): Record<string, any> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

export function TeamMembersTab({ projectId, orgId, project }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [leadersOnly, setLeadersOnly] = useState(false);

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code, status")
        .eq("org_id", orgId)
        .in("status", ["ACTIVE", "ONBOARDING"])
        .order("first_name");
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch current team
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["project-team", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_project_members" as any)
        .select("*")
        .eq("project_id", projectId);
      return (data || []) as any[];
    },
    enabled: !!projectId,
  });

  // Fetch project objects to calculate hours per star rating
  const { data: objects = [] } = useQuery({
    queryKey: ["forestry-objects", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_objects" as any)
        .select("*")
        .eq("project_id", projectId);
      return (data || []) as any[];
    },
    enabled: !!projectId,
  });

  // Sum hours per star from objects notes JSON
  const hoursByStar = useMemo(() => {
    const totals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    objects.forEach((obj: any) => {
      const nd = parseNotes(obj.notes);
      for (let s = 1; s <= 5; s++) {
        totals[s] += Number(nd[`hours_${s}`]) || 0;
      }
    });
    return totals;
  }, [objects]);

  const totalHoursAllStars = Object.values(hoursByStar).reduce((a, b) => a + b, 0);

  const teamMap = useMemo(() => {
    const map = new Map<string, any>();
    teamMembers.forEach((m: any) => map.set(m.employee_id, m));
    return map;
  }, [teamMembers]);

  const teamLeaderId = useMemo(() => {
    const leader = teamMembers.find((m: any) => m.role === "leader");
    return leader?.employee_id || "";
  }, [teamMembers]);

  // Toggle member
  const toggleMember = useMutation({
    mutationFn: async ({ employeeId, checked }: { employeeId: string; checked: boolean }) => {
      if (checked) {
        const { error } = await supabase.from("forestry_project_members" as any).insert({
          project_id: projectId,
          employee_id: employeeId,
          role: "member",
          star_rating: 1,
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("forestry_project_members" as any)
          .delete()
          .eq("project_id", projectId)
          .eq("employee_id", employeeId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-team", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-team-count", projectId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Set leader
  const setLeader = useMutation({
    mutationFn: async (employeeId: string) => {
      if (teamLeaderId) {
        await supabase
          .from("forestry_project_members" as any)
          .update({ role: "member" } as any)
          .eq("project_id", projectId)
          .eq("employee_id", teamLeaderId);
      }
      if (!teamMap.has(employeeId)) {
        await supabase.from("forestry_project_members" as any).insert({
          project_id: projectId,
          employee_id: employeeId,
          role: "leader",
          star_rating: 3,
        } as any);
      } else {
        await supabase
          .from("forestry_project_members" as any)
          .update({ role: "leader" } as any)
          .eq("project_id", projectId)
          .eq("employee_id", employeeId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-team", projectId] });
      toast.success("Team leader set");
    },
  });

  // Update star rating
  const updateRating = async (employeeId: string, rating: number) => {
    await supabase
      .from("forestry_project_members" as any)
      .update({ star_rating: rating } as any)
      .eq("project_id", projectId)
      .eq("employee_id", employeeId);
    queryClient.invalidateQueries({ queryKey: ["project-team", projectId] });
  };

  // Calculations
  const workDays = useMemo(() => {
    if (!project?.start_date || !project?.end_date) return 0;
    const days = eachDayOfInterval({
      start: parseISO(project.start_date),
      end: parseISO(project.end_date),
    });
    return days.filter((d) => !isWeekend(d)).length;
  }, [project]);

  const teamSize = teamMembers.length;
  const dailyHours = project?.daily_hours || 8;

  // Required team size per star = hours_for_star / (workDays × dailyHours)
  const requiredByStar = useMemo(() => {
    const perPersonHours = workDays * dailyHours;
    if (perPersonHours === 0) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const result: Record<number, number> = {};
    for (let s = 1; s <= 5; s++) {
      result[s] = hoursByStar[s] / perPersonHours;
    }
    return result;
  }, [hoursByStar, workDays, dailyHours]);

  const totalRequired = Object.values(requiredByStar).reduce((a, b) => a + b, 0);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e: any) => {
      const q = search.toLowerCase();
      const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
      return !search || name.includes(q) || e.employee_code?.toLowerCase().includes(q);
    });
  }, [employees, search]);

  const renderStars = (employeeId: string, currentRating: number) => {
    return (
      <div className="flex gap-0.5">
        {STAR_RATINGS.map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 cursor-pointer transition-colors ${
              s <= currentRating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
            onClick={() => updateRating(employeeId, s)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10"><Users className="w-4 h-4 text-primary" /></div>
        <div>
          <h3 className="font-semibold text-foreground">Team Members</h3>
          <p className="text-xs text-muted-foreground">Select team leader and assign star ratings (1-5)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Member selection */}
        <div className="lg:col-span-3 space-y-4">
          {/* Team Leader */}
          <div>
            <label className="text-xs font-medium flex items-center gap-1 mb-1.5">
              <Star className="w-3 h-3 text-amber-500" /> Select Team Leader <span className="text-destructive">*</span>
            </label>
            <Select value={teamLeaderId} onValueChange={(v) => setLeader.mutate(v)}>
              <SelectTrigger><SelectValue placeholder="Select team leader..." /></SelectTrigger>
              <SelectContent>
                {employees.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.first_name} {e.last_name} {e.employee_code ? `- ${e.employee_code}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Select Team Members</span>
            <Button
              variant={leadersOnly ? "default" : "outline"}
              size="sm"
              className="ml-auto h-7 text-[10px]"
              onClick={() => setLeadersOnly(!leadersOnly)}
            >
              <Star className="w-3 h-3 mr-1" /> Leaders Only
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>

          {/* Employee list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredEmployees.map((emp: any) => {
              const member = teamMap.get(emp.id);
              const isMember = !!member;
              const isLeader = member?.role === "leader";
              const rating = member?.star_rating || 1;

              return (
                <div
                  key={emp.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isMember
                      ? "border-primary/30 bg-primary/5"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    isMember ? "bg-primary" : "bg-muted-foreground/30"
                  }`}>
                    {(emp.first_name || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {emp.first_name} {emp.last_name}
                      </span>
                      {isMember && renderStars(emp.id, rating)}
                      {isLeader && <Badge className="bg-primary text-primary-foreground text-[9px] h-4">Leader</Badge>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{emp.employee_code || "No code"}</span>
                  </div>
                  <Checkbox
                    checked={isMember}
                    onCheckedChange={(c) => toggleMember.mutate({ employeeId: emp.id, checked: !!c })}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Calculation panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60">
            <CardContent className="pt-6 text-center">
              <h4 className="font-semibold text-sm">Team Calculation</h4>
              <p className="text-[10px] text-muted-foreground mb-4">Based on project objects & schedule</p>

              {/* Total Project Hours */}
              <div className="border border-border rounded-lg p-3 mb-3">
                <span className="text-[10px] font-bold uppercase text-primary">Total Project Hours</span>
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {STAR_RATINGS.map((s) => (
                    <div key={s}>
                      <div className="flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground mb-0.5">
                        {Array.from({ length: s }, (_, i) => <Star key={i} className="w-2 h-2 fill-amber-400 text-amber-400" />)}
                      </div>
                      <div className="text-lg font-bold">{hoursByStar[s].toFixed(0)}</div>
                      <div className="text-[8px] text-muted-foreground">hours</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-border">
                  <span className="text-xs font-semibold text-primary">{totalHoursAllStars.toFixed(0)} total hours</span>
                </div>
              </div>

              {/* Working Days */}
              <div className="border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 mb-3">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Total Working Days</span>
                <div className="text-3xl font-bold text-foreground mt-1">{workDays}</div>
                <div className="text-[9px] text-emerald-600">{dailyHours}h/day × {workDays} days = {(workDays * dailyHours).toFixed(0)}h per person</div>
              </div>

              {/* Required Team Size */}
              <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 mb-3">
                <span className="text-[10px] font-bold uppercase text-amber-600">Required Team Size</span>
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {STAR_RATINGS.map((s) => (
                    <div key={s}>
                      <div className="flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground mb-0.5">
                        {Array.from({ length: s }, (_, i) => <Star key={i} className="w-2 h-2 fill-amber-400 text-amber-400" />)}
                      </div>
                      <div className="text-lg font-bold">{requiredByStar[s].toFixed(1)}</div>
                      <div className="text-[8px] text-amber-600">people</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <span className="text-xs font-semibold text-amber-700">{totalRequired.toFixed(1)} total needed</span>
                </div>
              </div>

              {/* Current Team Size */}
              <div className={`border rounded-lg p-3 ${
                teamSize >= Math.ceil(totalRequired)
                  ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
              }`}>
                <span className={`text-[10px] font-bold uppercase ${teamSize >= Math.ceil(totalRequired) ? "text-emerald-600" : "text-amber-600"}`}>
                  Current Team Size
                </span>
                <div className="text-4xl font-bold text-foreground mt-1">{teamSize}</div>
                {teamSize >= Math.ceil(totalRequired) && totalRequired > 0 ? (
                  <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> Sufficient team allocated
                  </div>
                ) : totalRequired > 0 ? (
                  <div className="text-[10px] text-amber-600">Need at least {Math.ceil(totalRequired)} members</div>
                ) : (
                  <div className="text-[10px] text-muted-foreground">Add hours in Objects tab to calculate</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
