-- Increase max uses for BETA2025 invite code to 50
UPDATE public.invite_codes
SET max_uses = 50
WHERE code = 'BETA2025';