
-- 1. Create pending_role_assignments table
CREATE TABLE public.pending_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL,
  full_name text,
  app_access text[] DEFAULT '{}',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.pending_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pending assignments"
  ON public.pending_role_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Update handle_new_user trigger to check pending assignments
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _pending record;
BEGIN
  -- Create or update profile
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'pending'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email;

  -- Check for pending role assignment
  SELECT * INTO _pending
  FROM public.pending_role_assignments
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF _pending IS NOT NULL THEN
    -- Assign the role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _pending.role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Remove any other roles
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role != _pending.role;

    -- Mark profile as approved
    UPDATE public.profiles
    SET role = 'approved',
        full_name = COALESCE(_pending.full_name, NEW.raw_user_meta_data->>'full_name', NEW.email)
    WHERE user_id = NEW.id;

    -- Copy app access grants
    IF _pending.app_access IS NOT NULL AND array_length(_pending.app_access, 1) > 0 THEN
      INSERT INTO public.user_app_access (user_id, app_id, granted_by)
      SELECT NEW.id, unnest(_pending.app_access), _pending.invited_by;
    END IF;

    -- Delete the pending assignment
    DELETE FROM public.pending_role_assignments WHERE id = _pending.id;
  END IF;

  RETURN NEW;
END;
$function$;
