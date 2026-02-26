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

  -- Upsert: update existing or insert new
  INSERT INTO user_roles (user_id, role)
  VALUES (_target_user_id, _new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If the role is different from existing, delete old and insert new
  DELETE FROM user_roles 
  WHERE user_id = _target_user_id AND role != _new_role;

  -- Ensure the target role exists
  INSERT INTO user_roles (user_id, role)
  VALUES (_target_user_id, _new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;