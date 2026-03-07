

## Plan: Unify Contract Document — One Version Everywhere

### The Problem

After a thorough audit, I've identified that the contract is rendered in **6 different places**, and several of them are **not passing all the data** that `ContractDocument` supports. This means the contract looks different depending on where you view it.

Here are the 6 render points and what's missing:

```text
RENDER POINT                         MISSING DATA
─────────────────────────────────────────────────────────────
1. ContractDetailsStep (wizard §14)   ✓ All data (live from state)
2. ContractPreviewDialog (register)   ✗ No signing metadata passed
3. EmployerSigningDialog              ✗ No signing metadata passed
4. ContractSigning (/sign/:token)     ✗ No signing metadata passed
5. SigningSimulation                   ✗ No signing metadata passed
6. Print (via handlePrint in          ✗ Uses CSS that differs from
   ContractPreviewDialog &              the main index.css styles
   ContractDetailsStep)                 (duplicate style blocks)
```

### Root Causes

1. **Signing metadata not passed**: `ContractPreviewDialog`, `EmployerSigningDialog`, `ContractSigning`, and `SigningSimulation` all render `ContractDocument` but **never pass** `employeeSigningMetadata` or `employerSigningMetadata`. This means the Place/Date fields in the signature section are always empty in those views, even after signing.

2. **Print CSS divergence**: `ContractPreviewDialog` and `ContractDetailsStep` each have their own inline `<style>` block for printing. These are ~100-line duplicates that can drift. The §4 "comes into force" clause uses `hsl(var(--foreground))` which won't resolve in a print window that lacks the CSS variables.

3. **§4 clause color**: The `s4_comesIntoForce` clause uses `hsl(var(--foreground))` inline style, which fails in print views (no CSS variables available). Should use a hardcoded color like the rest of the print styles.

### Changes

#### 1. `ContractPreviewDialog.tsx` — Pass signing metadata
- Fetch `employee_signing_metadata` and `employer_signing_metadata` from the contracts query (already available in the `select *`)
- Pass them as props to `ContractDocument`

#### 2. `EmployerSigningDialog.tsx` — Pass signing metadata
- The contract fetch already uses `select *`, so the metadata is available
- Pass `employeeSigningMetadata` from `contract.employee_signing_metadata`

#### 3. `ContractSigning.tsx` — Pass signing metadata
- The `get_contract_for_signing` RPC **does not return** signing metadata columns. Need to update the DB function to include them.
- Once available, pass to `ContractDocument`

#### 4. `SigningSimulation.tsx` — Pass signing metadata
- The contract fetch already uses `select *`, so metadata is available
- Pass both metadata props to `ContractDocument`

#### 5. `ContractDocument.tsx` — Fix §4 clause colors for print
- Replace `hsl(var(--foreground))` with `#1a1a1a` and `hsl(var(--muted-foreground))` with `#64748b` in the inline styles of the `s4_comesIntoForce` block

#### 6. Database Migration — Add metadata to `get_contract_for_signing`
- Update the RPC function to also return `employee_signing_metadata` and `employer_signing_metadata`

#### 7. Print style unification
- Extract the common print CSS into a shared utility string so `ContractPreviewDialog` and `ContractDetailsStep` use the exact same styles

### Summary of Files

| File | Change |
|------|--------|
| `ContractDocument.tsx` lines 310-315 | Replace `hsl(var(...))` with hardcoded colors |
| `ContractPreviewDialog.tsx` lines 177-191 | Pass signing metadata props |
| `EmployerSigningDialog.tsx` lines 178-192 | Pass employee signing metadata |
| `ContractSigning.tsx` lines 284-295 | Pass signing metadata from RPC data |
| `SigningSimulation.tsx` lines 212-223 | Pass signing metadata from contract data |
| DB migration | Update `get_contract_for_signing` to return metadata columns |
| `src/lib/contract-print-styles.ts` (new) | Shared print CSS string used by both print handlers |
| `ContractPreviewDialog.tsx` lines 50-97 | Use shared print CSS |
| `ContractDetailsStep.tsx` lines 360-435 | Use shared print CSS |

