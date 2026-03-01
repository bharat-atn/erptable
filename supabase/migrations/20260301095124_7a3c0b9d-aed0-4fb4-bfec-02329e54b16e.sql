
CREATE OR REPLACE FUNCTION public.enforce_profile_identity_completeness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only enforce when user is updating their OWN profile (not admin/system)
  IF auth.uid() IS NOT NULL AND NEW.user_id = auth.uid() THEN
    -- Only enforce when skip_login_profile is being set to true OR identity fields are being touched
    IF (
      NEW.skip_login_profile = true
      OR NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth
      OR NEW.phone_number IS DISTINCT FROM OLD.phone_number
      OR NEW.nationality IS DISTINCT FROM OLD.nationality
    ) THEN
      IF NEW.date_of_birth IS NULL THEN
        RAISE EXCEPTION 'Date of birth is required.';
      END IF;
      IF NEW.phone_number IS NULL OR trim(NEW.phone_number) = '' THEN
        RAISE EXCEPTION 'Phone number is required.';
      END IF;
      IF NEW.nationality IS NULL OR trim(NEW.nationality) = '' THEN
        RAISE EXCEPTION 'Nationality is required.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enforce_profile_identity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_identity_completeness();
