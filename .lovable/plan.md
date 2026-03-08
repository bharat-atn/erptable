

## Plan: Section-based mapping UI + "Clear Colors" (not mappings)

### Two changes

**1. "Clear All" button becomes "Clear Colors"**
- Rename button to "Clear Colors" / add a separate button
- Instead of resetting `columnMapping` to `_skip`, introduce a `colorConfirmed` state (`Set<string>`) that tracks which mappings have been visually "confirmed"
- Actually simpler approach: add a `hideColors` boolean toggle. When true, all rows render in the neutral style regardless of mapping status. Clicking "Show Colors" re-enables the green highlighting. The mappings themselves are never touched.

**2. Group system fields by invitation template sections**
- Replace the flat `SYSTEM_FIELDS` array grouping (`core`/`address`/`personal`) with section-based grouping that matches the invitation template:
  - **Section 2.1 — Name & Address**: `name`, `first_name`, `middle_name`, `last_name`, `preferredName`, `address1`, `address2`, `city`, `postcode`, `stateProvince`, `country`
  - **Section 2.2 — Birth & Contact**: `email`, `phone`, `mobilePhone`, `dateOfBirth`, `countryOfBirth`, `citizenship`, `nationality`, `swedishPersonalNumber`, `swedishCoordinationNumber`
  - **Section 2.3 — Emergency Contact**: `emergencyFirstName`, `emergencyLastName`, `emergencyPhone`
  - **Section 3 — Bank Information**: `bankName`, `bankAccount`, `bicCode`, `bankCountry`
  - **Section 4 — ID / Employment**: `employee_code`
  - **Skip**: `_skip`
- Update the `<Select>` dropdown to show `<SelectGroup>` with `<SelectLabel>` headers for each section
- Update the mapping card grid to optionally group CSV columns by their mapped section (or keep flat, but the dropdown itself is sectioned)

### File: `src/components/dashboard/DataHandlingView.tsx`

**Changes:**
1. Update `SystemField.group` type to use section keys (`"2.1"` | `"2.2"` | `"2.3"` | `"3"` | `"4"` | `"skip"`)
2. Re-assign each field's group to match invitation template sections
3. Add section labels constant matching `InvitationTemplateView`
4. Update the `<Select>` for system field mapping to use `<SelectGroup>` + `<SelectLabel>` per section
5. Add `hideColors` state boolean, default `false`
6. Change "Clear All" button to "Clear Colors" — toggles `hideColors` on (hides green styling). Add "Show Colors" to toggle it back.
7. Update the `isMapped` visual styling to respect `hideColors`: when true, all rows use neutral styling regardless of mapping

