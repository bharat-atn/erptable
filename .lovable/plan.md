

# Fix Onboarding Links to Use Published URL

## The Problem
When you send an invitation email, the onboarding link points to the **preview URL** (e.g., `https://a91956c4-...lovableproject.com/onboard/...`). This URL requires Lovable authentication, so external candidates see a login screen instead of the onboarding form.

The root cause: the code uses `window.location.origin` to build the link, which returns whatever URL the admin is currently using (the preview URL during development).

## The Fix
Replace `window.location.origin` with the **published URL** (`https://erptable.lovable.app`) in all places where onboarding links are generated. This ensures external recipients always reach the public site.

## Files to Change

### 1. `src/components/dashboard/CreateInvitationDialog.tsx`
- Line 143: Change `baseUrl: window.location.origin` to `baseUrl: "https://erptable.lovable.app"`
- Line 154: Change the fallback link to also use the published URL

### 2. `src/components/dashboard/InvitationsView.tsx`
- Line 103: Change `baseUrl: window.location.origin` to `baseUrl: "https://erptable.lovable.app"`
- Line 111: Change the clipboard copy link to also use the published URL

## How It Works After the Fix
1. Admin creates an invitation from the dashboard (preview or published -- doesn't matter)
2. The email is sent with a link like `https://erptable.lovable.app/onboard/{token}`
3. The candidate clicks the link and goes directly to the public onboarding form -- **no login required**
4. The candidate fills in their details and submits

## Technical Note
The onboarding route (`/onboard/:token`) uses secure RPC functions (`get_invitation_by_token` and `submit_onboarding`) that bypass RLS, so no authentication is needed for the candidate. This is working as designed.
