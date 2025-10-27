-- Add RLS policies for invite_codes table

-- Allow service role to manage invite codes (needed for the use_invite_code function)
CREATE POLICY "Service role can manage invite codes"
ON public.invite_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to check if codes exist (read-only for validation)
CREATE POLICY "Users can view active invite codes"
ON public.invite_codes
FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow admins to fully manage invite codes
CREATE POLICY "Admins can manage invite codes"
ON public.invite_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));