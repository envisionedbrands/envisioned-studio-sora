-- Add category column to saved_prompts table
ALTER TABLE public.saved_prompts ADD COLUMN category TEXT DEFAULT 'Uncategorized';