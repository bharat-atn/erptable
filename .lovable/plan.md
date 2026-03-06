

## Plan: Fix CoC Scroll-Gated Confirmation + Replace Logo on Contract Pages

### Problem 1: CoC Confirmation Appears Immediately

**Root cause**: The scrollable container has `max-h-[500px]` and the iframe inside has `height: 900px`. The sentinel `div` (`cocBottomRef`) is placed *after* the iframe inside the container. However, the browser renders the iframe as a replaced element with a fixed height of 900px — and the sentinel `<div class="h-1">` sits at pixel 901 inside the scrollable container. This should work in theory.

The real issue is likely a **timing problem**: the `IntersectionObserver` is created in a `useEffect` that runs when the component mounts, but the `cocScrollContainerRef` and `cocBottomRef` may not be attached yet when the language is first selected (the refs are inside a conditional render `{selectedCocLang && ...}`). When `cocLanguage` changes, React re-renders, the refs attach, and the effect runs — but at that point the sentinel might momentarily be in view before the iframe content loads (the iframe starts at 0 height and expands).

**Fix**: Instead of relying on `IntersectionObserver` (which has proven unreliable across multiple attempts), switch to a simple `scroll` event listener on the container. Check if `scrollTop + clientHeight >= scrollHeight - threshold`. This is deterministic and cannot fire prematurely because:
- Before scrolling: `scrollTop` is 0, `clientHeight` is 500px, `scrollHeight` is 901px. `0 + 500 < 901 - 20` = true, so not at bottom.
- After scrolling to bottom: `scrollTop` ~= 401, `401 + 500 >= 901 - 20` = true.

Changes:
- Remove `cocBottomRef` sentinel div and its `IntersectionObserver` useEffect
- Add a `handleCocScroll` callback on the scrollable container's `onScroll` event
- When `scrollTop + clientHeight >= scrollHeight - 30`, set `cocScrolledToBottom = true`
- Reset `cocScrolledToBottom` to false when language changes (already done)

### Problem 2: Replace Logo on Contract Pages

The user uploaded `Logo_Ljungan_Forestry.jpg` and wants it used on contract-related pages instead of the current `ljungan-forestry-logo.png`.

- Copy uploaded file to `src/assets/ljungan-forestry-logo-new.jpg`
- Update imports in contract pages only:
  - `src/pages/ContractSigning.tsx`
  - `src/pages/SigningSimulation.tsx`
  - `src/pages/ScheduleView.tsx`

### Files to Change

| File | Changes |
|------|---------|
| `src/pages/ContractSigning.tsx` | Replace IntersectionObserver with scroll event listener; remove sentinel div; update logo import |
| `src/pages/SigningSimulation.tsx` | Same scroll event fix; update logo import |
| `src/pages/ScheduleView.tsx` | Update logo import only |
| `src/assets/ljungan-forestry-logo-new.jpg` | Copy uploaded logo file |

