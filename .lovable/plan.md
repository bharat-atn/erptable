

## Contracts View Enhancements

Two changes to the Contracts list view:

### 1. Add Contract Code column (leftmost)
Move the contract number (`contract_code`) to the first column in the table, before Employee. The column header will be "Contract No." so users can immediately identify which contract they're looking at.

### 2. "Continue" action to resume draft contracts
Add a clickable action on each row (or a "Continue" button) for contracts with `status = 'draft'`. Clicking it will navigate the user into the Contract Template wizard, pre-loaded with the existing contract data so they can pick up where they left off.

---

### Technical Details

**File: `src/components/dashboard/ContractsView.tsx`**
- Add a "Contract No." column as the first `<th>` in the table header
- Display `contract.contract_code` in each row's first `<td>`
- Add an "Actions" column on the far right with a "Continue" button for draft contracts
- The "Continue" button will call a callback prop (e.g., `onContinueContract(contractId)`) to switch the dashboard view

**File: `src/components/dashboard/Dashboard.tsx`**
- Pass `onContinueContract` callback from Dashboard to ContractsView
- When triggered, switch to `contract-template` view and pass the contract ID so the wizard loads the existing draft

**File: `src/components/dashboard/ContractTemplateView.tsx`**
- Accept an optional `resumeContractId` prop
- When provided, fetch the existing contract (with its `form_data`, `company_id`, `employee_id`) and pre-populate all wizard state from it
- Set the wizard step based on how far the user previously progressed (derive from `form_data` contents)

**File: `src/components/dashboard/ContractsView.tsx` (table reorder)**
- Column order: Contract No. | Employee | Employer | Season | Start Date | End Date | Salary | Status | Actions

The "Employer" column will be added by joining `companies` via `company_id` in the query (already available as a foreign key on the contracts table). This matches the user's request to show the employer to the right of the contract number.

