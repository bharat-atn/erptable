

## Plan: Translate All Workflow Step Cards in Process Guide

### Problem
The Process Guide has three workflow sections (New Hire, Renewal, Termination) where step titles, descriptions, role labels, and status badges are hardcoded in English. The terminology cards and summary section already use `t()` correctly — these workflow cards were missed.

### Changes

#### 1. `src/lib/ui-translations.ts`
Add translation keys for:
- **Role labels** (3): `guide.role.hrManager`, `guide.role.candidate`, `guide.role.system`
- **New Hire steps** (4 titles + 4 descs): `guide.step.sendInvitation` (already exists as `guide.sendInvitation`), `guide.step.dataSubmission`, `guide.step.contractReview`, `guide.step.activation` — plus their `Desc` variants
- **Renewal steps** (5 titles + 5 descs): `guide.step.selectCandidate`, `guide.step.sendRenewalInvite`, `guide.step.dataVerification`, `guide.step.contractSigning`, `guide.step.reactivation`
- **Termination steps** (3 titles + 3 descs): `guide.step.terminationNotice`, `guide.step.exitProcessing`, `guide.step.archive`

Many of these keys already exist (e.g. `guide.sendInvitation`, `guide.dataSubmission`, etc.) — reuse those where possible, add missing ones.

#### 2. `src/components/dashboard/ProcessGuideView.tsx`
- Move the three step arrays (`newHireSteps`, `renewalSteps`, `terminationSteps`) **inside** the `ProcessGuideView` component so they have access to `t()`.
- Replace all hardcoded strings with `t()` calls.
- Pass translated role labels to `StepCard` instead of raw English constants.

### Files to modify
- `src/lib/ui-translations.ts` — Add ~20 new translation keys (en/sv/ro)
- `src/components/dashboard/ProcessGuideView.tsx` — Move step arrays inside component, wire `t()` calls

