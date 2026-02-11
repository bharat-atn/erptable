import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateDummyEmployee, type DummyCountry } from "@/lib/dummy-employees";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, MoreVertical, Users, Calendar, Download, Upload, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { EmployeeFormDialog, EmployeeFormData } from "./EmployeeFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Tables } from "@/integrations/supabase/types";
import { CsvImportDialog } from "./CsvImportDialog";
import { EnhancedTable, type ColumnDef } from "@/components/ui/enhanced-table";

type EmployeeStatus = "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE";
type Employee = Tables<"employees">;

const statusConfig: Record<EmployeeStatus, { label: string; dot: string }> = {
  INVITED: { label: "Invited", dot: "bg-blue-500" },
  ONBOARDING: { label: "Onboarding", dot: "bg-amber-500" },
  ACTIVE: { label: "Active", dot: "bg-emerald-500" },
  INACTIVE: { label: "Terminated", dot: "bg-red-500" },
};

const employeeColumns: ColumnDef<Employee>[] = [
  {
    key: "employee_code",
    header: "Employee ID",
    accessor: (e) => e.employee_code,
    hideable: false,
    render: (e, hl) => <span className="font-medium text-sm">{hl?.(e.employee_code || "—") ?? e.employee_code ?? "—"}</span>,
  },
  {
    key: "name",
    header: "Name",
    accessor: (e) => `${e.first_name || ""} ${e.last_name || ""}`.trim(),
    minWidth: 180,
    hideable: false,
    render: (e, hl) => {
      const fullName = e.first_name && e.last_name ? `${e.first_name} ${e.last_name}` : "—";
      const initials = e.first_name ? `${e.first_name[0]}${e.last_name?.[0] || ""}` : "?";
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-primary">{initials}</span>
          </div>
          <span className="font-medium text-sm">{hl?.(fullName) ?? fullName}</span>
        </div>
      );
    },
  },
  {
    key: "email",
    header: "Email",
    accessor: (e) => e.email,
    render: (e, hl) => <span className="text-sm">{hl?.(e.email) ?? e.email}</span>,
  },
  {
    key: "phone",
    header: "Phone",
    accessor: (e) => e.phone,
    render: (e, hl) => <span className="text-sm text-muted-foreground">{hl?.(e.phone || "—") ?? e.phone ?? "—"}</span>,
  },
  {
    key: "city",
    header: "City",
    accessor: (e) => e.city,
    render: (e, hl) => <span className="text-sm text-muted-foreground">{hl?.(e.city || "—") ?? e.city ?? "—"}</span>,
  },
  {
    key: "country",
    header: "Country",
    accessor: (e) => e.country,
    render: (e, hl) => <span className="text-sm text-muted-foreground">{hl?.(e.country || "—") ?? e.country ?? "—"}</span>,
  },
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
    defaultVisible: false,
    render: (e) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        {format(new Date(e.created_at), "MMM dd yyyy")}
      </div>
    ),
  },
];

const statusFilterOptions = [
  { value: "INVITED", label: "Invited", dot: "bg-blue-500" },
  { value: "ONBOARDING", label: "Onboarding", dot: "bg-amber-500" },
  { value: "ACTIVE", label: "Active", dot: "bg-emerald-500" },
  { value: "INACTIVE", label: "Terminated", dot: "bg-red-500" },
];

export function EmployeeRegisterView() {
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

  const handleBulkDelete = (ids: string[], clearSelection: () => void) => {
    // For now just show count — could wire to a bulk delete mutation
    toast.info(`${ids.length} employees selected for action`);
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

      <EnhancedTable<Employee>
        data={employees ?? []}
        columns={employeeColumns}
        rowKey={(e) => e.id}
        defaultSortKey="employee_code"
        isLoading={isLoading}
        emptyMessage="No employees found"
        searchPlaceholder="Search by name, email, city, country... (combine terms)"
        enableSelection
        enableColumnToggle
        enableDenseToggle
        enableHighlight
        stickyHeader
        filters={[
          { key: "status", label: "Status", options: statusFilterOptions },
        ]}
        bulkActions={(ids, clear) => (
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive h-7" onClick={() => handleBulkDelete(ids, clear)}>
            <Trash2 className="w-3.5 h-3.5" /> Delete Selected
          </Button>
        )}
        onRowClick={(employee) => { setEditEmployee(employee); setFormOpen(true); }}
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

      <DeleteConfirmDialog
        open={!!deleteEmployee}
        onOpenChange={(open) => { if (!open) setDeleteEmployee(null); }}
        title="Delete Employee"
        itemName={deleteEmployee ? `${deleteEmployee.first_name || ""} ${deleteEmployee.last_name || ""}`.trim() || deleteEmployee.email : ""}
        description="This will remove the employee record, including all personal information stored in the system."
        onConfirm={() => { if (deleteEmployee) deleteEmployeeMutation.mutate(deleteEmployee.id); }}
        isLoading={deleteEmployeeMutation.isPending}
      />

      <CsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["register-employees"] })} />
    </div>
  );
}
