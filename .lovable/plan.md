

## Plan: Fix Forestry Sidebar Labels and Expand Structure

### Problems Identified

1. **Missing translations**: Items like `forestry-projects`, `forestry-objects`, `analytics` have no entries in `ui-translations.ts`, so the sidebar shows raw keys like "menu.forestry-projects" instead of proper labels.
2. **Missing sidebar items**: The desired sidebar (from screenshot 2) shows a much richer structure than what's currently defined. The current forestry sidebar only has 5 main items and 3 "others" items, but the target has many more including Settings sub-items.

### Target Sidebar Structure (from screenshot)

**MAIN:**
- Dashboard (LayoutDashboard)
- Projects (FolderKanban)
- Gantt View (BarChart3 — placeholder/teaser for now)
- Kanban Board (CheckSquare — placeholder/teaser for now)
- Employees (Users)
- Analytics (BarChart3)

**AUDIT:**
- Audit Log (Shield)

**SETTINGS** (group with items):
- Settings (Settings) — general settings page
- Client Register (Building2) — new, future
- Object Register (MapPin) — the existing Objects view
- Project ID (Hash) — project ID config, similar to Employee ID settings
- Comp. Groups (DollarSign) — compensation groups, future
- Contract Data (Briefcase) — reuse existing
- Project Defaults (Settings) — future
- Version Management (GitBranch) — reuse existing
- ISO Standards (Globe) — reuse existing

**Bottom (no group):**
- Process Guide (BookOpen)

### Changes

**1. `src/lib/ui-translations.ts`** — Add missing translation keys:
- `menu.forestry-projects` → en: "Projects", sv: "Projekt", ro: "Proiecte"
- `menu.forestry-objects` → en: "Objects", sv: "Objekt", ro: "Obiecte"
- `menu.analytics` → en: "Analytics", sv: "Analys", ro: "Analiză"
- `menu.gantt-view` → en: "Gantt View", sv: "Gantt-vy", ro: "Vizualizare Gantt"
- `menu.kanban-board` → en: "Kanban Board", sv: "Kanban-tavla", ro: "Tablou Kanban"
- `menu.client-register` → en: "Client Register", sv: "Kundregister", ro: "Registru clienți"
- `menu.project-id` → en: "Project ID", sv: "Projekt-ID", ro: "ID proiect"
- `menu.comp-groups` → en: "Comp. Groups", sv: "Komp. Grupper", ro: "Grupuri comp."
- `menu.project-defaults` → en: "Project Defaults", sv: "Projektstandard", ro: "Valori implicite proiect"
- `group.audit` → en: "Audit", sv: "Granskning", ro: "Audit"

**2. `src/components/dashboard/Sidebar.tsx`** — Restructure forestry menu arrays:
- `forestryMenuItems`: Dashboard, Projects, Gantt View (future), Kanban Board (future), Employees, Analytics
- `forestrySettingsItems` (new): Settings, Client Register, Object Register (forestry-objects), Project ID, Comp. Groups, Contract Data, Project Defaults, Version Management, ISO Standards
- `forestryOthersItems`: Audit Log
- Add Process Guide as a separate bottom item (like in the second screenshot, it appears outside of groups)
- Update the `useEffect` for app changes to set `settingsItems` to the new forestry settings array
- Add `group.audit` label for the audit section

**3. `src/lib/sidebar-registry.ts`** — Update forestry-project sidebar items and default access to include all the new items.

**4. `src/components/dashboard/Dashboard.tsx`** — Add placeholder cases for new sidebar items (gantt-view, kanban-board, client-register, project-id, comp-groups, project-defaults) that show a "Coming Soon" or teaser message, and wire existing views for contract-data, version-management, iso-standards.

### Result
The forestry sidebar will match the target layout with proper translated labels, a Settings group with sub-items, and all navigation working correctly.

