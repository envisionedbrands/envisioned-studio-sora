-- Make video-inputs bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'video-inputs';

-- Add RLS policy for users to upload their own images
CREATE POLICY "Users can upload their own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'video-inputs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policy for users to view their own images
CREATE POLICY "Users can view their own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'video-inputs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policy for users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'video-inputs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);