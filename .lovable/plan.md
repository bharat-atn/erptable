

## Plan: Salary Below Collective Agreement Warning

### Problem
When an HR user manually enters a base salary lower than the official collective agreement minimum (from `officialRate.hourly` or `officialRate.monthly`), there is no warning. The system should alert the user that the entered amount is below the minimum.

### Approach
Add an inline warning below each salary input field when the entered value is lower than the corresponding official rate for that job type. The warning compares the raw official rate (without company premium) since that is the legal minimum from Skogsavtalet.

### Changes

**`src/components/dashboard/ContractDetailsStep.tsx`**

In the per-job-type salary input loop (lines 2421-2455), after each salary input pair, add a conditional warning block:

1. For each job type (`idx` 1/2/3), resolve the matching `officialRate` / `officialRate2` / `officialRate3`.
2. If `salaryType === "hourly"` and `parseFloat(hb) > 0` and `parseFloat(hb) < officialRate.hourly`, show a warning with an `AlertTriangle` icon:
   - EN: "The entered basic pay (X SEK/hr) is below the collective agreement minimum (Y SEK/hr)."
   - SV: "Den angivna grundlönen (X SEK/tim) understiger kollektivavtalets minimibelopp (Y SEK/tim)."
   - Translated for RO/TH/UK via `bl()`.
3. Same logic for monthly: if `salaryType === "monthly"` and `parseFloat(mb) > 0` and `parseFloat(mb) < officialRate.monthly`, show equivalent warning.
4. The warning uses amber/orange styling (border-amber-400, bg-amber-50, text-amber-800) to distinguish from errors.

**`src/lib/form-translations.ts`**

Add translation keys for the warning message pattern in RO, TH, and UK dictionaries.

### Result
A visible amber warning appears directly under the salary inputs whenever the entered basic pay is below the collective agreement rate, preventing accidental underpayment of employees.

