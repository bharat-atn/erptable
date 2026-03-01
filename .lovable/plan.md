

## Plan: Improve LoginProfileDialog fields

### 1. Date of Birth - Use ISO date format from system settings

Read the ISO date format setting from localStorage (same as `IsoStandardsView` uses) and display the date accordingly. The native `<input type="date">` always uses YYYY-MM-DD internally, but we'll format the displayed value using the system's configured format and use a text input with a date pattern or a formatted display.

**Approach**: Keep the `<input type="date">` (browser-native, always stores YYYY-MM-DD which is ISO 8601) but add a helper label showing the configured format from localStorage ISO settings.

### 2. Phone Number - Replace plain text input with country dial code selector

Replace the simple phone number text input with a two-part input: a Select dropdown for the country dial code prefix (using the existing `countries` list from `src/lib/countries.ts`) plus a text input for the number. Priority countries at the top of the list: Sweden (+46), Romania (+40), Thailand (+66), Ukraine (+380), followed by a separator, then the rest alphabetically.

### 3. Remove Emergency Contact field

Remove the emergency contact input and its associated state/save logic entirely from `LoginProfileDialog.tsx`.

### 4. Nationality - Replace text input with searchable country/nationality Select

Replace the free-text nationality input with a Select dropdown listing world nationalities. Priority entries at top: Swedish, Romanian, Thai, Ukrainian, followed by a separator, then all others alphabetically. We'll derive nationality names from the existing `countries` list (mapping country name to demonym).

### Files to change
- `src/components/dashboard/LoginProfileDialog.tsx` - All four changes above

