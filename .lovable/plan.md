

## Plan: Auto-fill Birth Country & Citizenship from Address Country

### Problem
When the user selects an address country (e.g. Sweden or Poland), the "Country of Birth" and "Citizenship" fields remain empty, requiring manual selection.

### Fix
In `src/components/onboarding/OnboardingWizard.tsx`, update the address country `onValueChange` handler (line 975) to also set `countryOfBirth` and `citizenship` when they are currently empty.

**Before:**
```typescript
onValueChange={(v) => updateField("country", v)}
```

**After:**
```typescript
onValueChange={(v) => {
  updateField("country", v);
  if (!formData.countryOfBirth) updateField("countryOfBirth", v);
  if (!formData.citizenship) updateField("citizenship", v);
}}
```

This mirrors the existing pattern already used between `countryOfBirth` ↔ `citizenship` (lines 1074-1075, 1087-1088) where selecting one auto-fills the other if empty. The auto-fill is non-destructive — it only applies when the target field is blank.

### File changed
- `src/components/onboarding/OnboardingWizard.tsx` (1 line → 5 lines)

