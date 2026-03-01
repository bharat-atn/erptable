

## Plan: Add Legal Duration Text Below Contract Dates

### What
Add a bilingual legal notice below the Start Date / End Date fields in the Duration & Timing section of the Scheduling Step. The text states that the contract comes into force when work begins on site and ends when the mission is finished or weather no longer permits continuation.

### Changes

**1. `src/components/dashboard/SchedulingStep.tsx`**
- Add a `contractLanguage` prop to `SchedulingStepProps`.
- Insert a styled info block between the date pickers (line ~401) and the Daily Schedule card (line ~403) containing the bilingual legal text.
- Translate based on `contractLanguage`:
  - **EN/SE**: English + Swedish
  - **SE**: Swedish only
  - **RO/SE**: Romanian + Swedish
  - **TH/SE**: Thai + Swedish
  - **UK/SE**: Ukrainian + Swedish

Translations:
- **SV**: "Anställningsavtalet träder i kraft när arbetet på platsen påbörjas och upphör när det tilldelade uppdraget är slutfört eller om väderförhållandena inte längre tillåter att uppdraget fortsätter."
- **EN**: "The employment contract comes into force when work on the site begins and finishes when the assigned mission is finished or if the weather conditions no longer allow the continuation of the mission."
- **RO**: "Contractul de muncă intră în vigoare la începerea lucrărilor pe șantier și încetează la finalizarea misiunii atribuite sau dacă condițiile meteorologice nu mai permit continuarea misiunii."
- **TH**: "สัญญาจ้างงานมีผลบังคับใช้เมื่อเริ่มทำงานในพื้นที่ และสิ้นสุดเมื่อภารกิจที่ได้รับมอบหมายเสร็จสิ้น หรือหากสภาพอากาศไม่เอื้ออำนวยให้ดำเนินภารกิจต่อไปได้"
- **UK**: "Трудовий договір набуває чинності з початком роботи на об'єкті та припиняється після завершення призначеної місії або якщо погодні умови більше не дозволяють продовження місії."

**2. `src/components/dashboard/ContractDetailsStep.tsx`**
- Pass `contractLanguage` to `<SchedulingStep>` (line ~3171).

### Visual result
Below the two date pickers, a subtle info block with the legal clause in the appropriate bilingual format, similar to other info blocks used throughout the contract wizard.

