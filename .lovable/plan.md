

## Plan: Send Contract as PDF Attachment via Email

### Problem
The contract email currently sends the contract as an HTML email body — not as a PDF attachment. It also omits the Code of Conduct and Schedule, which are legally required appendices. The user wants one compact PDF file attached to the email containing all three documents.

### Constraint: PDF Generation in Edge Functions
Generating a true PDF from complex HTML in a Deno edge function is not straightforward — there is no headless browser (Puppeteer) available, and libraries like `pdfkit` or `pdf-lib` require programmatic layout (not HTML-to-PDF). 

### Proposed Approach
Use a **self-contained HTML file attachment** that is optimized for A4 printing (using the existing `CONTRACT_PRINT_CSS`). This approach:
- Produces an identical visual output to the on-screen preview when opened and printed/saved-as-PDF
- Includes page breaks, A4 margins, serif fonts — all already defined
- Can be opened in any browser and immediately printed to PDF (Ctrl+P → Save as PDF)

The HTML file will contain **three sections**:
1. **The full employment contract** (§1–§13 + signatures) — exactly as rendered by `ContractDocument`
2. **Appendix A: Code of Conduct** — full text from `CodeOfConductViewer` content, matching the contract language
3. **Appendix B: Work Schedule** — fetched from `contract_schedules` table, rendered as a daily schedule table

### Technical Changes

**File: `supabase/functions/send-contract-email/index.ts`**

1. **Simplify the email body** — The HTML email becomes a short notification letter (cover message) with contract code, employee name, company, and a note that the full contract is attached.

2. **Build a self-contained HTML attachment** — Reuse the existing `buildContractEmailHtml` function output, but extend it to include:
   - **Appendix A**: Embed the full Code of Conduct text (all 28 sections) inline in the HTML, using the contract's language. The CoC content is already defined in `CodeOfConductViewer.tsx` — we replicate the relevant language's content in the edge function.
   - **Appendix B**: Query `contract_schedules` table for the contract's schedule rows. Render them as a styled table (date, day type, hours, start/end time).
   - Add page breaks between sections (`page-break-before: always`)

3. **Attach via Resend** — Use Resend's `attachments` array with `content` (base64-encoded HTML) and `filename` (e.g., `Employment-Contract-EC-26-EPM-001.html`):
   ```typescript
   attachments: [{
     content: btoa(fullHtmlDocument),
     filename: `Employment-Contract-${contractCode}.html`,
   }]
   ```

4. **Fetch schedule data** — Query `contract_schedules` for the contract ID, ordered by date, and render as a table in Appendix B.

5. **Code of Conduct content** — Embed the full CoC text for all 5 languages directly in the edge function (mirroring `CodeOfConductViewer.tsx`), selecting the correct language based on `fd.contractLanguage`.

### File Changes

| File | Change |
|------|--------|
| `supabase/functions/send-contract-email/index.ts` | Simplify email body to cover letter; build full contract+CoC+schedule HTML; attach as file via Resend attachments API; fetch schedule from DB |

### Note on PDF vs HTML
The attached `.html` file uses `@page { size: A4 }` CSS, so opening it in any browser and printing (Ctrl+P) produces an exact A4 PDF. If you later want native PDF generation, we would need to integrate an external PDF conversion API service, which would require an additional API key.

