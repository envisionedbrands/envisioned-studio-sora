-- Create invite codes table
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  max_uses integer NOT NULL DEFAULT 1,
  current_uses integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check if a code is valid (read-only for validation)
CREATE POLICY "Anyone can check invite codes"
ON public.invite_codes
FOR SELECT
USING (true);

-- Create function to validate and use invite code
CREATE OR REPLACE FUNCTION public.use_invite_code(code_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record invite_codes%ROWTYPE;
BEGIN
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

-- Insert a beta test invite code with 10 uses
INSERT INTO public.invite_codes (code, max_uses, is_active)
VALUES ('BETA2025', 10, true);