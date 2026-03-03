

## Plan: Add Searchable Country and Phone Prefix Selectors

### Problem
The country and phone prefix dropdowns in the onboarding wizard require scrolling through long lists with no way to search. This is frustrating for users trying to find a specific country or dial code.

### Approach
Create two reusable searchable combobox components (based on the existing `CountryCombobox` pattern already used in `CompanyFormDialog.tsx`) and replace the current plain `Select` dropdowns in the onboarding wizard.

### New Components

**`src/components/ui/searchable-country-select.tsx`**
- Popover + search input + scrollable list with flags
- Shows priority countries (Romania, Thailand, Ukraine, Sweden) at top, separated by a divider
- Supports optional error styling via a `hasError` prop
- Reusable across the app

**`src/components/ui/searchable-phone-prefix-select.tsx`**
- Same popover pattern but for phone dial codes
- Shows flag + dial code (e.g. 🇸🇪 +46)
- Filters by country name or dial code
- Priority prefixes at top

### Changes in `src/components/onboarding/OnboardingWizard.tsx`

Replace 5 dropdowns with the new searchable components:

| Location | Field | Current | New |
|----------|-------|---------|-----|
| ~line 927 | Country (address) | `Select` | `SearchableCountrySelect` |
| ~line 1030 | Country of Birth | `Select` | `SearchableCountrySelect` |
| ~line 1044 | Citizenship | `Select` | `SearchableCountrySelect` |
| ~line 1063 | Phone prefix | `Select` | `SearchablePhonePrefixSelect` |
| ~line 1208 | Bank country | native `<select>` | `SearchableCountrySelect` (with "Other" option) |

No logic changes — only the UI widget is swapped. All existing `updateField` callbacks and state management remain the same.

