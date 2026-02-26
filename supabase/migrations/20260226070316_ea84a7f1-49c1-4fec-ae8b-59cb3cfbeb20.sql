
-- 1. Restore Ove's admin role
UPDATE user_roles SET role = 'admin' WHERE user_id = '077d0153-5c56-40e5-8a3d-e887c8cb14e3' AND role != 'admin';

-- 2. Add self-demotion protection to assign_user_role
CREATE OR REPLACE FUNCTION public.assign_user_role(
  _target_user_id uuid,
  _new_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;

  -- Prevent self-demotion
  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  -- Upsert: update existing or insert new
  INSERT INTO user_roles (user_id, role)
  VALUES (_target_user_id, _new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove any other roles
  DELETE FROM user_roles 
  WHERE user_id = _target_user_id AND role != _new_role;

  -- Ensure the target role exists
  INSERT INTO user_roles (user_id, role)
  VALUES (_target_user_id, _new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
