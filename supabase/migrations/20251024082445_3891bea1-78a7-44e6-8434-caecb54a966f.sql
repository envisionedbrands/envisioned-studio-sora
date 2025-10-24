-- Remove foreign key constraint temporarily to allow manual profile creation
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add it back but make it more flexible
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE 
NOT VALID;