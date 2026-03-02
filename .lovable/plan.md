

## Plan: Make Dummy Invitations Simulate Full Onboarding Completion

### Problem
Currently, adding a dummy via the Invitations view only creates an employee (status `INVITED`) and an invitation (status `SENT`). The user wants the dummy to simulate the **complete** lifecycle: the candidate received the email, filled out the form, and submitted — so the invitation shows as **Completed** and the employee moves to `ONBOARDING` with a draft contract.

### Changes

**`src/components/dashboard/InvitationsView.tsx`** — Update the `addDummyInvitation` mutation to simulate the full submission flow:

1. Create the employee with status `ONBOARDING` (not `INVITED`) and full `personal_info` already populated (the dummy data already has this).
2. Create the invitation with status `ACCEPTED` (not `SENT`) — this represents a completed submission.
3. Fetch the org's company and create a draft contract linked to the employee, mirroring what `submit_onboarding` does in production.
4. Update the `langMap` to include Ukraine: `{ Ukraine: "uk_en" }`.
5. Invalidate the contracts query cache as well.
6. Update the toast to say "Dummy submission created!" to clarify the full lifecycle was simulated.

**`src/lib/dummy-employees.ts`** — Add Ukraine as a supported dummy country:

1. Add `UKRAINE_DATA` with Ukrainian names, cities, addresses, phones, and postcodes.
2. Add `"Ukraine"` to the `COUNTRY_MAP` and `DummyCountry` type.
3. Add Ukraine-specific `personal_info` fields (country_of_birth, citizenship).

**`src/components/dashboard/InvitationsView.tsx`** — Add Ukraine option to the dummy dropdown menu (🇺🇦 Ukrainian).

### Result
Clicking "Add Dummy → 🇷🇴 Romanian" in Invitations will instantly create a fully-submitted dummy: employee in `ONBOARDING`, invitation `ACCEPTED` (Completed), and a draft contract — visible across Operations, Contracts, and Invitations views.

