
-- Add audit triggers to tables that currently lack them

CREATE TRIGGER audit_positions
  AFTER INSERT OR UPDATE OR DELETE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_skill_groups
  AFTER INSERT OR UPDATE OR DELETE ON public.skill_groups
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_agreement_periods
  AFTER INSERT OR UPDATE OR DELETE ON public.agreement_periods
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_contract_schedules
  AFTER INSERT OR UPDATE OR DELETE ON public.contract_schedules
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_contract_id_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.contract_id_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_employee_id_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_id_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_invitation_template_fields
  AFTER INSERT OR UPDATE OR DELETE ON public.invitation_template_fields
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
