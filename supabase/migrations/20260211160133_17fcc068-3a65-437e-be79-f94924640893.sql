
-- Table to store invitation form template field configuration
CREATE TABLE public.invitation_template_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text NOT NULL UNIQUE,
  section text NOT NULL,
  label_en text NOT NULL,
  label_sv text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  field_type text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitation_template_fields ENABLE ROW LEVEL SECURITY;

-- HR staff can read
CREATE POLICY "HR staff can view invitation_template_fields"
  ON public.invitation_template_fields FOR SELECT
  USING (is_hr_user());

-- HR staff can update
CREATE POLICY "HR staff can update invitation_template_fields"
  ON public.invitation_template_fields FOR UPDATE
  USING (is_hr_user());

-- HR staff can insert
CREATE POLICY "HR staff can insert invitation_template_fields"
  ON public.invitation_template_fields FOR INSERT
  WITH CHECK (is_hr_user());

-- Public read for onboarding portal (anonymous candidates need to know field config)
CREATE POLICY "Anyone can read invitation_template_fields"
  ON public.invitation_template_fields FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_invitation_template_fields_updated_at
  BEFORE UPDATE ON public.invitation_template_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default fields
INSERT INTO public.invitation_template_fields (field_key, section, label_en, label_sv, is_visible, is_required, sort_order, field_type) VALUES
  ('firstName', '2.1', 'First Name', 'Förnamn', true, true, 1, 'text'),
  ('middleName', '2.1', 'Middle Name', 'Mellannamn', true, false, 2, 'text'),
  ('lastName', '2.1', 'Last Name', 'Efternamn', true, true, 3, 'text'),
  ('preferredName', '2.1', 'Preferred Name', 'Tilltalsnamn', true, true, 4, 'text'),
  ('address1', '2.1', 'Address 1', 'Adress 1', true, true, 5, 'text'),
  ('address2', '2.1', 'Address 2', 'Adress 2', true, false, 6, 'text'),
  ('zipCode', '2.1', 'ZIP / Postal Code', 'Postnummer', true, true, 7, 'text'),
  ('city', '2.1', 'City', 'Ort', true, true, 8, 'text'),
  ('stateProvince', '2.1', 'State / Province', 'Län / Region', true, true, 9, 'text'),
  ('country', '2.1', 'Country', 'Land', true, true, 10, 'select'),
  ('birthday', '2.2', 'Birthday', 'Födelsedag', true, true, 11, 'date'),
  ('countryOfBirth', '2.2', 'Country of Birth', 'Födelseland', true, true, 12, 'select'),
  ('citizenship', '2.2', 'Citizenship', 'Medborgarskap', true, true, 13, 'select'),
  ('mobilePhone', '2.2', 'Mobile Phone Number', 'Mobiltelefon', true, true, 14, 'tel'),
  ('email', '2.2', 'Email', 'E-post', true, true, 15, 'email'),
  ('emergencyFirstName', '2.3', 'Emergency Contact First Name', 'Förnamn', true, true, 16, 'text'),
  ('emergencyLastName', '2.3', 'Emergency Contact Last Name', 'Efternamn', true, true, 17, 'text'),
  ('emergencyPhone', '2.3', 'Emergency Contact Mobile Phone', 'Mobiltelefon', true, true, 18, 'tel'),
  ('bankName', '3', 'Bank Selection', 'Bankval', true, true, 19, 'bank'),
  ('bicCode', '3', 'BIC Code', 'BIC-kod', true, true, 20, 'text'),
  ('bankAccountNumber', '3', 'Bank Account Number', 'Kontonummer', true, true, 21, 'text'),
  ('idDocument', '4', 'ID / Passport Document', 'ID- / Passdokument', true, true, 22, 'file');
