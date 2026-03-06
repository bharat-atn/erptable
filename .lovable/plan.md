

## Plan: Fix Missing Signature Canvas on Contract Signing Page

### Root Cause

The `canSign` condition requires `scheduleReviewed` to be true when schedule data exists, but the generic fallback message doesn't indicate which specific condition is unmet. On mobile, the "Mark as reviewed" button in the Schedule Appendix section is easy to miss.

### Fix (single file: `src/pages/ContractSigning.tsx`)

**1. Replace generic message with specific missing-condition checklist**

Instead of:
> "Please review the Code of Conduct, confirm both checkboxes, and enter the signing place to enable signing."

Show a checklist of conditions with check/cross icons:
- ✓/✗ Review Code of Conduct
- ✓/✗ Confirm contract terms
- ✓/✗ Confirm Code of Conduct
- ✓/✗ Review Schedule (only shown if schedule data exists)
- ✓/✗ Enter signing place

This tells the user exactly what's blocking them.

**2. Auto-review schedule when user scrolls to bottom of schedule table**

Add an `IntersectionObserver` on the schedule section's "Mark as reviewed" button area. When it becomes visible, auto-set `scheduleReviewed = true` after a short delay (e.g., 2 seconds). This mirrors the CoC pattern where the iframe `onLoad` auto-sets `cocReviewed`.

Alternatively (simpler): keep the manual button but make it more prominent — use a primary-colored button with larger text, and add a pulsing indicator if the schedule section hasn't been reviewed yet while other conditions are met.

**3. Add scroll-to-schedule link in the checklist**

If the schedule isn't reviewed, the checklist item becomes a clickable link that scrolls up to the Schedule Appendix section, using a `ref` and `scrollIntoView`.

### Estimated changes

~30 lines modified in the signing area section (lines 607-613) to render the condition checklist, plus ~10 lines to add a ref on the schedule card and a scroll handler.

