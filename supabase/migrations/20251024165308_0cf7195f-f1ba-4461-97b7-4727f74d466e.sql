-- Create saved_prompts table for users to save and reuse prompts
CREATE TABLE public.saved_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  title TEXT,
  source_video_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_prompts
CREATE POLICY "Users can view their own saved prompts"
ON public.saved_prompts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved prompts"
ON public.saved_prompts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved prompts"
ON public.saved_prompts
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_prompts_user_id ON public.saved_prompts(user_id);