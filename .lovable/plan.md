

## Plan: Redesign Bank Selection as a Two-Step Picker

### Problem
The current hybrid text-input-with-autocomplete approach has multiple issues:
- "Swedbank" appears as a default/persisted value due to `useEffect` sync loops between parent `selectedBank` state and local `bankNameValue`
- The "Other bank" option is buried inside the autocomplete dropdown
- BIC/account fields are sometimes unresponsive due to state conflicts

### Solution: Replace with a clean Select + Toggle pattern

**File: `src/components/onboarding/OnboardingWizard.tsx`**

**1. Replace the text input + autocomplete with a proper Select dropdown**
- After country is selected, show a `<Select>` (or the existing `SearchableCountrySelect`-style searchable popover) listing banks for that country
- No default selection — placeholder says "Select bank / Välj bank"
- This eliminates the `bankNameValue` local state and all its sync issues

**2. Add a separate "Other bank" toggle below the select**
- A checkbox or small link/button: "My bank is not listed / Min bank finns inte i listan"
- When toggled ON: hide the bank select, show a plain text `<Input>` for custom bank name
- When toggled OFF: show the bank select again, clear custom bank name

**3. BIC and Account Number fields always visible and editable**
- When a bank is picked from the list: auto-fill BIC but keep it editable
- When "Other bank" is toggled: BIC starts empty, fully manual
- Account number is always empty and manual

**4. Remove the `bankNameValue` local state and the problematic `useEffect` (lines 724-765)**
- The select component manages its own value via `selectedBank` prop from parent
- No more sync loops or stale values

**5. Remove `bankDropdownOpen`, `bankInputRef`, `filteredBankSuggestions` state/memo**
- No longer needed with a proper select component

### UI Layout (after country is selected)

```text
┌─────────────────────────────────┐
│ BANK NAME / BANKNAMN *          │
│ [▼ Select bank / Välj bank    ]│  ← searchable select from bank list
└─────────────────────────────────┘
☐ My bank is not listed / Min bank finns inte i listan

(if checked:)
┌─────────────────────────────────┐
│ OTHER BANK NAME / ANNAT BANKNAMN│
│ [                              ]│  ← free text input
└─────────────────────────────────┘

┌───────────────┐ ┌───────────────┐
│ BIC CODE      │ │ ACCOUNT NUMBER│
│ [auto/manual ]│ │ [manual      ]│
└───────────────┘ └───────────────┘
```

### Files to edit
- `src/components/onboarding/OnboardingWizard.tsx` — bank section rewrite (~80 lines changed in the bank section, remove ~40 lines of stale state management)

