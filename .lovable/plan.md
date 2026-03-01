

## Plan: Add Ukrainian to Code of Conduct Language Selection

### What
Add Ukrainian (Українська) as a fifth language option in the Code of Conduct selection, across all three places where it appears. Also need to create/add the Ukrainian PDF document.

### Changes

**1. Create Ukrainian Code of Conduct PDF**
- A file `public/documents/code-of-conduct-uk.pdf` needs to exist. Since we cannot generate a translated PDF programmatically, we will add the entry pointing to the file path. You will need to provide/upload the actual Ukrainian PDF document separately.

**2. `src/components/dashboard/CodeOfConductStep.tsx`**
- Add Ukrainian entry to the `LANGUAGES` array:
  `{ code: "uk", label: "Українська", labelEn: "Ukrainian", flag: "🇺🇦", file: "/documents/code-of-conduct-uk.pdf" }`

**3. `src/pages/ContractSigning.tsx`**
- Add Ukrainian entry to the `COC_LANGUAGES` array:
  `{ code: "uk", label: "Українська", labelEn: "Ukrainian", file: "/documents/code-of-conduct-uk.pdf" }`

**4. `src/pages/SigningSimulation.tsx`**
- Add Ukrainian entry to the `COC_LANGUAGES` array:
  `{ code: "uk", label: "Українська", labelEn: "Ukrainian", file: "/documents/code-of-conduct-uk.pdf" }`

### Note
The grid uses `grid-cols-2`, so with 5 languages the last row will have one card — this is fine and consistent with the layout. The Ukrainian PDF file will need to be uploaded to `public/documents/code-of-conduct-uk.pdf` for the document link to work.

