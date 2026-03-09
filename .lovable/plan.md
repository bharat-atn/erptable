

## Diagnosis: Why the crash keeps coming back

The white-screen crash is caused by **Radix UI Portal components** (`Select`, `Popover`, `SearchableCountrySelect`) in the bank section. When the user toggles between "listed bank" and "other bank" modes, multiple Radix components mount/unmount simultaneously, triggering a React DOM reconciliation error (`removeChild` on a node that no longer exists in the tree). Every previous fix attempted to patch timing or state flow, but the fundamental issue is **Radix Portals in a conditionally-rendered section**.

The current codebase (preview) already has a simplified text-only bank input. But you want the hybrid UX back (list first, manual fallback). The plan below rebuilds this using **zero Radix components** in the bank section.

## Plan: Hybrid bank UX with zero Radix components

### Architecture
```text
Bank section (always rendered, never conditionally mounted):
  1. Native <select> for bank country (SE/RO/TH/UA/MD/Other)
  2. Native <select> for bank name (populated from FALLBACK_BANKS_BY_COUNTRY)
     - Auto-fills BIC when a listed bank is selected
     - Last option: "Other / Not in list" → switches to manual text input
  3. OR plain <input> for manual bank name (when "Other" selected or country has no list)
  4. Plain <input> for BIC code (always visible, always editable)
  5. Plain <input> for bank account number (always visible)
  
  Reset: A small "Clear selection" link resets bank country + name to empty.
  
  No Radix Select. No Radix Popover. No SearchableCountrySelect.
  No conditional mount/unmount of interactive components.
```

### File: `src/components/onboarding/OnboardingWizard.tsx`

1. **Add local state** for bank flow (inside the wizard, not as props):
   - `bankCountryKey` — selected country key for bank (string, e.g. "Sweden")
   - `isManualBank` — boolean, true when user picks "Other" from bank list or country has no predefined banks

2. **Replace the current bank section** (lines ~1097-1155) with:
   - A native `<select>` for bank country with priority countries (Sweden, Romania, Thailand, Ukraine, Moldova) + "Other country"
   - A native `<select>` for bank name, populated from `FALLBACK_BANKS_BY_COUNTRY[bankCountryKey]`, with a final "Other / Not in list" option
   - When a listed bank is selected: auto-fill `bicCode` via `updateField`, set `bankName`
   - When "Other" is selected or country has no list: show a plain `<input>` for `bankName`
   - A small "Reset" text button to clear all bank selections
   - Keep existing BIC and Account Number `<Input>` fields unchanged

3. **Update `s4Missing` validation** to require `bankName` regardless of flow path.

4. **Update AI fill handler** (`handleAiFill`): set `bankCountryKey` and `isManualBank` based on AI-generated data so the UI reflects the filled state without triggering portal mounts.

5. **No changes to props/interfaces** — `OnboardingWizardProps` stays the same. All bank state is local to the wizard.

### Files NOT changed
- `OnboardingPreview.tsx` — no prop changes needed
- `SubmissionViewDialog.tsx` — no prop changes needed  
- `OnboardingPortal.tsx` — no changes needed
- `searchable-country-select.tsx` — not used in bank section anymore

### Why this will not crash
- Native `<select>` elements have no Portal, no animation, no Presence component
- No conditional mounting of interactive Radix components
- All state transitions are simple string assignments with no cascading effects
- The bank country select and bank name select are always in the DOM (just with different `<option>` sets)

