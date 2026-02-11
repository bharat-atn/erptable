-- Allow HR staff to delete invitations
CREATE POLICY "HR staff can delete invitations"
  ON public.invitations
  FOR DELETE
  USING (is_hr_user());
