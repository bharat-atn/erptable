

## Plan: Make Date Pickers Open to the Selected Date's Month

### Problem
All `<Calendar>` components across `ContractDetailsStep.tsx` and `SchedulingStep.tsx` lack the `defaultMonth` prop. When a date is already selected (e.g., September 30), re-opening the picker shows the current month (March 2026) instead of September. This forces users to navigate several months to find their selected date.

### Fix
Add `defaultMonth={selectedDate}` to every `<Calendar>` instance. The `react-day-picker` `defaultMonth` prop accepts a `Date` object and opens the calendar to that month.

### Changes

**File: `src/components/dashboard/ContractDetailsStep.tsx`** (~11 Calendar instances)
- Add `defaultMonth={selectedDate}` to each `<Calendar>` where `selectedDate` is the corresponding state variable (`permanentFromDate`, `probationFromDate`, `seasonalFromDate`, `seasonalEndAround`, etc.)
- Example: `<Calendar mode="single" selected={seasonalEndAround} defaultMonth={seasonalEndAround || undefined} onSelect={...} />`

**File: `src/components/dashboard/SchedulingStep.tsx`** (1 `DatePicker` component used ~6 times)
- Update the inner `DatePicker` component's `<Calendar>` to include `defaultMonth={value ? parseISO(value) : undefined}`
- Since this is a shared local component, the fix applies to all 6 usages automatically.

No schema changes, no new dependencies.

