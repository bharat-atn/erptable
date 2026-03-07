

## Plan: Redesign CoC Confirmation & Signing Flow for Clarity

### Problems Identified

1. **CoC toggle is unreliable**: The scroll detection on the iframe container (`max-h-[500px]`) depends on the user scrolling the outer `div`, not the iframe content. Many browsers don't propagate iframe scroll events to the parent, so `cocScrolledToBottom` may never become `true` — the toggle button never appears.

2. **Toggle is not visually obvious**: The current custom-built toggle (a div mimicking a switch) lacks clear affordance. Users don't recognize it as something they must interact with.

3. **Flow is confusing**: The signing card is hidden until CoC is confirmed, but the contract confirmation checkbox and place/date fields are *inside* the signing card — so users can't see what's needed until they've already toggled CoC.

### Design Solution

**Sequential, numbered steps with clear visual states:**

```text
Step 1: Read Contract          [always visible]
Step 2: Code of Conduct        [always visible]
  → Select language
  → Read PDF (scrollable + "Open in new tab" link)
  → Toggle appears ALWAYS (not gated by scroll)
  → Toggle uses the actual Switch component from shadcn/ui
  → Big, clear label with visual emphasis
Step 3: Confirmations & Sign   [appears only after CoC toggle ON]
  → Contract terms confirmation (Switch, not checkbox)
  → Schedule reviewed (if applicable)
  → Place & Date fields
  → Checklist of remaining steps
  → Signature canvas (disabled until all complete)
```

### Changes

#### `src/pages/ContractSigning.tsx`

1. **Remove scroll-gating for CoC toggle**: Show the toggle always (after language is selected and PDF is displayed). Remove `cocScrolledToBottom` gating. Keep the scroll detection only as a visual hint ("Please scroll through the document above").

2. **Replace custom toggle with shadcn Switch**: Use the proper `Switch` component with a large, clear label. Add a yellow/amber warning banner above it when not yet toggled: "⚠ You must confirm that you have read the Code of Conduct to proceed."

3. **Replace contract confirmation custom checkbox with Switch**: Same treatment for consistency.

4. **Add step numbers**: Add visual step indicators (Step 2, Step 3) to the card headers so the sequential flow is obvious.

5. **Keep signing card gated**: The signing card remains hidden until `cocConfirmed === true`, which is correct.

#### `src/pages/SigningSimulation.tsx`

Apply the same changes for consistency.

### Files to Edit

| File | Change |
|------|--------|
| `ContractSigning.tsx` | Remove scroll-gating, use Switch components, add step numbers, add warning banner |
| `SigningSimulation.tsx` | Same changes for consistency |

