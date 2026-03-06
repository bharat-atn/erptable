

## Plan: Fix Code of Conduct Display and Scroll-Gated Review

### Problems

1. **PDF not loading**: The Google Docs viewer iframe (`https://docs.google.com/gview?embedded=true&url=...`) is failing to render the PDF — the area appears blank.
2. **Review toggle visible too early**: The "Mark as reviewed" button and confirmation checkbox are shown before the user has scrolled through the document.

### Fix

**1. Replace Google Docs viewer with direct PDF embed**

Switch from `<iframe src="https://docs.google.com/gview?...">` to `<iframe src="/documents/code-of-conduct-sv.pdf">` (direct URL). Modern browsers have built-in PDF viewers that render PDFs natively in iframes without relying on a third-party service.

**2. Scroll-gated review flow**

Since we cannot detect scroll inside an iframe/PDF viewer (cross-origin restriction), the approach is:

- The sentinel `div` (`cocBottomRef`) stays below the iframe in the page flow. The user must scroll the page past the entire PDF viewer area for it to become visible — this is a reasonable proxy for "having seen the document."
- The "Mark as reviewed" button remains hidden (not just disabled) until the sentinel has been intersected.
- The CoC confirmation checkbox remains hidden until `cocReviewed` is true.

**3. Hide confirmation checkbox until reviewed**

Currently the CoC checkbox is shown but disabled. Change it to be completely hidden until `cocReviewed === true`.

### Files to change

- `src/pages/ContractSigning.tsx` — change iframe `src` to direct PDF URL, hide (not disable) review button and confirmation checkbox until conditions are met.

