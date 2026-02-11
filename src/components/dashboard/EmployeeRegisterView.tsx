import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateDummyEmployee, type DummyCountry } from "@/lib/dummy-employees";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus,
  MoreVertical,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  Download,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { EmployeeFormDialog, EmployeeFormData } from "./EmployeeFormDialog";
import { DeleteEmployeeDialog } from "./DeleteEmployeeDialog";
import type { Tables } from "@/integrations/supabase/types";
import { CsvImportDialog } from "./CsvImportDialog";
import { SortableTable, type ColumnDef } from "@/components/ui/sortable-table";

type EmployeeStatus = "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE";
type Employee = Tables<"employees">;

const statusConfig: Record<EmployeeStatus, { label: string; dot: string }> = {
  INVITED: { label: "Invited", dot: "bg-blue-500" },
  ONBOARDING: { label: "Onboarding", dot: "bg-amber-500" },
  ACTIVE: { label: "Active", dot: "bg-emerald-500" },
  INACTIVE: { label: "Terminated", dot: "bg-red-500" },
};

const ITEMS_PER_PAGE = 7;

const employeeColumns: ColumnDef<Employee>[] = [
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

export function EmployeeRegisterView() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const addDummyEmployee = useMutation({
    mutationFn: async (country: DummyCountry) => {
      const dummy = generateDummyEmployee(country);
      const { error } = await supabase.from("employees").insert([{
        first_name: dummy.first_name, last_name: dummy.last_name, middle_name: dummy.middle_name,
        email: dummy.email, phone: dummy.phone, city: dummy.city, country: dummy.country,
        status: dummy.status, personal_info: dummy.personal_info,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["register-employees"] }); toast.success("Dummy employee added!"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ["register-employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async (data: EmployeeFormData & { id: string }) => {
      const { id, ...rest } = data;
      const { error } = await supabase.from("employees").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["register-employees"] }); toast.success("Employee updated!"); setFormOpen(false); setEditEmployee(null); },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["register-employees"] }); toast.success("Employee deleted!"); setDeleteEmployee(null); },
    onError: (err: Error) => toast.error(err.message),
  });

  const filteredEmployees = employees?.filter((emp) => {
    const term = search.toLowerCase();
    return (
      emp.email?.toLowerCase().includes(term) ||
      emp.first_name?.toLowerCase().includes(term) ||
      emp.last_name?.toLowerCase().includes(term) ||
      emp.employee_code?.toLowerCase().includes(term) ||
      emp.city?.toLowerCase().includes(term) ||
      emp.country?.toLowerCase().includes(term)
    );
  }) ?? [];

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const total = employees?.length || 0;
  const active = employees?.filter((e) => e.status === "ACTIVE").length || 0;
  const onboarding = employees?.filter((e) => e.status === "ONBOARDING").length || 0;
  const invited = employees?.filter((e) => e.status === "INVITED").length || 0;
  const terminated = employees?.filter((e) => e.status === "INACTIVE").length || 0;

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

  const exportCsv = () => {
    if (!employees || employees.length === 0) { toast.error("No employees to export"); return; }
    const headers = ["employee_code", "first_name", "last_name", "middle_name", "email", "phone", "city", "country", "status", "created_at"];
    const rows = employees.map((e) =>
      headers.map((h) => {
        const str = String((e as any)[h] ?? "");
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${employees.length} employees`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employee Register</h1>
          <p className="text-muted-foreground text-sm">Add and manage employees in your organization.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={addDummyEmployee.isPending}>
                <Users className="w-4 h-4" /> Add Dummy
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => addDummyEmployee.mutate("Sweden")}>🇸🇪 Swedish</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addDummyEmployee.mutate("Romania")}>🇷🇴 Romanian</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addDummyEmployee.mutate("Thailand")}>🇹🇭 Thai</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setCsvImportOpen(true)}>
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button className="gap-2" onClick={() => { setEditEmployee(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Total Employees</p><p className="text-2xl font-bold">{total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Invited</p><p className="text-2xl font-bold text-blue-600">{invited}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Onboarding</p><p className="text-2xl font-bold text-amber-600">{onboarding}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Active</p><p className="text-2xl font-bold text-emerald-600">{active}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Terminated</p><p className="text-2xl font-bold text-red-600">{terminated}</p></CardContent></Card>
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
            columns={employeeColumns}
            rowKey={(e) => e.id}
            defaultSortKey="employee_code"
            isLoading={isLoading}
            emptyMessage="No employees found"
            rowActions={(employee) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditEmployee(employee); setFormOpen(true); }}>Edit Employee</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteEmployee(employee)}>Delete Employee</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditEmployee(null); }}
        employee={editEmployee}
        onSubmit={(data) => {
          if (editEmployee) { updateEmployee.mutate({ ...data, id: editEmployee.id }); }
          else {
            supabase.from("employees").insert([data]).then(({ error }) => {
              if (error) { toast.error(error.message); return; }
              queryClient.invalidateQueries({ queryKey: ["register-employees"] });
              toast.success("Employee created!");
              setFormOpen(false);
            });
          }
        }}
        isLoading={updateEmployee.isPending}
      />

      <DeleteEmployeeDialog
        open={!!deleteEmployee}
        onOpenChange={(open) => { if (!open) setDeleteEmployee(null); }}
        employeeName={deleteEmployee ? `${deleteEmployee.first_name || ""} ${deleteEmployee.last_name || ""}`.trim() || deleteEmployee.email : ""}
        onConfirm={() => { if (deleteEmployee) deleteEmployeeMutation.mutate(deleteEmployee.id); }}
        isLoading={deleteEmployeeMutation.isPending}
      />

      <CsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["register-employees"] })} />
    </div>
  );
}
