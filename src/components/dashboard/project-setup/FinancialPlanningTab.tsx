import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DollarSign, Home, Truck, Wrench, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { differenceInCalendarDays, eachDayOfInterval, isWeekend, parseISO } from "date-fns";

interface Props {
  project: any;
  projectId: string;
  orgId: string;
  onSave: (updates: Record<string, any>) => Promise<void>;
  onSaveSetupData: (partial: Record<string, any>) => Promise<void>;
}

function formatSEK(val: number) {
  return new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + " sek";
}

export function FinancialPlanningTab({ project, projectId, orgId, onSave, onSaveSetupData }: Props) {
  const sd = (project?.setup_data || {}) as any;
  const [viewMode, setViewMode] = useState<"less" | "more">("less");

  // Financial overrides from setup_data
  const [totalKm, setTotalKm] = useState(String(sd.total_km ?? 500));
  const [costPerKm, setCostPerKm] = useState(String(sd.cost_per_km ?? 5));
  const [manualNights, setManualNights] = useState(String(sd.manual_nights ?? ""));
  const [rentPerNight, setRentPerNight] = useState(String(sd.rent_per_night ?? 500));
  const [beddingPerNight, setBeddingPerNight] = useState(String(sd.bedding_per_night ?? 100));
  const [equipmentCost, setEquipmentCost] = useState(String(sd.equipment_cost ?? 50));
  const [brushCutterCost, setBrushCutterCost] = useState(String(sd.brush_cutter_cost ?? 50));
  const [accomOpen, setAccomOpen] = useState(true);
  const [transportOpen, setTransportOpen] = useState(true);
  const [consumptionOpen, setConsumptionOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(false);

  // Fetch objects for revenue
  const { data: objects = [] } = useQuery({
    queryKey: ["forestry-objects", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("forestry_objects" as any)
        .select("*")
        .eq("project_id", projectId);
      return (data || []) as any[];
    },
  });

  // Calculations
  const totalNights = useMemo(() => {
    if (!project?.start_date || !project?.end_date) return 0;
    return differenceInCalendarDays(parseISO(project.end_date), parseISO(project.start_date));
  }, [project]);

  const workDays = useMemo(() => {
    if (!project?.start_date || !project?.end_date) return 0;
    return eachDayOfInterval({
      start: parseISO(project.start_date),
      end: parseISO(project.end_date),
    }).filter((d) => !isWeekend(d)).length;
  }, [project]);

  const nights = Number(manualNights) || totalNights;
  const totalRent = nights * Number(rentPerNight);
  const totalBedding = nights * Number(beddingPerNight);
  const totalAccommodation = totalRent + totalBedding;
  const totalTransport = Number(totalKm) * Number(costPerKm);
  const totalHours = workDays * (project?.daily_hours || 8);
  const totalEquipment = Number(equipmentCost) * totalHours;
  const totalBrushCutter = Number(brushCutterCost) * totalHours;
  const totalConsumption = totalEquipment + totalBrushCutter;
  const totalRevenue = 0; // From objects (placeholder)
  const totalCost = totalAccommodation + totalTransport + totalConsumption;
  const grossProfit = totalRevenue - totalCost;

  const handleSave = async () => {
    await onSaveSetupData({
      financial_saved: true,
      total_km: Number(totalKm),
      cost_per_km: Number(costPerKm),
      manual_nights: manualNights ? Number(manualNights) : null,
      rent_per_night: Number(rentPerNight),
      bedding_per_night: Number(beddingPerNight),
      equipment_cost: Number(equipmentCost),
      brush_cutter_cost: Number(brushCutterCost),
    });
    await onSave({
      revenue: totalRevenue,
      cost: totalCost,
      budget: totalCost,
    });
    toast.success("Financial plan saved");
  };

  return (
    <div className="space-y-6">
      {/* Total Overview */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Total Calculation Overview</h3>
          <div className="divide-y divide-border">
            <div className="flex justify-between py-3">
              <span className="text-sm">Total Object Revenue</span>
              <span className="text-sm font-semibold text-emerald-600">{formatSEK(totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-sm">Total Project Cost</span>
              <span className="text-sm font-semibold text-destructive">{formatSEK(totalCost)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-sm font-semibold">Gross Profit</span>
              <span className={`text-sm font-bold ${grossProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {formatSEK(grossProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-muted rounded-lg p-1">
          <Button size="sm" variant={viewMode === "less" ? "default" : "ghost"} onClick={() => setViewMode("less")} className="text-xs">
            Less information
          </Button>
          <Button size="sm" variant={viewMode === "more" ? "default" : "ghost"} onClick={() => setViewMode("more")} className="text-xs">
            More information
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
        <div>
          <h3 className="font-semibold text-foreground">Financial Planning</h3>
          <p className="text-xs text-muted-foreground">Project revenue calculation</p>
        </div>
      </div>

      {/* Revenue */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-sm mb-3">Revenue</h4>
          {objects.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <DollarSign className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No project objects found. Please add objects in the Objects tab first.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{objects.length} objects loaded</p>
          )}
        </CardContent>
      </Card>

      {viewMode === "more" && (
        <>
          {/* Accommodation */}
          <Collapsible open={accomOpen} onOpenChange={setAccomOpen}>
            <Card className="border-border/60">
              <CollapsibleTrigger asChild>
                <CardContent className="pt-6 pb-4 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10"><Home className="w-4 h-4 text-primary" /></div>
                    <h4 className="font-semibold text-sm">Accommodation cost</h4>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${accomOpen ? "" : "-rotate-90"}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-4">
                  {/* Rent */}
                  <div className="border border-border/40 rounded-lg p-4">
                    <h5 className="text-sm font-medium mb-3">Rent</h5>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-[10px]">Total nights (from schedule)</Label>
                        <Input value={totalNights} disabled className="h-8 text-right bg-muted/50" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Manual nights (override)</Label>
                        <Input value={manualNights || totalNights} onChange={(e) => setManualNights(e.target.value)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Standard price per night</Label>
                        <Input value={rentPerNight} onChange={(e) => setRentPerNight(e.target.value)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Total cost for rent</Label>
                        <Input value={formatSEK(totalRent)} disabled className="h-8 text-right bg-muted/50 font-semibold" />
                      </div>
                    </div>
                  </div>
                  {/* Bedding */}
                  <div className="border border-border/40 rounded-lg p-4">
                    <h5 className="text-sm font-medium mb-3">Bedding and cleaning cost</h5>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-[10px]">Total nights (from schedule)</Label>
                        <Input value={totalNights} disabled className="h-8 text-right bg-muted/50" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Manual nights (override)</Label>
                        <Input value={manualNights || totalNights} onChange={(e) => setManualNights(e.target.value)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Standard price per night</Label>
                        <Input value={beddingPerNight} onChange={(e) => setBeddingPerNight(e.target.value)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Total cost for bedding and cleaning</Label>
                        <Input value={formatSEK(totalBedding)} disabled className="h-8 text-right bg-muted/50 font-semibold" />
                      </div>
                    </div>
                  </div>
                  {/* Accommodation total */}
                  <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <span className="text-sm font-semibold text-primary">Total Accommodation Cost</span>
                    <span className="text-sm font-bold text-primary">{formatSEK(totalAccommodation)}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Transportation */}
          <Collapsible open={transportOpen} onOpenChange={setTransportOpen}>
            <Card className="border-border/60">
              <CollapsibleTrigger asChild>
                <CardContent className="pt-6 pb-4 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10"><Truck className="w-4 h-4 text-primary" /></div>
                    <h4 className="font-semibold text-sm">Transportation cost</h4>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${transportOpen ? "" : "-rotate-90"}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[10px]">Total kilometer for project</Label>
                      <Input value={totalKm} onChange={(e) => setTotalKm(e.target.value)} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Cost per kilometer</Label>
                      <Input value={costPerKm} onChange={(e) => setCostPerKm(e.target.value)} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Total cost for transportation</Label>
                      <Input value={formatSEK(totalTransport)} disabled className="h-8 text-right bg-muted/50 font-semibold" />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Consumption */}
          <Collapsible open={consumptionOpen} onOpenChange={setConsumptionOpen}>
            <Card className="border-border/60">
              <CollapsibleTrigger asChild>
                <CardContent className="pt-6 pb-4 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10"><Wrench className="w-4 h-4 text-primary" /></div>
                    <h4 className="font-semibold text-sm">Consumption cost</h4>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${consumptionOpen ? "" : "-rotate-90"}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-4 gap-3 text-[10px] uppercase font-bold text-muted-foreground mb-2">
                    <span>Type of cost</span><span className="text-right">Cost per unit (SEK)</span>
                    <span className="text-right">Total units (hours)</span><span className="text-right">Total consumption costs</span>
                  </div>
                  {/* Equipment */}
                  <div className="grid grid-cols-4 gap-3 items-center py-2 border-b border-border/30">
                    <span className="text-sm">Wear and tear on safety equipment and clothing</span>
                    <Input value={equipmentCost} onChange={(e) => setEquipmentCost(e.target.value)} className="h-8 text-right" />
                    <span className="text-sm text-right">{totalHours.toFixed(2)}</span>
                    <span className="text-sm text-right font-medium">{formatSEK(totalEquipment)}</span>
                  </div>
                  {/* Brush Cutter */}
                  <div className="grid grid-cols-4 gap-3 items-center py-2 border-b border-border/30">
                    <span className="text-sm">Wear and tear on Brush Cutter and its energy consumption</span>
                    <Input value={brushCutterCost} onChange={(e) => setBrushCutterCost(e.target.value)} className="h-8 text-right" />
                    <span className="text-sm text-right">{totalHours.toFixed(2)}</span>
                    <span className="text-sm text-right font-medium">{formatSEK(totalBrushCutter)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3">
                    <span className="text-sm font-semibold text-primary">Total Consumption Costs</span>
                    <span className="text-sm font-bold text-primary">{formatSEK(totalConsumption)}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Other costs */}
          <Collapsible open={otherOpen} onOpenChange={setOtherOpen}>
            <Card className="border-border/60">
              <CollapsibleTrigger asChild>
                <CardContent className="pt-6 pb-6 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
                    <h4 className="font-semibold text-sm">Other costs</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{formatSEK(0)}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${otherOpen ? "" : "-rotate-90"}`} />
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 text-sm text-muted-foreground">
                  No additional costs configured.
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          {viewMode === "less" ? "Continue to Preliminary Payroll" : "Save Financial Plan"}
        </Button>
      </div>
    </div>
  );
}
