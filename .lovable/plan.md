

## Plan: Age-Aware Salary Rate Lookup in Contract Wizard

### What This Changes

Currently, the salary lookup in the contract wizard (Section 8) fetches agreement rates based only on **position** and **skill group**, ignoring the employee's age and the contract period. This means it could return the wrong rate for workers under 19.

After this change, the system will automatically determine the employee's **age group** (16, 17, 18, or 19+) from their birth date and match it against the correct **period** to pull the right collective agreement rate.

### How It Works

1. **Age Calculation** -- Using the employee's birth date (already collected in Section 2:2) and the contract's seasonal start date (from Section 4/scheduling), the system calculates the employee's age at the start of employment.
   - Age 16 --> age group "16"
   - Age 17 --> age group "17"  
   - Age 18 --> age group "18"
   - Age 19+ --> age group "19_plus"

2. **Period Matching** -- The system determines which agreement period applies (2025/2026 or 2026/2027) based on the contract's season year or start date, then filters to rates from that period.

3. **Updated Rate Lookup** -- The "Apply Official Rate" button in Section 8 will use all four criteria (position, skill group, age group, period) to find the exact rate from the collective agreement data.

4. **Visual Feedback** -- When a rate is applied, the system will show which age group and period it matched against, so the HR user can verify correctness.

---

### Technical Details

**File: `src/components/dashboard/ContractDetailsStep.tsx`**

- **Query update** (line ~529): Expand the `agreement_periods` query to also fetch `period_label` and `age_group` columns.

- **Age group derivation** (new helper): Add a function that calculates the employee's age from `birthday` state and the employment start date (e.g., `seasonalFromDate`), then maps it to the age group string ("16", "17", "18", or "19_plus").

- **Period derivation**: Use the component's existing `season_year` or the employment start date to determine the matching `period_label` (e.g., "2025/2026" or "2026/2027").

- **`getOfficialRate()` update** (line ~540): Add `age_group` and `period_label` filters to the agreement lookup, changing the match from 2 criteria to 4 criteria.

- **UI indicator**: When the rate is applied, show a small info line like "Rate for: 19+ / Period 2025/2026" so the user knows which data was used. If the employee is under 19 and only hourly rates exist (monthly = 0), the monthly field will be left empty or show "N/A".

