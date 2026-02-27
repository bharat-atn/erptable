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
};
