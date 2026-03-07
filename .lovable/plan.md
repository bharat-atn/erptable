

## Plan: Fix Signing Date to Display in ISO Format (YYYY-MM-DD)

### Problem

The signing date field uses `<input type="date">`, which renders dates in the browser's locale format (e.g., `07/03/2026` for MM/DD/YYYY locales). This contradicts the ISO 8601 standard (YYYY-MM-DD) used throughout the application.

### Fix — `src/pages/ContractSigning.tsx`

Replace the native date input with a regular text input that displays and accepts YYYY-MM-DD format:

1. Change `<Input type="date" ...>` to `<Input type="text" ...>` with `placeholder="YYYY-MM-DD"` and `maxLength={10}`
2. The `signingDate` state is already initialized as `format(new Date(), "yyyy-MM-dd")` — this is correct and stays as-is
3. The value is already stored in ISO format — no backend changes needed

This is a one-line change (the `type` attribute and adding placeholder/maxLength).

### Files to Edit

| File | Change |
|------|--------|
| `src/pages/ContractSigning.tsx` | Change date input from `type="date"` to `type="text"` with ISO placeholder |

