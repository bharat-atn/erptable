

## Plan: Production-Ready Signing Flow — Job Types in §3 + Stability Fixes

### Problem 1: §3 Only Shows First Job Type

When 2 or 3 job types are selected in the wizard (e.g., "Planting" + "Brush clearing"), the contract document §3 (Position & Duties) only renders the first job type. The second screenshot shows 2 job types configured, but §3 only displays one. All job types with their experience levels should appear in §3.

**Fix in `src/components/dashboard/ContractDocument.tsx`** (lines 200-229):

Replace the single `fd.jobType` / `fd.experienceLevel` fields with a loop that renders all configured job types, similar to how §7 already iterates over them. When `numberOfJobTypes` is "2" or "3", render each job type with its experience level as sub-rows in §3.

### Problem 2: SigningSimulation Missing Place/Date + signingMetadata

`SigningSimulation.tsx` (line 121) calls `upload-employee-signature` without `signingPlace` or `signingDate` — the metadata fields are missing entirely. This means internal simulation signing produces incomplete audit trails.

**Fix in `src/pages/SigningSimulation.tsx`**: Add `signingPlace` and `signingDate` state variables (same as ContractSigning.tsx), add Place/Date input fields in the signing section, and pass them in the edge function call.

### Problem 3: SigningSimulation CoC Still Has Dead Code

`SigningSimulation.tsx` still imports and references `AVAILABLE_COC_PDFS`, `PUBLISHED_ORIGIN`, `ExternalLink` — dead code from the old iframe approach that should be cleaned up.

### Problem 4: SigningSimulation Missing Schedule Review from form_data

When no `contract_schedules` rows exist in the DB but `schedulingData` exists in `form_data`, `SigningSimulation.tsx` shows the schedule section but has no generated day-by-day view (it only uses DB rows). `ContractSigning.tsx` generates schedule days from `form_data` client-side. Align both pages.

### Files to Edit

| File | Change |
|------|--------|
| `src/components/dashboard/ContractDocument.tsx` | §3: Render all job types (1-3) with experience levels, not just the first |
| `src/pages/SigningSimulation.tsx` | Add Place/Date fields, pass to edge function; clean dead code; generate schedule from form_data when DB rows empty |
| `src/pages/ContractSigning.tsx` | Minor: no functional changes needed (already correct) |

### Implementation Details

**ContractDocument.tsx §3 change:**
```tsx
// Replace single jobType/experienceLevel with loop
{(() => {
  const numJobs = String(fd.numberOfJobTypes || "1");
  const jobs = [
    { idx: 1, jt: fd.jobType, el: fd.experienceLevel },
    ...((numJobs === "2" || numJobs === "3") ? [{ idx: 2, jt: fd.jobType2, el: fd.experienceLevel2 }] : []),
    ...(numJobs === "3" ? [{ idx: 3, jt: fd.jobType3, el: fd.experienceLevel3 }] : []),
  ];
  return jobs.map(({ idx, jt, el }) => (
    <div key={idx} className="field-grid-2">
      <div className="field">
        <span className="field-label">{bl(CL.jobType, lang)} {numJobs !== "1" ? idx : ""}</span>
        <span className="field-value">{jt || "—"}</span>
      </div>
      <div className="field">
        <span className="field-label">{bl(CL.experienceLevel, lang)} {numJobs !== "1" ? idx : ""}</span>
        <span className="field-value">{el || "—"}</span>
      </div>
    </div>
  ));
})()}
```

**SigningSimulation.tsx changes:**
- Import `format` from date-fns, add `signingPlace`/`signingDate` state
- Add Place/Date inputs before signature canvas
- Pass `signingPlace` and `signingDate` to edge function body
- Remove unused imports (`PUBLISHED_ORIGIN`, `AVAILABLE_COC_PDFS`, `ExternalLink`)
- Add client-side schedule generation fallback when DB rows are empty but `schedulingData` exists (reuse the same `generateSchedule` logic from ContractSigning.tsx or extract shared utility)

