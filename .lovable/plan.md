

## Plan: Add Organization Context Banner to Data Handling

### Problem
The Data Handling import view does not clearly indicate which organization/company the employee data will be imported into. This creates a risk of importing data into the wrong tenant.

### Changes (single file: `src/components/dashboard/DataHandlingView.tsx`)

**1. Add a prominent organization/company context banner below the header (~line 649)**
- Fetch the current organization name and company name from the existing `useOrg()` context and a query to the `companies` table (filtered by `orgId`).
- Display a clearly visible banner/badge showing: "Importing to: **[Company Name]** ([Organization Name])" with a Building icon.
- Use an info-style alert or a colored banner (e.g., blue/amber background) so it stands out.
- If the org type is "sandbox", show an additional amber "Sandbox" badge as a warning.

**2. Add an import confirmation step**
- Before the final import executes (step 4), show a confirmation dialog that explicitly states: "You are about to import X employees into [Company Name]." with the org environment badge.
- Require the user to confirm before proceeding.

**3. Import required icon**
- Add `Building2` from lucide-react to the existing icon imports.

This is a focused UI clarity change — no database or RLS changes needed. The `orgId` and org details are already available via `useOrg()`, and company data can be fetched with a simple query.

