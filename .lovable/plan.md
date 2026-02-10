

# HR Process Guide Page

## Overview

Build a new **"Process Guide"** page in the sidebar that serves as a comprehensive reference for the entire employee lifecycle. This is a documentation/reference page (read-only, no database interaction) that visually explains the HR workflows with clear terminology, step-by-step flows, and status tracking.

## What Will Be Built

### 1. System Terminology Section
A card at the top explaining the 6 key concepts used throughout the app:
- **Invitation** -- Email link sent to start the process
- **Onboarding Wizard** -- Digital form for personal, bank, and ID info
- **Contract** -- Auto-generated employment agreement
- **Seasonal Pool** -- Archive of past employees for quick renewal
- **Renewal** -- Re-engagement process before rehiring
- **Termination** -- Exit process and archival

Each term will have an icon, title, and short description displayed in a grid layout.

### 2. New Hire Workflow (Flow 1)
A 4-step horizontal flow card with color-coded role labels:
1. **Send Invitation** (HR Manager) -- Status: INVITED
2. **Data Submission** (Candidate) -- Status: ONBOARDING
3. **Contract Review** (HR Manager) -- Status: ONBOARDING
4. **Activation** (System) -- Status: ACTIVE

### 3. Seasonal Pool to Renewal Workflow (Flow 2)
A 5-step horizontal flow card:
1. **Select Candidate** (HR Manager) -- Source: SEASONAL_POOL
2. **Send Renewal Invitation** (HR Manager) -- Status: RENEWAL
3. **Data Verification** (Candidate) -- Status: RENEWAL
4. **Contract Signing** (Candidate) -- Status: RENEWAL
5. **Reactivation** (System) -- Status: ACTIVE

### 4. Termination Workflow (Flow 3)
A 3-step horizontal flow card:
1. **Termination Notice** (HR Manager) -- Status: ACTIVE
2. **Exit Processing** (System) -- Status: TERMINATING
3. **Archive** (System) -- Status: TERMINATED

### 5. Complete Process Flow Summary
A compact visual at the bottom showing numbered flows:
- Flow 1: Pending Invites -> Onboarding -> Active Duty
- Flow 2: Seasonal Renewal -> Data Update -> Active Duty
- Flow 3: Active -> Terminating -> Terminated/Seasonal Pool

## Sidebar Changes

Add a new **"Process Guide"** item under a **"CONFIGURATION"** section divider in the sidebar, matching the screenshot's navigation structure.

## Technical Details

### Files to Create
- `src/components/dashboard/ProcessGuideView.tsx` -- The main page component containing all sections (terminology grid, workflow cards, flow summary)

### Files to Modify
- `src/components/dashboard/Sidebar.tsx` -- Add a "CONFIGURATION" section label and "Process Guide" menu item (using the `BookOpen` icon from lucide-react)
- `src/components/dashboard/Dashboard.tsx` -- Add the `process-guide` case to the view switch

### Component Architecture
The page is entirely static/presentational -- no database queries needed. It uses existing UI components (`Card`, `Badge`) and Tailwind classes for the colored role labels (HR MANAGER in blue, CANDIDATE in green, SYSTEM in purple) and status badges.

### Workflow Step Card Pattern
Each workflow will be rendered as a responsive horizontal grid of step cards. On mobile, steps will stack vertically. Each step shows:
- Role label (color-coded)
- Step number and title with icon
- Description text
- Status badge

