

# Sidebar Redesign: Pixel-Perfect Match to Arbor Pro Figma Template

## What's Changing

Based on the Figma screenshot, the current sidebar needs several specific fixes to match the design system:

### 1. Color & Contrast Fixes
- The active item pill should be a vibrant **blue-violet** (closer to `hsl(255, 80%, 55%)` or a true indigo-blue), not a muted purple
- The left border indicator on active items should be a **darker/contrasting blue** (not the same color as the pill)
- Inactive text should be **dark gray/near-black** (like `hsl(220, 15%, 30%)`), not faded -- the Figma shows clearly readable dark text
- Group labels ("MAIN", "OTHERS") should be a **light muted purple/lavender** tint, matching the Figma

### 2. Typography Fixes
- Inactive menu items: **medium weight (font-medium)**, dark text, ~14px
- Active menu item: **semibold**, white text on the blue pill
- Header "Company Name" (OnboardFlow): **bold**, dark
- Header subtitle: **regular weight**, muted gray
- Group labels: **semibold**, small caps, purple-tinted

### 3. Active Item Styling (from Figma component breakdown)
- Blue/indigo rounded pill background filling the full width
- White text + white icon inside the pill
- A **short vertical bar** on the left edge (darker blue, outside the pill)
- A **chevron-right** icon on the right side inside the pill
- The icon on the far right (grid icon) appears to be outside the pill in some variants

### 4. Header Card
- Logo in a **circular blue/gradient container** (the Figma shows a teal/blue circle with a leaf icon)
- For our app: keep the Ljungan logo in the rounded container
- Company name bold, subtitle below in muted text, chevron-down on right
- Subtle hover state

### 5. "Need Support" Card (New Addition)
- A card near the bottom with a support icon, "Need Support" title, dismiss (X) button
- Subtitle: "Contact with one of our experts to get support."
- Light background card with subtle border

### 6. User Profile Footer
- User avatar (photo or initials circle)
- Name in **semibold** with a small verified/blue badge icon
- Email below in muted text
- Chevron-right on the right

## Technical Details

### Files to modify:

**`src/index.css`** -- Update sidebar CSS variables:
- `--sidebar-primary`: shift to `250 80% 58%` (more vibrant blue-violet)
- `--sidebar-foreground`: darken to `220 15% 30%` (near-black for readable text)
- `--sidebar-accent`: keep light purple for hover states

**`src/components/dashboard/Sidebar.tsx`** -- Multiple component updates:

1. **SidebarItem**: 
   - Active: `bg-sidebar-primary text-white font-semibold` with left bar indicator outside/overlapping
   - Inactive: `text-foreground font-medium` (no opacity reduction)
   - The left bar should use a slightly darker shade or contrasting color

2. **GroupLabel**: Purple-tinted label matching Figma exactly

3. **SidebarHeader**: Ensure logo container matches the circular blue style from Figma

4. **New "Need Support" card component**: Add between navigation and user profile, with dismiss functionality (stored in localStorage)

5. **UserProfileCard**: Add a small blue verified badge icon next to the user name

### Sequencing:
1. Update CSS variables in `index.css`
2. Update `Sidebar.tsx` -- fix item styling, add support card, refine header/footer

