

## Plan: Replace Auto-Screenshot with Manual Screenshot Instructions

The `html2canvas` library has inherent limitations with dark themes, CSS filters, and complex rendering that make reliable screenshots difficult. Instead of trying to fix it further, we'll remove the auto-capture and guide users to take their own screenshots.

### Changes

**`src/components/dashboard/IssueReportDialog.tsx`**

1. **Remove `html2canvas`** — delete the import and the `captureScreenshot()` function entirely
2. **Remove auto-capture** — remove the `useEffect` that calls `captureScreenshot` on dialog open
3. **Remove `screenshotBlob`/`screenshotPreview` state** and the screenshot preview section
4. **Add instruction banner** at the top of the dialog body with platform-specific shortcut instructions:
   - Mac: `⇧ ⌘ 4` — drag to select area, screenshot saves to clipboard/desktop
   - Windows: `Win + Shift + S` — opens Snipping Tool to select area
   - Then: "Attach the screenshot below using the Attach Image button"
5. **Keep the existing attachment section** — users attach their manual screenshots the same way they attach other images today
6. **Upload logic stays the same** — attachments upload to `issue-screenshots` storage bucket

### Result
- No more dark/broken auto-screenshots
- Users get clear, high-quality screenshots they control
- Simpler code with no `html2canvas` dependency (can be removed from package.json)

