

## Plan: Fix Bank Radio Buttons Not Clickable

### Root Cause

The bank names (e.g., "BANCA TRANSILVANIA S.A.", "ING BANK N.V., AMSTERDAM - BUCHAREST BRANCH") are used directly as HTML `id` attributes and `htmlFor` targets on lines 1312-1313:

```tsx
<RadioGroupItem value={bank} id={bank} />
<Label htmlFor={bank}>{bank}</Label>
```

HTML `id` attributes with spaces, commas, periods, and special characters are invalid. The `htmlFor`-to-`id` link breaks, so clicking the label text (the large clickable area) does nothing. Only the tiny 16×16px radio circle would respond — and that's nearly impossible to hit on mobile.

This has technically always been fragile, but the previous rendering logic may have masked it. The fix is to sanitize the `id` values and also add a direct click handler on the label row as a safety net.

### Changes

**File: `src/components/onboarding/OnboardingWizard.tsx`**

1. **Sanitize IDs**: Create a small helper like `const bankId = (name: string) => "bank-" + name.replace(/[^a-zA-Z0-9]/g, "-")` and use it for both `id` and `htmlFor` on bank radio items (lines 1310-1314).

2. **Same fix for "other-bank"**: Already has a clean id — no change needed there.

This is a one-file, ~5-line change.

