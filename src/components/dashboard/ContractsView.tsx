import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { EnhancedTable, type ColumnDef } from "@/components/ui/enhanced-table";

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

const statusFilterOptions = [
  { value: "signed", label: "Signed", dot: "bg-emerald-500" },
  { value: "pending", label: "Pending", dot: "bg-amber-500" },
];

export function ContractsView({ onContinueContract }: ContractsViewProps) {
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

  // Add a derived "statusLabel" for filtering
  const dataWithStatus = (contracts ?? []).map((c) => ({
    ...c,
    _statusLabel: c.signed_at ? "signed" : "pending",
  }));

  type ContractWithStatus = typeof dataWithStatus[number];

  const columns: ColumnDef<ContractWithStatus>[] = [
    { key: "contract_code", header: "Contract No.", accessor: (c) => c.contract_code, hideable: false, render: (c, hl) => <span className="font-medium text-sm">{hl?.(c.contract_code || "—") ?? c.contract_code ?? "—"}</span> },
    {
      key: "employee", header: "Employee",
      accessor: (c) => c.employees?.first_name ? `${c.employees.first_name} ${c.employees.last_name}` : c.employees?.email,
      render: (c, hl) => {
        const name = c.employees?.first_name && c.employees?.last_name ? `${c.employees.first_name} ${c.employees.last_name}` : c.employees?.email || "—";
        return <span className="text-sm">{hl?.(name) ?? name}</span>;
      },
    },
    { key: "company", header: "Employer", accessor: (c) => c.companies?.name, render: (c, hl) => <span className="text-sm">{hl?.(c.companies?.name || "—") ?? c.companies?.name ?? "—"}</span> },
    { key: "season_year", header: "Season", accessor: (c) => c.season_year, className: "text-sm" },
    { key: "start_date", header: "Start Date", accessor: (c) => c.start_date, render: (c) => <span className="text-sm text-muted-foreground">{c.start_date ? format(new Date(c.start_date), "yyyy-MM-dd") : "—"}</span> },
    { key: "end_date", header: "End Date", accessor: (c) => c.end_date, defaultVisible: false, render: (c) => <span className="text-sm text-muted-foreground">{c.end_date ? format(new Date(c.end_date), "yyyy-MM-dd") : "—"}</span> },
    { key: "salary", header: "Salary", accessor: (c) => c.salary, render: (c) => <span className="text-sm">{c.salary ? `$${Number(c.salary).toLocaleString()}` : "—"}</span> },
    {
      key: "_statusLabel", header: "Status", accessor: (c) => c._statusLabel,
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

      <EnhancedTable<ContractWithStatus>
        data={dataWithStatus}
        columns={columns}
        rowKey={(c) => c.id}
        defaultSortKey="contract_code"
        isLoading={isLoading}
        emptyMessage="No contracts found"
        searchPlaceholder="Search contracts by code, employee, employer..."
        enableColumnToggle
        enableDenseToggle
        enableHighlight
        stickyHeader
        filters={[{ key: "_statusLabel", label: "Status", options: statusFilterOptions }]}
        rowActions={onContinueContract ? (contract) => (
          contract.status === "draft" ? (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onContinueContract(contract.id)}>
              Continue <ArrowRight className="w-3 h-3" />
            </Button>
          ) : null
        ) : undefined}
      />
    </div>
  );
}
