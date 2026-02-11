import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface ContractIdConfig {
  id: string;
  prefix: string;
  separator: string;
  include_year: boolean;
  next_number: number;
  padding: number;
}

export function ContractIdSettingsView() {
  const queryClient = useQueryClient();

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

  const [form, setForm] = useState({
    prefix: "EC",
    separator: "-",
    include_year: true,
    next_number: 1,
    padding: 4,
  });

  useEffect(() => {
    if (config) {
      setForm({
        prefix: config.prefix,
        separator: config.separator,
        include_year: config.include_year,
        next_number: config.next_number,
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

  const year = new Date().getFullYear();
  const exampleEmpCode = "EPM-001";
  const preview = form.include_year
    ? `${form.prefix}${form.separator}${year}${form.separator}${exampleEmpCode}`
    : `${form.prefix}${form.separator}${exampleEmpCode}`;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">
          Contract ID{" "}
          <span className="text-muted-foreground font-normal text-lg">/ Avtals-ID</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure how contract IDs are generated
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            ID Format
          </CardTitle>
          <CardDescription>
            Contract IDs are composed of a prefix, the year, and the employee code.
            Example: EC-2026-EPM-001
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate(form);
            }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prefix">Prefix / Prefix</Label>
                <Input
                  id="prefix"
                  value={form.prefix}
                  onChange={(e) => setForm((p) => ({ ...p, prefix: e.target.value }))}
                  placeholder="EC"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="separator">Separator / Separator</Label>
                <Input
                  id="separator"
                  value={form.separator}
                  onChange={(e) => setForm((p) => ({ ...p, separator: e.target.value }))}
                  placeholder="-"
                  required
                />
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

            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <Badge variant="secondary" className="text-sm font-mono">
                {preview}
              </Badge>
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
