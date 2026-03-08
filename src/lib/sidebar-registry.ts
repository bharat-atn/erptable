/**
 * Registry of all sidebar menu items per app, used by the Sidebar Permissions UI.
 */

export interface SidebarItemDef {
  id: string;
  label: string;
  group: "main" | "settings" | "others";
}

export const SIDEBAR_ITEMS_BY_APP: Record<string, SidebarItemDef[]> = {
  "hr-management": [
    { id: "dashboard", label: "Dashboard", group: "main" },
    { id: "operations", label: "Operations", group: "main" },
    { id: "invitations", label: "Invitations", group: "main" },
    { id: "contracts", label: "Contracts", group: "main" },
    { id: "contract-template", label: "Contract Template", group: "settings" },
    { id: "invitation-template", label: "Invitation Template", group: "settings" },
    { id: "contract-data", label: "Contract Data", group: "settings" },
    { id: "bank-list", label: "Bank Information", group: "settings" },
    { id: "employee-register", label: "Employee Register", group: "settings" },
    { id: "company-register", label: "Company Register", group: "settings" },
    { id: "employee-id-settings", label: "Employee ID", group: "settings" },
    { id: "contract-id-settings", label: "Contract ID", group: "settings" },
    { id: "iso-standards", label: "ISO Standards", group: "settings" },
    { id: "data-handling", label: "Data Handling", group: "settings" },
    { id: "issue-tracker", label: "Issue Tracker", group: "others" },
    { id: "version-management", label: "Version Management", group: "others" },
    { id: "process-guide", label: "Process Guide", group: "others" },
    { id: "audit-log", label: "Audit Log", group: "others" },
  ],
  "user-management": [
    { id: "user-management", label: "Users", group: "main" },
    { id: "role-permissions", label: "Role Permissions", group: "main" },
    { id: "issue-tracker", label: "Issue Tracker", group: "main" },
    { id: "audit-log", label: "Audit Log", group: "main" },
    { id: "settings", label: "Settings", group: "main" },
  ],
  "forestry-project": [
    { id: "dashboard", label: "Dashboard", group: "main" },
    { id: "forestry-projects", label: "Projects", group: "main" },
    { id: "gantt-view", label: "Gantt View", group: "main" },
    { id: "kanban-board", label: "Kanban Board", group: "main" },
    { id: "employee-register", label: "Employees", group: "main" },
    { id: "analytics", label: "Analytics", group: "main" },
    { id: "settings", label: "Settings", group: "settings" },
    { id: "client-register", label: "Client Register", group: "settings" },
    { id: "forestry-objects", label: "Object Register", group: "settings" },
    { id: "project-id", label: "Project ID", group: "settings" },
    { id: "comp-groups", label: "Comp. Groups", group: "settings" },
    { id: "contract-data", label: "Contract Data", group: "settings" },
    { id: "project-defaults", label: "Project Defaults", group: "settings" },
    { id: "version-management", label: "Version Management", group: "settings" },
    { id: "iso-standards", label: "ISO Standards", group: "settings" },
    { id: "audit-log", label: "Audit Log", group: "others" },
    { id: "process-guide", label: "Process Guide", group: "others" },
  ],
  "payroll": [
    { id: "dashboard", label: "Dashboard", group: "main" },
    { id: "salary-events", label: "Salary Events", group: "main" },
    { id: "absence", label: "Absence", group: "main" },
    { id: "holiday", label: "Holiday", group: "main" },
    { id: "attestation", label: "Attestation", group: "main" },
    { id: "payroll-runs", label: "Payroll Runs", group: "main" },
    { id: "salary-slips", label: "Salary Slips", group: "main" },
    { id: "employee-register", label: "Employees", group: "main" },
    { id: "salary-tables", label: "Salary Tables", group: "settings" },
    { id: "tax-reports", label: "Tax Reports", group: "settings" },
    { id: "reports", label: "Reports", group: "settings" },
    { id: "deductions", label: "Deductions", group: "settings" },
    { id: "tax-settings", label: "Tax Settings", group: "settings" },
    { id: "payment-methods", label: "Payment Methods", group: "settings" },
    { id: "settings", label: "Settings", group: "settings" },
    { id: "audit-log", label: "Audit Log", group: "others" },
  ],
  "employee-hub": [
    { id: "my-profile", label: "My Profile", group: "main" },
    { id: "my-contracts", label: "My Contracts", group: "main" },
    { id: "my-schedule", label: "My Schedule", group: "main" },
    { id: "my-payslips", label: "My Payslips", group: "main" },
    { id: "documents", label: "Documents", group: "main" },
    { id: "leave-requests", label: "Leave Requests", group: "main" },
    { id: "settings", label: "Settings", group: "settings" },
  ],
  "time-reporting": [
    { id: "dashboard", label: "Dashboard", group: "main" },
    { id: "time-entries", label: "Time Entries", group: "main" },
    { id: "timesheets", label: "Timesheets", group: "main" },
    { id: "approvals", label: "Approvals", group: "main" },
    { id: "reports", label: "Reports", group: "main" },
    { id: "project-codes", label: "Project Codes", group: "settings" },
    { id: "overtime-rules", label: "Overtime Rules", group: "settings" },
    { id: "audit-log", label: "Audit Log", group: "others" },
  ],
};

/** Default sidebar access per role per app — used for "Reset to Defaults" */
export const DEFAULT_SIDEBAR_ACCESS: Record<string, Record<string, string[]>> = {
  "hr-management": {
    admin: SIDEBAR_ITEMS_BY_APP["hr-management"].map((i) => i.id),
    // org_admin also gets issue-tracker access
    org_admin: SIDEBAR_ITEMS_BY_APP["hr-management"].map((i) => i.id),
    hr_manager: [
      "dashboard", "operations", "invitations", "contracts",
      "contract-template", "invitation-template", "contract-data",
      "bank-list", "employee-register", "company-register", "data-handling", "process-guide",
    ],
    project_manager: ["dashboard", "operations"],
    payroll_manager: ["dashboard", "employee-register"],
    team_leader: ["dashboard"],
    user: ["dashboard"],
  },
  "user-management": {
    admin: ["user-management", "role-permissions", "issue-tracker", "audit-log", "settings"],
  },
  "forestry-project": {
    admin: SIDEBAR_ITEMS_BY_APP["forestry-project"].map((i) => i.id),
    org_admin: SIDEBAR_ITEMS_BY_APP["forestry-project"].map((i) => i.id),
    hr_manager: ["dashboard", "forestry-projects", "forestry-objects", "employee-register", "contract-data"],
    project_manager: ["dashboard", "forestry-projects", "gantt-view", "kanban-board", "forestry-objects", "employee-register", "analytics", "process-guide"],
    team_leader: ["dashboard", "forestry-projects", "forestry-objects", "employee-register"],
    user: ["dashboard"],
  },
  "payroll": {
    admin: SIDEBAR_ITEMS_BY_APP["payroll"].map((i) => i.id),
    org_admin: SIDEBAR_ITEMS_BY_APP["payroll"].map((i) => i.id),
    payroll_manager: SIDEBAR_ITEMS_BY_APP["payroll"].map((i) => i.id),
    hr_manager: ["dashboard", "payroll-runs", "salary-slips", "employee-register", "salary-tables"],
    user: ["dashboard"],
  },
  "employee-hub": {
    admin: SIDEBAR_ITEMS_BY_APP["employee-hub"].map((i) => i.id),
    org_admin: SIDEBAR_ITEMS_BY_APP["employee-hub"].map((i) => i.id),
    user: SIDEBAR_ITEMS_BY_APP["employee-hub"].map((i) => i.id),
    team_leader: SIDEBAR_ITEMS_BY_APP["employee-hub"].map((i) => i.id),
    hr_manager: SIDEBAR_ITEMS_BY_APP["employee-hub"].map((i) => i.id),
    project_manager: SIDEBAR_ITEMS_BY_APP["employee-hub"].map((i) => i.id),
    payroll_manager: SIDEBAR_ITEMS_BY_APP["employee-hub"].map((i) => i.id),
  },
  "time-reporting": {
    admin: SIDEBAR_ITEMS_BY_APP["time-reporting"].map((i) => i.id),
    org_admin: SIDEBAR_ITEMS_BY_APP["time-reporting"].map((i) => i.id),
    project_manager: ["dashboard", "time-entries", "timesheets", "approvals", "reports", "project-codes"],
    team_leader: ["dashboard", "time-entries", "timesheets", "approvals"],
    hr_manager: ["dashboard", "timesheets", "reports"],
    payroll_manager: ["dashboard", "timesheets", "reports"],
    user: ["dashboard", "time-entries", "timesheets"],
  },
};
