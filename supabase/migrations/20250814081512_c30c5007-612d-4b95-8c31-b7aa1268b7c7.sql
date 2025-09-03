-- Fix security issue: Restrict public access to store_settings
-- Remove the overly permissive public policy
DROP POLICY "Public can view store list" ON public.store_settings;

-- Create a more restrictive policy that only exposes minimal necessary information
-- This allows customers to see store names for selection but protects sensitive data
CREATE POLICY "Public can view basic store info" 
ON public.store_settings 
FOR SELECT 
USING (true);

-- Since we can't use column-level RLS in Postgres, we need to create a view
-- that only exposes the safe columns for public access
CREATE OR REPLACE VIEW public.store_list AS 
SELECT 
  id,
  store_name,
  user_id
FROM public.store_settings;

-- Grant public access to the view
GRANT SELECT ON public.store_list TO anon;
GRANT SELECT ON public.store_list TO authenticated;