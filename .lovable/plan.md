

## Investigation: Bank Section Not Working on Onboarding Portal

### What I Found

After extensive code review, the BIC Code and Bank Account Number input fields in the OnboardingWizard have correct `value`/`onChange` bindings and no `disabled` or `readOnly` attributes. The `updateField` function in `OnboardingPortal.tsx` correctly calls `setFormData(prev => ({...prev, [field]: value}))`.

### Possible Root Causes

I identified two likely issues:

**1. Bank radio list may not be visible after country selection**
After selecting Romania, the bank radio list should expand (`setBankListExpanded(true)` on line 1235). If the user doesn't see or interact with the bank radio list, the BIC field won't auto-fill. The screenshot shows "TOGGLE YOUR BANK" with no radio list below it, which suggests the list may have collapsed unexpectedly or wasn't rendered.

**2. The BIC and account fields appear always — but without a bank selected, the validation marks them as incomplete**
The fields are always visible regardless of bank selection state. The user might type in them but the overall section still shows as incomplete because no bank is toggled from the radio list.

### Proposed Fix

Since I cannot reproduce the exact issue via browser automation (auth wall), I'll make defensive improvements:

**File: `src/components/onboarding/OnboardingWizard.tsx`**

1. **Ensure bank list stays expanded when no bank is selected**: Add logic so that if no bank is selected and `bankListExpanded` is false, auto-expand it. This prevents the state where the user sees the "Toggle your Bank" label but no radio list.

2. **Add a "No bank selected" prompt**: When the bank list is collapsed and no bank is selected, show a clickable message like "Please select a bank" that re-expands the list, rather than showing nothing between the country selector and the BIC fields.

3. **Verify inputs work independently of bank selection**: Confirm the BIC and account fields remain fully functional regardless of whether a bank has been toggled from the radio list.

These are small, targeted changes in one file with no database or schema modifications needed.

