

## Problem

When the "All" filter is active, the schedule table starts at the beginning of the contract period (e.g., February 2026). These early days are "Off-season" or "Weekend" types with 0 scheduled hours, so the Hours and Time columns display "---" for every visible row. This makes it appear as though those columns are broken, even though workdays with actual hours exist further down (starting in March).

## Solution

Make the table more informative in "All" mode so it's immediately clear that Off-season/Weekend days intentionally have no hours, while workdays do:

1. **Show "0h" instead of "---" for days with zero hours** -- This makes it explicit that the system calculated zero hours rather than failing to display data. Only truly null/undefined values will show "---".

2. **Show the time range for Workday rows and "---" for non-work rows** -- This is already the current behavior (line 520), but combined with fix #1, the table will look more intentional.

3. **Auto-scroll to the first workday when "All" filter is selected** -- After rendering, scroll the table so the first Workday row is visible. This way users immediately see rows with actual hours and times.

## Technical Details

**File: `src/components/dashboard/SchedulingStep.tsx`**

- **Line 517**: Change `row.hours > 0 ? row.hours.toFixed(1) : "---"` to always show the numeric value (e.g., `0.0` or `8.5`), using "---" only if `row.hours` is null/undefined.
- **Add a `useRef`** on the scrollable container (`div.max-h-[400px]`) and a `useEffect` that, when filter is `"all"`, finds the index of the first Workday in `filteredSchedule` and scrolls to bring that row into view.
- This keeps the full list intact but ensures users land on meaningful data immediately.

