

## Plan: Embed Code of Conduct PDF Inline via Google Docs Viewer

### Problem

In `ContractSigning.tsx` (line 359), the iframe loads the raw PDF file directly (`src={selectedCocLang.file}`). Most mobile browsers cannot render PDFs inline in iframes — they either show a blank page or trigger a download. `SigningSimulation.tsx` already uses Google Docs Viewer and works correctly.

### Fix — One-line change in `src/pages/ContractSigning.tsx`

**Line 359**: Change the iframe `src` from:
```
src={selectedCocLang.file}
```
to:
```
src={`https://docs.google.com/gview?embedded=true&url=${PUBLISHED_ORIGIN}${selectedCocLang.file}`}
```

This matches the working implementation in `SigningSimulation.tsx` (line 274). The Google Docs Viewer renders the PDF as scrollable HTML that works on all devices including mobile phones.

No other files need changes.

