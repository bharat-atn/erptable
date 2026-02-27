

## Two Bugs to Fix

### Bug 1: Contract doesn't pick up employee information

**Root cause:** Employee personal data (name, address, phone, etc.) only gets written to the contract's `form_data` when the HR user visits step 4 of the wizard, which mounts `ContractDetailsStep` and triggers auto-save. If the user skips steps, uses fast-track, or views the contract before visiting step 4, the `form_data` remains empty for employee fields.

**Fix:** When a contract is created or when the wizard first loads a contract with empty employee fields in `form_data`, pre-populate the `form_data` with employee data from `personal_info`. This should happen in `ContractTemplateView.tsx` when the contract is first created (step 2 → step 3 transition) or when resuming. Specifically:

1. In `ContractTemplateView.tsx`, after creating or loading a contract, check if `form_data` is missing employee fields. If so, immediately write the employee's data (from `personal_info` and top-level columns) into `form_data`.
2. This ensures the contract document always has employee data available, regardless of which steps the HR user visits.

**Files to modify:**
- `src/components/dashboard/ContractTemplateView.tsx` — Add a function that pre-populates `form_data` with employee data when the contract is first associated with an employee (after step 2 completes and a contract record exists).

### Bug 2: Signing UX — Place & Date should be above the signature

**Root cause:** In both `EmployerSigningDialog.tsx` and `ContractSigning.tsx`, the Place & Date fields appear before the signature canvas, but the user's expectation (and the user's complaint about "going upwards") suggests the current visual order creates confusion when scrolling through a long contract document.

Re-reading the user's request: "Be that you entering the location where you're signing and the date, and below that you do the signing." — The user wants Place & Date ABOVE the signature, which IS the current order. The confusion is likely caused by the long contract document pushing Place & Date far down, and then the signature card creates additional scrolling. The real issue may be that in the `EmployerSigningDialog`, the signature card is a separate card below Place & Date, requiring scrolling past Place & Date to reach the signature canvas.

**Fix:** Merge the Place & Date fields and the Signature section into a single card in both `EmployerSigningDialog.tsx` and `ContractSigning.tsx`, with Place & Date at the top and signature drawing area directly below — no gap or separate card headers. This eliminates the "going upwards" scroll issue.

**Files to modify:**
- `src/components/dashboard/EmployerSigningDialog.tsx` — Merge the Place & Date card and Employer Signature card into one card, with Place & Date fields first, then the signature canvas directly below.
- `src/pages/ContractSigning.tsx` — Same merge for the employee signing page: combine Place & Date and signature canvas into one cohesive section.

### Implementation Steps

1. **Pre-populate form_data with employee data** — In `ContractTemplateView.tsx`, after a contract is created or loaded, write employee personal info into `form_data` if employee fields are missing.

2. **Merge Place & Date with Signature section** — In both `EmployerSigningDialog.tsx` and `ContractSigning.tsx`, combine the two separate sections into one card with Place & Date on top and signature drawing below.

