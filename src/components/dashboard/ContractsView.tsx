import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Search, Filter, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface ContractsViewProps {
  onContinueContract?: (contractId: string) => void;
}

export function ContractsView({ onContinueContract }: ContractsViewProps) {
  const [search, setSearch] = useState("");

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`*, employees (email, first_name, last_name), companies (name)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredContracts = contracts?.filter((c) =>
    c.employees?.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.employees?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.employees?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contract_code?.toLowerCase().includes(search.toLowerCase()) ||
    c.companies?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Contracts</h1>
        <p className="text-muted-foreground text-sm">
          View and manage employee contracts
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            All Contracts
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-[180px]"
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contract No.</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Season</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Start Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">End Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Salary</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td colSpan={9} className="py-4 px-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredContracts?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No contracts found
                    </td>
                  </tr>
                ) : (
                  filteredContracts?.map((contract) => (
                    <tr key={contract.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm font-medium">
                        {contract.contract_code || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {contract.employees?.first_name && contract.employees?.last_name
                          ? `${contract.employees.first_name} ${contract.employees.last_name}`
                          : contract.employees?.email || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {contract.companies?.name || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm">{contract.season_year || "—"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {contract.start_date ? format(new Date(contract.start_date), "yyyy-MM-dd") : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {contract.end_date ? format(new Date(contract.end_date), "yyyy-MM-dd") : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {contract.salary ? `$${Number(contract.salary).toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={contract.signed_at ? "success" : "pending"}>
                          {contract.signed_at ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Signed</>
                          ) : (
                            <><Clock className="w-3 h-3 mr-1" /> Pending</>
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {contract.status === "draft" && onContinueContract && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => onContinueContract(contract.id)}
                          >
                            Continue
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
