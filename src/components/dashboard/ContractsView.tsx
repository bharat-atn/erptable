import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ArrowRight, Trash2, PenTool, Send, Printer, Eye, AlertTriangle, RotateCcw, Play, Zap, RotateCw, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { EnhancedTable, type ColumnDef } from "@/components/ui/enhanced-table";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EmployerSigningDialog } from "./EmployerSigningDialog";
import { ContractPreviewDialog } from "./ContractPreviewDialog";
import { RedoConfirmDialog } from "./RedoConfirmDialog";
import { toast } from "sonner";
export type ResumeMode = "start" | "fasttrack" | "resume";

interface ContractsViewProps {
  onContinueContract?: (contractId: string, mode: ResumeMode) => void;
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
  signing_status: string;
  employee_signed_at: string | null;
  employer_signed_at: string | null;
  created_at: string;
  employees: { email: string; first_name: string | null; last_name: string | null } | null;
  companies: { name: string } | null;
};

const signingStatusOptions = [
  { value: "not_sent", label: "Draft", dot: "bg-gray-400" },
  { value: "sent_to_employee", label: "Sent", dot: "bg-blue-500" },
  { value: "employee_signed", label: "Awaiting Employer", dot: "bg-amber-500" },
  { value: "employer_signed", label: "Fully Signed", dot: "bg-emerald-500" },
];

/** Check if a contract's form_data has critical missing fields */
function getContractMissingFields(fd: Record<string, any> | null): string[] {
  if (!fd) return ["All fields missing"];
  const missing: string[] = [];
  if (!fd.firstName) missing.push("First Name");
  if (!fd.lastName) missing.push("Last Name");
  if (!fd.address) missing.push("Address");
  if (!fd.city) missing.push("City");
  if (!fd.country) missing.push("Country");
  if (!fd.birthday) missing.push("Birthday");
  if (!fd.citizenship) missing.push("Citizenship");
  if (!fd.mobile) missing.push("Mobile");
  if (!fd.email) missing.push("Email");
  if (!fd.mainDuties) missing.push("Main Duties");
  if (!fd.jobType) missing.push("Job Type");
  if (!fd.postingLocation) missing.push("Posting Location");
  if (fd.salaryType === "hourly" && !fd.hourlyBasic) missing.push("Hourly Rate");
  if (fd.salaryType === "monthly" && !fd.monthlyBasic) missing.push("Monthly Rate");
  return missing;
}

export function ContractsView({ onContinueContract }: ContractsViewProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<ContractRow | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [clearSelectionFn, setClearSelectionFn] = useState<(() => void) | null>(null);
  const [signingContractId, setSigningContractId] = useState<string | null>(null);
  const [previewContractId, setPreviewContractId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<ContractRow | null>(null);

  const resetContract = useMutation({
    mutationFn: async (contract: ContractRow) => {
      const { error } = await supabase
        .from("contracts")
        .update({
          signing_status: "not_sent",
          status: "draft",
          signing_token: null,
          employee_signature_url: null,
          employee_signed_at: null,
          employer_signature_url: null,
          employer_signed_at: null,
          signed_at: null,
          sent_for_signing_at: null,
        })
        .eq("id", contract.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract reset to draft — ready for re-signing");
      setResetTarget(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset contract: ${error.message}`);
    },
  });
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`*, employees (email, first_name, last_name), companies (name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map(c => ({
        ...c,
        _missingFields: getContractMissingFields(c.form_data as Record<string, any> | null),
      }));
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
    _signingStatus: c.signing_status,
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
      key: "_signingStatus", header: "Signing Status", accessor: (c) => c._signingStatus,
      render: (c: any) => {
        const s = c.signing_status;
        const missing = c._missingFields || [];
        const hasWarning = missing.length > 0;
        return (
          <div className="flex items-center gap-1.5">
            {s === "employer_signed" ? <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Signed</Badge>
              : s === "employee_signed" ? <Badge variant="pending" className="bg-amber-100 text-amber-800 border-amber-200"><PenTool className="w-3 h-3 mr-1" /> Awaiting Employer</Badge>
              : s === "sent_to_employee" ? <Badge variant="pending" className="bg-blue-100 text-blue-800 border-blue-200"><Send className="w-3 h-3 mr-1" /> Sent</Badge>
              : <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>}
            {hasWarning && (
              <span title={`Missing: ${missing.join(", ")}`}>
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              </span>
            )}
          </div>
        );
      },
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
        filters={[{ key: "_signingStatus", label: "Signing Status", options: signingStatusOptions }]}
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
            {(contract.signing_status === "employer_signed" || contract.signing_status === "signed") && (
              <>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setPreviewContractId(contract.id)}>
                  <Eye className="w-3 h-3" /> View
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setResetTarget(contract)}>
                  <RotateCcw className="w-3 h-3" /> Redo
                </Button>
              </>
            )}
            {contract.signing_status === "employee_signed" && (
              <>
                <Button variant="default" size="sm" className="gap-1" onClick={() => setSigningContractId(contract.id)}>
                  <PenTool className="w-3 h-3" /> Review & Sign
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setResetTarget(contract)}>
                  <RotateCcw className="w-3 h-3" /> Redo
                </Button>
              </>
            )}
            {contract.signing_status === "sent_to_employee" && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setResetTarget(contract)}>
                <RotateCcw className="w-3 h-3" /> Redo
              </Button>
            )}
            {onContinueContract && contract.status === "draft" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    Continue <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 z-50 bg-popover">
                  <DropdownMenuItem onClick={() => onContinueContract(contract.id, "start")} className="gap-2 cursor-pointer">
                    <Play className="w-3.5 h-3.5 text-primary" />
                    From Start
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onContinueContract(contract.id, "fasttrack")} className="gap-2 cursor-pointer">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Fast Track
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onContinueContract(contract.id, "resume")} className="gap-2 cursor-pointer font-medium">
                    <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                    {(() => {
                      const fd = (contract as any).form_data as Record<string, any> | null;
                      return fd?.lastActiveSection ? "Resume Where Left Off" : "Resume (from beginning)";
                    })()}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Employer signing dialog */}
      <EmployerSigningDialog
        contractId={signingContractId}
        open={!!signingContractId}
        onOpenChange={(open) => !open && setSigningContractId(null)}
      />
      {/* Contract preview/print/email dialog */}
      <ContractPreviewDialog
        contractId={previewContractId}
        open={!!previewContractId}
        onOpenChange={(open) => !open && setPreviewContractId(null)}
      />

      {/* Reset / Redo confirmation */}
      <RedoConfirmDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        itemName={resetTarget ? getContractLabel(resetTarget) : ""}
        description="This will clear all signatures and reset the contract to draft status. You can then edit it, re-send for employee signing, and counter-sign again."
        onConfirm={() => resetTarget && resetContract.mutate(resetTarget)}
        isLoading={resetContract.isPending}
      />
    </div>
  );
}
