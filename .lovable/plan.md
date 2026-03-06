

## Plan: Build Forestry Project Manager — Foundation

This is a large feature, so I propose building it incrementally. This first phase delivers the core foundation: a working app with a Dashboard, a Projects view with CRUD, and proper sidebar navigation. Future phases will add Gantt View, Kanban Board, Analytics, and other advanced features.

### Database Changes (Migration)

**1. `forestry_projects` table**
Stores project records per organization.

```sql
CREATE TABLE public.forestry_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id_display TEXT NOT NULL,          -- e.g. "PJ-26-0001"
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'clearing',      -- clearing, planting, mixed
  status TEXT NOT NULL DEFAULT 'setup',       -- setup, planning, in_progress, payroll_ready, completed
  location TEXT,
  client TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12,2) DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forestry_projects ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read their org's projects
CREATE POLICY "Org members can view projects"
  ON public.forestry_projects FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Org members can insert projects"
  ON public.forestry_projects FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Org members can update projects"
  ON public.forestry_projects FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Org members can delete projects"
  ON public.forestry_projects FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));
```

**2. `forestry_tasks` table**
Tasks assigned within a project.

```sql
CREATE TABLE public.forestry_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.forestry_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',     -- pending, in_progress, completed
  priority TEXT NOT NULL DEFAULT 'medium',    -- low, medium, high, urgent
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forestry_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage tasks"
  ON public.forestry_tasks FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM public.forestry_projects
    WHERE org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid())
  ));
```

### Frontend Changes

**1. Enable the app** — `AppLauncher.tsx`
- Set `available: true` for the `forestry-project` app definition.

**2. Update sidebar registry** — `sidebar-registry.ts`
- Update the forestry-project items to match the new views: Dashboard, Projects, Employees, Analytics, Audit Log, Settings, Process Guide. Remove placeholder items (work-orders, field-reports, map-view, etc.) that are not being built yet.

**3. Add sidebar menu items** — `Sidebar.tsx`
- Add a new conditional branch for `appId === "forestry-project"` with the correct menu items and icons (LayoutDashboard, FolderKanban, Users, BarChart3, etc.).

**4. Create `ForestryDashboardView.tsx`** (new component)
Inspired by the screenshot, includes:
- **Warning & Attention row**: Overdue projects, setup projects, pending tasks, task completion rate.
- **Notifications & Status row**: Total projects, active, planning, assignments.
- **Financial & Information row**: Completed, total revenue, total profit, avg duration, high-value count.
- Search bar with status filters (All, Setup, Planning, In Progress, Payroll Ready, Completed) and type filters (All, Clearing, Planting, Mixed).
- Projects list table with project ID, name, location, client, status badge.
- Recent Activity and Upcoming Tasks panels.
- All data fetched from `forestry_projects` and `forestry_tasks`.

**5. Create `ForestryProjectsView.tsx`** (new component)
- Full CRUD table for projects.
- Create/Edit dialog with fields: name, description, type, status, location, client, start/end dates, budget.
- Delete with confirmation.
- Search, filter by status/type, pagination.

**6. Create `ForestryProjectFormDialog.tsx`** (new component)
- Reusable form dialog for creating and editing projects.

**7. Wire into `Dashboard.tsx`**
- Import and render ForestryDashboardView and ForestryProjectsView in the `renderView` switch, gated by `appId === "forestry-project"`.

**8. Remove TeaserDialog trigger** for forestry-project
- Since the app is now real, clicking it should open the dashboard instead of showing the teaser.

### What is NOT included in this phase
- Gantt View, Kanban Board (future phase)
- AI System Insights section (future phase)
- Map View, Equipment, Site Register (future phase)
- Forestry-specific Settings view (will reuse existing Settings for now)

### Result
The Forestry Project Manager becomes a functional app with a rich dashboard and full project CRUD, accessible from the App Launcher. The sidebar shows the correct navigation items with proper role-based access.

