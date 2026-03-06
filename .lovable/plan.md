

## Plan: Fix Sidebar Active Item Styling

### Problem
Two styling issues in the `SidebarItem` component (`Sidebar.tsx`):

1. **Text not white when active**: Line 206 has `text-primary` hardcoded on the label `<span>`, which forces it to blue (`217 91% 53%`) even when the parent button sets `text-sidebar-primary-foreground` (white). The label overrides the inherited white color.

2. **Active background is violet, not blue**: `--sidebar-primary` is set to `250 80% 58%` (blue-violet) in `index.css`, but the design system primary is `217 91% 53%` (deep blue). The sidebar active highlight should match this blue.

### Changes

**1. `src/index.css`** — Update sidebar-primary to match the primary blue:
- Change `--sidebar-primary: 250 80% 58%` → `--sidebar-primary: 217 91% 53%` (same as `--primary`)
- Update `--sidebar-primary-dark` and related accent colors to match the blue family

**2. `src/components/dashboard/Sidebar.tsx`** — Fix text color inheritance:
- Line 206: Remove `text-primary` from the label span so it inherits the white `text-sidebar-primary-foreground` from the parent when active
- Ensure non-active items keep their current foreground color via the parent's `text-sidebar-foreground`
- Update the left accent bar (lines 175, 203) from `hsl(250 85% 45%)` to use the primary blue

### Result
- Active sidebar items: blue background with white text
- Non-active items: unchanged dark text with hover effect
- Left accent indicator matches the blue theme

