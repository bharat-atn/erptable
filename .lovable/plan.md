

## Plan: Complete Translation Audit of Contract Wizard

### Problem
Multiple sections of the contract wizard still contain hardcoded English/Swedish text that is not routed through `bl()`, meaning Romanian, Thai, and Ukrainian users see English instead of their language. The affected areas span Sections 8, 10, 11, 12, and 14.

### Affected Areas

**1. Section 8 — Salary reference notes (lines ~2535-2538)**
Three hardcoded EN-only paragraphs about Skogsavtalet references. Need `bl()` wrapping with translations added.

**2. Section 8 — Payment method description (line ~2575)**
Hardcoded EN-only paragraph about payment on the 25th of each month. Needs `bl()`.

**3. Section 8 — "Piece-work pay / Ackordslön" in salary prompt modal (line ~2648)**
Already uses `bl()` in the main section but hardcoded in the modal at line 2648.

**4. Section 10 — Social Security (lines ~2823-2847)**
The entire section is hardcoded EN/SV. Card title, two paragraphs of legal text, and six bullet points of insurance types all need `bl()`.

**5. Section 11 — Miscellaneous (lines ~2875, 2880, 2886)**
Card title, description, and placeholder are hardcoded EN/SV. Need `bl()`.

**6. Section 12 — Notes (lines ~2914-2971)**
The entire Notes section is hardcoded EN/SV. Card title, six numbered legal notes, and three additional legal paragraphs all need `bl()`.

**7. Section 14 — Signing (lines ~3268-3341)**
Multiple hardcoded strings:
- "Contract has X missing required field(s)" (line 3268)
- "...and X more" (line 3272)
- "Please go back and complete..." (line 3274)
- "Send for E-Signing / Skicka för e-signering" (line 3285)
- "Preparing signing..." (line 3283)
- "Signing link (fallback)" (line 3295)
- "Copy" button (line 3298)
- "Open Signing Page" (line 3307)
- "Opens the actual signing page..." (line 3310)
- "Employee has signed..." (line 3321)
- "Employer Signature" (line 3324)
- "Saving..." (line 3328)
- "Contract Fully Signed" (line 3338)
- "Both parties have signed..." (line 3340-3341)

### Changes

**`src/lib/form-translations.ts`**
Add all missing translation keys to `FORM_LABELS_RO`, `FORM_LABELS_TH`, and `FORM_LABELS_UK` for:
- Section 10 social security card title, legal paragraphs, and all six insurance line items
- Section 11 miscellaneous card title and helper text
- Section 12 notes: all six numbered clauses, three additional legal paragraphs
- Section 8 salary reference notes and payment terms paragraph
- Section 14 signing: all status messages, button labels, and helper text
- Deduction type labels (Rent/Accommodation, Company Car Usage, Travel Costs, Immigration Process Fees, Other Deduction)

**`src/components/dashboard/ContractDetailsStep.tsx`**
Replace all hardcoded EN/SV strings identified above with `bl()` calls, using the English text as the lookup key and Swedish as the fallback.

### Scope
This is a large but mechanical change: approximately 40-50 new dictionary entries per language (RO, TH, UK) and roughly 30 `bl()` wrapper insertions in ContractDetailsStep.tsx.

### Result
Every visible string in the contract wizard — across all 14 sections plus scheduling — will be fully translated for all five supported language modes (EN/SE, SE, RO/SE, TH/SE, UK/SE).

