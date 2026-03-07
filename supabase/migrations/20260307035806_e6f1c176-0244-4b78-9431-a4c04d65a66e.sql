CREATE POLICY "HR can update employer signatures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = 'employer' AND (SELECT public.is_hr_user()))
WITH CHECK (bucket_id = 'signatures' AND (storage.foldername(name))[1] = 'employer' AND (SELECT public.is_hr_user()));