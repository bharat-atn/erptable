

## Plan: Fix Bank Section — Clean Rewrite of State Management

### Root Cause

The bank name input has a **race condition** between parent and child state. Here's what happens step-by-step:

1. User types "bank" → `onChange` fires on **every keystroke**, calling `onBankSelect("other")` which sets `selectedBank=""` and `isOtherBank=true` in parent
2. User clicks a suggestion → `onMouseDown` calls `onBankSelect("CEC BANK S.A.")` which sets `selectedBank="CEC BANK S.A."` and `isOtherBank=false`
3. The input value expression `bankSearchQuery || (isOtherBank ? formData.otherBankName : selectedBank) || ""` tries to derive the display from **three different state sources** across parent and child — this creates timing issues during React's batched re-renders
4. The session replay confirms: after clicking a suggestion, the DOM input value is set to `""` — the bank name never appears

For BIC and account number: the same `onChange → onBankSelect("other")` loop on every keystroke triggers parent re-renders that cascade through the entire form, likely causing focus/value issues with sibling inputs.

### Fix

**File: `src/components/onboarding/OnboardingWizard.tsx`**

1. **Add a local `bankNameValue` state** that tracks what the user sees in the bank name input — no more complex derived expression
2. **Remove `onBankSelect("other")` from the input's `onChange`** — only call `onBankSelect` when a dropdown suggestion is clicked or on blur when user has typed a custom value
3. **On suggestion click**: set `bankNameValue` directly, call `onBankSelect(bank)` once, auto-fill BIC
4. **On blur with custom text**: call `onBankSelect("other")` and `updateField("otherBankName", bankNameValue)` once
5. **BIC and account number inputs stay simple** — no changes needed to their logic, the fix above stops the parent re-render storm that was interfering

**File: `src/pages/OnboardingPortal.tsx`** — no changes needed.

This is a ~30-line change isolated to the bank name input block (lines 1260-1324).

