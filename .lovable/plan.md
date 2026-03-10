

## Problem

The contract form (Sections 2.1 and 2.2) uses a hardcoded `COUNTRIES` array with only 11 countries (line 100-103 of `ContractDetailsStep.tsx`). When an employee submits onboarding data with a country like "India", the contract form's dropdown cannot display or select it.

The onboarding wizard correctly uses `SearchableCountrySelect` which pulls from the full `countries` list in `src/lib/countries.ts` (250+ countries).

## Plan

**Replace all three country `<Select>` dropdowns** in `ContractDetailsStep.tsx` (Country, Country of Birth, Citizenship) with the existing `SearchableCountrySelect` component.

### Changes

1. **`src/components/dashboard/ContractDetailsStep.tsx`**
   - Import `SearchableCountrySelect` from `@/components/ui/searchable-country-select`
   - Remove the hardcoded `COUNTRIES` array (lines 100-103)
   - Replace the `<Select>` for **Country** (lines 1435-1446) with `<SearchableCountrySelect value={country} onValueChange={setCountry} />`
   - Replace the `<Select>` for **Country of Birth** (lines 1498-1509) with `<SearchableCountrySelect value={countryOfBirth} onValueChange={setCountryOfBirth} />`
   - Replace the `<Select>` for **Citizenship** (lines 1513-1524) with `<SearchableCountrySelect value={citizenship} onValueChange={setCitizenship} />`

This reuses the same searchable component with priority countries (Romania, Thailand, Ukraine, Sweden) at the top, followed by all other countries -- exactly matching the invitation/onboarding form behavior.

