

## Plan: View Submitted Onboarding Data from Invitations

### Problem
When an invitation is marked as "Completed" (ACCEPTED), the candidate has filled out and submitted their onboarding form. Currently there is no way for an HR admin to review what the candidate submitted. The `personal_info` JSONB column on the `employees` table holds all the submitted data, but there is no UI to display it.

### Solution
Add a "View Submission" action to the row actions menu in the Invitations view. For completed invitations, clicking this opens a read-only dialog showing all the fields the candidate filled out, organized by section (Name/Address, Birth/Contact, Emergency Contact, Bank Details, Documents).

### Technical approach

**1. New component: `SubmissionViewDialog.tsx`**
- A dialog that receives an `employeeId` and fetches the employee's `personal_info` JSONB from the `employees` table.
- Renders the data in a clean, read-only layout organized into labeled sections matching the onboarding form structure.
- Sections: Personal Info, Address, Birth & Contact, Emergency Contact, Bank Details, Swedish ID numbers.
- Each field shown as a label/value pair. Empty fields shown as "—".

**2. Update `InvitationsView.tsx`**
- Add state for `viewSubmissionEmployeeId`.
- In the row actions dropdown, add a "View Submission" menu item (visible only when `status === "ACCEPTED"`), which sets the employee ID from the invitation.
- Render the new `SubmissionViewDialog` at the bottom of the component.
- The invitation query already joins `employees`, but we only fetch `email, first_name, last_name`. We need to also include the `id` in the join so we can pass it to the dialog. Looking at the `InvitationRow` type and query, the employee_id is available on the invitation row itself.

**3. Data flow**
- `InvitationRow` already has `employee_id` from the invitations table (it is a column).
- The dialog fetches `employees.personal_info` using that ID.
- No database changes needed -- just reading existing data.

### Files to create/edit
- **Create**: `src/components/dashboard/SubmissionViewDialog.tsx`
- **Edit**: `src/components/dashboard/InvitationsView.tsx` (add state, menu item, dialog render)

