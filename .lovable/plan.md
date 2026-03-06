

## Plan: Fix CoC Review Flow — Scroll-Gated Confirmation Below PDF

### Problems

1. **"Reviewed" badge appears immediately** — The sentinel `div` is placed right after the iframe in the normal page flow, so the `IntersectionObserver` fires as soon as the CoC section scrolls into view, not after the user has scrolled through the entire PDF.
2. **CoC confirmation checkbox is in the wrong place** — It's in the signing section below, separated from the CoC. It should be directly under the Code of Conduct document.
3. **Auto-toggle concern** — The "Reviewed" status appears automatically via the observer; it should require a manual action.

### Solution

**Move the sentinel and confirmation below the PDF, and increase the iframe height so the user must scroll past it.**

1. **Increase iframe height** to `700px` (or similar) so the CoC section is tall enough that the sentinel at the bottom won't be visible until the user actively scrolls down past the document.

2. **Move the CoC confirmation checkbox** from the signing confirmations section (line ~547) to directly below the sentinel in the CoC card (after line 372). This checkbox will be:
   - **Hidden** until `cocScrolledToBottom` is true
   - **Manual toggle only** — no auto-checking; user must click it
   - Replace the current "Mark as reviewed" button with this checkbox directly

3. **Remove the separate "Mark as reviewed" button** (lines 375-392) and the `cocReviewed` state. Instead, `cocConfirmed` becomes the single gate: hidden until scrolled, manually toggled by the user.

4. **Remove the "Reviewed / Granskad" badge** from the header area — the confirmation checkbox below the document is sufficient.

5. **Update `canSign`** — replace `cocReviewed && cocConfirmed` with just `cocConfirmed`.

### Files to change

- `src/pages/ContractSigning.tsx`

