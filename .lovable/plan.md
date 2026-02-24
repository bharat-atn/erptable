
# Section 8 (Salary) Enhancements: Multi-Job-Type Rates, Company Premium, and Overtime Clause

## Summary
Three major changes to Section 8:
1. Support salary lookup for up to 3 job types (matching Section 3 selections)
2. Add a company salary premium setting (percentage above official rate, e.g. 5-10%)
3. Add an overtime clause between Monthly Salary and Piece-work pay

---

## 1. Multi-Job-Type Official Rate Lookup

Currently, the "Official Skogsavtalet Rate" card only looks up rates for Job Type 1. With up to 3 job types selected in Section 3, the salary section needs to show rates for each.

**What changes:**
- The single "Official Rate" card becomes a list of rate cards -- one per selected job type (based on `numberOfJobTypes`, `jobType`, `jobType2`, `jobType3`)
- Each card shows the job type name, its official hourly and monthly rate, age group, and period
- The "Apply Rate" button on each card fills that specific job type's salary fields
- State variables expand: instead of single `hourlyBasic`/`monthlyBasic`, we add `hourlyBasic2`, `monthlyBasic2`, `hourlyBasic3`, `monthlyBasic3` (and corresponding premium fields)
- The Hourly Pay and Monthly Salary input sections repeat per job type, displayed in a clear grouped layout (e.g., "Job Type 1: Planting / Plantering" with its own hourly/monthly inputs)

**Validation updates:**
- `section8Missing` checks each active job type's required salary field

---

## 2. Company Salary Premium (Above Official Rate)

A new feature allowing companies to set a default premium percentage above the official forestry contract rate.

**What changes:**
- Add a "Company Premium / Företagspremie" input below the official rate lookup area
- A percentage input (e.g., 5%, 10%) stored in `form_data` as `companyPremiumPercent`
- Default value: 0 (no premium)
- When "Apply Rate" is clicked, the system calculates: `official_rate * (1 + premium/100)` and fills the basic pay field with the adjusted amount
- Visual feedback shows: "Official rate: 147.90 SEK/hr + 5% premium = 155.30 SEK/hr"
- A safeguard prevents entering a negative premium (never below official rate)
- This premium setting persists per contract via `form_data`

---

## 3. Overtime Clause Between Monthly Salary and Piece-work Pay

A new bilingual text block inserted between the Monthly Salary section and the Piece-work Pay checkbox.

**What changes:**
- Add a styled info block (similar to the existing reference notes box) with the text:
  - English: "Only ordered overtime will be compensated with overtime pay."
  - Swedish: "Endast beordrad övertid ersätts med övertidsersättning."
  - Romanian: "Doar orele suplimentare dispuse vor fi compensate cu plata orelor suplimentare."
  - Thai: "เฉพาะการทำงานล่วงเวลาที่ได้รับคำสั่งเท่านั้นที่จะได้รับค่าชดเชยการทำงานล่วงเวลา"
- Displayed as a compact, always-visible notice with an info icon
- Positioned after the Monthly Salary box and before the Piece-work pay checkbox

---

## Technical Details

### New State Variables (`ContractDetailsStep.tsx`)
```text
companyPremiumPercent: string (default "0")
hourlyBasic2, hourlyPremium2, monthlyBasic2, monthlyPremium2: string
hourlyBasic3, hourlyPremium3, monthlyBasic3, monthlyPremium3: string
```

### Modified Functions
- `getOfficialRate()` -- becomes `getOfficialRateForJob(jobTypeName, expLevel)` to support per-job-type lookups
- `handleApplyRate()` -- takes a job index parameter, applies premium, fills correct state variables
- `getFormData()` -- includes all new fields
- Restoration logic in `useEffect` -- restores new fields from saved `form_data`
- `section8Missing` validation -- checks all active job types

### Auto-save
All new fields added to `getFormData()` and its dependency array for seamless auto-save.

### Contract Document (`ContractDocument.tsx`)
- Section 8 rendering updated to display salary data for each job type
- Overtime clause rendered in the document

### File Modified
- `src/components/dashboard/ContractDetailsStep.tsx` (primary)
- `src/components/dashboard/ContractDocument.tsx` (contract rendering)
