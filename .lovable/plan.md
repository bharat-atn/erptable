

## Plan: Align CSV Import System Fields with Invitation Template Fields

### Problem
The CSV import mapping only has ~22 system fields, but the invitation/onboarding template defines additional fields that are missing — notably `address1`, `address2`, `stateProvince`, `countryOfBirth`, `emergencyFirstName`, `emergencyLastName`, `mobilePhone`, and `swedishPersonalNumber`/`swedishCoordinationNumber` (which exist but under different keys). The mapping should cover all fields that exist in the onboarding form so imported data is complete.

### Missing Fields
Fields in the invitation template but absent from `SYSTEM_FIELDS`:

| Template field_key | What to add |
|---|---|
| `address1` | Address Line 1 |
| `address2` | Address Line 2 |
| `stateProvince` | State / Province |
| `countryOfBirth` | Country of Birth |
| `emergencyFirstName` | Emergency Contact First Name |
| `emergencyLastName` | Emergency Contact Last Name |
| `mobilePhone` | Mobile Phone (currently mapped as generic "phone") |
| `work_permit_document` | Skip — file upload, not CSV-importable |

Also, the existing `address` field should be split into `address1` and `address2` to match the template, and `emergencyContact` should be split into `emergencyFirstName` and `emergencyLastName`.

### Changes — single file: `src/components/dashboard/DataHandlingView.tsx`

**1. Update `SYSTEM_FIELDS` array:**
- Replace `address` with `address1` (Address Line 1) and `address2` (Address Line 2)
- Add `stateProvince` (State / Province) to the address group
- Add `countryOfBirth` (Country of Birth) to the personal group
- Replace `emergencyContact` with `emergencyFirstName` and `emergencyLastName`
- Add `mobilePhone` as a separate field from `phone` (phone = landline/general, mobilePhone = mobile)

**2. Update `HEADER_ALIASES`:**
- Add aliases for new fields (e.g., `address_1` → `address1`, `state` → `stateProvince`, `province` → `stateProvince`, `country_of_birth` → `countryOfBirth`, etc.)
- Keep backward compatibility with `address` alias pointing to `address1`

**3. Update `proceedToWashing` mapping logic:**
- Map the new fields into the `MappedEmployee` personal_info object during the washing step

**4. Update `handleImport`:**
- Include the new fields in the `personalInfo` object that gets saved to `personal_info` JSONB on the employees table
- Map `address1` to the existing `address` column on the employees table (for backward compatibility with top-level column)

