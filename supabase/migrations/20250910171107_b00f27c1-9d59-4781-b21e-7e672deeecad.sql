-- SECURITY FIX: Restrict admin_users table access
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated access to admin_users" ON public.admin_users;

-- Create secure policies that only allow access to authenticated admin users
-- For now, we'll make it completely private since the frontend uses hardcoded auth
CREATE POLICY "Restrict admin_users access - no public access" 
ON public.admin_users 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Add a comment explaining the security measure
COMMENT ON TABLE public.admin_users IS 'Admin credentials table - access restricted for security. Use proper authentication system instead of direct table access.';