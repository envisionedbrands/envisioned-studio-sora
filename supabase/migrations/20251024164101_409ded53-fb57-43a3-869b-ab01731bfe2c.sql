-- Add fail_reason column to videos table to store failure messages
ALTER TABLE public.videos ADD COLUMN fail_reason TEXT;