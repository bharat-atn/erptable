import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface ContractIdConfig {
  id: string;
  prefix: string;
  separator: string;
  include_year: boolean;
  next_number: number;
  padding: number;
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

export function ContractIdSettingsView() {
  const queryClient = useQueryClient();
  const [resetTarget, setResetTarget] = useState<YearCounter | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["contract-id-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_id_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as ContractIdConfig;
    },
  });

  const { data: yearCounters } = useQuery({
    queryKey: ["contract-year-counters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_id_year_counters")
        .select("*")
        .order("year", { ascending: true });
      if (error) throw error;
      return data as YearCounter[];
    },
  });

  const [form, setForm] = useState({
    prefix: "EC",
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

  const mutation = useMutation({
    mutationFn: async (values: typeof form) => {
      if (!config) return;
      const { error } = await supabase
        .from("contract_id_settings")
        .update(values)
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-id-settings"] });
      toast.success("Contract ID settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetYearMutation = useMutation({
    mutationFn: async (counter: YearCounter) => {
      const { error } = await supabase
        .from("contract_id_year_counters")
        .update({ next_number: 1, issued_count: 0 })
        .eq("id", counter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-year-counters"] });
      toast.success("Year counter reset");
      setResetTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const currentYear = new Date().getFullYear();
  const previewNext = yearCounters?.find((c) => c.year === currentYear)?.next_number ?? 1;
  const preview = form.include_year
    ? `${form.prefix}${form.separator}${currentYear}${form.separator}${String(previewNext).padStart(form.padding, "0")}`
    : `${form.prefix}${form.separator}${String(previewNext).padStart(form.padding, "0")}`;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">
          Contract ID{" "}
          <span className="text-muted-foreground font-normal text-lg">/ Avtals-ID</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure how contract IDs are generated. The format is{" "}
          <strong>PREFIX{form.separator}YEAR{form.separator}NUMBER</strong>
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              ID Format
            </CardTitle>
            <CardDescription>
              Contract numbers reset each year automatically.
            </CardDescription>
          </div>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            size="sm"
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={form.prefix}
                onChange={(e) => setForm((p) => ({ ...p, prefix: e.target.value }))}
                placeholder="EC"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="separator">Separator</Label>
              <Select
                value={form.separator}
                onValueChange={(v) => setForm((p) => ({ ...p, separator: v }))}
              >
                <SelectTrigger id="separator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {separatorOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="padding">Number Padding</Label>
              <Select
                value={String(form.padding)}
                onValueChange={(v) => setForm((p) => ({ ...p, padding: Number(v) }))}
              >
                <SelectTrigger id="padding">
                  <SelectValue />
                </SelectTrigger>
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
              id="include_year"
              checked={form.include_year}
              onCheckedChange={(v) => setForm((p) => ({ ...p, include_year: v }))}
            />
            <Label htmlFor="include_year">Include Year / Inkludera år</Label>
          </div>

          <div className="p-3 rounded-md bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Preview — next contract number:</p>
            <p className="text-lg font-semibold font-mono">{preview}</p>
          </div>
        </CardContent>
      </Card>

      {/* Year Counters */}
      {form.include_year && yearCounters && yearCounters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Year Counters</CardTitle>
            <CardDescription>Each year has its own independent numbering sequence.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {yearCounters.map((counter) => (
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
                    {counter.issued_count > 0 && (
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
                  <p className="text-sm text-muted-foreground">
                    {counter.issued_count} contract{counter.issued_count !== 1 ? "s" : ""} issued → next:{" "}
                    <span className="font-mono">
                      {form.prefix}{form.separator}{counter.year}{form.separator}
                      {String(counter.next_number).padStart(form.padding, "0")}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        title="Reset Year Counter"
        itemName={resetTarget ? `${resetTarget.year} counter` : ""}
        description={`This will reset the ${resetTarget?.year} counter back to 1. Existing contract codes will not be changed, but new contracts may receive duplicate numbers.`}
        onConfirm={() => resetTarget && resetYearMutation.mutate(resetTarget)}
        isLoading={resetYearMutation.isPending}
        requireTypedConfirmation
      />
    </div>
  );
}
