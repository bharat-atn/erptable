

## Add Email Notification to User Invitations

### Problem
The "Invite User" flow in User Management stores a pending role assignment but does **not** send any email to notify the invited person. The user has no way of knowing they've been invited unless told manually.

### Current State
- `invite-user` edge function creates a `pending_role_assignments` record and an audit log entry
- No email is sent during this process
- The `send-invitation-email` function is for onboarding invitations (HR), not user role invitations
- Pending users don't appear in the User Management list until they sign in

### Design

**1. Show pending invitations in the user list**
- Query `pending_role_assignments` alongside `profiles` in `UserManagementView`
- Display pending invitations as rows with a "Pending Invitation" status badge
- Show email, assigned role, app access, and invited date
- Allow delete (remove pending assignment) and resend actions

**2. Send a notification email when inviting a user**
- Update the `invite-user` edge function to send an email via Resend (if configured) after storing the pending assignment
- Email content: "You've been invited to ERP Table. Sign in with your Google account at [link]."
- If Resend is not configured or fails, log it but don't block the invitation

**3. Add "Resend Invite" action for pending users**
- Create a small edge function or reuse `send-role-notification` to re-send the invite email
- Available from the row actions menu on pending invitation rows

### Implementation Steps

1. **Update `invite-user` edge function** -- Add email sending via Resend after the pending assignment is created (in the `else` branch where `action = "invited"`). Use the same Resend pattern as `send-invitation-email`. Fallback gracefully if no API key.

2. **Show pending invitations in UserManagementView** -- Fetch `pending_role_assignments` and merge them into the user list as synthetic rows with a distinct "Invited" status. Add delete and resend actions.

3. **Add resend capability** -- Allow re-triggering the invite email for pending users from the UI.

### Technical Details

The `invite-user` function already has access to the service role key and the invited email. Adding Resend integration follows the exact same pattern used in `send-invitation-email`:

```text
invite-user flow (updated):
1. Store pending_role_assignment  ← existing
2. Send email via Resend          ← NEW
3. Write audit log                ← existing
4. Return success + email status  ← updated
```

