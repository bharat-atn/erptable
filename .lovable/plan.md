

## User Role System -- 3-Level Access Control

### Overview

Build a robust role-based access system with three tiers that controls what each user can see and do across the entire application.

### The Three Roles

| Level | Role (in DB) | Who | What they can do |
|-------|-------------|-----|-----------------|
| Super Admin | `admin` | System owner (you) | Everything -- manage users, assign roles, full system config |
| Admin (HR Manager) | `hr_admin` / `hr_staff` | HR team | Send invitations, create contracts, manage employees, daily operations |
| User (Employee) | `user` | Staff / candidates | View their own data, future Employee Hub mobile app |

### What Will Be Built

**1. User Management Page (Super Admin only)**
- New "User Management" view accessible from the sidebar (only visible to `admin` role)
- Lists all registered users with their email, name, role, and status
- Allows the Super Admin to assign/change roles for any user
- Shows pending users who signed up but haven't been approved yet

**2. Role-Based Sidebar and Navigation**
- Super Admin: sees everything including User Management and system configuration
- Admin/HR: sees the operational views (Dashboard, Employees, Invitations, Contracts, Settings, etc.) -- the current experience
- User: sees only a minimal "Employee Hub" placeholder (for future mobile app features)

**3. Post-Login Role Check**
- After login, the system checks the user's role in the `user_roles` table
- If no role is assigned (new signup), show a "Pending Approval" screen explaining that an admin needs to approve their account
- Super Admin gets notified of pending users via the User Management page

**4. Auto-Create Profile on Signup**
- A database trigger will automatically create a `profiles` row when a new user signs up
- New users start with no role (pending state) until a Super Admin assigns one

**5. Secure Sign-Up Flow**
- Sign-up remains available but new accounts are "locked" until the Super Admin assigns a role
- This prevents unauthorized access to HR data

### Technical Details

**Database Changes:**
- Create a trigger on `auth.users` that auto-inserts a row into `profiles` on new user creation
- The existing `user_roles` table and `app_role` enum are already in place and will be reused
- Your current user (`ove.eriksson@dahai.se`) already has `hr_admin` -- we will also assign `admin` to make you the Super Admin

**New Files:**
- `src/components/dashboard/UserManagementView.tsx` -- full user list with role assignment UI
- `src/components/auth/PendingApproval.tsx` -- screen shown to users without a role
- `src/hooks/useUserRole.ts` -- reusable hook to fetch and cache the current user's role

**Modified Files:**
- `src/pages/Index.tsx` -- add role check after login, route to correct experience based on role
- `src/components/dashboard/Sidebar.tsx` -- filter menu items based on user role
- `src/components/dashboard/Dashboard.tsx` -- add User Management view to the view router
- `src/components/auth/AuthForm.tsx` -- ensure profile is created on signup

**Security:**
- All role checks use the existing server-side `has_role()` and `is_hr_user()` functions (RLS)
- Role assignment is protected: only `admin` can manage the `user_roles` table (already enforced by RLS)
- No client-side role storage -- role is always fetched from the database

