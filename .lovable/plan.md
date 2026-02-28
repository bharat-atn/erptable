

## Fix: Infinite Recursion in org_members RLS Policies

### Root Cause
The `org_members` table's SELECT policy references itself via a subquery (`EXISTS (SELECT 1 FROM org_members ...)`), causing Postgres error `42P17: infinite recursion detected`. This blocks ALL organization queries, which is why "No Organizations Available" appears.

### Database Migration

Drop and recreate all 4 `org_members` policies to avoid self-referencing subqueries:

1. **SELECT** — `user_id = auth.uid() OR is_super_admin()` (direct column check, no subquery)
2. **INSERT** — Keep super_admin OR check the inserting user is owner/admin of that org, but use `auth.uid()` directly on the row being inserted plus a `SECURITY DEFINER` helper function `is_org_admin(_org_id uuid)` that bypasses RLS
3. **UPDATE** — Same pattern: helper function `is_org_admin`
4. **DELETE** — Same pattern: helper function `is_org_admin`

The helper function `is_org_admin(_org_id uuid)` will be `SECURITY DEFINER` (bypasses RLS) and checks if `auth.uid()` has `owner` or `admin` role in the given org.

Also fix the `organizations` SELECT policy which has the same recursive subquery through `org_members`.

### Files Changed

- **Database migration only** — no frontend code changes needed; the OrganizationPicker and OrgContext are already correct, they just can't fetch data due to the 500 error.

