

## Improve HTML Attachment Formatting

### Problem
The attached HTML document has no padding or max-width for **screen viewing**. The `@page` margins only apply when printing. When opened in a browser (or previewed on a phone), content runs edge-to-edge with no whitespace.

### Fix
Update the `printCss` in `supabase/functions/send-contract-email/index.ts` to add:

1. **Body padding and max-width for screen** — Add `padding: 24mm 18mm` and `max-width: 210mm; margin: 0 auto` to `body` so the document is centered and padded when viewed on screen
2. **Contract doc padding** — Add `padding: 0 4mm` to `.contract-doc` for inner breathing room
3. **Schedule table improvements** — Add alternating row shading, better cell padding, and compact font sizing so the long schedule table looks cleaner
4. **CoC section spacing** — Improve heading and body spacing in the Code of Conduct appendix for readability
5. **Print media query override** — Use `@media print` to reset body padding to 0 (since `@page` margins handle print spacing)

### Technical Details

**File:** `supabase/functions/send-contract-email/index.ts` (lines 289-338)

Update the `printCss` constant:
- `body`: add `padding: 20mm 16mm; max-width: 210mm; margin: 0 auto;`
- `@media print { body { padding: 0; max-width: 100%; } }` to keep print layout clean
- `.contract-doc`: add `padding: 0 2mm`
- `.coc-heading`: increase margin-top to `12px`, add `border-bottom: 1px solid #ddd; padding-bottom: 2px`
- `.coc-body`: increase line-height to `1.5`, add left margin for bullet points
- `.schedule-table td`: increase padding to `3px 8px`
- `.schedule-table tr:nth-child(even)`: subtle alternating row background `#fafafa`

Single file change, then redeploy the edge function.

