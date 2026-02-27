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
    { id: "version-management", label: "Version Management", group: "others" },
    { id: "process-guide", label: "Process Guide", group: "others" },
    { id: "audit-log", label: "Audit Log", group: "others" },
  ],
  "user-management": [
    { id: "user-management", label: "Users", group: "main" },
    { id: "role-permissions", label: "Role Permissions", group: "main" },
    { id: "audit-log", label: "Audit Log", group: "main" },
    { id: "settings", label: "Settings", group: "main" },
  ],
  "forestry-project": [
    { id: "dashboard", label: "Dashboard", group: "main" },
    { id: "projects", label: "Projects", group: "main" },
    { id: "work-orders", label: "Work Orders", group: "main" },
    { id: "field-reports", label: "Field Reports", group: "main" },
    { id: "map-view", label: "Map View", group: "main" },
    { id: "inventory", label: "Inventory", group: "settings" },
    { id: "equipment", label: "Equipment", group: "settings" },
    { id: "site-register", label: "Site Register", group: "settings" },
    { id: "species-register", label: "Species Register", group: "settings" },
    { id: "audit-log", label: "Audit Log", group: "others" },
    { id: "process-guide", label: "Process Guide", group: "others" },
  ],
  "payroll": [
    { id: "dashboard", label: "Dashboard", group: "main" },
    { id: "payroll-runs", label: "Payroll Runs", group: "main" },
    { id: "salary-slips", label: "Salary Slips", group: "main" },
    { id: "tax-reports", label: "Tax Reports", group: "main" },
    { id: "deductions", label: "Deductions", group: "main" },
    { id: "salary-tables", label: "Salary Tables", group: "settings" },
    { id: "tax-settings", label: "Tax Settings", group: "settings" },
    { id: "payment-methods", label: "Payment Methods", group: "settings" },
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
    org_admin: SIDEBAR_ITEMS_BY_APP["hr-management"].map((i) => i.id),
    hr_manager: [
      "dashboard", "operations", "invitations", "contracts",
      "contract-template", "invitation-template", "contract-data",
      "bank-list", "employee-register", "company-register", "process-guide",
    ],
    project_manager: ["dashboard", "operations"],
    payroll_manager: ["dashboard", "employee-register"],
    team_leader: ["dashboard"],
    user: ["dashboard"],
  },
  "user-management": {
    admin: ["user-management", "role-permissions", "audit-log", "settings"],
  },
  "forestry-project": {
    admin: SIDEBAR_ITEMS_BY_APP["forestry-project"].map((i) => i.id),
    org_admin: SIDEBAR_ITEMS_BY_APP["forestry-project"].map((i) => i.id),
    hr_manager: ["dashboard", "projects", "work-orders", "field-reports"],
    project_manager: ["dashboard", "projects", "work-orders", "field-reports", "map-view", "site-register", "equipment"],
    team_leader: ["dashboard", "work-orders", "field-reports", "map-view"],
    user: ["dashboard"],
  },
  "payroll": {
    admin: SIDEBAR_ITEMS_BY_APP["payroll"].map((i) => i.id),
    org_admin: SIDEBAR_ITEMS_BY_APP["payroll"].map((i) => i.id),
    payroll_manager: SIDEBAR_ITEMS_BY_APP["payroll"].map((i) => i.id),
    hr_manager: ["dashboard", "payroll-runs", "salary-slips", "salary-tables"],
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
