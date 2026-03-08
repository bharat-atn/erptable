import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Plus, Search, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SLA_OPTIONS = [
  { value: "101", label: "101 – Easy" },
  { value: "103", label: "103 – Easy/Standard" },
  { value: "105", label: "105 – Standard" },
  { value: "107", label: "107 – Standard/Difficult" },
  { value: "109", label: "109 – Difficult" },
  { value: "111", label: "111 – Difficult/Extreme" },
  { value: "113", label: "113 – Extreme" },
];

interface Props {
  projectId: string;
  orgId: string;
}

function generateObjectId() {
  const y = new Date().getFullYear().toString().slice(-2);
  const n = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `OBJ-${y}-${n}`;
}

export function ProjectObjectsTab({ projectId, orgId }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [saved, setSaved] = useState(false);

  const { data: objects = [], isLoading } = useQuery({
    queryKey: ["forestry-objects", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forestry_objects" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!projectId,
  });

  const addRowsMutation = useMutation({
    mutationFn: async (count: number) => {
      const rows = Array.from({ length: count }, () => ({
        project_id: projectId,
        org_id: orgId,
        object_id_display: generateObjectId(),
        name: "New Object",
        sla_class: "standard",
        status: "registered",
      }));
      const { error } = await supabase.from("forestry_objects" as any).insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-objects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["forestry-objects-count", projectId] });
      toast.success("Rows added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forestry_objects" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forestry-objects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["forestry-objects-count", projectId] });
    },
  });

  const updateField = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("forestry_objects" as any)
      .update({ [field]: value } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      queryClient.invalidateQueries({ queryKey: ["forestry-objects", projectId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const filtered = useMemo(() => {
    return objects.filter((o: any) => {
      const q = search.toLowerCase();
      const matchSearch = !search || o.object_id_display?.toLowerCase().includes(q) || o.name?.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [objects, search]);

  const starHeaders = ["1★", "2★", "3★", "4★", "5★"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10"><MapPin className="w-4 h-4 text-primary" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Project Objects</h3>
            <p className="text-xs text-muted-foreground">Add objects from the register with project-specific details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Saved
            </Badge>
          )}
          <Button variant="outline" onClick={() => addRowsMutation.mutate(5)} disabled={addRowsMutation.isPending}>
            <Plus className="w-4 h-4 mr-1" /> Add 5 More Rows
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by Object ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="clearing">Clearing</SelectItem>
            <SelectItem value="planting">Planting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Object ID</TableHead>
                <TableHead className="w-[120px]">Name</TableHead>
                <TableHead className="w-[80px]">Quantity</TableHead>
                <TableHead className="w-[120px]">SLA Class</TableHead>
                <TableHead className="text-center" colSpan={5}>
                  <span className="text-xs">Execution units/day →</span>
                </TableHead>
                <TableHead className="text-center" colSpan={5}>
                  <span className="text-xs">Total hours →</span>
                </TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
              <TableRow>
                <TableHead />
                <TableHead />
                <TableHead />
                <TableHead />
                {starHeaders.map((s) => <TableHead key={"e" + s} className="text-center text-[10px] w-14">{s}</TableHead>)}
                {starHeaders.map((s) => <TableHead key={"h" + s} className="text-center text-[10px] w-14 bg-primary/5">{s}</TableHead>)}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8 text-muted-foreground text-sm">
                    No objects yet. Click "Add 5 More Rows" to start.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((obj: any) => {
                  let sd: any = {};
                  if (obj.notes) {
                    try { sd = JSON.parse(obj.notes); } catch { sd = {}; }
                  }
                  return (
                    <TableRow key={obj.id}>
                      <TableCell className="font-mono text-xs">{obj.object_id_display}</TableCell>
                      <TableCell>
                        <Input
                          value={obj.name}
                          onChange={(e) => updateField(obj.id, "name", e.target.value)}
                          className="h-8 text-xs w-[110px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={obj.area_hectares || 0}
                          onBlur={(e) => updateField(obj.id, "area_hectares", Number(e.target.value))}
                          className="h-8 text-xs w-16 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={obj.sla_class}
                          onValueChange={(v) => updateField(obj.id, "sla_class", v)}
                        >
                          <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue placeholder="Required..." /></SelectTrigger>
                          <SelectContent>
                            {SLA_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {/* Execution units - 5 star cols */}
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TableCell key={"e" + star} className="text-center">
                          <Input
                            type="number"
                            defaultValue={0}
                            className="h-8 text-xs w-14 text-center"
                          />
                        </TableCell>
                      ))}
                      {/* Total hours - 5 star cols with colored bg */}
                      {[1, 2, 3, 4, 5].map((star) => {
                        const colors = ["bg-blue-50", "bg-blue-100", "bg-rose-50", "bg-rose-100", "bg-rose-200"];
                        return (
                          <TableCell key={"h" + star} className={`text-center ${colors[star - 1]}`}>
                            <Input
                              type="number"
                              defaultValue={0}
                              className={`h-8 text-xs w-14 text-center font-semibold ${colors[star - 1]} border-0`}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteMutation.mutate(obj.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {/* Totals row */}
              {filtered.length > 0 && (
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={9} className="text-right text-xs">Total hours</TableCell>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const colors = ["bg-blue-100 text-blue-700", "bg-blue-200 text-blue-700", "bg-rose-100 text-rose-700", "bg-rose-200 text-rose-700", "bg-rose-300 text-rose-700"];
                    return (
                      <TableCell key={"t" + star} className="text-center">
                        <Badge className={`text-[10px] ${colors[star - 1]}`}>0.00</Badge>
                      </TableCell>
                    );
                  })}
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
