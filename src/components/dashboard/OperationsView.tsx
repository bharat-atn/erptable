import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
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
  Columns,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

type EmployeeStatus = "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE";

const statusConfig: Record<EmployeeStatus, { label: string; variant: "pending" | "warning" | "success" | "expired"; dot: string }> = {
  INVITED: { label: "Invited", variant: "pending", dot: "bg-blue-500" },
  ONBOARDING: { label: "Onboarding", variant: "warning", dot: "bg-amber-500" },
  ACTIVE: { label: "Active", variant: "success", dot: "bg-emerald-500" },
  INACTIVE: { label: "Absent", variant: "expired", dot: "bg-muted-foreground" },
};

const ITEMS_PER_PAGE = 7;

export function OperationsView() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: employees, isLoading } = useQuery({
    queryKey: ["operations-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredEmployees = employees?.filter((emp) =>
    emp.email?.toLowerCase().includes(search.toLowerCase()) ||
    emp.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    (emp as any).employee_code?.toLowerCase().includes(search.toLowerCase()) ||
    (emp as any).city?.toLowerCase().includes(search.toLowerCase()) ||
    (emp as any).country?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil((filteredEmployees?.length || 0) / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const totalContracts = employees?.length || 0;
  const invited = employees?.filter((e) => e.status === "INVITED").length || 0;
  const renewal = 0; // Placeholder - could come from contracts/invitations
  const onboarding = employees?.filter((e) => e.status === "ONBOARDING").length || 0;
  const activeDuty = employees?.filter((e) => e.status === "ACTIVE").length || 0;
  const seasonalPool = 0; // Placeholder
  const terminated = employees?.filter((e) => e.status === "INACTIVE").length || 0;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Operations</h1>
          <p className="text-muted-foreground text-sm">
            Manage workflows and employee lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Invitation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-7 gap-3">
        {/* Total Contracts */}
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="p-4">
            <FileText className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs font-medium text-primary">Total Contracts</p>
            <p className="text-2xl font-bold">{totalContracts}</p>
            <Badge variant="default" className="mt-1 text-[10px] px-1.5 py-0">
              Active Entities
            </Badge>
          </CardContent>
        </Card>

        {/* Before Season */}
        <div className="col-span-2 space-y-2">
          <div className="text-center">
            <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-[10px]">
              Before Season
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Invited</span>
                </div>
                <p className="text-2xl font-bold">{invited}</p>
                <p className="text-[10px] text-muted-foreground">Candidate Action</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Renewal</span>
                </div>
                <p className="text-2xl font-bold">{renewal}</p>
                <p className="text-[10px] text-muted-foreground">Re-onboarding</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Under Season */}
        <div className="col-span-2 space-y-2">
          <div className="text-center">
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px]">
              Under Season
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Onboarding</span>
                </div>
                <p className="text-2xl font-bold">{onboarding}</p>
                <p className="text-[10px] text-muted-foreground">HR Action Required</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Active Duty</span>
                </div>
                <p className="text-2xl font-bold">{activeDuty}</p>
                <p className="text-[10px] text-muted-foreground">Contract Signed</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* After Season */}
        <div className="col-span-2 space-y-2">
          <div className="text-center">
            <Badge variant="outline" className="bg-violet-50 text-violet-600 border-violet-200 text-[10px]">
              After Season
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Snowflake className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Seasonal Pool</span>
                </div>
                <p className="text-2xl font-bold">{seasonalPool}</p>
                <p className="text-[10px] text-muted-foreground">Eligible for Rehire</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Terminated</span>
                </div>
                <p className="text-2xl font-bold">{terminated}</p>
                <p className="text-[10px] text-muted-foreground">Archived Data</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2">
            <Columns className="w-4 h-4" />
            Columns
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedEmployees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees?.map((employee) => {
                  const emp = employee as any;
                  const status = employee.status as EmployeeStatus;
                  const config = statusConfig[status];
                  const fullName = employee.first_name && employee.last_name
                    ? `${employee.first_name} ${employee.last_name}`
                    : "—";
                  const initials = employee.first_name
                    ? `${employee.first_name[0]}${employee.last_name?.[0] || ""}`
                    : "?";

                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-primary">{initials}</span>
                          </div>
                          <span className="font-medium text-sm">{fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{employee.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.employee_code || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.phone || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.city || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.country || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                          <span className="text-sm">{config.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(employee.created_at), "MMM dd yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Employee</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {getPageNumbers().map((page, i) =>
              typeof page === "string" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
