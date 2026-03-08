

# Plan: Verify & Align System for Scenario 1 Project Test

## Assessment

Scenario 1 (Forest Clearing Project PJ-26-0001) requires these components, which I've mapped against the existing system:

| Scenario 1 Requirement | System Component | Status |
|---|---|---|
| **Client**: "Swedish Forestry Corporation" | `ClientRegisterView` + `forestry_clients` table | Seed uses "SCA Skog AB" — mismatch with scenario |
| **Project creation** (PJ-26-0001, clearing, Värmland) | `ForestryProjectsView` → `ProjectSetupView` | Seed project is "Kvissleby Clearing 2026" in Sundsvall — mismatch |
| **3 clearing objects** (D330474, D330473, D330472, SLA 107, piece work) | `ProjectObjectsTab` + `forestry_objects` table | Objects exist in seed but SLA classes use text ("standard"/"difficult"/"extreme") instead of numeric codes ("107") |
| **Team of 4** (Anna 5★, Niran 3★, Andrei 2★, Somchai 2★) | `TeamMembersTab` + `forestry_project_members` | Employees exist in seed. Star assignments use `5 - index` formula — Anna=5, Elena=4, Niran=3... not exactly matching scenario (Andrei is ONBOARDING, not ACTIVE) |
| **Comp Group**: SLA 107 piece-work rates per star | `CompGroupView` + `comp_group_classes` table | Auto-seeds defaults — needs verification that SLA 107 with correct rates exists |
| **Duration & Timing** (3 work days, 8h/day) | `DurationTimingTab` | Component exists, dates in seed are 6 months apart (not 3 days) |
| **Financial Planning** (revenue 2,500 SEK/ha × 49.8 ha) | `FinancialPlanningTab` | Component exists, but `revenue` field on project not populated in seed |
| **Preliminary Payroll** | `PreliminaryPayrollTab` | Component exists |

## Issues Found

1. **Seed data doesn't match Scenario 1** — The seed project name, client, location, objects (SLA codes), and team composition don't align with the scenario guide. Users following the guide won't find matching data.

2. **SLA class codes mismatch** — Scenario uses numeric "107" but database stores text like "standard", "difficult", "extreme". The `sla_class` column accepts free text so either convention works, but they must be consistent between objects, comp groups, and the scenario guide.

3. **Employee status issue** — Andrei Popescu is seeded as "ONBOARDING" (not ACTIVE), so he won't appear in the team assignment list which filters for ACTIVE/ONBOARDING employees. Scenario 1 expects him on the team.

4. **Scenario 1 objects need exactly 3 clearing objects** — Seed has 11 objects (mix of planting and clearing). The 3 scenario-matching ones (D330472–D330474) exist but with text SLA labels instead of "107".

## Plan

### 1. Update seed data to match Scenario 1 exactly

Update `supabase/functions/seed-sandbox-data/index.ts`:
- Change `SEED_PROJECT` to match Scenario 1: name "Värmland Forest Clearing 2026", client "Swedish Forestry Corporation", location "Värmland, Sweden"
- Add "Swedish Forestry Corporation" to `SEED_CLIENTS` 
- Change Scenario 1's 3 objects (D330472–D330474) to use `sla_class: "107"` 
- Set Andrei Popescu's status to `"ACTIVE"` so he's available for team assignment
- Fix star rating assignments so they match scenario: Anna=5, Niran=3, Andrei=2, Somchai=2
- Set project `budget` and `revenue` fields to match scenario financial data

### 2. Align SLA class codes across the system

Update the `SLA_OPTIONS` in `ProjectObjectsTab.tsx` and `ForestryObjectFormDialog.tsx` to use numeric codes (101–113) consistent with the comp group system and scenario guide, instead of text labels like "standard"/"difficult".

### 3. Seed comp group data for Scenario 1

Update the seed function to also seed `comp_groups` and `comp_group_classes` with the Scenario 1 SLA 107 piece-work rates:
- Star 1: 108 SEK/h, Star 2: 144 SEK/h, Star 3: 162 SEK/h, Star 4: 180 SEK/h, Star 5: 198 SEK/h
- This ensures the Financial Planning and Payroll tabs can pull real compensation data

### 4. No structural/schema changes needed

All database tables and UI components already exist. This is purely a data alignment task — updating seed data and ensuring SLA code consistency.

## Files to Change

- `supabase/functions/seed-sandbox-data/index.ts` — Update seed data to match Scenario 1
- `src/components/dashboard/project-setup/ProjectObjectsTab.tsx` — Align SLA options to numeric codes
- `src/components/dashboard/ForestryObjectFormDialog.tsx` — Align SLA options to numeric codes

