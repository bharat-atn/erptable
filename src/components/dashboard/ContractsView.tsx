import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export function ContractsView() {
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          employees (
            email,
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Contracts</h1>
        <p className="text-muted-foreground mt-1">
          View and manage employee contracts
        </p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            All Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : contracts?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No contracts yet</p>
              <p className="text-sm">Contracts will appear when employees complete onboarding</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {contracts?.map((contract) => {
                const isSigned = !!contract.signed_at;

                return (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {contract.employees?.first_name && contract.employees?.last_name
                            ? `${contract.employees.first_name} ${contract.employees.last_name}`
                            : contract.employees?.email || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {contract.season_year && <span>{contract.season_year}</span>}
                          {contract.start_date && (
                            <>
                              <span>•</span>
                              <span>
                                {format(new Date(contract.start_date), "MMM d, yyyy")}
                                {contract.end_date && ` - ${format(new Date(contract.end_date), "MMM d, yyyy")}`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {contract.salary && (
                        <span className="text-sm font-medium">
                          ${Number(contract.salary).toLocaleString()}
                        </span>
                      )}
                      <Badge variant={isSigned ? "success" : "pending"}>
                        {isSigned ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Signed
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
