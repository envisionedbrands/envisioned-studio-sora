-- Create rate_limits table for tracking API usage
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  attempts int DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(identifier, action)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits FOR ALL
USING (auth.role() = 'service_role');

-- Create function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _action text,
  _max_attempts int,
  _window_minutes int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_record rate_limits%ROWTYPE;
  _window_expired boolean;
  _attempts_remaining int;
BEGIN
  -- Try to get existing rate limit record
  SELECT * INTO _current_record
  FROM public.rate_limits
  WHERE identifier = _identifier
    AND action = _action
  FOR UPDATE;
  
  -- Check if window has expired
  _window_expired := (
    _current_record.window_start IS NULL OR 
    _current_record.window_start + (_window_minutes || ' minutes')::interval < now()
  );
  
  IF _current_record.id IS NULL THEN
    -- First attempt - create new record
    INSERT INTO public.rate_limits (identifier, action, attempts, window_start)
    VALUES (_identifier, _action, 1, now())
    RETURNING * INTO _current_record;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'attempts_remaining', _max_attempts - 1,
      'reset_at', _current_record.window_start + (_window_minutes || ' minutes')::interval
    );
    
  ELSIF _window_expired THEN
    -- Window expired - reset counter
    UPDATE public.rate_limits
    SET attempts = 1, window_start = now()
    WHERE identifier = _identifier AND action = _action
    RETURNING * INTO _current_record;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'attempts_remaining', _max_attempts - 1,
      'reset_at', _current_record.window_start + (_window_minutes || ' minutes')::interval
    );
    
  ELSIF _current_record.attempts >= _max_attempts THEN
    -- Over limit
    RETURN jsonb_build_object(
      'allowed', false,
      'attempts_remaining', 0,
      'reset_at', _current_record.window_start + (_window_minutes || ' minutes')::interval
    );
    
  ELSE
    -- Within window and under limit - increment
    UPDATE public.rate_limits
    SET attempts = attempts + 1
    WHERE identifier = _identifier AND action = _action
    RETURNING * INTO _current_record;
    
    _attempts_remaining := _max_attempts - _current_record.attempts;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'attempts_remaining', _attempts_remaining,
      'reset_at', _current_record.window_start + (_window_minutes || ' minutes')::interval
    );
  END IF;
END;
$$;

-- Update use_invite_code function to include rate limiting
CREATE OR REPLACE FUNCTION public.use_invite_code(code_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- If rate limited, return false
  IF NOT (rate_limit_result->>'allowed')::boolean THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later.';
  END IF;
  
  -- Get the invite code
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

-- Create cleanup function to remove old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits
  WHERE created_at < now() - interval '7 days';
$$;