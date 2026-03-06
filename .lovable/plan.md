

## Plan: Add eIDAS-Compliant Signing Metadata to E-Signing Flow

### Current State & Gap Analysis

The article you shared covers the **US ESIGN Act**. Since your business operates in Sweden/EU, the relevant law is **eIDAS** (EU Regulation 910/2014). Your current implementation qualifies as a **Simple Electronic Signature (SES)** under eIDAS, which is legally valid for employment contracts in Sweden. However, it's missing critical **evidentiary metadata** that strengthens legal enforceability.

**What's currently captured:** signature image, timestamp (`employee_signed_at`), token-based intent verification, audit log of contract changes.

**What's missing for robust SES under eIDAS:**
- Signer's IP address (proves who/where)
- User agent / device info (proves which device)
- Signing place and date entered by the signer (currently collected in UI but **never persisted to the database**)
- Explicit consent text (the exact confirmation wording the signer agreed to)
- A tamper-evident hash of the contract content at signing time

### Changes

**1. Add signing metadata columns to contracts table** (migration)

```sql
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS employee_signing_metadata jsonb,
  ADD COLUMN IF NOT EXISTS employer_signing_metadata jsonb;
```

Each metadata JSONB will store:
```json
{
  "ip": "203.0.113.42",
  "userAgent": "Mozilla/5.0 ...",
  "place": "Stockholm",
  "date": "2026-03-07",
  "consentText": "I have read and agree to the terms...",
  "contentHash": "sha256:abc123...",
  "signedAt": "2026-03-07T05:48:33Z"
}
```

**2. Update `upload-employee-signature` edge function**

- Accept `signingPlace`, `signingDate` from the request body
- Capture IP from request headers (`x-forwarded-for` or `cf-connecting-ip`)
- Capture user agent from request headers
- Compute SHA-256 hash of `form_data` JSON to create a tamper-evident content fingerprint
- Store all metadata in `employee_signing_metadata` column via updated `submit_employee_signature` RPC

**3. Update `submit_employee_signature` RPC**

Add `_signing_metadata jsonb` parameter:
```sql
CREATE OR REPLACE FUNCTION public.submit_employee_signature(
  _token text, _signature_url text, _signing_metadata jsonb DEFAULT '{}'
)
```
Persist metadata alongside the existing signature URL and timestamp.

**4. Update `submit_employer_signature` RPC**

Same pattern — add `_signing_metadata jsonb` parameter to capture employer's IP, user agent, place, date.

**5. Update `EmployerSigningDialog.tsx`**

Pass signing place, date, IP (from a lightweight IP detection call or just server-side), and user agent to the RPC.

**6. Update `ContractSigning.tsx` (employee side)**

Pass `signingPlace` and `signingDate` to the `upload-employee-signature` function call. The edge function handles IP/UA capture server-side.

**7. Update `ContractDocument.tsx` (display)**

Show the signing metadata (place, date) alongside each signature on the rendered contract, providing a complete audit trail visible on the document itself.

### eIDAS Compliance Notes

- **SES (Simple Electronic Signature):** Legally valid for employment contracts in the EU. Your implementation with intent verification (checkboxes), metadata capture, and audit logging meets this level.
- **AES/QES (Advanced/Qualified):** Would require certificate-based digital signatures (e.g., BankID in Sweden). This is a separate integration and not required for standard employment contracts under Swedish labor law.
- The metadata capture makes your SES **evidentially strong** — in case of dispute, you can prove intent, identity, timing, location, and document integrity.

### Files to change
- `supabase/migrations/[new].sql` — add metadata columns, update both RPCs
- `supabase/functions/upload-employee-signature/index.ts` — capture IP, UA, place, date, content hash
- `src/pages/ContractSigning.tsx` — pass place/date to edge function
- `src/components/dashboard/EmployerSigningDialog.tsx` — pass metadata to RPC
- `src/components/dashboard/ContractDocument.tsx` — display signing metadata

