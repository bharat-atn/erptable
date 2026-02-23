

# Update Email Sender Domain to mail.erptable.com

## Summary
Update all edge functions that send emails to use the verified `mail.erptable.com` domain instead of the Resend sandbox address `onboarding@resend.dev`. No new secrets or API keys are needed -- the existing `RESEND_API_KEY` already works with this verified domain.

## What Changes

### 1. send-invitation-email (Onboarding Invitations)
- Change sender from `onboarding@resend.dev` to `hr@mail.erptable.com`
- Update the "from" label to use the company name dynamically (already does this)

### 2. send-contract-email (Signed Contracts)
- Change sender from `onboarding@resend.dev` to `contracts@mail.erptable.com`
- Keeps the existing email template and logic

### 3. send-signing-email (Contract Signing)
- This function currently returns a signing URL without sending email
- No changes needed unless we want to add email sending here later

## Files Modified
- `supabase/functions/send-invitation-email/index.ts` -- update "from" address
- `supabase/functions/send-contract-email/index.ts` -- update "from" address

## Technical Details
- The verified subdomain is `mail.erptable.com`, so all sender addresses must use this exact subdomain (e.g., `hr@mail.erptable.com`, not `hr@erptable.com`)
- Edge functions will be redeployed automatically after the changes

