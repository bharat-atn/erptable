

## Plan: Add Ukrainian Worker to AI Test Data Generator + Fix Scroll/Button Layout

### Problem
1. The AI Test Data Generator only shows Romanian, Thai, and Swedish worker buttons — no Ukrainian option.
2. The language selector in OnboardingPreview and SubmissionView is missing "Ukrainian + English".
3. The generate-test-data edge function has no Ukrainian nationality support.
4. The floating bottom controls (language selector + Admin View button) can overlap the form's submit button, making it inaccessible.

### Changes

**1. `src/components/onboarding/OnboardingWizard.tsx`**
- Add "Ukrainian" to the nationality button list on line 782: `["Romanian", "Thai", "Swedish", "Ukrainian"]`
- Add bottom padding to the form container (line 727-728) so the submit button is never hidden behind floating controls: add `pb-24` to ensure scroll clearance.

**2. `src/components/dashboard/OnboardingPreview.tsx`**
- Add `<SelectItem value="uk_en">Ukrainian + English</SelectItem>` to the language selector (after line 74).

**3. `src/components/dashboard/SubmissionViewDialog.tsx`**
- Add `<SelectItem value="uk_en">Ukrainian + English</SelectItem>` to the language selector (after line 81).

**4. `supabase/functions/generate-test-data/index.ts`**
- Add Ukrainian rules to the system prompt's country-specific validation section: phone prefix +380, 9 digits, Ukrainian cities/postcodes/provinces.
- Add `"Ukrainian"` entry to the `nationalityMap` post-processing object: `{ country: "Ukraine", prefix: "+380" }`.

### Result
The onboarding preview will show four AI test data buttons (Romanian, Thai, Swedish, Ukrainian), the language selectors will include Ukrainian + English, the edge function will generate proper Ukrainian test data, and the submit button will always remain visible above the floating controls.

