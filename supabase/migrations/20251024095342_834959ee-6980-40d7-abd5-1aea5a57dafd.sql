-- Create function to check if user limit is reached
CREATE OR REPLACE FUNCTION public.check_user_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count total users in profiles table
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Return true if under limit, false if at or over limit
  RETURN user_count < 20;
END;
$$;