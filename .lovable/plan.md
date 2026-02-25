

# Plan: Signing Page Improvements (4 items)

## 1. Fix Code of Conduct Language Switching

**Problem**: When the user selects a different language on the signing page, the iframe URL doesn't change because the Google Docs Viewer caches the previous URL. The iframe `src` needs a cache-busting key to force a re-render when the language changes.

**Fix** in `src/pages/ContractSigning.tsx`:
- Add a `key={cocLanguage}` prop to the `<iframe>` element so React destroys and re-creates it when the language changes, forcing a fresh load of the new PDF URL.

---

## 2. Add Mandatory Place & Date Fields Before Signing

**Problem**: The signing section has no "Place and Date" inputs. These are legally required and shown in the contract document template (see screenshot: "PLACE AND DATE / PLATS OCH DATUM").

**Changes** in `src/pages/ContractSigning.tsx`:
- Add two state variables: `signingPlace` (string) and `signingDate` (string, defaulting to today's date).
- Render two input fields (Place and Date) above the signature canvas, inside the signing area card.
- Update the `canSign` condition to also require `signingPlace` to be non-empty.
- Pass `signingPlace` and `signingDate` along with the signature submission (store in `form_data` or as part of the RPC call metadata).

**Changes** in `src/components/dashboard/EmployerSigningDialog.tsx`:
- Add the same Place & Date fields for the employer counter-signing flow.
- Store the employer's place and date alongside the employer signature.

---

## 3. Signature Redo/Reset Before Submission

**Current behavior**: The `SignatureCanvas` component already has a "Clear" button and a "Confirm Signature" button. Once "Confirm Signature" is clicked, `onSave` is called and the signature is immediately submitted to the database -- there is no preview/approval step.

**Changes** in `src/pages/ContractSigning.tsx`:
- Instead of calling `handleSign` directly from the `SignatureCanvas.onSave`, introduce an intermediate "preview" state.
- When the user clicks "Confirm Signature", store the data URL in state (`pendingSignature`) and show a preview of the signature image.
- Show two buttons: "Redo Signature / Gör om" (clears the preview and returns to the canvas) and "Submit Signature / Skicka in" (calls the actual `handleSign`).
- This gives the user a chance to review before the irreversible database submission.

Same pattern applied in `src/components/dashboard/EmployerSigningDialog.tsx` for the employer flow.

---

## 4. Default Employer Signature (Upload Feature)

**Purpose**: Allow HR managers to upload a default signature image (e.g., a scanned signature) so they don't need to draw it every time.

**Changes** in `src/components/dashboard/SettingsView.tsx`:
- Add a new "Default Signature" card section.
- Allow the HR manager to upload a small PNG/JPG image of their signature.
- Store the uploaded image in the `signatures` storage bucket under `employer-default/` path.
- Save the public URL reference in a new `employer_default_signature` column in the `profiles` table (or use a simple key-value approach in a settings table).

**Database migration**: Add `default_signature_url TEXT` column to the `profiles` table.

**Changes** in `src/components/dashboard/EmployerSigningDialog.tsx`:
- Fetch the current user's `default_signature_url` from `profiles`.
- If a default signature exists, show it as an option: "Use saved signature" button alongside the draw canvas.
- Clicking "Use saved signature" skips the canvas and uses the stored URL directly (still shows preview for confirmation).

---

## Files Modified
- `src/pages/ContractSigning.tsx` -- Fix language switching, add place/date, add signature preview step
- `src/components/dashboard/EmployerSigningDialog.tsx` -- Add place/date, signature preview, default signature option
- `src/components/dashboard/SettingsView.tsx` -- Add default signature upload card
- Database migration -- Add `default_signature_url` to `profiles` table

