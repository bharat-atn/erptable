import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  FileText,
  Users,
  Star,
  Clock,
  CheckCircle,
  Snowflake,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  FilePlus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { SortableTable, type ColumnDef } from "@/components/ui/sortable-table";
import type { Tables } from "@/integrations/supabase/types";
import { EmployeeFormDialog, type EmployeeFormData } from "./EmployeeFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useUiLanguage } from "@/hooks/useUiLanguage";

type EmployeeStatus = "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE";
type Employee = Tables<"employees">;

interface OperationsViewProps {
  onNavigate?: (view: string, employeeId?: string) => void;
}

const statusConfig: Record<EmployeeStatus, { label: string; dot: string }> = {
  INVITED: { label: "Invited", dot: "bg-blue-500" },
  ONBOARDING: { label: "Onboarding", dot: "bg-amber-500" },
  ACTIVE: { label: "Active", dot: "bg-emerald-500" },
  INACTIVE: { label: "Terminated", dot: "bg-red-500" },
};

const ITEMS_PER_PAGE = 7;

const operationsColumns: ColumnDef<Employee>[] = [
  {
    key: "employee_code",
    header: "Employee ID",
    accessor: (e) => e.employee_code,
    render: (e) => <span className="font-medium text-sm">{e.employee_code || "—"}</span>,
  },
  {
    key: "name",
    header: "Name",
    accessor: (e) => `${e.first_name || ""} ${e.last_name || ""}`.trim(),
    minWidth: 180,
    render: (e) => {
      const fullName = e.first_name && e.last_name ? `${e.first_name} ${e.last_name}` : "—";
      const initials = e.first_name ? `${e.first_name[0]}${e.last_name?.[0] || ""}` : "?";
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-primary">{initials}</span>
          </div>
          <span className="font-medium text-sm">{fullName}</span>
        </div>
      );
    },
  },
  { key: "email", header: "Email", accessor: (e) => e.email, className: "text-sm" },
  { key: "phone", header: "Phone", accessor: (e) => e.phone, className: "text-sm text-muted-foreground" },
  { key: "city", header: "City", accessor: (e) => e.city, className: "text-sm text-muted-foreground" },
  { key: "country", header: "Country", accessor: (e) => e.country, className: "text-sm text-muted-foreground" },
  {
    key: "status",
    header: "Status",
    accessor: (e) => e.status,
    render: (e) => {
      const config = statusConfig[e.status as EmployeeStatus];
      return (
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className="text-sm">{config.label}</span>
        </div>
      );
    },
  },
  {
    key: "created_at",
    header: "Timeline",
    accessor: (e) => e.created_at,
    render: (e) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        {format(new Date(e.created_at), "MMM dd yyyy")}
      </div>
    ),
  },
];

type StatusFilter = "ALL" | "INVITED" | "RENEWAL" | "ONBOARDING" | "ACTIVE" | "SEASONAL" | "INACTIVE";

export function OperationsView({ onNavigate }: OperationsViewProps) {
  const { t } = useUiLanguage();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const queryClient = useQueryClient();
  const { orgId } = useOrg();

  const { data: employees, isLoading } = useQuery({
    queryKey: ["operations-employees", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("org_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: invitationStats } = useQuery({
    queryKey: ["operations-invitation-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("invitations").select("id, status, type").eq("org_id", orgId!);
      if (error) throw error;
      const sent = data?.filter((i) => i.status === "SENT").length || 0;
      const completed = data?.filter((i) => i.status === "ACCEPTED").length || 0;
      const renewalCompleted = data?.filter((i) => i.type === "CONTRACT_RENEWAL" && i.status === "ACCEPTED").length || 0;
      const pending = data?.filter((i) => i.status === "PENDING").length || 0;
      return { sent, completed, pending, renewalCompleted, total: sent + completed + pending };
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ["operations-contracts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("id, employee_id, status, signing_status").eq("org_id", orgId!);
      if (error) throw error;
      return data;
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["operations-employees"] });
    queryClient.invalidateQueries({ queryKey: ["operations-contracts"] });
    queryClient.invalidateQueries({ queryKey: ["operations-invitation-stats"] });
    queryClient.invalidateQueries({ queryKey: ["register-employees"] });
    queryClient.invalidateQueries({ queryKey: ["invitations"] });
    queryClient.invalidateQueries({ queryKey: ["contracts"] });
  };

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...data }: EmployeeFormData & { id: string }) => {
      const { error } = await supabase.from("employees").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Employee updated!");
      setEditEmployee(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      // Delete related invitations and contracts first (cascade) - scoped by org_id
      await supabase.from("invitations").delete().eq("employee_id", id).eq("org_id", orgId!);
      await supabase.from("contracts").delete().eq("employee_id", id).eq("org_id", orgId!);
      const { error } = await supabase.from("employees").delete().eq("id", id).eq("org_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Employee deleted!");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const employeesWithContracts = employees?.filter((e) =>
    contracts?.some((c) => c.employee_id === e.id)
  ) || [];
  const total = employeesWithContracts.length;
  const invited = employees?.filter((e) => e.status === "INVITED").length || 0;
  const onboarding = employees?.filter((e) => e.status === "ONBOARDING").length || 0;
  const active = employees?.filter((e) => e.status === "ACTIVE").length || 0;
  const inactive = employees?.filter((e) => e.status === "INACTIVE").length || 0;

  const onboardingEmployees = employees?.filter((e) => e.status === "ONBOARDING") || [];
  const onboardingWithSignedContracts = onboardingEmployees.filter((e) =>
    contracts?.some((c) => c.employee_id === e.id && c.signing_status === "signed")
  ).length;
  const signedContracts = contracts?.filter((c) => c.signing_status === "signed").length || 0;

  const handleFilterClick = (filter: StatusFilter) => {
    setStatusFilter((prev) => (prev === filter ? "ALL" : filter));
    setCurrentPage(1);
  };

  const statusFilteredEmployees = employees?.filter((emp) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "RENEWAL" || statusFilter === "SEASONAL") return false;
    return emp.status === statusFilter;
  }) ?? [];

  const filteredEmployees = statusFilteredEmployees.filter((emp) => {
    const term = search.toLowerCase();
    return (
      emp.email?.toLowerCase().includes(term) || emp.first_name?.toLowerCase().includes(term) ||
      emp.last_name?.toLowerCase().includes(term) || emp.employee_code?.toLowerCase().includes(term) ||
      emp.city?.toLowerCase().includes(term) || emp.country?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">{t("page.operations.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("page.operations.desc")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-7 gap-3">
        <Card className={cn("border-2 cursor-pointer transition-all", statusFilter === "ALL" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")} onClick={() => handleFilterClick("ALL")}>
          <CardContent className="p-4">
            <FileText className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs font-medium text-primary">Total Contracts</p>
            <p className="text-2xl font-bold">{total}</p>
            <Badge variant="default" className="mt-1 text-[10px] px-1.5 py-0">Active Entities</Badge>
          </CardContent>
        </Card>
        <div className="col-span-2 space-y-2">
          <div className="text-center"><Badge variant="outline" className="w-full justify-center bg-orange-50 text-orange-600 border-orange-200 text-xs py-1 font-semibold">Before Season</Badge></div>
          <div className="grid grid-cols-2 gap-2">
            <Card className={cn("cursor-pointer transition-all", statusFilter === "INVITED" ? "border-2 border-primary bg-primary/5" : "hover:border-primary/50")} onClick={() => handleFilterClick("INVITED")}><CardContent className="p-4"><div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Invited</span></div><p className="text-2xl font-bold">{invited}</p><p className="text-[10px] text-muted-foreground">{(invitationStats?.sent || 0) + (invitationStats?.completed || 0)} emails sent</p></CardContent></Card>
            <Card className={cn("cursor-pointer transition-all", statusFilter === "RENEWAL" ? "border-2 border-primary bg-primary/5" : "hover:border-primary/50")} onClick={() => handleFilterClick("RENEWAL")}><CardContent className="p-4"><div className="flex items-center gap-1.5 mb-1"><Star className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Renewal</span></div><p className="text-2xl font-bold">0</p><p className="text-[10px] text-muted-foreground">{invitationStats?.renewalCompleted || 0} completed</p></CardContent></Card>
          </div>
        </div>
        <div className="col-span-2 space-y-2">
          <div className="text-center"><Badge variant="outline" className="w-full justify-center bg-amber-50 text-amber-600 border-amber-200 text-xs py-1 font-semibold">Under Season</Badge></div>
          <div className="grid grid-cols-2 gap-2">
             <Card className={cn("cursor-pointer transition-all", statusFilter === "ONBOARDING" ? "border-2 border-primary bg-primary/5" : "hover:border-primary/50")} onClick={() => handleFilterClick("ONBOARDING")}><CardContent className="p-4"><div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Onboarding</span></div><p className="text-2xl font-bold">{onboarding}</p><p className="text-[10px] text-muted-foreground">{onboardingWithSignedContracts} of {onboarding} contracts prepared</p></CardContent></Card>
             <Card className={cn("cursor-pointer transition-all", statusFilter === "ACTIVE" ? "border-2 border-primary bg-primary/5" : "hover:border-primary/50")} onClick={() => handleFilterClick("ACTIVE")}><CardContent className="p-4"><div className="flex items-center gap-1.5 mb-1"><CheckCircle className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Active Duty</span></div><p className="text-2xl font-bold">{active}</p><p className="text-[10px] text-muted-foreground">{signedContracts} Contract Signed</p></CardContent></Card>
          </div>
        </div>
        <div className="col-span-2 space-y-2">
          <div className="text-center"><Badge variant="outline" className="w-full justify-center bg-violet-50 text-violet-600 border-violet-200 text-xs py-1 font-semibold">After Season</Badge></div>
          <div className="grid grid-cols-2 gap-2">
            <Card className={cn("cursor-pointer transition-all", statusFilter === "SEASONAL" ? "border-2 border-primary bg-primary/5" : "hover:border-primary/50")} onClick={() => handleFilterClick("SEASONAL")}><CardContent className="p-4"><div className="flex items-center gap-1.5 mb-1"><Snowflake className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Seasonal Pool</span></div><p className="text-2xl font-bold">0</p><p className="text-[10px] text-muted-foreground">Eligible for Rehire</p></CardContent></Card>
            <Card className={cn("cursor-pointer transition-all", statusFilter === "INACTIVE" ? "border-2 border-primary bg-primary/5" : "hover:border-primary/50")} onClick={() => handleFilterClick("INACTIVE")}><CardContent className="p-4"><div className="flex items-center gap-1.5 mb-1"><XCircle className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Terminated</span></div><p className="text-2xl font-bold">{inactive}</p><p className="text-[10px] text-muted-foreground">Archived Data</p></CardContent></Card>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <SortableTable<Employee>
            data={paginatedEmployees}
            columns={operationsColumns}
            rowKey={(e) => e.id}
            defaultSortKey="employee_code"
            isLoading={isLoading}
            emptyMessage="No employees found"
            rowActions={(e) => {
              const hasContract = contracts?.some((c) => c.employee_id === e.id);
              return (
                <div className="flex items-center gap-1">
                  {e.status === "ONBOARDING" && !hasContract && onNavigate && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs whitespace-nowrap"
                      onClick={() => onNavigate("contract-template", e.id)}
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      Create Contract
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditEmployee(e)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(e)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            {getPageNumbers().map((page, i) =>
              typeof page === "string" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
              ) : (
                <Button key={page} variant={currentPage === page ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>{page}</Button>
              )
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <EmployeeFormDialog
        open={!!editEmployee}
        onOpenChange={(open) => { if (!open) setEditEmployee(null); }}
        employee={editEmployee}
        onSubmit={(data) => {
          if (editEmployee) {
            updateEmployee.mutate({ ...data, id: editEmployee.id });
          }
        }}
        isLoading={updateEmployee.isPending}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Employee"
        itemName={deleteTarget ? `${deleteTarget.first_name || ""} ${deleteTarget.last_name || deleteTarget.email}`.trim() : ""}
        description="This will permanently delete the employee and all associated invitations and contracts. This action cannot be undone."
        onConfirm={() => { if (deleteTarget) deleteEmployee.mutate(deleteTarget.id); }}
        isLoading={deleteEmployee.isPending}
        requireTypedConfirmation
      />
    </div>
  );
}
