

## Plan: Multilingual Feature Announcement Dialog

### What changes
**Single file edit: `src/components/dashboard/FeatureAnnouncementDialog.tsx`**

Add a translations dictionary for all 5 languages (EN, SV, RO, TH, UK) and language-switcher buttons at the top of the dialog.

### Implementation

1. Add a `translations` record keyed by language code (`en`, `sv`, `ro`, `th`, `uk`) containing:
   - Title ("New: Issue Reporter")
   - Description
   - "Look for this button" label
   - Body text about the red bug icon
   - "Got it!" button text

2. Add local `useState` for the selected announcement language, defaulting to the user's `preferred_language` (passed as a new prop) or `"en"`.

3. Render a row of compact flag/label toggle buttons at the top of the dialog content (🇬🇧 EN, 🇸🇪 SV, 🇷🇴 RO, 🇹🇭 TH, 🇺🇦 UK). The active language gets a highlighted style.

4. All dialog text references the translations dictionary using the selected language.

### Props change
Add optional `preferredLanguage?: string` prop so Index.tsx can pass the user's saved language as the default. Falls back to `"en"`.

### No other files need changes
The dialog is self-contained; Index.tsx already has access to the user profile and can pass the preferred language.

