

# Company Register and Contract Template Wizard

## Overview

Two interconnected features: a **Company Register** (under Settings) to manage employer companies, and a redesigned **Contract Template** page with a step-by-step sidebar wizard where Step 1 is selecting a company.

All labels will be bilingual: **English (main) / Swedish (legal)**.

---

## 1. Database: Create `companies` Table

A new migration to create the `companies` table:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| name | text NOT NULL | Employer / Arbetsgivare |
| org_number | text | Organization Number / Organisationsnummer |
| address | text | Address / Adress |
| postcode | text | Postcode / Postnummer |
| city | text | City / Ort |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

RLS policies will be added for authenticated users (select, insert, update, delete).

---

## 2. Company Register View (Settings sub-item)

**New file**: `src/components/dashboard/CompanyRegisterView.tsx`

- A table listing all companies (name, org number, city)
- "Add Company" button opening a form dialog
- Edit/Delete via row actions
- All field labels shown bilingually, e.g. **"Employer / Arbetsgivare"**
- Layout matches the screenshot style (card with form fields)

**New file**: `src/components/dashboard/CompanyFormDialog.tsx`

- Dialog with form fields matching the screenshot
- Bilingual labels on each field

---

## 3. Sidebar Navigation Update

**Modified**: `src/components/dashboard/Sidebar.tsx`

Add "Company Register" (Building icon) to the `settingsItems` array alongside "Contract Template":

```
Settings
  - Contract Template
  - Company Register
```

---

## 4. Contract Template Redesign with Sidebar Wizard

**Modified**: `src/components/dashboard/ContractTemplateView.tsx`

Replace the placeholder with a two-panel layout:
- **Left panel (sidebar)**: Step list with visual indicators (active/completed/upcoming)
  - Step 1: Company (select from Company Register)
  - Future steps will be added later (e.g., Employee, Terms, Review)
- **Right panel (content)**: Shows the form/content for the active step

Step 1 content: A searchable dropdown/select to pick a company from the register, with a preview card showing the selected company details in bilingual format.

---

## 5. Routing Update

**Modified**: `src/components/dashboard/Dashboard.tsx`

Add the `company-register` case to render `<CompanyRegisterView />`.

---

## Files Summary

| File | Action |
|------|--------|
| Database migration (companies table + RLS) | Create |
| `src/components/dashboard/CompanyRegisterView.tsx` | Create |
| `src/components/dashboard/CompanyFormDialog.tsx` | Create |
| `src/components/dashboard/ContractTemplateView.tsx` | Modify (wizard layout) |
| `src/components/dashboard/Sidebar.tsx` | Modify (add Company Register) |
| `src/components/dashboard/Dashboard.tsx` | Modify (add routing) |

