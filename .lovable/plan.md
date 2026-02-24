

# Audit Log Gap Analysis and Fix Plan

## Current State

Your audit system is **partially complete**. Here's what it covers today:

### Already Tracked
- All changes (add/edit/delete) to: Employees, Contracts, Invitations, Companies, User Roles, Banks
- User login and logout events

### What's Missing

There are two categories of gaps:

### 1. Database Tables Without Audit Triggers
These tables can be changed by HR staff but those changes are invisible in the audit log:
- **Positions** (job positions)
- **Skill Groups**
- **Agreement Periods** (salary data)
- **Contract Schedules** (work schedules)
- **Contract ID Settings**
- **Employee ID Settings**
- **Invitation Template Fields**

### 2. Email and Edge Function Actions (Biggest Gap)
When someone sends an email or triggers a backend action, there is **zero record** in the audit log:
- Sending an **invitation email** to a new hire
- Sending a **signing email** with contract link
- Sending a **signed contract email**
- **Company lookups** (searching for company data)
- **Address validations**

These are important because they represent actions taken toward employees — if an HR person sends a signing email, you want to know who did it and when.

---

## Implementation Plan

### Step 1: Add Missing Database Triggers
Add audit triggers to the 7 tables that currently lack them. This is a single database migration — no code changes needed, the existing `audit_trigger_func()` handles everything automatically.

Tables to add: `positions`, `skill_groups`, `agreement_periods`, `contract_schedules`, `contract_id_settings`, `employee_id_settings`, `invitation_template_fields`

### Step 2: Add Audit Logging to Edge Functions
Update each edge function to write an entry to `audit_log` after performing its action:

- **send-invitation-email**: Log "EMAIL_SENT" with invitation ID, recipient email, and who triggered it
- **send-signing-email**: Log "SIGNING_EMAIL_SENT" with contract ID, recipient email, and who triggered it
- **send-contract-email**: Log "CONTRACT_EMAIL_SENT" with contract ID, recipient email, and who triggered it
- **invite-user**: Log "USER_INVITED" with the invited email and assigned role

### Step 3: Update Audit Log UI
Add the new categories and action types to the AuditLogView so they display properly:
- Add new action types: EMAIL_SENT, SIGNING_EMAIL_SENT, CONTRACT_EMAIL_SENT, USER_INVITED
- Add filter options for these new categories
- Add appropriate icons and color coding

---

## Technical Details

### Database Migration (Step 1)
```sql
-- Add audit triggers to all remaining tables
CREATE TRIGGER audit_positions
  AFTER INSERT OR UPDATE OR DELETE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- (same pattern for all 7 tables)
```

### Edge Function Logging Pattern (Step 2)
Each edge function already has a service-role Supabase client. After the main action succeeds, insert into `audit_log`:

```sql
INSERT INTO audit_log (user_id, user_email, action, table_name, record_id, summary, new_data)
VALUES (caller_user_id, caller_email, 'EMAIL_SENT', 'invitations', invitation_id, 
        'Invitation email sent to employee@example.com', '{"recipient": "..."}');
```

### UI Updates (Step 3)
- Add new entries to `TABLE_ICONS`, `ACTION_COLORS`, `ACTION_ICONS`, `TABLE_LABELS`
- Add "Emails" filter option in the category dropdown
- Add "Email Sent" filter in the action dropdown

### Files to Change
- 1 new database migration (triggers for 7 tables)
- `supabase/functions/send-invitation-email/index.ts`
- `supabase/functions/send-signing-email/index.ts`
- `supabase/functions/send-contract-email/index.ts`
- `supabase/functions/invite-user/index.ts`
- `src/components/dashboard/AuditLogView.tsx`

