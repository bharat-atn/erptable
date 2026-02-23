

# Fix Operations Stat Bar: "Emails Sent" Counter

## What's Working
The stat bars are mostly correct. The employee counts (Invited, Onboarding, Active, Terminated) all match the actual database state. The "1 completed" under Renewal is also correct.

## What Needs Fixing

### 1. "Emails sent" shows 0 instead of 1
The Invited card shows "0 emails sent" because it only counts invitations currently in `SENT` status. Once a candidate accepts, the status changes to `ACCEPTED`, so the counter drops to 0. It should count all invitations that were ever sent (both `SENT` and `ACCEPTED`).

**Fix:** Change the subtitle under "Invited" from `invitationStats?.sent` to `invitationStats?.sent + invitationStats?.completed` (i.e., SENT + ACCEPTED = total emails ever sent).

### 2. Phone/City/Country dashes (browser cache)
The database already contains the correct values (phone: 0701820168, city: TABY, country: Sweden). The dashes are caused by browser caching of the old data. A hard refresh (Ctrl+Shift+R) will fix this. No code change needed.

## Technical Details

**File:** `src/components/dashboard/OperationsView.tsx`

- Around line 168 (the Invited card subtitle): change `{invitationStats?.sent || 0} emails sent` to `{(invitationStats?.sent || 0) + (invitationStats?.completed || 0)} emails sent`

This is a one-line change.

