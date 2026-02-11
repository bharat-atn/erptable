import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Search, Filter, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { SortableTable, type ColumnDef } from "@/components/ui/sortable-table";

interface ContractsViewProps {
  onContinueContract?: (contractId: string) => void;
}

type ContractRow = {
  id: string;
  contract_code: string | null;
  employee_id: string;
  company_id: string | null;
  season_year: string | null;
  start_date: string | null;
  end_date: string | null;
  salary: number | null;
  status: string;
  signed_at: string | null;
  created_at: string;
  employees: { email: string; first_name: string | null; last_name: string | null } | null;
  companies: { name: string } | null;
};

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
      return data as ContractRow[];
    },
  });

  const filteredContracts = contracts?.filter((c) =>
    c.employees?.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.employees?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.employees?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contract_code?.toLowerCase().includes(search.toLowerCase()) ||
    c.companies?.name?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const columns: ColumnDef<ContractRow>[] = [
    { key: "contract_code", header: "Contract No.", accessor: (c) => c.contract_code, render: (c) => <span className="font-medium text-sm">{c.contract_code || "—"}</span> },
    {
      key: "employee", header: "Employee",
      accessor: (c) => c.employees?.first_name ? `${c.employees.first_name} ${c.employees.last_name}` : c.employees?.email,
      render: (c) => <span className="text-sm">{c.employees?.first_name && c.employees?.last_name ? `${c.employees.first_name} ${c.employees.last_name}` : c.employees?.email || "—"}</span>,
    },
    { key: "company", header: "Employer", accessor: (c) => c.companies?.name, className: "text-sm" },
    { key: "season_year", header: "Season", accessor: (c) => c.season_year, className: "text-sm" },
    { key: "start_date", header: "Start Date", accessor: (c) => c.start_date, render: (c) => <span className="text-sm text-muted-foreground">{c.start_date ? format(new Date(c.start_date), "yyyy-MM-dd") : "—"}</span> },
    { key: "end_date", header: "End Date", accessor: (c) => c.end_date, render: (c) => <span className="text-sm text-muted-foreground">{c.end_date ? format(new Date(c.end_date), "yyyy-MM-dd") : "—"}</span> },
    { key: "salary", header: "Salary", accessor: (c) => c.salary, render: (c) => <span className="text-sm">{c.salary ? `$${Number(c.salary).toLocaleString()}` : "—"}</span> },
    {
      key: "status", header: "Status", accessor: (c) => c.signed_at ? "signed" : "pending",
      render: (c) => (
        <Badge variant={c.signed_at ? "success" : "pending"}>
          {c.signed_at ? <><CheckCircle className="w-3 h-3 mr-1" /> Signed</> : <><Clock className="w-3 h-3 mr-1" /> Pending</>}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Contracts</h1>
        <p className="text-muted-foreground text-sm">View and manage employee contracts</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> All Contracts
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-[180px]" />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9"><Filter className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SortableTable<ContractRow>
            data={filteredContracts}
            columns={columns}
            rowKey={(c) => c.id}
            defaultSortKey="contract_code"
            isLoading={isLoading}
            emptyMessage="No contracts found"
            rowActions={onContinueContract ? (contract) => (
              contract.status === "draft" ? (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => onContinueContract(contract.id)}>
                  Continue <ArrowRight className="w-3 h-3" />
                </Button>
              ) : null
            ) : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
