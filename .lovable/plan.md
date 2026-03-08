

## Plan: Rebuild CSV Import to Match Onboarding Fields

### Problem
The current CSV template only has 8 basic columns (`first_name, last_name, middle_name, email, phone, city, country, status`), but the onboarding invitation collects much more data — preferred name, full address, birthday, citizenship, bank details, emergency contacts, Swedish ID numbers, etc.

### Solution
Rebuild the CSV import template and parsing to include all fields from the `PersonalInfo` schema used in the onboarding wizard.

**File: `src/components/dashboard/CsvImportDialog.tsx`**

**1. Expand the `ParsedRow` interface** to include all onboarding fields:
- `preferred_name`, `address1`, `address2`, `zip_code`, `state_province`
- `birthday`, `country_of_birth`, `citizenship`
- `mobile_phone`, `emergency_first_name`, `emergency_last_name`, `emergency_phone`
- `bank_name`, `bic_code`, `bank_account_number`, `bank_country`
- `swedish_coordination_number`, `swedish_personal_number`

**2. Update `validateRow`** to parse all new columns (with flexible header matching like `address_1`/`address 1`/`address1`) and add validation for:
- Birthday format (YYYY-MM-DD)
- Email format (already exists)
- Phone format (basic check)

**3. Update `downloadTemplate`** to generate a CSV header row with all fields and a sample row with realistic example data.

**4. Update `handleImport`** to store the extended fields in the `personal_info` JSONB column (matching the keys the onboarding wizard uses: `preferredName`, `address1`, `zipCode`, `birthday`, `countryOfBirth`, `citizenship`, `mobilePhone`, `bankName`, `bicCode`, `bankAccountNumber`, `emergencyFirstName`, `emergencyLastName`, `emergencyPhone`, etc.) alongside the top-level columns (`first_name`, `last_name`, `email`, `phone`, `city`, `country`).

**5. Update the preview table** to show a few more meaningful columns (name, email, country, birthday, bank) instead of just the current 5.

### CSV Template Columns (new)
```text
first_name,middle_name,last_name,preferred_name,email,address1,address2,zip_code,city,state_province,country,birthday,country_of_birth,citizenship,mobile_phone,bank_name,bic_code,bank_account_number,bank_country,emergency_first_name,emergency_last_name,emergency_phone,swedish_coordination_number,swedish_personal_number,status
```

### Files to edit
- `src/components/dashboard/CsvImportDialog.tsx` — full rebuild of template, parsing, validation, and insert logic

