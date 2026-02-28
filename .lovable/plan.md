

## Enhance Create Organization with AI Company Lookup

### Problem
The Create Organization dialog is bare -- just name, slug, and type. No company details like org number, address, or website are collected. The existing `lookup-company` edge function already does exactly what's needed (Firecrawl + AI lookup).

### Step 1: Add columns to `organizations` table
Database migration to add:
- `org_number` (text, nullable)
- `address` (text, nullable)
- `postcode` (text, nullable)
- `city` (text, nullable)
- `country` (text, nullable, default 'Sweden')
- `phone` (text, nullable)
- `email` (text, nullable)
- `website` (text, nullable)

### Step 2: Rewrite Create Organization dialog in OrganizationPicker.tsx
- Add a "Lookup" button next to the Name field that calls the existing `lookup-company` edge function
- On lookup success, auto-fill: org_number, address, postcode, city, country, website, phone, email
- Auto-generate slug from the company name
- Show a lookup status indicator (loading spinner, success with source badge, or error)
- Add input fields for all new fields, pre-filled but editable
- Keep the Production/Sandbox type selector
- Show confidence indicators (verified/unverified badge) like the Company Register does

### Step 3: Update handleCreate to save new fields
Insert the additional columns when creating the organization.

### Step 4: Update OrgContext types
Add the new fields to the `Organization` interface so they're available downstream.

### Files Changed
1. **Database migration** -- Add 8 columns to `organizations` table
2. **`src/components/dashboard/OrganizationPicker.tsx`** -- Expand create dialog with AI lookup and new fields
3. **`src/contexts/OrgContext.tsx`** -- Update Organization interface with new fields

### Architecture Note
Reuses the existing `lookup-company` edge function -- no new backend code needed. The same Firecrawl + AI pipeline that powers Company Register now powers org creation.

