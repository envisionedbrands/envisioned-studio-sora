-- Add UPDATE policy for saved_prompts to complete RLS coverage
CREATE POLICY "Users can update their own saved prompts"
ON public.saved_prompts
FOR UPDATE
USING (auth.uid() = user_id);