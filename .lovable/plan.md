

# Contract Signing Flow Optimization

## Issues Identified

1. **PDF not rendering inline** -- The Code of Conduct iframe (`<iframe src="/documents/code-of-conduct-sv.pdf">`) does not display the PDF content on many browsers/devices (especially mobile). It shows a file icon or blank page instead of the actual document.

2. **Label styling still too faded/small** -- The `.field-label` is currently `0.55rem` with `0.72` opacity. The user wants labels slightly bigger and less faded.

3. **Signing error handling is destructive** -- When signing fails, `setError()` replaces the entire page with an unrecoverable error screen. The user loses all progress (CoC review, checkboxes, etc.) with no way to retry.

## Plan

### 1. Fix PDF Inline Rendering

Replace the bare `<iframe src="file.pdf">` with Google Docs Viewer as the primary renderer, which works across all browsers and devices:

```text
src = `https://docs.google.com/gview?embedded=true&url=${window.location.origin}${selectedCocLang.file}`
```

This renders the PDF directly in the iframe on all platforms. Keep the "Open in new tab" link as a fallback for users who prefer a full-screen view.

**File**: `src/pages/ContractSigning.tsx` (lines 216-221)

### 2. Optimize Label Styling

Adjust the `.field-label` CSS for better readability while maintaining the professional hierarchy:

- **Desktop**: Increase from `0.55rem` to `0.6rem`, opacity from `0.72` to `0.78`
- **Mobile**: Increase from `0.62rem` to `0.66rem`
- **Print**: Keep current `6.5pt` / `#888` (already good for print)

**File**: `src/index.css` (lines 149, 210-211)

### 3. Fix Error Handling in Signing Flow

Replace the destructive `setError()` pattern with a toast notification + inline error state so users can retry without losing progress:

- Add a `signingError` state (separate from the page-level `error`)
- Show error as an inline alert banner above the signature canvas
- Allow the user to clear the canvas and try again
- Only use the full-page error screen for truly unrecoverable errors (invalid token, expired link)

**File**: `src/pages/ContractSigning.tsx` (lines 71-101, 386-408)

### 4. Apply Same PDF Fix to SigningSimulation

Update `SigningSimulation.tsx` to use the same Google Docs Viewer approach for consistency.

**File**: `src/pages/SigningSimulation.tsx`

## Technical Details

### PDF Viewer Implementation
```text
Before:  <iframe src="/documents/code-of-conduct-sv.pdf" />
After:   <iframe src="https://docs.google.com/gview?embedded=true&url=https://erptable.lovable.app/documents/code-of-conduct-sv.pdf" />
```
The Google Docs Viewer renders PDFs reliably in all browsers. The published domain URL is used since Google needs a publicly accessible URL.

### Error Handling Change
```text
Before: catch (err) { setError(err.message) }  --> replaces entire page
After:  catch (err) { setSigningError(err.message) }  --> shows inline retry banner
```

### Files Modified
- `src/pages/ContractSigning.tsx` -- PDF viewer fix, error handling improvement
- `src/pages/SigningSimulation.tsx` -- PDF viewer fix (consistency)
- `src/index.css` -- Label size/opacity optimization
