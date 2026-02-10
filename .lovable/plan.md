

# Fix: Unify Employee Register with Operations (Add Missing CRUD)

## The Problem

The **Operations** view already has full CRUD functionality (Add Employee, Add Dummy, Edit, Delete). However, the **Employees** sidebar item points to a completely separate `EmployeesView` component that is read-only -- no add, edit, delete, or dummy generation buttons.

Since Operations and Employee Register are the same feature, we should unify them.

## Solution

**Replace the separate EmployeesView with the OperationsView** so there is one unified employee register with all CRUD functionality, accessible from the sidebar.

### Option: Remove the duplicate "Employees" sidebar item

Since "Operations" already serves as the employee register with full CRUD, we will:

1. **Remove the "Employees" sidebar item** to avoid confusion -- clicking "Operations" is the single entry point for managing employees.
2. **Redirect the "employees" view case** in `Dashboard.tsx` to render `OperationsView` instead, as a safety net in case anything references it.

### Files to Modify

- **`src/components/dashboard/Sidebar.tsx`** -- Remove the "Employees" menu item from the sidebar navigation since Operations already covers this.
- **`src/components/dashboard/Dashboard.tsx`** -- Change the `"employees"` case to render `<OperationsView />` instead of `<EmployeesView />`, keeping backward compatibility.

### What Already Works (No Changes Needed)

The `OperationsView.tsx` already includes:
- **Add Employee** button (opens the form dialog)
- **Add Dummy** button (generates random Sweden/Romania/Thailand employees)
- **Edit** via the row dropdown menu
- **Delete** via the row dropdown menu with confirmation dialog
- Search, pagination, and stats cards

This is a minimal 2-file change that eliminates the confusion of having two separate employee views.
