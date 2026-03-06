

## Plan: Forestry Sidebar Expansion and Process Guide

### Understanding

The Forestry Project Manager handles **Projects** that contain **Objects** (forest parcels, cutting areas, planting sites). Each Object has an **SLA class** (difficulty level), which will later link to a price list. The Process Guide needs to document the forestry-specific workflow for setting up and executing projects.

### 1. Database: `forestry_objects` table

A new table to store objects within projects, including SLA classification:

```sql
CREATE TABLE public.forestry_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.forestry_projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  object_id_display TEXT NOT NULL,        -- e.g. "OBJ-26-001"
  name TEXT NOT NULL,
  description TEXT,
  sla_class TEXT NOT NULL DEFAULT 'standard', -- e.g. easy, standard, difficult, extreme
  location TEXT,
  area_hectares NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'registered', -- registered, planned, in_progress, completed
  coordinates TEXT,                        -- GPS or map reference
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: org members can manage via org_id
```

### 2. Sidebar Updates

**Current:** Dashboard, Projects, Employees, Analytics | Audit Log, Settings, Process Guide

**Updated structure:**
- **MAIN**: Dashboard, Projects, Objects, Employees, Analytics
- **OTHERS**: Audit Log, Settings, Process Guide

Files changed: `sidebar-registry.ts`, `Sidebar.tsx` (add Objects item with `MapPin` icon)

### 3. New Component: `ForestryObjectsView.tsx`

- Table listing all objects across projects (or filtered by project)
- Columns: Object ID, Name, Project, SLA Class, Location, Area, Status
- CRUD via form dialog (create/edit with project selector, SLA class dropdown)
- Filter by SLA class and status

### 4. New Component: `ForestryProcessGuideView.tsx`

A forestry-specific process guide (separate from the HR one), with:

**Terminology section:**
- Project: A forestry contract/assignment with defined scope and timeline
- Object: A specific forest parcel, site, or area within a project
- SLA Class: Difficulty classification (easy/standard/difficult/extreme) affecting pricing
- Work Order: Task assignments for field crews (future)
- Field Report: Documentation of completed work (future)

**Workflow: New Project Setup (Flow 1)**
1. **Project Manager** - Create Project (define name, type, client, location, dates, budget) → Status: SETUP
2. **Project Manager** - Register Objects (add forest parcels/sites, assign SLA classes, specify areas) → Status: PLANNING
3. **Project Manager** - Assign Teams (link employees/crews to objects) → Status: PLANNING
4. **System** - Activate Operations (all objects planned, teams assigned) → Status: IN PROGRESS
5. **Project Manager** - Monitor & Report (track progress, update object statuses) → Status: IN PROGRESS
6. **System** - Complete & Archive (all objects completed, financials reconciled) → Status: COMPLETED

**Flow Summary section** matching the HR guide pattern.

### 5. Wire into Dashboard.tsx

- Add `case "forestry-objects"` rendering `ForestryObjectsView`
- Replace `ProcessGuideView` with `ForestryProcessGuideView` for the forestry app

### Files to Create
- `src/components/dashboard/ForestryObjectsView.tsx`
- `src/components/dashboard/ForestryProcessGuideView.tsx`
- `src/components/dashboard/ForestryObjectFormDialog.tsx`

### Files to Edit
- `src/lib/sidebar-registry.ts` — add `forestry-objects` item
- `src/components/dashboard/Sidebar.tsx` — add Objects menu item with `MapPin` icon
- `src/components/dashboard/Dashboard.tsx` — wire new views
- Database migration for `forestry_objects` table

