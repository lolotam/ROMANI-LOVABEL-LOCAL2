-- SECURITY FIX: Fix function search_path vulnerabilities
-- Update all three functions to use secure search_path settings

-- 1. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

-- 2. Fix calculate_document_status function  
CREATE OR REPLACE FUNCTION public.calculate_document_status(expiry_date date)
RETURNS document_status AS $$
BEGIN
  IF expiry_date IS NULL THEN
    RETURN 'valid';
  ELSIF expiry_date < CURRENT_DATE THEN
    RETURN 'expired';
  ELSIF expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    RETURN 'expiring_soon';
  ELSE
    RETURN 'valid';
  END IF;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

-- 3. Fix update_document_status function
CREATE OR REPLACE FUNCTION public.update_document_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status = public.calculate_document_status(NEW.expiry_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;