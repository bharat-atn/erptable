

## Sign-In Page Refresh

### Changes to `src/components/auth/AuthForm.tsx`

1. **Replace logo**: Copy the uploaded `ERPTable_logo.png` to `src/assets/erp-table-logo.png` and import it instead of `ljungan-forestry-logo.png`.

2. **Logo styling**: Display the logo as a square/rectangular image (no rounded-full), larger size (~h-20 or h-24), so the full "ERP TABLE" wordmark is visible.

3. **Remove text below logo**: Remove the `<h1>ERP Table</h1>` heading — the logo already contains the brand name. Keep only `<p>Application Launcher</p>` below the logo (or remove it per preference — user said "just keep the logo there", so remove "Application Launcher" text too).

4. **Remove footer**: Change the footer from "Ljungåverk Forestry AB · Secure Enterprise Login" to just "Secure Enterprise Login".

5. **Make the card bigger**: Increase `max-w-sm` to `max-w-md`, bump button height from `h-12` to `h-14`, increase card padding, and make the overall layout feel more spacious and polished.

6. **Spice up the design**: Add a subtle gradient border or glow effect on the card, slightly larger text on the Google button, and more generous spacing throughout.

### Files Changed

| File | Change |
|------|--------|
| `src/assets/erp-table-logo.png` | New file (copied from upload) |
| `src/components/auth/AuthForm.tsx` | Replace logo, remove heading text, enlarge card, update footer |

