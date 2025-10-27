-- Create table for OTP verification codes
CREATE TABLE public.otp_verification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_verification ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert OTP codes (for registration)
CREATE POLICY "Anyone can create OTP codes" 
ON public.otp_verification 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow users to verify their own OTP codes
CREATE POLICY "Anyone can verify OTP codes" 
ON public.otp_verification 
FOR SELECT 
USING (true);

-- Create policy to allow updating verification status
CREATE POLICY "Anyone can update OTP verification status" 
ON public.otp_verification 
FOR UPDATE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_otp_email ON public.otp_verification(email);
CREATE INDEX idx_otp_code ON public.otp_verification(code);

-- Create function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_verification
  WHERE expires_at < now();
END;
$$;