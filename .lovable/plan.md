

## Problem

When the user sets contract start/end dates (Duration & Timing), the Work Start and Work End fields below do not automatically inherit those values. Additionally, there is no validation preventing the work period from exceeding the contract period — e.g., a 6-month contract with a 10-month work period.

## Plan

### 1. Auto-populate Work Start/End from Contract Dates

In `SchedulingStep.tsx`, when the user sets or changes `contractStartDate` or `contractEndDate`:
- Automatically copy the value into `workStartDate` / `workEndDate` respectively
- This only applies if the work date is currently `null`, or if the work date would now fall outside the new contract period

Implementation: Modify the `onSelect` handlers for the contract start/end `DatePicker` components (lines 386-387) to also call `update()` with the corresponding work dates.

### 2. Clamp Work Dates to Contract Period

When the user manually changes `workStartDate` or `workEndDate`:
- If `workStartDate` is set earlier than `contractStartDate`, show a bilingual warning
- If `workEndDate` is set later than `contractEndDate`, show a bilingual warning
- The warnings will appear as inline destructive alerts below the date pickers (similar to existing warning style)
- The dates will NOT be blocked — the user can still proceed, but they are warned

### 3. Validation Warnings

Add computed warning flags:
- `workStartTooEarly`: `workStartDate < contractStartDate`
- `workEndTooLate`: `workEndDate > contractEndDate`

Display conditional warning messages inside the red work-period section, below the date pickers:
- "⚠ Work start is before contract start date. / OBS: Arbetsstart är före avtalets startdatum."
- "⚠ Work end is after contract end date. / OBS: Arbetsstopp är efter avtalets slutdatum."

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/SchedulingStep.tsx` | Auto-sync contract dates → work dates; add out-of-range warnings |

