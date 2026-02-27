

## Problem

The `invite-user` edge function pre-creates auth users via `admin.createUser()` with an **email identity**. When the invited person then signs in with **Google OAuth**, Supabase treats it as a different identity and creates a **new auth user** with no roles. The invited user lands on the "Pending Approval" screen even though the admin already approved them.

Evidence from the database:
- `dorinlazea@gmail.com` (created by admin) — provider: `email`, role: `org_admin`, **never signed in**
- `dorin.lazea@ljunganforestry.se` (created by Google OAuth) — provider: `google`, **no role**, signed in Feb 25

These are two separate auth users for the same person because the identities never linked.

## Solution

Stop pre-creating auth users. Instead, store pending role assignments in a new table, and auto-assign roles when the user first signs in (via any method).

## Changes

### 1. Create `pending_role_assignments` table (migration)

```sql
CREATE TABLE public.pending_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL,
  full_name text,
  app_access text[] DEFAULT '{}',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.pending_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pending assignments"
  ON public.pending_role_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
```

### 2. Update `handle_new_user` trigger function

After creating the profile, check `pending_role_assignments` for a matching email. If found:
- Insert the role into `user_roles`
- Update the profile to `approved`
- Copy app access into `user_app_access`
- Delete the pending assignment

### 3. Rewrite `invite-user` edge function

- **Existing auth user**: Keep current behavior (update role directly)
- **New user (no auth account yet)**: Insert into `pending_role_assignments` instead of calling `admin.createUser()`. Return success with a message like "Invitation stored. User will be auto-approved when they first sign in."
- If a fallback password is provided, still call `admin.createUser()` (email/password users need a pre-created account)

### 4. Fix `send-role-notification` import

Change `import { createClient } from "https://esm.sh/@supabase/supabase-js@2"` to `import { createClient } from "npm:@supabase/supabase-js@2"` for Deno runtime stability.

### 5. Clean up orphaned data

Provide guidance on merging or cleaning the duplicate user entries (e.g., `dorin.lazea@ljunganforestry.se` has no role).

```text
Flow: Before (broken)
┌─────────┐    admin.createUser()    ┌──────────────┐
│  Admin   │ ──────────────────────► │ Auth user    │ (email identity)
│  invites │                         │ + role       │
└─────────┘                         └──────────────┘
                                           ✕ no link
┌─────────┐    Google OAuth          ┌──────────────┐
│  Invited │ ──────────────────────► │ NEW auth user│ (google identity)
│  user    │                         │ NO role      │ ← stuck
└─────────┘                         └──────────────┘

Flow: After (fixed)
┌─────────┐    pending_role_         ┌──────────────┐
│  Admin   │ ──assignments──────────►│ Table row    │
│  invites │                         │ email + role │
└─────────┘                         └──────────────┘
                                           │
┌─────────┐    Google OAuth          ┌─────▼────────┐
│  Invited │ ──────────────────────► │ Auth user    │
│  user    │    handle_new_user      │ + auto role  │ ← works
└─────────┘    trigger checks table  └──────────────┘
```

