

## Plan: Seed a Company into Sandbox Data

### Problem
The `seed-sandbox-data` edge function seeds employees, invitations, and contracts but never creates a **company** record. When trying to build a contract in the sandbox, the contract wizard finds no company to select.

### Solution
Update the `seed-sandbox-data` edge function to also insert a company that mirrors the production organization's company. This ensures the sandbox is fully functional for contract creation.

### Changes

**`supabase/functions/seed-sandbox-data/index.ts`**

1. Add a `SEED_COMPANY` constant with realistic Swedish company data (matching the production company pattern — name, org number, address, bankgiro, CEO, etc.).

2. In the reset flow (`resetFirst`), also delete from `companies` for the sandbox org before re-seeding.

3. After the reset/before employee insertion, insert the seed company into the `companies` table with `org_id = sandboxOrgId`.

4. Use the inserted company's `id` as `company_id` when creating draft contracts for ONBOARDING employees, so contracts are properly linked to the company.

5. Return the company count in the response JSON.

### Seed Company Data
A single company will be seeded with fields like:
- name, org_number, address, postcode, city, country, phone, email, website, bankgiro, ceo_name, company_type

### No database changes needed
The `companies` table already exists with the correct schema and RLS policies.

