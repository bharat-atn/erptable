-- Make signatures bucket public so contract preview can display them
UPDATE storage.buckets SET public = true WHERE id = 'signatures';

-- Ensure a public SELECT policy exists
CREATE POLICY "Public read access to signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');