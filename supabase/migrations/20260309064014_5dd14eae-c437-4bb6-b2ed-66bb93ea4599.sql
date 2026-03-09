
INSERT INTO agreement_periods (org_id, position_id, skill_group_id, hourly_rate, monthly_rate, period_label, age_group)
SELECT DISTINCT ap.org_id,
  'a510451e-eadc-4e9e-9eaf-a12b1e0a4db6'::uuid,
  '52b3674a-0931-428d-ae58-405fe2689441'::uuid,
  v.hourly, v.monthly, v.period_label, v.age_group
FROM agreement_periods ap
CROSS JOIN (VALUES
  (157.36, 27381, '2025/2026', '19_plus'),
  (162.88, 28344, '2026/2027', '19_plus'),
  (124.00, 0, '2025/2026', '16'),
  (128.35, 0, '2026/2027', '16'),
  (131.72, 0, '2025/2026', '17'),
  (136.34, 0, '2026/2027', '17'),
  (139.43, 0, '2025/2026', '18'),
  (144.32, 0, '2026/2027', '18')
) AS v(hourly, monthly, period_label, age_group)
WHERE ap.position_id = 'a510451e-eadc-4e9e-9eaf-a12b1e0a4db6'::uuid
LIMIT 1;
