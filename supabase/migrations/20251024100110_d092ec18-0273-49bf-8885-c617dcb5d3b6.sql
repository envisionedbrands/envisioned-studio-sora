-- Fix critical security issues

-- 1. Remove dangerous public SELECT policy on invite_codes
DROP POLICY IF EXISTS "Anyone can check invite codes" ON public.invite_codes;

-- Note: The use_invite_code function has SECURITY DEFINER so it can still access the table
-- This prevents code enumeration while maintaining validation functionality

-- 2. Add missing INSERT policy on profiles table for safety net
CREATE POLICY "Users can create own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);