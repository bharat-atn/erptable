
# Apply Arbor Pro Design System

## Overview

Align the application's visual identity with the **Arbor Pro Design System** observed from the Figma screenshots. The system uses a clean, professional aesthetic with strong contrast and bold typography. The key changes focus on color tokens, typography weight/sizing, shadow depth, and overall "dominant" feel across all components.

## What I observed from the design system

- **Color Palette**: Primary blue (deep, saturated -- approximately `#2563EB` to `#1D4ED8`), with supporting colors for green (success), orange (warning), red (destructive), purple, yellow, pink, and teal
- **Typography**: Clean sans-serif (Inter is a good match), with a clear size hierarchy from large titles down to small labels. Bold weights used prominently for headings
- **Icons**: Line and Fill variants for Business, Communication, Design, Development, Device, and Document categories -- these map well to Lucide icons already in the project
- **Components**: Cards with 60px radius noted in Figma, strong shadows, clear visual hierarchy
- **Overall feel**: High contrast, bold, professional -- not faded or washed out

## Changes

### 1. Update CSS Color Tokens (`src/index.css`)

Shift the color palette to be more dominant and aligned with Arbor Pro:

| Token | Current | New (approx) | Why |
|-------|---------|---------------|-----|
| `--primary` | `217 91% 60%` (lighter blue) | `217 91% 53%` (deeper blue) | More dominant, richer primary |
| `--foreground` | `222 47% 11%` | `222 47% 11%` | Keep -- already dark |
| `--muted-foreground` | `215 16% 47%` | `215 16% 40%` | Darker muted text for better contrast |
| `--border` | `214 32% 91%` | `214 32% 86%` | Slightly stronger borders |
| `--sidebar-background` | `0 0% 100%` (white) | `217 91% 15%` (dark blue) | Match dominant blue sidebar from visual-identity memory |
| `--sidebar-foreground` | gray | white/light | Light text on dark sidebar |
| `--sidebar-accent` | light blue | slightly lighter blue | Active state on dark sidebar |

### 2. Update Sidebar to Dark Blue Style (`Sidebar.tsx`)

Transform the sidebar from white/light to a **dark blue dominant** look:
- Dark blue background with white text
- Active item highlighted with a lighter blue accent
- Logo area with strong contrast
- Sign-out button styled for dark background

### 3. Strengthen Typography and Shadows Globally

In `src/index.css` and component files:
- Add a utility class for stronger card shadows (e.g., `shadow-md` as default for cards)
- Ensure headings use `font-bold` or `font-semibold` consistently
- Increase border-radius to match the design system's rounded feel

### 4. Update Card Component Defaults (`src/components/ui/card.tsx`)

- Upgrade default shadow from `shadow-sm` to `shadow-md`
- This propagates the "dominant" look across all cards in the app automatically

### 5. Update Button Hover States

- Ensure primary buttons have a slightly deeper hover color for more visual feedback
- Maintain the existing variant system but strengthen contrast

---

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Update CSS custom properties for deeper primary, darker sidebar, stronger borders/muted colors |
| `src/components/dashboard/Sidebar.tsx` | Dark blue background, white text, stronger active states |
| `src/components/ui/card.tsx` | Default shadow from `shadow-sm` to `shadow-md` |
| `tailwind.config.ts` | No changes needed -- already configured for CSS variables |

## What stays the same

- **Inter font** -- already matches the design system's sans-serif choice
- **Lucide icons** -- already map well to the Arbor Pro icon sets
- **Component structure** -- no layout changes, just visual refinement
- **Bilingual labels** -- already implemented per standards
