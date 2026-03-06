

## Plan: Remove "Reviewed" Badge + Fix Missing Signing Area

### Two Issues

1. **"✓ Reviewed / Granskad" badge on schedule section** (line 507-511) — still showing. Remove it entirely.

2. **Signing area not visible** — The `canSign` condition (line 270) requires `cocConfirmed && contractConfirmed && signingPlace.trim().length > 0`. But the **CoC confirmation checkbox only appears after scrolling** (`cocScrolledToBottom`), and the **contract confirmation checkbox + place/date fields are inside the signing area card** which is always visible but placed *after* the schedule section. The user likely hasn't scrolled far enough or hasn't completed all steps. The real UX problem: the signing canvas is hidden behind a checklist when `canSign` is false, and the checklist doesn't clearly guide the user.

### Changes (`src/pages/ContractSigning.tsx`)

1. **Remove the "Reviewed / Granskad" text** on lines 507-511 (the blue check badge after schedule).

2. **Make the signing section always show the signature canvas** — but keep it disabled until conditions are met. Instead of hiding the `SignatureCanvas` behind the checklist, always render it with `disabled={!canSign}`. Show the missing-steps checklist *above* the canvas as guidance, not as a replacement. This way the user always sees where to sign.

3. **Include `scheduleReviewed` in `canSign`** when schedule data exists — currently it's missing from the condition (line 270), which may have been a regression.

### Summary of line changes

| Lines | Change |
|-------|--------|
| 270 | Add `scheduleReviewed` to `canSign` when `schedData` exists |
| 507-511 | Remove the "Reviewed / Granskad" badge entirely |
| 597-675 | Restructure: always show SignatureCanvas (disabled when `!canSign`), show checklist as guidance above it |

