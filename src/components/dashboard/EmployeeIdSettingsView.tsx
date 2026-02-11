import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";
import { toast } from "sonner";

interface EmployeeIdConfig {
  id: string;
  prefix: string;
  separator: string;
  next_number: number;
  padding: number;
}

export function EmployeeIdSettingsView() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["employee-id-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_id_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as EmployeeIdConfig;
    },
  });

  const [form, setForm] = useState({ prefix: "", separator: "", next_number: 1, padding: 4 });

  useEffect(() => {
    if (config) {
      setForm({
        prefix: config.prefix,
        separator: config.separator,
        next_number: config.next_number,
        padding: config.padding,
      });
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form) => {
      if (!config) return;
      const { error } = await supabase
        .from("employee_id_settings")
        .update(values)
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-id-settings"] });
      toast.success("Employee ID settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const preview = `${form.prefix}${form.separator}${String(form.next_number).padStart(form.padding, "0")}`;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">
          Employee ID{" "}
          <span className="text-muted-foreground font-normal text-lg">/ Anställnings-ID</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure how employee IDs are generated
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" />
            ID Format
          </CardTitle>
          <CardDescription>
            Set the prefix, separator, padding, and starting number for new employee IDs.
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
                  placeholder="EPM"
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
              <div className="space-y-1.5">
                <Label htmlFor="padding">Number Padding / Siffror</Label>
                <Input
                  id="padding"
                  type="number"
                  min={1}
                  max={10}
                  value={form.padding}
                  onChange={(e) => setForm((p) => ({ ...p, padding: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="next_number">Next Number / Nästa nummer</Label>
                <Input
                  id="next_number"
                  value={String(form.next_number).padStart(form.padding, "0")}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    if (!raw) return;
                    const num = parseInt(raw, 10);
                    const newPadding = Math.max(form.padding, raw.length);
                    setForm((p) => ({ ...p, next_number: num, padding: newPadding }));
                  }}
                  required
                />
              </div>
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
