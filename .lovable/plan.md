

## Two Issues

### Issue 1: Dorin disappeared from the user list
This is expected and correct behavior. The orphan cleanup deleted his old (broken) auth account and created a `pending_role_assignment` entry preserving his role (`org_admin`) and 5 app permissions. When Dorin signs in with Google, the system will automatically create a fresh profile, assign his role, and grant his app access. He will reappear in the user list as a fully approved user. No code change needed.

### Issue 2: Delete button for pending users does not work
The trash icon triggers `deleteProfileMutation`, which calls `supabase.from("profiles").delete()`. However, the `profiles` table has **no RLS policy allowing DELETE**. The operation silently fails every time.

**Fix:** Add an RLS policy on the `profiles` table allowing admins to delete profiles.

```sql
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
```

This single migration will make the existing delete button functional. The `DeleteConfirmDialog` with typed "DELETE" confirmation is already wired up correctly in the UI.

