

## Plan: Add Ukrainian Language Support to Contract System

The contract translation system currently supports EN, SV, RO, and TH. Ukrainian (UK) needs to be added to both the contract document translations and the form wizard translations, plus the helper functions need to handle `"UK/SE"`.

### 1. Update `src/lib/contract-translations.ts`
- Add `uk` field to `LabelSet` interface
- Update `L()` helper to accept 5th param (Ukrainian)
- Add Ukrainian translations to all ~80 label entries in `CONTRACT_LABELS`
- Update `bilingualLabel()` and `primaryText()` to handle `"UK/SE"` case

### 2. Update `src/lib/form-translations.ts`
- Add new `FORM_LABELS_UK: Record<string, string>` with Ukrainian translations for all ~260 form labels (matching RO and TH dictionaries)
- Update `getFormLabel()`, `getFormSectionLabel()`, and `getFormBilingual()` to handle `"UK/SE"` case

### 3. Populate position/skill group translations in database
- Use the insert tool to UPDATE existing positions with Romanian, Thai, and Ukrainian translations for all position labels and type labels
- Use the insert tool to UPDATE existing skill groups with Romanian, Thai, and Ukrainian translations

### Technical Details

**Ukrainian translations scope for contract-translations.ts** (~80 labels):
- Contract header, legal disclaimer
- §1-§13 section titles and field labels
- Employment form types, frequency labels, deduction types
- Signature section labels

**Ukrainian translations scope for form-translations.ts** (~260 labels):
- All section headers, field labels, button labels
- Employment form descriptions, helper text
- Salary section labels, training labels
- Deduction labels, signing status messages

**Database updates** for positions table (~15 positions):
- Translate `label_ro`, `label_th`, `label_uk` for each position
- Translate `type_label_ro`, `type_label_th`, `type_label_uk` for each type group

**Database updates** for skill_groups table (~5 groups):
- Translate `label_ro`, `label_th`, `label_uk` for each skill group

