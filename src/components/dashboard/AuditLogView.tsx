import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Search, Filter, Clock, User, FileText, Building2, Mail, Users, LogIn, LogOut, KeyRound, Settings, UserPlus, UserMinus, Pencil, Trash2, Plus, CalendarDays, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useUiLanguage } from "@/hooks/useUiLanguage";

const TABLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  employees: Users,
  contracts: FileText,
  invitations: Mail,
  companies: Building2,
  user_roles: Shield,
  auth: KeyRound,
  banks: Building2,
  positions: Settings,
  skill_groups: Settings,
  agreement_periods: Settings,
  contract_id_settings: Settings,
  employee_id_settings: Settings,
  invitation_template_fields: Settings,
  profiles: User,
  org_members: Users,
  organizations: Building2,
  pending_role_assignments: UserPlus,
  user_app_access: Shield,
  role_app_access: Shield,
  role_sidebar_access: Shield,
  app_launcher_config: Settings,
  app_versions: Settings,
  contract_id_year_counters: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  UPDATE: "bg-amber-500/10 text-amber-700 border-amber-200",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  LOGIN: "bg-blue-500/10 text-blue-700 border-blue-200",
  LOGOUT: "bg-slate-500/10 text-slate-700 border-slate-200",
  EMAIL_SENT: "bg-violet-500/10 text-violet-700 border-violet-200",
  SIGNING_EMAIL_SENT: "bg-violet-500/10 text-violet-700 border-violet-200",
  CONTRACT_EMAIL_SENT: "bg-violet-500/10 text-violet-700 border-violet-200",
  USER_INVITED: "bg-teal-500/10 text-teal-700 border-teal-200",
  INVITE_EMAIL_RESENT: "bg-teal-500/10 text-teal-700 border-teal-200",
  ROLE_NOTIFICATION_SENT: "bg-violet-500/10 text-violet-700 border-violet-200",
  ORPHAN_CLEANUP: "bg-destructive/10 text-destructive border-destructive/20",
};

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  INSERT: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  EMAIL_SENT: Mail,
  SIGNING_EMAIL_SENT: Mail,
  CONTRACT_EMAIL_SENT: Mail,
  USER_INVITED: UserPlus,
  INVITE_EMAIL_RESENT: Mail,
  ROLE_NOTIFICATION_SENT: Mail,
  ORPHAN_CLEANUP: UserMinus,
};

const TABLE_LABELS: Record<string, string> = {
  employees: "Employees",
  contracts: "Contracts",
  invitations: "Invitations",
  companies: "Companies",
  user_roles: "User Roles",
  auth: "Authentication",
  banks: "Banks",
  positions: "Positions",
  skill_groups: "Skill Groups",
  agreement_periods: "Agreement Periods",
  contract_id_settings: "Contract ID Settings",
  employee_id_settings: "Employee ID Settings",
  invitation_template_fields: "Invitation Template",
  profiles: "Profiles",
  org_members: "Org Members",
  organizations: "Organizations",
  pending_role_assignments: "Pending Assignments",
  user_app_access: "App Access",
  role_app_access: "Role App Access",
  role_sidebar_access: "Sidebar Access",
  app_launcher_config: "App Launcher Config",
  app_versions: "App Versions",
  contract_id_year_counters: "Year Counters",
};

function extractDetail(log: any): string {
  const { action, table_name, new_data, old_data } = log;
  const data = new_data ?? old_data;
  if (!data) return "";

  try {
    if (table_name === "employees") {
      const name = [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(" ");
      const email = data.email;
      if (action === "INSERT") return `Added employee: ${name || email || "—"}`;
      if (action === "DELETE") return `Removed employee: ${name || email || "—"}`;
      if (action === "UPDATE") {
        const changes: string[] = [];
        if (old_data && new_data) {
          if (old_data.status !== new_data.status) changes.push(`status → ${new_data.status}`);
          if (old_data.first_name !== new_data.first_name || old_data.last_name !== new_data.last_name) changes.push(`name → ${[new_data.first_name, new_data.last_name].filter(Boolean).join(" ")}`);
          if (old_data.email !== new_data.email) changes.push(`email → ${new_data.email}`);
        }
        return `Updated employee ${name || email || "—"}${changes.length ? ": " + changes.join(", ") : ""}`;
      }
    }

    if (table_name === "contracts") {
      const code = data.contract_code || "—";
      if (action === "INSERT") return `Created contract ${code}`;
      if (action === "DELETE") return `Deleted contract ${code}`;
      if (action === "UPDATE") {
        const changes: string[] = [];
        if (old_data && new_data) {
          if (old_data.signing_status !== new_data.signing_status) changes.push(`signing → ${new_data.signing_status}`);
          if (old_data.status !== new_data.status) changes.push(`status → ${new_data.status}`);
          if (!old_data.employee_signed_at && new_data.employee_signed_at) changes.push("employee signed");
          if (!old_data.employer_signed_at && new_data.employer_signed_at) changes.push("employer signed");
        }
        return `Updated contract ${code}${changes.length ? ": " + changes.join(", ") : ""}`;
      }
    }

    if (table_name === "invitations") {
      if (action === "INSERT") return `Created invitation (${data.type || "—"})`;
      if (action === "DELETE") return `Deleted invitation`;
      if (action === "UPDATE") {
        const changes: string[] = [];
        if (old_data && new_data && old_data.status !== new_data.status) changes.push(`status → ${new_data.status}`);
        return `Updated invitation${changes.length ? ": " + changes.join(", ") : ""}`;
      }
    }

    if (table_name === "companies") {
      const name = data.name || "—";
      if (action === "INSERT") return `Added company: ${name}`;
      if (action === "DELETE") return `Removed company: ${name}`;
      if (action === "UPDATE") return `Updated company: ${name}`;
    }

    if (table_name === "user_roles") {
      if (action === "INSERT") return `Assigned role "${data.role}" to user`;
      if (action === "DELETE") return `Removed role "${(old_data ?? data).role}" from user`;
      if (action === "UPDATE") return `Changed role to "${data.role}"`;
    }

    if (table_name === "banks") {
      const name = data.name || "—";
      if (action === "INSERT") return `Added bank: ${name}`;
      if (action === "DELETE") return `Removed bank: ${name}`;
      if (action === "UPDATE") return `Updated bank: ${name}`;
    }

    if (table_name === "positions") {
      const label = data.label_en || data.label_sv || "—";
      if (action === "INSERT") return `Added position: ${label}`;
      if (action === "DELETE") return `Removed position: ${label}`;
      if (action === "UPDATE") return `Updated position: ${label}`;
    }

    if (table_name === "agreement_periods") {
      if (action === "INSERT") return `Added agreement period mapping`;
      if (action === "DELETE") return `Removed agreement period mapping`;
      if (action === "UPDATE") return `Updated agreement period mapping`;
    }

    if (table_name === "profiles") {
      const name = data.full_name || data.email || "—";
      if (action === "INSERT") return `Profile created: ${name}`;
      if (action === "DELETE") return `Profile deleted: ${name}`;
      if (action === "UPDATE") {
        const changes: string[] = [];
        if (old_data && new_data) {
          if (old_data.full_name !== new_data.full_name) changes.push(`name → ${new_data.full_name}`);
          if (old_data.preferred_language !== new_data.preferred_language) changes.push(`language → ${new_data.preferred_language}`);
          if (old_data.current_org_id !== new_data.current_org_id) changes.push("switched org");
          if (old_data.skip_login_profile !== new_data.skip_login_profile) changes.push(`skip profile → ${new_data.skip_login_profile}`);
          if (old_data.last_sign_in_at !== new_data.last_sign_in_at) changes.push("signed in");
        }
        return `Updated profile ${name}${changes.length ? ": " + changes.join(", ") : ""}`;
      }
    }

    if (table_name === "org_members") {
      if (action === "INSERT") return `Added member to org`;
      if (action === "DELETE") return `Removed member from org`;
      if (action === "UPDATE") return `Updated org membership`;
    }

    if (table_name === "organizations") {
      const name = data.name || "—";
      if (action === "INSERT") return `Created org: ${name}`;
      if (action === "DELETE") return `Deleted org: ${name}`;
      if (action === "UPDATE") return `Updated org: ${name}`;
    }

    if (table_name === "auth") {
      return log.summary || `${action} event`;
    }
  } catch {
    // fallback
  }

  const table = table_name?.replace(/_/g, " ");
  if (action === "INSERT") return `Created a new ${table} record`;
  if (action === "UPDATE") return `Updated a ${table} record`;
  if (action === "DELETE") return `Deleted a ${table} record`;
  return log.summary || `${action} on ${table}`;
}

function DataDiff({ oldData, newData }: { oldData: any; newData: any }) {
  if (!oldData && !newData) return null;

  const allKeys = new Set([
    ...Object.keys(oldData ?? {}),
    ...Object.keys(newData ?? {}),
  ]);

  const changedKeys = Array.from(allKeys).filter((key) => {
    if (["updated_at", "created_at"].includes(key)) return false;
    const o = JSON.stringify(oldData?.[key]);
    const n = JSON.stringify(newData?.[key]);
    return o !== n;
  });

  if (changedKeys.length === 0) return <span className="text-xs text-muted-foreground italic">No field changes</span>;

  return (
    <div className="text-xs space-y-1 mt-1">
      {changedKeys.slice(0, 8).map((key) => (
        <div key={key} className="flex gap-2 items-baseline">
          <span className="font-medium text-foreground min-w-[100px]">{key.replace(/_/g, " ")}:</span>
          {oldData?.[key] !== undefined && (
            <span className="text-destructive line-through truncate max-w-[150px]">
              {typeof oldData[key] === "object" ? JSON.stringify(oldData[key]).slice(0, 40) : String(oldData[key]).slice(0, 40)}
            </span>
          )}
          {newData?.[key] !== undefined && (
            <span className="text-emerald-700 truncate max-w-[150px]">
              → {typeof newData[key] === "object" ? JSON.stringify(newData[key]).slice(0, 40) : String(newData[key]).slice(0, 40)}
            </span>
          )}
        </div>
      ))}
      {changedKeys.length > 8 && (
        <span className="text-muted-foreground italic">+{changedKeys.length - 8} more fields</span>
      )}
    </div>
  );
}

const PAGE_SIZE = 50;

export function AuditLogView() {
  const { t } = useUiLanguage();
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const hasActiveFilters = search || tableFilter !== "all" || actionFilter !== "all" || userFilter !== "all" || dateFrom || dateTo;

  const clearAllFilters = () => {
    setSearch("");
    setTableFilter("all");
    setActionFilter("all");
    setUserFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  // Reset page when filters change
  const updateFilter = useCallback((setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(0);
  }, []);

  const { data: allProfiles } = useQuery({
    queryKey: ["audit-log-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .not("email", "is", null)
        .order("email");
      return data ?? [];
    },
  });

  // Server-side total count for current filters
  const { data: totalCount } = useQuery({
    queryKey: ["audit-log-count", tableFilter, actionFilter, userFilter, dateFrom, dateTo, search],
    queryFn: async () => {
      let query = supabase
        .from("audit_log")
        .select("id", { count: "exact", head: true });

      if (tableFilter !== "all") query = query.eq("table_name", tableFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (userFilter !== "all") query = query.eq("user_email", userFilter);
      if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
      if (search) query = query.or(`user_email.ilike.%${search}%,summary.ilike.%${search}%,table_name.ilike.%${search}%,record_id.ilike.%${search}%`);

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 15000,
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-log", tableFilter, actionFilter, userFilter, dateFrom, dateTo, search, page],
    queryFn: async () => {
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (tableFilter !== "all") query = query.eq("table_name", tableFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (userFilter !== "all") query = query.eq("user_email", userFilter);
      if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
      if (search) query = query.or(`user_email.ilike.%${search}%,summary.ilike.%${search}%,table_name.ilike.%${search}%,record_id.ilike.%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const uniqueUsers = useMemo(() => {
    const emails = new Set<string>();
    (allProfiles ?? []).forEach((p) => { if (p.email) emails.add(p.email); });
    (logs ?? []).forEach((log) => { if (log.user_email) emails.add(log.user_email); });
    return Array.from(emails).sort();
  }, [allProfiles, logs]);

  const displayLogs = logs ?? [];
  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          {t("page.auditLog.title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("page.auditLog.desc")}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, table, action, or detail..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={tableFilter} onValueChange={updateFilter(setTableFilter)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All tables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="employees">Employees</SelectItem>
                <SelectItem value="contracts">Contracts</SelectItem>
                <SelectItem value="invitations">Invitations</SelectItem>
                <SelectItem value="companies">Companies</SelectItem>
                <SelectItem value="user_roles">User Roles</SelectItem>
                <SelectItem value="profiles">Profiles</SelectItem>
                <SelectItem value="org_members">Org Members</SelectItem>
                <SelectItem value="organizations">Organizations</SelectItem>
                <SelectItem value="banks">Banks</SelectItem>
                <SelectItem value="positions">Positions</SelectItem>
                <SelectItem value="skill_groups">Skill Groups</SelectItem>
                <SelectItem value="agreement_periods">Agreement Periods</SelectItem>
                <SelectItem value="user_app_access">App Access</SelectItem>
                <SelectItem value="pending_role_assignments">Pending Assignments</SelectItem>
                <SelectItem value="contract_id_settings">Contract ID Settings</SelectItem>
                <SelectItem value="employee_id_settings">Employee ID Settings</SelectItem>
                <SelectItem value="invitation_template_fields">Invitation Template</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={updateFilter(setActionFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="INSERT">Created</SelectItem>
                <SelectItem value="UPDATE">Updated</SelectItem>
                <SelectItem value="DELETE">Deleted</SelectItem>
                <SelectItem value="EMAIL_SENT">Invitation Email</SelectItem>
                <SelectItem value="SIGNING_EMAIL_SENT">Signing Email</SelectItem>
                <SelectItem value="CONTRACT_EMAIL_SENT">Contract Email</SelectItem>
                <SelectItem value="USER_INVITED">User Invited</SelectItem>
                <SelectItem value="INVITE_EMAIL_RESENT">Invite Resent</SelectItem>
                <SelectItem value="ROLE_NOTIFICATION_SENT">Role Notification</SelectItem>
                <SelectItem value="ORPHAN_CLEANUP">Orphan Cleanup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Select value={userFilter} onValueChange={updateFilter(setUserFilter)}>
              <SelectTrigger className="w-[220px]">
                <User className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((email) => (
                  <SelectItem key={email} value={email}>{email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="w-[150px]"
                placeholder="From"
              />
              <span className="text-muted-foreground text-xs">–</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="w-[150px]"
                placeholder="To"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-muted-foreground">
                <X className="w-3.5 h-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("audit.recentActivity")}</CardTitle>
              <CardDescription>
                {total > 0 ? `Showing ${rangeStart}–${rangeEnd} of ${total} entries` : "No entries found"}
              </CardDescription>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Time</TableHead>
                  <TableHead className="w-[180px]">User</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead className="w-[140px]">Category</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading audit log...
                    </TableCell>
                  </TableRow>
                ) : displayLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No audit entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayLogs.map((log) => {
                    const TableIcon = TABLE_ICONS[log.table_name] ?? FileText;
                    const ActionIcon = ACTION_ICONS[log.action] ?? FileText;
                    const isExpanded = expandedRow === log.id;
                    const hasData = log.old_data || log.new_data;

                    return (
                      <TableRow
                        key={log.id}
                        className={hasData ? "cursor-pointer hover:bg-muted/50" : ""}
                        onClick={() => hasData && setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            <div className="flex flex-col">
                              <span>
                                {new Date(log.created_at).toLocaleString(undefined, {
                                  month: "short", day: "numeric",
                                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                                  hour12: false, timeZoneName: "short",
                                })}
                              </span>
                              {(() => {
                                const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                                const utcLabel = new Date(log.created_at).toLocaleString("en-US", {
                                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                                  hour12: false, timeZone: "UTC", timeZoneName: "short",
                                });
                                if (localTz === "UTC") return null;
                                return (
                                  <span className="text-[10px] text-muted-foreground/60">
                                    {utcLabel}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs truncate max-w-[140px]">
                              {log.user_email ?? "System"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${ACTION_COLORS[log.action] ?? ""}`}>
                            <ActionIcon className="w-3 h-3" />
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <TableIcon className="w-3 h-3 text-muted-foreground" />
                            {TABLE_LABELS[log.table_name] ?? log.table_name?.replace(/_/g, " ")}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>{extractDetail(log)}</div>
                          {isExpanded && hasData && (
                            <div className="mt-2 p-2 bg-muted/30 rounded border border-border">
                              <DataDiff oldData={log.old_data} newData={log.new_data} />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
