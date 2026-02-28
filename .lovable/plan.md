

## Super Admin Org Bypass + Membership-Filtered Org Picker

### Current State
- All users (including super admins) see the Organization Picker when no org is selected
- The `organizations` table RLS already filters: super admins see all orgs, others see only orgs they're members of via `is_org_member(id)`
- `org_members` SELECT RLS: `user_id = auth.uid() OR is_super_admin()` — already correct

### What Needs to Change

**1. Auto-bypass org picker for super admins** (`src/contexts/OrgContext.tsx`)
- In `fetchOrgs`, after loading orgs: if user is super admin (`is_super_admin()` check), auto-select the first org (or saved org) without requiring manual pick
- This means the `orgId` will already be set before `Index.tsx` reaches the picker check

**2. Update Index.tsx flow** (`src/pages/Index.tsx`)
- Pass `isAdmin` to OrgContext or handle in Index: if `isAdmin` and `orgs.length > 0` but no `orgId`, auto-select first org and skip picker
- Non-admin users still see the picker, but only orgs they belong to (already enforced by RLS)

**3. No database changes needed**
- RLS on `organizations` already filters by membership for non-admins
- `org_members` already only shows own memberships to non-admins
- The User Management "Manage Orgs" dialog already controls which orgs users can access

### Files Changed
1. **`src/contexts/OrgContext.tsx`** — Add super admin detection; auto-select first org for admins
2. **`src/pages/Index.tsx`** — Skip org picker when `isAdmin` and orgs are available (auto-select handled by context)

