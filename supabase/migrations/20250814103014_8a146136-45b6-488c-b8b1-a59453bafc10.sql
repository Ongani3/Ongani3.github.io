-- Remove the public policy that exposes promotion details to everyone
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;

-- Create a more secure policy for authenticated users to view promotions
-- This allows authenticated customers to see active promotions without exposing sensitive business data
CREATE POLICY "Authenticated users can view basic promotion info" 
ON public.promotions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true 
  AND now() >= start_date 
  AND now() <= end_date
);

-- Store owners can still view all their own promotions (existing policy remains)
-- This maintains full access for business owners to manage their promotions