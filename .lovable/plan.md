

## Plan: Store Raw CSV Data in Drafts

### Problem
Currently, drafts save headers, mappings, and mapped data — but **not the original CSV rows**. When loading a draft, users must re-upload the CSV file from disk. The user wants the CSV content stored in the system so drafts are fully self-contained.

### Current State
- `handleSaveDraft` explicitly strips `raw` from mapped data (line 607: "too large")
- `handleLoadDraft` restores rows with `raw: {}` and caps at step 2
- The `import_drafts` table has `mapped_data jsonb` but no column for raw CSV content
- The `raw_headers` column exists but raw row data is not persisted

### Approach
Store the original CSV rows (`csvRows`) in the draft alongside everything else. This makes drafts fully resumable without re-uploading.

### Changes

**1. Database migration — add `raw_csv_rows` column to `import_drafts`**
```sql
ALTER TABLE public.import_drafts
  ADD COLUMN raw_csv_rows jsonb DEFAULT '[]'::jsonb;
```
This stores the parsed CSV row objects (array of `{header: value}` objects). For typical imports (a few hundred rows, ~25 columns) this is well within Postgres JSONB limits.

**2. `src/hooks/useImportPresetsAndDrafts.ts`**
- Add `raw_csv_rows` to the `ImportDraft` interface
- Include `raw_csv_rows` in the `select` query
- Add `raw_csv_rows` to the `saveDraft` mutation (both insert and update)
- Add it to the mutation input type

**3. `src/components/dashboard/DataHandlingView.tsx`**
- **`handleSaveDraft`**: Include `csvRows` as `raw_csv_rows` in the save payload. Also keep the `raw` field in mapped data since we now have the source data.
- **`handleLoadDraft`**: Restore `csvRows` from `draft.raw_csv_rows`. Reconstruct `raw` references on mapped data. Allow resuming from the actual saved step (not capped at 2).
- **Upload step UI**: When drafts are listed, show a "Resume" button. When a draft with stored CSV data is loaded, skip the file upload and go straight to the mapping/washing step.

