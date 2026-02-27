

## Fix Syntax Error + End-to-End Test Plan

There is a **syntax error in `EmployerSigningDialog.tsx`** (visible in console logs) that must be fixed before testing. The JSX structure around lines 215-303 has a `<div>` that opens inside `<CardContent>` but its closing creates a parsing issue due to inconsistent nesting with the conditional blocks.

### Step 1: Fix EmployerSigningDialog.tsx syntax error
The `<div className="border-t border-border pt-4 space-y-3">` at line 215 closes at line 303, but the parser is choking on it. The fix is to ensure the closing `</div>` at line 303 is properly aligned and there's no stray text node between the conditional blocks and the closing tag. Specifically, add proper wrapping so the JSX fragment structure is unambiguous.

### Step 2: Test the full end-to-end flow
After fixing the syntax error, use the browser automation to:

1. **Send an invitation** — Navigate to Invitations, create a new invitation for a test Swedish employee, send it
2. **Fill out onboarding** — Open the onboarding portal link, use AI test data generator to fill as a Swedish person, submit
3. **Create contract** — Go to Contracts, open the new contract, fill in required fields with random data across all sections
4. **Employer signing** — Send contract for signing, then counter-sign as employer using the signing dialog
5. **Verify employee signing** — Navigate to the employee signing page, confirm the contract is ready for employee signature
6. **Report results** — Confirm both signatures are stored and the contract status is fully signed in the database

### Technical Details
- The syntax error is at line 303 in `EmployerSigningDialog.tsx` — the `</div>` closing the `<div>` from line 215 may need the conditional blocks wrapped in a fragment or the div restructured
- The ContractTemplateView employee data pre-population code (recently added) will be verified as part of this flow
- The merged Place & Date + Signature UI will be tested during the employer signing step

