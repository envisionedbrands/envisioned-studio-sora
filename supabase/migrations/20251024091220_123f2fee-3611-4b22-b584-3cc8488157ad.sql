-- Update default credits for new users
ALTER TABLE public.profiles 
ALTER COLUMN credits SET DEFAULT 5;

-- Reset all existing users' credits to 5
UPDATE public.profiles 
SET credits = 5;