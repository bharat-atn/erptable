import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function TimeReportsView() {
  const { orgId } = useOrg();
  const isMobile = useIsMobile();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["time-reports-history", orgId, selectedYear],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_reports")
        .select("*, forestry_projects!inner(name, project_id_display)")
        .eq("org_id", orgId!)
        .eq("year", Number(selectedYear))
        .order("week_number", { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "approved": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "submitted": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pt-2 md:pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Rapporter • All weekly reports</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[90px] h-10 sm:h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No reports found for {selectedYear}</p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* Mobile: card list */
        <div className="space-y-2">
          {reports.map((r: any) => (
            <Card key={r.id} className="border-border/60">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold font-mono">W{r.week_number}</span>
                  <Badge variant="secondary" className={`text-[10px] capitalize ${statusColor(r.status)}`}>
                    {r.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate">{r.forestry_projects?.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-muted-foreground">{r.forestry_projects?.project_id_display}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop: table */
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Week Start</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-bold text-sm">W{r.week_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{r.forestry_projects?.name}</span>
                        <span className="text-[10px] text-muted-foreground">{r.forestry_projects?.project_id_display}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.week_start}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] capitalize ${statusColor(r.status)}`}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
