import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ArrowRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { EnhancedTable, type ColumnDef } from "@/components/ui/enhanced-table";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { toast } from "sonner";
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
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<ContractRow | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [clearSelectionFn, setClearSelectionFn] = useState<(() => void) | null>(null);

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

  const deleteContract = useMutation({
    mutationFn: async (contract: ContractRow) => {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contract.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract deleted successfully");
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contract: ${error.message}`);
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success(`${ids.length} contract(s) deleted successfully`);
      setBulkDeleteIds(null);
      clearSelectionFn?.();
      setClearSelectionFn(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contracts: ${error.message}`);
    },
  });

  // Add a derived "statusLabel" for filtering
  const dataWithStatus = (contracts ?? []).map((c) => ({
    ...c,
    _statusLabel: c.signed_at ? "signed" : "pending",
  }));

  type ContractWithStatus = typeof dataWithStatus[number];

  const getContractLabel = (c: ContractRow) => {
    const empName = c.employees?.first_name && c.employees?.last_name
      ? `${c.employees.first_name} ${c.employees.last_name}`
      : c.employees?.email || "Unknown";
    return `${c.contract_code || "Draft"} — ${empName}`;
  };

  const columns: ColumnDef<ContractWithStatus>[] = [
    { key: "contract_code", header: "Contract ID", accessor: (c) => c.contract_code, hideable: false, render: (c, hl) => <span className="font-medium text-sm">{hl?.(c.contract_code || "—") ?? c.contract_code ?? "—"}</span> },
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
        enableSelection
        stickyHeader
        filters={[{ key: "_statusLabel", label: "Status", options: statusFilterOptions }]}
        bulkActions={(selectedKeys, clearSelection) => (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setBulkDeleteIds(selectedKeys);
              setClearSelectionFn(() => clearSelection);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete {selectedKeys.length}
          </Button>
        )}
        rowActions={(contract) => (
          <div className="flex items-center gap-1">
            {onContinueContract && contract.status === "draft" && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => onContinueContract(contract.id)}>
                Continue <ArrowRight className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteTarget(contract)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      />

      {/* Single delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Contract"
        itemName={deleteTarget ? getContractLabel(deleteTarget) : ""}
        description={
          deleteTarget?.contract_code
            ? `Contract ID "${deleteTarget.contract_code}" will be released and can be reassigned to a future contract.`
            : "This draft contract has no assigned Contract ID yet."
        }
        onConfirm={() => deleteTarget && deleteContract.mutate(deleteTarget)}
        isLoading={deleteContract.isPending}
        requireTypedConfirmation
      />

      {/* Bulk delete confirmation */}
      <DeleteConfirmDialog
        open={!!bulkDeleteIds}
        onOpenChange={(open) => !open && setBulkDeleteIds(null)}
        title="Delete Multiple Contracts"
        itemName={`${bulkDeleteIds?.length ?? 0} contracts`}
        description="All selected contracts and their associated contract IDs will be released. This action cannot be undone."
        onConfirm={() => bulkDeleteIds && bulkDelete.mutate(bulkDeleteIds)}
        isLoading={bulkDelete.isPending}
        requireTypedConfirmation
      />
    </div>
  );
}
