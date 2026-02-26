
-- Migrate existing hr_admin -> hr_manager and hr_staff -> user
UPDATE public.user_roles SET role = 'hr_manager' WHERE role = 'hr_admin';
UPDATE public.user_roles SET role = 'user' WHERE role = 'hr_staff';

-- Update is_hr_user() to use new role values
CREATE OR REPLACE FUNCTION public.is_hr_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'org_admin', 'hr_manager')
  )
$function$;

-- Update audit_log RLS policy to use hr_manager instead of hr_admin
DROP POLICY IF EXISTS "Admins can view audit_log" ON public.audit_log;
CREATE POLICY "Admins can view audit_log" ON public.audit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'hr_manager'::app_role));
