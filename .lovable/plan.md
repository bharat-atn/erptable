

## Plan: Fix CoC Scroll-Gated Confirmation and Ukrainian PDF Issue

### Two Problems

1. **Confirmation appears immediately** — The sentinel `div` (`cocBottomRef`) is placed right after the iframe in normal document flow. Since the iframe has a fixed CSS height (600-700px), the sentinel is already in the viewport when the CoC section loads. The `IntersectionObserver` fires instantly. The user never has to scroll past the document.

2. **Ukrainian Code of Conduct PDF missing** — The file `code-of-conduct-uk.pdf` is referenced in code but does not exist in `public/documents/`. Only `sv`, `en`, `ro`, and `th` PDFs exist. When selected, the iframe shows "No preview available."

### Solution

**Problem 1: Wrap the iframe in a scrollable container and put the sentinel inside it**

Instead of relying on page-level scroll (which doesn't work because the iframe has a fixed height and the sentinel is immediately visible), place the iframe inside a scrollable container with a constrained height. The sentinel goes *below* the iframe content inside that scrollable container, so it only becomes visible when the user scrolls the container to the bottom.

Approach:
- Wrap the iframe in a `div` with `overflow-y: auto` and a max-height (e.g. `500px`)
- Give the iframe a larger height than the container (e.g. `800px` or `900px`) so the container actually scrolls
- Place the `cocBottomRef` sentinel at the bottom of this scrollable div, after the iframe
- The `IntersectionObserver` uses `root: scrollContainerRef.current` so it only fires when the sentinel scrolls into view within the container
- The confirmation checkbox remains hidden until `cocScrolledToBottom` is true

**Problem 2: Block Ukrainian until PDF exists**

- When the user selects Ukrainian, show a message explaining the PDF is not yet available and disable/hide the confirmation checkbox
- Add a check: if the selected language's PDF file doesn't exist (we can check against a known list), show a "Document not available" alert instead of the iframe
- The user chose "Block until PDF exists" — so we show an explicit message and prevent confirmation

### Files to Change

**`src/pages/ContractSigning.tsx`**:
- Add a `scrollContainerRef` for the CoC scrollable wrapper
- Wrap iframe in scrollable container div with constrained height
- Move `cocBottomRef` inside the scrollable container, below the iframe
- Update `IntersectionObserver` to use `root: scrollContainerRef.current`
- Add Ukrainian PDF availability check — show alert instead of iframe when PDF is missing
- Hide confirmation checkbox when PDF is unavailable

**`src/pages/SigningSimulation.tsx`**:
- Same Ukrainian PDF availability fix (show "not available" message)
- This file uses Google Docs viewer and `onLoad` for review — apply same scrollable-container pattern for consistency

**`src/components/dashboard/CodeOfConductStep.tsx`**:
- No iframe here (just language selection), no changes needed

### Available PDFs
```
sv, en, ro, th  ← exist
uk              ← missing
```

