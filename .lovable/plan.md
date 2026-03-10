

## Diagnosis

The clock-in/clock-out camera failure on iPhone stems from two issues in `EmployeeHubDashboardView.tsx`:

1. **Two-tap problem on iOS Safari**: The user taps "Clock In" (opens dialog + fetches GPS), then must tap a photo slot to start the camera. On iOS Safari, the second tap inside a Radix Dialog can lose the "user gesture" context required by `getUserMedia`, especially when the dialog just animated in.

2. **Overconstrained camera**: The `getUserMedia` call specifies `width: { ideal: 640 }, height: { ideal: 480 }` which can throw `OverconstrainedError` on some iOS devices with non-standard aspect ratios. When this fails, the fallback error message is generic.

## Plan

### File: `src/components/dashboard/employee-hub/EmployeeHubDashboardView.tsx`

**Change 1 — Start camera immediately on dialog open (single gesture)**

Instead of opening the dialog first and waiting for the user to tap a photo slot, start the camera as the very first `await` inside `handleOpenDialog` — directly in the button click handler chain. This preserves the user-gesture context that iOS Safari requires.

```text
Current flow:  Tap Clock In → open dialog + fetch GPS → (user taps slot) → getUserMedia
New flow:      Tap Clock In → getUserMedia (selfie) → open dialog + fetch GPS in parallel
```

- Move `getUserMedia` to be the FIRST await in `handleOpenDialog`, before any location fetch or state updates
- Open the dialog after the stream is acquired
- Fetch location in parallel (non-blocking)

**Change 2 — Simplify camera constraints with fallback**

Remove `width`/`height` ideals from the initial `getUserMedia` call. If the first attempt fails with `OverconstrainedError`, retry with bare `{ video: true }` as a last resort.

**Change 3 — Add retake capability**

Currently, once a photo is captured, the slot becomes non-clickable (`!photos.selfie && startCamera`). Add a small "retake" button on captured photos so users can redo a bad shot without closing the dialog.

**Change 4 — Better error messages**

Show device-specific guidance in toast messages (e.g., "On iPhone, go to Settings → Safari → Camera → Allow") instead of generic errors. Link to the existing `CameraPermissionHelp` dialog automatically on `NotAllowedError`.

### No database or schema changes needed.

