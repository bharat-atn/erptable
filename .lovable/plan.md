

# Continue Contract: Choice Dialog

## Current Behavior
When clicking "Continue" on a draft contract, the system immediately navigates to the contract wizard and resumes at the last saved section (via `lastActiveSection` in `form_data`).

## Proposed Change
Replace the immediate navigation with a dropdown menu (or popover) offering three choices:

1. **From Start** -- Resets `form_data.lastActiveSection` and navigates to Step 3 (Language Selection), keeping the company/employee selection intact
2. **Fast Track** -- Navigates directly to Step 18 (Review & Sign), skipping all intermediate sections so the user can quickly review and finalize
3. **Resume Where Left Off** -- Current behavior: navigates to the last saved section from `form_data.lastActiveSection` (or Step 4 if none saved)

## Implementation

### File: `src/components/dashboard/ContractsView.tsx`

Replace the single "Continue" `<Button>` with a `<DropdownMenu>` (already available via Radix). The three menu items will call `onContinueContract` with an additional `mode` parameter:

```text
onContinueContract(contractId, "start")      → Step 3
onContinueContract(contractId, "fasttrack")   → Step 18
onContinueContract(contractId, "resume")      → last saved step
```

The "Resume" option will be the default/highlighted item. If no `lastActiveSection` exists in `form_data`, the "Resume" label will show as "Resume (from beginning)" to clarify there's no prior progress.

### File: `src/components/dashboard/Dashboard.tsx`

Update `handleContinueContract` to accept and pass a `mode` parameter. Store it in state alongside `resumeContractId`.

### File: `src/components/dashboard/ContractTemplateView.tsx`

Accept a new `resumeMode` prop (`"start" | "fasttrack" | "resume"`). In the resume `useEffect` (lines 192-239):

- `"start"` → set `activeStep = 3`, skip loading `lastActiveSection`
- `"fasttrack"` → set `activeStep = 18`
- `"resume"` (default) → existing behavior, load `lastActiveSection`

### UI Design

The "Continue" button becomes a split/dropdown button:

```text
┌──────────────────────┐
│  Continue →          │  ← clicking opens dropdown
├──────────────────────┤
│  ▶ From Start        │
│  ⚡ Fast Track        │
│  ↻ Resume Where...   │  ← shows last section name if available
└──────────────────────┘
```

Uses the existing `DropdownMenu` component from `@radix-ui/react-dropdown-menu` (already installed).

### Files Modified
- `src/components/dashboard/ContractsView.tsx` -- Replace button with dropdown menu
- `src/components/dashboard/Dashboard.tsx` -- Pass resume mode through state
- `src/components/dashboard/ContractTemplateView.tsx` -- Handle three resume modes

