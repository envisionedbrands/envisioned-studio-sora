-- Grant execute permission on use_invite_code function to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.use_invite_code(text) TO anon, authenticated;

-- Also grant execute on check_user_limit to anon users (needed for signup)
GRANT EXECUTE ON FUNCTION public.check_user_limit() TO anon, authenticated;