

## Analysis: Ukrainian Person Not Appearing in Invitations

### What Happened

After investigating the database, here's the timeline:

1. **01:25 UTC** — A Ukrainian dummy employee (`mykola.bondarenko@example.com`) was successfully created along with an invitation.
2. **01:29 UTC** — All invitations and employees were bulk-deleted (3 invitations + 3 employees removed at the same time).
3. **02:01 UTC** — The "Seed Default Banks" button was clicked, inserting 15+ banks (including 5 Ukrainian banks) into the registry. These bank INSERT entries are what appears in the audit log.
4. **No new employee/invitation has been created since the bulk delete.**

The audit log entries you're seeing are from the **bank seeding**, not from creating a person. The Ukrainian dummy you created earlier was removed in the bulk delete at 01:29.

### Fix

No code change is needed. The Ukrainian dummy flow works correctly. You just need to:

1. Go to the **Invitations** view.
2. Click **Add Dummy → 🇺🇦 Ukrainian**.
3. The Ukrainian employee and invitation will appear in the list.

The previous Ukrainian entry was deleted during a bulk delete operation. Creating a new one will work as expected.

