

## Plan: Fix date format and enforce validation before continue

### Problem 1: Date of Birth format
The native `<input type="date">` always renders dates in the browser's locale format (e.g., `02/12/1958` in US browsers), ignoring our ISO setting. The fix is to replace it with a plain text `<Input>` that uses a placeholder matching the ISO format (e.g., `YYYY-MM-DD`) and stores the value in that same format. We'll add a pattern and validate the format on input.

### Problem 2: Enforce "Validate Fields" before "Continue"
- The "Continue" button should be **disabled and visually muted** until validation has passed successfully (no errors).
- When the user changes any field after a successful validation, reset validation state — this re-disables "Continue" and highlights "Validate Fields".
- The "Validate Fields" button should have a **prominent visual cue** (e.g., a pulsing border or red/orange outline) when validation is required but hasn't been done yet, so users understand they need to click it.
- Remove the auto-validate-on-continue behavior; the user must explicitly click "Validate Fields" first.

### Changes in `src/components/dashboard/LoginProfileDialog.tsx`

1. **Date input**: Replace `<Input type="date">` with `<Input type="text">` using the ISO format as placeholder. The value is stored as `YYYY-MM-DD` internally. Show the format hint as placeholder text.

2. **Continue button**: Disable unless `validation` exists and `hasErrors` is false. Add muted styling when disabled.

3. **Validate button**: Add attention styling (e.g., `border-orange-400 animate-pulse` or `ring-2 ring-destructive`) when `validation` is null (needs validation). This draws the user's eye.

4. **Remove auto-validate from handleContinue**: The continue handler should only proceed if validation passed; it should not trigger validation itself.

