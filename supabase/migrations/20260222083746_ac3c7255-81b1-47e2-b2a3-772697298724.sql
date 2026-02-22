INSERT INTO invitation_template_fields (field_key, section, label_en, label_sv, is_visible, is_required, sort_order, field_type)
VALUES
  ('swedishCoordinationNumber', '2.2', 'Swedish Coordination Number', 'Svenskt samordningsnummer', true, false, 11.5, 'text'),
  ('swedishPersonalNumber', '2.2', 'Swedish Personal Number', 'Svenskt personnummer', true, false, 11.6, 'text');

-- Fix sort_order to be clean integers
UPDATE invitation_template_fields SET sort_order = 11 WHERE field_key = 'birthday' AND section = '2.2';
UPDATE invitation_template_fields SET sort_order = 12 WHERE field_key = 'swedishCoordinationNumber' AND section = '2.2';
UPDATE invitation_template_fields SET sort_order = 13 WHERE field_key = 'swedishPersonalNumber' AND section = '2.2';
UPDATE invitation_template_fields SET sort_order = 14 WHERE field_key = 'countryOfBirth' AND section = '2.2';
UPDATE invitation_template_fields SET sort_order = 15 WHERE field_key = 'citizenship' AND section = '2.2';
UPDATE invitation_template_fields SET sort_order = 16 WHERE field_key = 'mobilePhone' AND section = '2.2';
UPDATE invitation_template_fields SET sort_order = 17 WHERE field_key = 'email' AND section = '2.2';