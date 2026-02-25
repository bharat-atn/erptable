

## Problem Analysis

The database cascade triggers are working correctly -- when you delete an invitation, the employee record IS deleted from the database if it has no other invitations or contracts. However, the **Operations view doesn't refresh** because its React Query cache is never invalidated.

Here is what happens:
1. You delete an invitation in the Invitations tab
2. The `InvitationsView` invalidates only `["invitations"]` query cache
3. The database trigger deletes the orphaned employee record
4. The Operations view still shows stale cached data from `["operations-employees"]`

The same issue exists for contract deletions in the Contracts view.

## Plan

### 1. Update `InvitationsView` delete mutations to also invalidate Operations caches

In `src/components/dashboard/InvitationsView.tsx`, update `onSuccess` for both `deleteInvitation` and `bulkDelete` mutations to also invalidate:
- `["operations-employees"]`
- `["operations-invitation-stats"]`
- `["operations-contracts"]`

### 2. Update `ContractsView` delete mutations similarly

In `src/components/dashboard/ContractsView.tsx`, update any delete mutation `onSuccess` to also invalidate:
- `["operations-employees"]`
- `["operations-contracts"]`
- `["operations-invitation-stats"]`

### 3. Update `EmployeeRegisterView` delete mutations

In `src/components/dashboard/EmployeeRegisterView.tsx`, update delete mutation `onSuccess` to also invalidate the operations query keys, ensuring Employee Register and Operations stay in sync.

This is a frontend cache synchronization fix -- no database changes needed since the triggers already handle the data cleanup correctly.

