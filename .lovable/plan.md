

## Plan: Replace Generic CoC with Full Company Document (All 6 Pages)

### Problem
The current `CodeOfConductViewer.tsx` contains a generic 12-section Code of Conduct. The real company document (Ljungan Skogsvård AB) has **25+ sections across 6 pages** covering forestry-specific rules: work requirements, PPE, driving rules, planting instructions, fuel handling, accommodation, emergency procedures, etc. Only ~1 page worth of content is showing.

### Solution
Replace all 5 language constants (`COC_SV`, `COC_EN`, `COC_UK`, `COC_RO`, `COC_TH`) in `CodeOfConductViewer.tsx` with the full company-specific content matching the uploaded PDF structure.

**Single file change:** `src/components/dashboard/CodeOfConductViewer.tsx`

#### Content to add (all ~25 sections per language):
1. Arbetskrav / Work Requirements
2. Hälsovård och ersättning / Healthcare & Compensation
3. Personlig skyddsutrustning (PSU) / PPE
4. Säkerhet under arbete / Safety During Work
5. Körregler / Driving Rules
6. Förbjudna substanser / Prohibited Substances
7. Avfallshantering / Waste Management
8. Bränsleförvaring / Fuel Storage
9. Boende Lokaler / Accommodation Facilities
10. Arbetstider / Working Hours
11. Kvalitetsstandarder / Quality Standards
12. Plantering instruktioner / Planting Instructions
13. Boende / Accommodation
14. Kommunikation och rapportering / Communication & Reporting
15. Uppsägning av anställning / Termination of Employment
16. Förbjudna aktiviteter / Prohibited Activities
17. Utrustning och underhåll / Equipment & Maintenance
18. Arbetsmiljö / Work Environment
19. Bränslehantering / Fuel Handling
20. Kemikaliehantering / Chemical Handling
21. Fordonssäkerhet / Vehicle Safety
22. Kartor och nödprocedurer / Maps & Emergency Procedures
23. Diskriminering och sekretess / Discrimination & Confidentiality
24. Användning av företagsfordon / Company Vehicle Use
25. Skattedeklaration / Tax Declaration
26. Riskidentifiering och rapportering / Risk Identification
27. Personliga hygienartiklar / Personal Hygiene Items
28. Bekräftelse och avtal / Acknowledgment & Agreement

#### Per-language approach:
- **COC_SV**: Direct from the parsed PDF text (Swedish source of truth)
- **COC_EN**: Translate from Swedish (already have the English versions from the PDF structure)
- **COC_UK**: Full Ukrainian translation of the Swedish company document
- **COC_RO**: Romanian translation matching the same structure
- **COC_TH**: Thai translation matching the same structure

The viewer component itself (`CodeOfConductViewer`) and its scroll container remain unchanged — it already supports rendering any number of sections. The issue is purely that the content only had 12 generic sections instead of 28.

