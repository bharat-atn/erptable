

## Plan: Smart Profile Dialog with AI Validation

### 1. Auto-set nationality when language changes

In `LoginProfileDialog.tsx`, when the user changes their preferred language, auto-fill nationality if it's currently empty or matches a previous auto-set value:
- `sv` → "Swedish", dial code → "+46"
- `ro` → "Romanian", dial code → "+40"  
- `en` → no change
- (Thai `th` and Ukrainian `uk` are not UI languages currently, so no mapping needed)

### 2. Display date of birth using ISO format

The native `<input type="date">` always renders in the browser's locale format regardless of our ISO setting. Replace with a formatted text display showing the stored date in the configured ISO format (e.g., DD/MM/YYYY), plus keep the native date input for editing. Use `date-fns` `format()` to render the date in the configured format pattern.

### 3. Create edge function for profile field validation

Create a new edge function `validate-profile-fields` that uses AI to validate the consistency and correctness of:
- Phone number length/format for the selected dial code country
- Whether nationality, language, and phone prefix are consistent
- Whether date of birth is reasonable (age 16-80)

**File:** `supabase/functions/validate-profile-fields/index.ts`
- Accepts: `{ dialCode, localNumber, nationality, preferredLanguage, dateOfBirth }`
- Returns: `{ fields: { phone: {valid, message}, nationality: {valid, message}, dateOfBirth: {valid, message} } }`

### 4. Add validation UI to LoginProfileDialog

In `LoginProfileDialog.tsx`:
- Add a "Validate" button or auto-validate on blur/before Continue
- Show validation status icons (check/warning) next to each field
- Block "Continue" if critical validation errors exist
- Show AI feedback messages inline under each field

### Files to change
- `src/components/dashboard/LoginProfileDialog.tsx` — Auto-nationality, ISO date display, validation UI
- New: `supabase/functions/validate-profile-fields/index.ts` — AI validation edge function

