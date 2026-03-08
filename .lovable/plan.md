

## Plan: Add Swedish Personal Number and Coordination Number to Data Handling

### Problem
1. The Data Handling CSV import is missing "Swedish Personal Number" and "Swedish Coordination Number" as mappable fields — these exist in the onboarding wizard and CsvImportDialog but were omitted from DataHandlingView.
2. The aliases `personnr` and `personnummer` are **incorrectly mapped** to `employee_code` — they should map to `swedishPersonalNumber` instead.

### Changes (single file: `src/components/dashboard/DataHandlingView.tsx`)

**1. Add two fields to `SYSTEM_FIELDS` (~line 71)**
```
{ key: "swedishPersonalNumber", label: "Swedish Personal Number / Personnummer", group: "personal" }
{ key: "swedishCoordinationNumber", label: "Swedish Coordination Number / Samordningsnummer", group: "personal" }
```

**2. Fix aliases in `HEADER_ALIASES` (~line 100)**
- Move `personnr` and `personnummer` from `employee_code` to `swedishPersonalNumber`
- Add aliases: `personal_number`, `samordningsnummer`, `coordination_number`, `swedishpersonalnumber`, `swedishcoordinationnumber`

**3. Ensure values flow into `personalInfo` during mapping**
- These are `personal` group fields, so they should already be stored in the `personalInfo` JSONB sub-object during the mapping step. Verify and fix if needed.

