-- Remove the overly permissive public policy for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a more secure policy that allows authenticated users to view profiles
-- This allows users to see other users' basic profile info (display_name, avatar) when needed
-- but only if they are authenticated themselves
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Users can still update their own profile (existing policy)
-- Users can still insert their own profile (existing policy)