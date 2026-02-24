

# Reorder Section 3: "Number of Job Types" Selector First

## Summary
Move the "Number of Job Types" selector to the top of Section 3 (right after "Main Duties"), and make it a gatekeeper: nothing below it (job type inputs, experience levels) appears until a selection is made. This removes confusion about how many job types to fill in.

## Changes

### File: `src/components/dashboard/ContractDetailsStep.tsx`

**1. Change default state for `numberOfJobTypes`**
- Change from `"1"` to `""` (empty string) so no selection is pre-made
- Update the type from `"1" | "2" | "3"` to `"" | "1" | "2" | "3"`

**2. Move the "Number of Job Types" selector block (lines 1322-1343) to right after "Main Duties" (after line 1269)**
- Place it immediately below the "Employed as / Main Duties" field
- Add a red validation highlight (same destructive border style) when no selection has been made, prompting the user to choose
- Keep the bilingual helper text

**3. Conditionally show Job Type 1 + Experience Level 1**
- Wrap the existing Job Type 1 and Experience Level 1 fields (lines 1271-1320) so they only render when `numberOfJobTypes` is `"1"`, `"2"`, or `"3"` (i.e., not empty)
- This means: pick a number first, then the system reveals the corresponding inputs

**4. Job Types 2 and 3 remain conditional as they are**
- Job Type 2 appears when numberOfJobTypes is "2" or "3"
- Job Type 3 appears when numberOfJobTypes is "3"

**5. Update validation logic**
- Add `numberOfJobTypes` as a required field in `section3Missing` -- if empty, push "Number of Job Types"
- Keep existing validation for job types 1/2/3 and their experience levels

**6. Update `getFormData` restoration logic**
- When restoring from saved `form_data`, if `numberOfJobTypes` is not set but `jobType` exists, default to `"1"` (backward compatibility with existing drafts)
- Otherwise keep the saved value

## What the user will experience
1. Open Section 3 -- sees "Main Duties" field, then a red-highlighted "Number of Job Types" selector with no default
2. Selects "1" -- one pair of Job Type + Experience Level inputs appears
3. Selects "2" -- two pairs appear
4. Selects "3" -- three pairs appear
5. Cannot proceed without making a selection

