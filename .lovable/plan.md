

## Plan: Fix Deduction Section — Checkbox Wording and Missing Translations

### Problem 1: Confirmation Checkbox Wording
The current text reads from the employee's perspective: *"I confirm that I have reviewed and considered all applicable salary deductions..."*. Since this is the HR contract wizard (not the employee signing portal), the wording should reflect that the **contract creator** is confirming they have reviewed the deductions as a checkpoint — not that the employee agrees.

**New wording (all 5 languages):**
- EN: "I confirm that I have reviewed and verified the salary deductions entered above are correct for this contract."
- SV: "Jag bekräftar att jag har granskat och kontrollerat att ovanstående löneavdrag är korrekta för detta avtal."
- RO: "Confirm că am verificat și controlat că deducerile salariale introduse mai sus sunt corecte pentru acest contract."
- TH: "ฉันยืนยันว่าได้ตรวจสอบและยืนยันว่าการหักเงินเดือนที่ระบุข้างต้นถูกต้องสำหรับสัญญานี้"
- UK: "Я підтверджую, що перевірив(-ла) та засвідчив(-ла), що утримання із заробітної плати, зазначені вище, є правильними для цього договору."

### Problem 2: Deduction Type Labels Not Translated
The `DEDUCTION_TYPES` array (line 281-287) is hardcoded with only English `label` and Swedish `labelSv`. When rendering a deduction card header (line 3014), it directly uses `typeInfo.label / typeInfo.labelSv` instead of going through `bl()`, so RO/TH/UK languages never show their translation.

**Fix:** Use the existing `CONTRACT_LABELS` (CL) translations for deduction types at render time. The deduction card header (line 3014) and the "Add Deduction" buttons (line 3118-3119) will use `bl()` to display the correct bilingual deduction type names.

### Changes

**`src/components/dashboard/ContractDetailsStep.tsx`**

1. **Line 3014** — Replace `typeInfo.label / typeInfo.labelSv` with `bl(typeInfo.label, typeInfo.labelSv)` so it routes through `getFormBilingual` and picks up UK/RO/TH translations.

2. **Lines 3118-3119** — Same fix for the "Add Deduction" button labels: use `bl(dt.label, dt.labelSv)` instead of separate lines.

3. **Line 3069-3070** — The company car hint text is hardcoded EN/SV. Wrap it in `bl()`.

4. **Line 3164** — Update the confirmation checkbox text to the new HR-oriented wording, still using `bl()`.

**`src/lib/form-translations.ts`**

5. Update the confirmation text key in all four translation dictionaries (RO, TH, UK, and the EN key used for lookup) to match the new wording.

6. Add the car usage hint text translation for RO, TH, and UK dictionaries.

### Result
- The deduction section will be fully translated for all 5 supported languages (EN/SE, SE, RO/SE, TH/SE, UK/SE)
- The confirmation checkbox will clearly read as an HR checkpoint rather than an employee agreement
- Deduction type names will display in the correct bilingual format

