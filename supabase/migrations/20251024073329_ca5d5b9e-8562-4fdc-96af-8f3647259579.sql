-- Create storage bucket for video input images
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-inputs', 'video-inputs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for video inputs
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-inputs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-inputs');

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'video-inputs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);