-- Add org_ids column to pending_role_assignments for storing pre-selected organizations
ALTER TABLE public.pending_role_assignments ADD COLUMN IF NOT EXISTS org_ids uuid[] DEFAULT '{}';

-- Update handle_new_user trigger to also create org_members from pending assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending RECORD;
  org_id_val uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'pending'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      last_sign_in_at = now();

  -- Check for pending role assignment
  SELECT * INTO pending
  FROM public.pending_role_assignments
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;

  IF FOUND THEN
    -- Assign role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, pending.role)
    ON CONFLICT DO NOTHING;

    -- Update profile to approved
    UPDATE public.profiles
    SET role = 'approved',
        full_name = COALESCE(pending.full_name, profiles.full_name)
    WHERE user_id = NEW.id;

    -- Grant app access
    IF pending.app_access IS NOT NULL AND array_length(pending.app_access, 1) > 0 THEN
      INSERT INTO public.user_app_access (user_id, app_id, granted_by)
      SELECT NEW.id, unnest(pending.app_access), pending.invited_by
      ON CONFLICT DO NOTHING;
    END IF;

    -- Create org memberships
    IF pending.org_ids IS NOT NULL AND array_length(pending.org_ids, 1) > 0 THEN
      FOREACH org_id_val IN ARRAY pending.org_ids LOOP
        INSERT INTO public.org_members (org_id, user_id, role)
        VALUES (org_id_val, NEW.id, 'member')
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;

    -- Remove pending assignment
    DELETE FROM public.pending_role_assignments WHERE id = pending.id;
  END IF;

  RETURN NEW;
END;
$$;