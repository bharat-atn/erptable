

## Plan: Sticky Footer for CreateInvitationDialog

### Problem
On low-resolution screens, the "Back" and "Send Invitation" buttons scroll off-screen in the Create Invitation dialog, making them inaccessible.

### Changes

**File: `src/components/dashboard/CreateInvitationDialog.tsx`**

Apply the same sticky footer pattern used in the Invite User dialog:

1. **DialogContent** (line 335): Add `max-h-[90vh] flex flex-col overflow-hidden`
2. **Form element** (line 339): Change to `flex flex-col overflow-hidden flex-1 min-h-0` (remove `space-y-5`)
3. **Scrollable body**: Wrap form fields (lines 340-475) and the email preview (lines 479-487) in a `div` with `overflow-y-auto flex-1 min-h-0 space-y-5 pr-1`
4. **Footer buttons** (lines 488-517): Move outside the scrollable wrapper with `shrink-0 border-t pt-4` so they stay pinned at the bottom regardless of screen size

This affects both states: the preview state (Back + Send Invitation) and the initial state (Preview Email button).

