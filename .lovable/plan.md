
Goal: restore an in-app, scrollable Code of Conduct (no forced download), provide real Ukrainian content, and enforce ISO date format everywhere in signing.

1) Replace the current CoC iframe strategy (Google viewer)
- Build a dedicated `CodeOfConductViewer` component and use it in both:
  - `src/pages/ContractSigning.tsx`
  - `src/pages/SigningSimulation.tsx`
- Remove the external viewer URL and remove/disable the “Open in new tab” download-style action in signing flow.
- Keep the CoC inside the existing fixed-height scroll container so phone users can scroll directly in-app.

2) Make Ukrainian CoC actually Ukrainian (not English placeholder)
- Add a Ukrainian translated CoC content source (based on the English text) and wire it to the `uk` language option.
- Render Ukrainian content in the same CoC box/component as other languages, so behavior is identical.
- Keep language card label as `Українська / Ukrainian`.

3) Fix ISO date compliance end-to-end (YYYY-MM-DD)
- Frontend input hardening:
  - `src/pages/ContractSigning.tsx`: keep date as text, enforce `YYYY-MM-DD` pattern, validate before allowing submit.
  - `src/components/dashboard/EmployerSigningDialog.tsx`: change employer signing date from native `type="date"` to ISO-controlled text input with same validation.
- Display hardening:
  - `src/components/dashboard/ContractDocument.tsx`: format signing metadata dates with ISO formatter (`fmtDate`) before rendering under “Place and Date”.
  - Replace any `toLocaleDateString()` in signing-related summaries with ISO format.
- Backend hardening:
  - `supabase/functions/upload-employee-signature/index.ts`: reject non-ISO signingDate.
  - Add a migration to update signing RPC validation (`submit_employee_signature`, `submit_employer_signature`) so metadata date must match `^\d{4}-\d{2}-\d{2}$` (or null), preventing bad formats from being persisted.

4) Consistency + regression coverage
- Ensure both signing pages use the same CoC viewer path and same language mapping.
- Verify no CoC step in signing requires downloading to proceed.
- Verify existing stored signatures still render safely (formatted display), while new signatures are strictly validated.

Technical details
- No new tables needed; only RPC/function validation update via migration.
- No auth model changes.
- CoC viewer change is UI-only but applied in both signing entry points to prevent drift.
- ISO enforcement is layered: UI validation + edge function validation + RPC validation + normalized rendering.

Acceptance criteria
- On mobile, selecting any CoC language shows readable in-box content with scroll; no download prompt required to read.
- Ukrainian CoC displays Ukrainian text in the same CoC viewer area.
- Signing date fields and displayed signature “Place and Date” are always `YYYY-MM-DD`.
- Non-ISO dates are blocked before save and rejected server-side if bypassed client-side.
