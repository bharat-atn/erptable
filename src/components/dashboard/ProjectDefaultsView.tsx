import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Clock, DollarSign, Save } from "lucide-react";

interface ProjectDefaults {
  id?: string;
  project_start_date: string;
  project_end_date: string;
  work_start_date: string;
  work_end_date: string;
  daily_hours: number;
  weekly_hours: number;
  start_time: string;
  end_time: string;
  daily_allowance: number;
  transport_cost_per_km: number;
  accommodation_per_night: number;
  bedding_cleaning_per_night: number;
}

const INITIAL: ProjectDefaults = {
  project_start_date: "2026-02-01",
  project_end_date: "2026-11-30",
  work_start_date: "2026-02-01",
  work_end_date: "2026-10-31",
  daily_hours: 8,
  weekly_hours: 40,
  start_time: "06:30",
  end_time: "17:00",
  daily_allowance: 300,
  transport_cost_per_km: 5,
  accommodation_per_night: 500,
  bedding_cleaning_per_night: 100,
};

interface Props {
  onBack?: () => void;
}

export function ProjectDefaultsView({ onBack }: Props) {
  const { orgId } = useOrg();
  const [data, setData] = useState<ProjectDefaults>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const fetchDefaults = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("project_defaults")
      .select("*")
      .eq("org_id", orgId)
      .limit(1);
    if (rows && rows.length > 0) {
      const r = rows[0] as any;
      setExistingId(r.id);
      setData({
        project_start_date: r.project_start_date || INITIAL.project_start_date,
        project_end_date: r.project_end_date || INITIAL.project_end_date,
        work_start_date: r.work_start_date || INITIAL.work_start_date,
        work_end_date: r.work_end_date || INITIAL.work_end_date,
        daily_hours: r.daily_hours ?? INITIAL.daily_hours,
        weekly_hours: r.weekly_hours ?? INITIAL.weekly_hours,
        start_time: r.start_time || INITIAL.start_time,
        end_time: r.end_time || INITIAL.end_time,
        daily_allowance: r.daily_allowance ?? INITIAL.daily_allowance,
        transport_cost_per_km: r.transport_cost_per_km ?? INITIAL.transport_cost_per_km,
        accommodation_per_night: r.accommodation_per_night ?? INITIAL.accommodation_per_night,
        bedding_cleaning_per_night: r.bedding_cleaning_per_night ?? INITIAL.bedding_cleaning_per_night,
      });
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

  const save = async () => {
    if (!orgId) return;
    setSaving(true);
    const payload = {
      org_id: orgId,
      project_start_date: data.project_start_date || null,
      project_end_date: data.project_end_date || null,
      work_start_date: data.work_start_date || null,
      work_end_date: data.work_end_date || null,
      daily_hours: data.daily_hours,
      weekly_hours: data.weekly_hours,
      start_time: data.start_time,
      end_time: data.end_time,
      daily_allowance: data.daily_allowance,
      transport_cost_per_km: data.transport_cost_per_km,
      accommodation_per_night: data.accommodation_per_night,
      bedding_cleaning_per_night: data.bedding_cleaning_per_night,
    };

    let error;
    if (existingId) {
      ({ error } = await supabase.from("project_defaults").update(payload as any).eq("id", existingId));
    } else {
      const { data: inserted, error: e } = await supabase.from("project_defaults").insert(payload).select().single();
      error = e;
      if (inserted) setExistingId((inserted as any).id);
    }
    setSaving(false);
    if (error) { toast.error("Failed to save defaults"); return; }
    toast.success("Project defaults saved");
  };

  const update = (field: keyof ProjectDefaults, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground">Loading project defaults…</div>;
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global Project Defaults</h1>
          <p className="text-muted-foreground text-sm mt-1">Set default values for new projects</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>Back</Button>
        )}
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold">Timeline</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground">Project Start Date</label>
                <Input
                  type="date"
                  value={data.project_start_date}
                  onChange={e => update("project_start_date", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Project End Date</label>
                <Input
                  type="date"
                  value={data.project_end_date}
                  onChange={e => update("project_end_date", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Work Start Date</label>
                <Input
                  type="date"
                  value={data.work_start_date}
                  onChange={e => update("work_start_date", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Work End Date</label>
                <Input
                  type="date"
                  value={data.work_end_date}
                  onChange={e => update("work_end_date", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-base font-semibold">Daily Schedule</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground">Daily Hours</label>
                <Input
                  type="number"
                  value={data.daily_hours}
                  onChange={e => update("daily_hours", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Weekly Hours</label>
                <Input
                  type="number"
                  value={data.weekly_hours}
                  onChange={e => update("weekly_hours", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Start Time</label>
                <Input
                  type="time"
                  value={data.start_time}
                  onChange={e => update("start_time", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">End Time</label>
                <Input
                  type="time"
                  value={data.end_time}
                  onChange={e => update("end_time", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Costs & Prices */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-semibold">Costs & Prices</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground">Daily Allowance (SEK)</label>
                <Input
                  type="number"
                  value={data.daily_allowance}
                  onChange={e => update("daily_allowance", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Transport Cost/km (SEK)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={data.transport_cost_per_km}
                  onChange={e => update("transport_cost_per_km", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Accommodation/Night (SEK)</label>
                <Input
                  type="number"
                  value={data.accommodation_per_night}
                  onChange={e => update("accommodation_per_night", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Bedding Cleaning/Night (SEK)</label>
                <Input
                  type="number"
                  value={data.bedding_cleaning_per_night}
                  onChange={e => update("bedding_cleaning_per_night", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg" className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Defaults"}
        </Button>
      </div>
    </div>
  );
}
