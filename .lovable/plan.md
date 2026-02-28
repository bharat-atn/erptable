
Root cause confirmed
- In invitation onboarding (public, no login), `OnboardingWizard` fetches banks directly from `banks` (`src/components/onboarding/OnboardingWizard.tsx`, current `useEffect` bank fetch).
- Current bank read policy only allows authenticated org members (`supabase/migrations/20260228004314_d2197cac-50e9-404d-916b-467890cfb80b.sql`, banks policies), so invitation users get empty results.
- Empty results trigger `FALLBACK_BANKS_BY_COUNTRY`, which is why only a small subset appears (for Sweden: 4 fallback banks) instead of the full configured registry (Sweden has 10 active banks).

Implementation plan
1. Add a token-scoped backend read function
- Create `get_onboarding_banks_by_token(_token text)` as `SECURITY DEFINER`.
- Validate token (exists, not expired, not accepted/expired), resolve invitation org.
- Return only active banks for that org (`name`, `bic_code`, `country`, ordered).

2. Switch invitation onboarding to token-based bank retrieval
- Add optional `invitationToken` prop to `OnboardingWizard`.
- From `OnboardingPortal`, pass the URL token into wizard.
- In wizard: if `invitationToken` exists, load banks via new function (not direct table select).

3. Remove synthetic fallback for real invitation links
- For token mode, do not inject fallback banks.
- If no banks are returned, show explicit inline state: “No bank list configured for this invitation. Please contact HR.”
- Keep fallback behavior only for demo/simulator mode (if needed).

4. Keep dropdown/list strictly registry-driven
- Countries = unique countries from returned bank rows only.
- Bank options = all returned banks for selected country.
- Preserve BIC auto-fill from selected bank.

5. Validate end-to-end before release
- Test from an actual email link in a logged-out browser.
- Confirm Sweden shows all 10 configured banks (and other countries match backend counts).
- Confirm simulator/internal preview still works.
- Confirm “Other Bank” still functions and submit flow remains valid.

Technical details
- Backend/data access update only (no table schema changes).
- Files:
  - `supabase/migrations/*` (new function + grants)
  - `src/pages/OnboardingPortal.tsx` (pass token)
  - `src/components/onboarding/OnboardingWizard.tsx` (token-aware fetch + fallback split by mode)
