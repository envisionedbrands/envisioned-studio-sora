-- Drop the old use_invite_code function and create two new functions

-- Function to check if an invite code is valid without consuming it
CREATE OR REPLACE FUNCTION public.check_invite_code(code_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code_record invite_codes%ROWTYPE;
  rate_limit_result jsonb;
BEGIN
  -- Check rate limit: 10 attempts per hour per code
  rate_limit_result := public.check_rate_limit(
    code_text, 
    'invite_code_validation',
    10,
    60
  );
  
  -- If rate limited, return error
  IF NOT (rate_limit_result->>'allowed')::boolean THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Too many attempts. Please try again later.'
    );
  END IF;
  
  -- Get the invite code
  SELECT * INTO code_record
  FROM public.invite_codes
  WHERE code = code_text
  AND is_active = true;
  
  -- Check if code exists and is valid
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid invite code');
  END IF;
  
  -- Check if code has uses remaining
  IF code_record.current_uses >= code_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invite code has reached maximum uses');
  END IF;
  
  RETURN jsonb_build_object('valid', true);
END;
$$;

-- Function to consume an invite code (increment usage counter)
CREATE OR REPLACE FUNCTION public.consume_invite_code(code_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code_record invite_codes%ROWTYPE;
BEGIN
  -- Get the invite code with lock
  SELECT * INTO code_record
  FROM public.invite_codes
  WHERE code = code_text
  AND is_active = true
  FOR UPDATE;
  
  -- Check if code exists and is valid
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if code has uses remaining
  IF code_record.current_uses >= code_record.max_uses THEN
    RETURN false;
  END IF;
  
  -- Increment usage
  UPDATE public.invite_codes
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE code = code_text;
  
  RETURN true;
END;
$$;