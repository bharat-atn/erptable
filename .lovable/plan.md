

## Plan: Rebuild Forestry Process Guide

### What We're Building

A comprehensive, multi-tab Process Guide matching the screenshots exactly. This replaces the current simple `ForestryProcessGuideView.tsx` with a rich reference document containing two tabs: **Process Map** and **Scenarios**.

### Tab 1: Process Map

Visual hierarchy showing how the forestry system is structured:

1. **Header** with two info dialog buttons: "What is a Compensation Group?" and "What is an SLA Class?"

2. **Project Hierarchy Flow**: Project → Client → Location → Coordinates → Objects (icon cards with arrows)

3. **Object Types**: Two side-by-side cards — Planting Objects (plant pieces/thousands) and Clearing Objects (hectares)

4. **Compensation Methods**: Hourly Salary (both types) and Piece Work (per unit)

5. **SLA Classes (101-113)**: Visual gradient from green (101 Light) through blue (107 Medium) to red (113 Heavy), with intermediate classes shown as badge groups

6. **Forest Plant & Clearing Types 1-10**: Two columns showing plant types (Jackpot, Powerpot, Superpot...) and clearing types (Young Forest, Undergrowth, Powerline...)

7. **Compensation Details**:
   - Hourly Salary: Star System table (Job Type × Salary Group × Stars 1-5 with kr/h rates)
   - Piece Work: Planting table (SLA Class × Stars with plants/day + Net Gross) and Clearing table (SLA Class × Stars with hectares/day + Net Gross)

8. **What is a Project Object?**: Object attributes (Unique ID, Quantity, Compensation Type)

9. **Compensation Type Connection**: Category + Compensation Method

10. **5-Level Compensation Hierarchy**: Category → Compensation Method → Quantity Units → Difficulty Level (SLA) → Employee Performance (Stars)

11. **Practical Example**: Object D330470 trace through the full hierarchy

### Tab 2: Scenarios

Workflow phases and real-world examples:

1. **Foundation Setup** (6 cards in 2-col grid): Client Register, Object Register, Compensation Groups, Employee Register, Project Numbers, Project Defaults

2. **Project Planning** (5 cards): Create Project, Add Project Objects, Set Duration & Timing, Assign Team, Financial Planning — each with subtitle notes

3. **Execution & Monitoring** (4 cards): Gantt View, Kanban Board, Task Management, Activity Log

4. **Compensation & Reporting** (3 cards): Preliminary Payroll, Analytics, Documentation

5. **Real-World Scenarios**:
   - **Scenario 1: Beginner Planting Project** — Project Setup card → Project Objects table → Team Assignment list → Compensation Calculation → Expected Results
   - **Scenario 2: Complex Clearing Project** — Same structure with harder parameters

### Technical Approach

**Single file change**: Complete rewrite of `src/components/dashboard/ForestryProcessGuideView.tsx`

- Use Radix `Tabs` component for Process Map / Scenarios toggle
- Use `Dialog` for the info popups ("What is a Compensation Group?" / "What is an SLA Class?")
- All data is static/hardcoded (reference documentation, not database-driven)
- Use existing Card, Badge, Table components
- Arrow connectors between sections using `ArrowDown` icon + centered text
- Color-coded sections: green tint for planting, blue for clearing, yellow/red for SLA difficulty
- Responsive: 2-column grids collapse to single column on mobile

### Estimated Size

~800-900 lines for the full component with all the tables, scenarios, and visual hierarchy.

