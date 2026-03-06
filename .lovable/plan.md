

## Plan: Rebuild Scenario 1 — Forest Clearing Project

The screenshots reveal a dramatically different and richer Scenario 1 than what currently exists. The current implementation uses a compact card with simple tables. The target is a full-page, multi-section walkthrough with detailed financial calculations, timeline visualization, team performance breakdowns, and compensation analysis.

### Current vs Target

**Current**: Simple card with setup grid, table, team list, one calculation line, 3-column results.

**Target**: Full scenario page with 10+ distinct sections, each with rich visual cards, colored badges, star avatars, timeline bars, and detailed financial breakdowns.

### What Scenario 1 Looks Like (from screenshots)

The scenario is "Forest Clearing Project" (not "Beginner Planting" as currently). It follows this flow:

1. **Scenario selector** — 3 buttons at top to switch between scenarios
2. **Live data banner** — Yellow note: "This scenario reflects the current state of project PJ-26-0001"
3. **Project Setup** — 4-column layout: Project Number (PJ-26-0001), Client (Swedish Forestry Corporation), Location (Värmland, Sweden), Coordinates (59.3293° N, 13.4877° E)
4. **Project Objects (3)** — Individual object cards (not table), each showing Object ID, Type, SLA Class badge, Compensation badge, Quantity. Objects: D330474 (16.9 ha), D330473 (14.2 ha), D330472 (18.7 ha) — all Forest Clearing, SLA 107, Piece Work
5. **Summary stats** — 4 colored cards: 3 Total Objects, 49.8 Total Hectares, Piece Work (Compensation), Class 107 (SLA Difficulty)
6. **Team Assignment (4 Members)** — 2x2 grid cards with star ratings, hourly rate, total earnings: Anna Lindqvist (5★ Team Leader, 198 SEK, 3792 SEK), Niran Chairat (3★, 162 SEK, 3103 SEK), Andrei Popescu (2★, 144 SEK, 2758 SEK), Somchai Rattanakul (2★, 144 SEK, 2758 SEK)
7. **Project Timeline** — 3 stat cards (3 Working Days, 19.2 Total Hours, 8 Hours/Day) + calculation note + Object Type Breakdown (Young Forest Type 1, Undergrowth Type 2)
8. **Project Timeline - Scenario 1** — Two-column: Planning Phase (Apr 1 - May 31, 60 days) + Execution Phase (May 15 - May 31, 16 days) with green background. Timeline Overview bar chart (Feb-Jul 2026).
9. **Timeline & Planning** — 3 cards: Planning Phase (April 2026), Execution Period (May 15 - May 31, 2026), Daily Schedule (8 hours)
10. **Timeline Match Analysis** — Yellow-bordered note about 3 working days requirement
11. **Performance & Duration Calculation** — 4 stat cards: 3 Working Days, 4 Team Members, 3 Clearing Days, 3.0★ Avg Team Rating
12. **Team Performance Breakdown** — Per-person cards with Clearing Performance (ha/hour, ha/day, total ha) + Compensation Breakdown (ha × SEK). Anna: 0.85 ha/h, 6.80 ha/day, 20.40 ha, 51,000 SEK. Niran: 0.65, 5.20, 15.60, 39,000. Andrei: 0.55, 4.40, 13.20, 33,000. Somchai: same as Andrei.
13. **Project Compensation Summary** — Two columns: Individual Distribution (4 workers with amounts) + Project Financial Overview (156,000 SEK total, Clearing Rate 2,500 SEK/hectare, Avg per person 39,000 SEK)
14. **Key Insights & Performance Analysis** — Bullet points with colored highlights
15. **Compensation Breakdown - Scenario 1** — Distribution method toggle (Individual Performance / Equal Distribution) + SLA Class 107 Pricing Rates (3,500 SEK/hectare)
16. **Individual Earnings** — Per-person cards with star avatar, role badge, Clearing Contribution details, Total Earnings
17. **Project Financial Summary** — 3 cards: Total Labor Cost (218,400 SEK red), Gross Revenue (174,300 SEK), Gross Profit (-44,100 SEK, -25.3% margin)

### Technical Approach

**File**: Rewrite `src/components/dashboard/forestry-guide/ScenariosTab.tsx`

- Keep the phase cards and best practices at top/bottom
- Replace the 3 simple `Scenario` components with a **tabbed scenario selector** (3 buttons)
- Build Scenario 1 as a comprehensive component with all 15+ sections above
- Scenarios 2 and 3 remain as placeholders ("Coming in next iteration") for now
- Use colored circle avatars for star ratings (gold for 5★, blue for 3★, brown for 2★)
- Timeline overview uses simple CSS bar chart (no recharts needed)
- All data is static/hardcoded

### Estimated Size

~900-1000 lines due to the rich visual detail in each section.

