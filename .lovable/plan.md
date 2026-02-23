

## Add User Management to the App Launcher

### What's Missing Today

There is no user management anywhere in the system. No way to see who has signed up, approve new users, or assign roles. This needs to exist before going live.

### Where It Will Live

A new **"User Management"** app card will be added to the App Launcher -- right alongside HR Management, Payroll, etc. This makes it immediately visible and accessible after login.

- Only users with the **Super Admin** (`admin`) role will see this card
- Other users won't see it at all

### What Gets Built

**1. Database Setup**
- Create a trigger that automatically creates a profile row when someone signs up (so no one falls through the cracks)
- Assign the `admin` role to your account (`ove.eriksson@dahai.se`) so you become the Super Admin
- Add RLS policies so admins can view and manage all profiles

**2. User Role Hook (`src/hooks/useUserRole.ts`)**
- A reusable hook that fetches the current user's role from `user_roles`
- Returns the role (e.g. `admin`, `hr_admin`, `user`) or `null` if pending
- Used everywhere to gate access

**3. Pending Approval Screen (`src/components/auth/PendingApproval.tsx`)**
- Shown to users who have signed up but haven't been assigned a role yet
- Clean, informative screen saying "Your account is pending approval"
- Includes a sign-out button

**4. User Management View (`src/components/dashboard/UserManagementView.tsx`)**
- Table listing all users: email, name, current role, status (pending/approved)
- Dropdown to assign or change roles (admin, hr_admin, hr_staff, user)
- Visual indicator for pending users who need approval
- Uses the typed DELETE confirmation pattern already in the system for removing users

**5. User Management as an App in the Launcher**
- New app card: "User Management" with a Shield icon
- Only visible to `admin` role users
- Launches into a dedicated dashboard view with the User Management table

**6. Role Gating Throughout the System**
- `Index.tsx`: After login, check role -- if no role, show Pending Approval screen
- `AppLauncher.tsx`: Filter visible apps based on role (User Management only for admins)
- `Sidebar.tsx`: Filter menu items based on role (HR views hidden from `user` role)
- `Dashboard.tsx`: Add `user-management` to the view router

### Files

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Auto-profile trigger, admin role assignment, RLS policies |
| `src/hooks/useUserRole.ts` | Create | Hook to fetch current user's role |
| `src/components/auth/PendingApproval.tsx` | Create | Screen for unapproved users |
| `src/components/dashboard/UserManagementView.tsx` | Create | Admin page to manage users and roles |
| `src/pages/Index.tsx` | Modify | Add role check after login, route based on role |
| `src/components/dashboard/AppLauncher.tsx` | Modify | Add User Management card, filter by role |
| `src/components/dashboard/Dashboard.tsx` | Modify | Add user-management view to router |
| `src/components/dashboard/Sidebar.tsx` | Modify | Filter menu items by role |

### Security

- Roles stored in separate `user_roles` table (never on profiles)
- All role checks use the existing server-side `has_role()` function via RLS
- Only `admin` can modify roles (enforced by existing RLS on `user_roles`)
- No client-side role storage -- always fetched from the database
- New signups are locked out until explicitly approved

