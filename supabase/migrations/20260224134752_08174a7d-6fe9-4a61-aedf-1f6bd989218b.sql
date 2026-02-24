-- Allow unauthenticated users to upload employee signatures
CREATE POLICY "Anyone can upload employee signatures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'signatures' 
  AND (storage.foldername(name))[1] = 'employee'
);

-- Allow unauthenticated users to update (upsert) employee signatures
CREATE POLICY "Anyone can update employee signatures"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'signatures' 
  AND (storage.foldername(name))[1] = 'employee'
)
WITH CHECK (
  bucket_id = 'signatures' 
  AND (storage.foldername(name))[1] = 'employee'
);