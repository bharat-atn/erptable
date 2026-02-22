

## Add Working Visa Upload to Onboarding Form

### What Changes

Add a second file upload field in the "ID / Passport Information" section for candidates who have a Swedish working visa/work permit. This will be optional (not all candidates need one).

### Updated Section Layout

The section will contain:

1. **ID / Passport upload** (existing, required) -- no changes
   - EN: "Please attach your valid EU ID or Passport"
   - SV: "Bifoga ditt giltiga EU-ID eller pass"

2. **Working Visa / Work Permit upload** (new, optional)
   - EN: "If applicable, please attach your Swedish Work Permit / Working Visa"
   - SV: "Om tillamligt, bifoga ditt svenska arbetstillstand / arbetsvisum"
   - Same drag-and-drop UI style as the ID upload
   - Accepted formats: JPG, PNG, PDF
   - No red validation border since it's optional

### Section Header Update

- EN: "ID / Passport & Work Permit Information"
- SV: "ID- / Pass- och arbetstillstandsinformation"

### Technical Details

**File: `src/components/onboarding/OnboardingWizard.tsx`**

- Add a new `workPermitFile` state prop to `OnboardingWizardProps` and corresponding `onWorkPermitFileChange` handler prop.
- Add a second file upload block inside the Section 4 `CollapsibleContent`, below the existing ID upload, with an "(Optional)" indicator on the label.
- The new upload uses its own `<input type="file">` with a distinct `id` (`work-permit-upload`).

**File: `src/pages/OnboardingPortal.tsx`**

- Add `workPermitFile` state alongside existing `uploadedFile`.
- Add `handleWorkPermitFileChange` handler.
- Pass both to `OnboardingWizard`.

**File: `src/components/dashboard/OnboardingPreview.tsx`**

- Add matching state and handler for the work permit file to keep the preview functional.
