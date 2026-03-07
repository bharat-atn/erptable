

## Plan: Rewrite Bank Section in OnboardingWizard

### Problem
The bank section is completely broken. The RadioGroup-based bank selection doesn't respond to clicks (invalid HTML IDs, complex expand/collapse state), and the BIC/account inputs are also non-functional. Multiple fix attempts have failed because the underlying architecture is too fragile.

### Approach: Hybrid Bank Entry
Replace the entire bank section (lines ~1213-1362 in `OnboardingWizard.tsx`) with a clean implementation:

1. **Country selector** -- keep as-is (SearchableCountrySelect)
2. **Bank name field** -- always-visible text input with autocomplete dropdown showing matching banks from the list. User can type freely OR pick from suggestions. Picking auto-fills BIC.
3. **BIC Code field** -- always-visible, always editable text input
4. **Bank Account Number field** -- always-visible, always editable text input

### Key changes

**File: `src/components/onboarding/OnboardingWizard.tsx`**

- Remove `RadioGroup`/`RadioGroupItem` from the bank section entirely
- Remove `bankListExpanded` state and all its toggle logic
- Replace bank selection with a searchable text input that shows filtered suggestions from `bankList` as a dropdown. Clicking a suggestion fills the bank name + BIC.
- The `onBankSelect` callback still gets called with the bank name (or "other" if typed manually), maintaining compatibility with parent components.
- BIC and account number inputs remain standard `<Input>` elements with their existing `onChange` handlers -- no conditional rendering, no dependency on bank selection state.

**No changes needed to:**
- `OnboardingPortal.tsx` (handleBankSelect stays the same)
- `OnboardingPreview.tsx` (same interface)
- `SubmissionViewDialog.tsx` (read-only view)
- Database or edge functions
- Default bank list (FALLBACK_BANKS_BY_COUNTRY stays)

### Validation adjustment
- `s4Missing` check: instead of requiring `selectedBank || isOtherBank`, require either `selectedBank || isOtherBank || formData.otherBankName` (any bank name provided counts).

This is a single-file rewrite of ~150 lines in the bank section, replacing fragile RadioGroup logic with plain HTML inputs and a simple dropdown.

