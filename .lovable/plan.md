

## Plan: Fix Three Issues in Contract Signing Flow

### Issue 1: §4 Clause Not Appearing in Signing View
The `ContractDocument` component correctly renders the `s4_comesIntoForce` clause. The issue is that in `ContractSigning.tsx`, the contract is rendered via `ContractDocument` with the same props — so it should appear. Let me verify the contract document is receiving `formData` correctly. Looking at line 220-221, `fd = data?.form_data || {}` and it's passed as `formData={fd}` on line 292. The clause renders unconditionally on line 300-310 of ContractDocument — so it should always appear. The clause IS showing (user's third screenshot confirms this). The user may be referring to the fact that it wasn't showing before the previous fix was applied. This is now resolved.

### Issue 2: Signing Date Not ISO Standard
The `fmtDate` function in `ContractDocument.tsx` (line 35-38) parses dates with `new Date(val)` which interprets date-only strings as UTC midnight, potentially shifting the date by -1 day in timezones behind UTC. Fix: parse the date string directly without `new Date()` constructor for date-only strings.

**File: `src/components/dashboard/ContractDocument.tsx` (line 35-38)**
Replace `fmtDate` to avoid UTC date shift:
```typescript
function fmtDate(val: string | null | undefined): string {
  if (!val) return "—";
  // If already YYYY-MM-DD, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch { return val; }
}
```

### Issue 3: Code of Conduct Confirmation Flow — Clearer Process
Current problem: The confirmation checkbox is hidden until scroll and there's no clear visual guidance. The user wants a **toggle button** that appears after scrolling, and the signing section should only appear after toggling it.

**Changes to `src/pages/ContractSigning.tsx`:**

1. **Add Ukrainian to `AVAILABLE_COC_PDFS`** (line 27): Add `"uk"` since we created the PDF.

2. **Replace the CoC confirmation checkbox with a clear toggle button** (lines 384-400): After scrolling to the bottom, show a prominent button/switch instead of a small checkbox. When toggled, it confirms the CoC.

3. **Hide the entire signing card until CoC is confirmed** (line 512-671): Wrap the signing `<Card>` in a condition: only show when `cocConfirmed` is true. This creates a clear sequential flow: scroll CoC → toggle confirmation → signing area appears.

### Same fixes for `src/pages/SigningSimulation.tsx`
Apply the same CoC flow improvements and Ukrainian PDF availability fix.

### Summary of Changes

| File | Change |
|------|--------|
| `ContractDocument.tsx` line 35-38 | Fix `fmtDate` to avoid UTC date shift |
| `ContractSigning.tsx` line 27 | Add `"uk"` to `AVAILABLE_COC_PDFS` |
| `ContractSigning.tsx` lines 384-400 | Replace checkbox with prominent toggle button |
| `ContractSigning.tsx` line 512 | Only show signing card when `cocConfirmed` is true |
| `SigningSimulation.tsx` | Same CoC and Ukrainian fixes |

