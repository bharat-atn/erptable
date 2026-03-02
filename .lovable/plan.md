

## Plan: Fix Login Events Not Appearing in Audit Log

### Problem
The `log_auth_event` database function inserts into `audit_log` without providing an `org_id` value. Since the `org_id` column was made `NOT NULL` in a later migration, the INSERT silently fails for all login/logout events. This is why Yash Gandhi's login (and likely recent logins from other users too) doesn't appear.

The last successful LOGIN entries are from Feb 28 -- before the `NOT NULL` constraint was added.

### Fix

**Database migration** -- Update the `log_auth_event` function to look up the user's `current_org_id` from `profiles` and include it in the INSERT. For users without a profile or org yet, fall back to a default organization.

```sql
CREATE OR REPLACE FUNCTION public.log_auth_event(
  _action text, _user_id uuid, _user_email text, _summary text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
BEGIN
  -- Get user's current org from profile
  SELECT current_org_id INTO _org_id
  FROM public.profiles WHERE user_id = _user_id;

  -- Fallback to any org they belong to
  IF _org_id IS NULL THEN
    SELECT org_id INTO _org_id
    FROM public.org_members WHERE user_id = _user_id LIMIT 1;
  END IF;

  -- Last resort: first org in system
  IF _org_id IS NULL THEN
    SELECT id INTO _org_id FROM public.organizations LIMIT 1;
  END IF;

  INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, org_id)
  VALUES (_user_id, _user_email, _action, 'auth', _user_id::text,
          COALESCE(_summary, _action || ' by ' || COALESCE(_user_email, 'unknown')),
          _org_id);
END;
$$;
```

### Result
- All login/logout events will be correctly recorded in the audit log with a valid `org_id`
- Yash Gandhi's future logins will appear immediately
- No code changes needed -- only the database function needs updating

