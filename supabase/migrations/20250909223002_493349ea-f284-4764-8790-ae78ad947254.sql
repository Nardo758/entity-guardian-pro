-- Security fix batch 2: Secure OTPs and phone verifications
DROP POLICY IF EXISTS "otp_select_owner" ON public.otps;
CREATE POLICY "otp_secure_select" ON public.otps
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND expires_at > now()
);

-- Fix phone_verifications table
DROP POLICY IF EXISTS "Users can manage their own phone verifications" ON public.phone_verifications;
CREATE POLICY "phone_verification_secure" ON public.phone_verifications
FOR ALL
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);