-- Fix the security definer view issue
DROP VIEW IF EXISTS public.store_list;

-- Remove the public policy entirely - customers should authenticate to access store info
DROP POLICY IF EXISTS "Public can view basic store info" ON public.store_settings;

-- This means only authenticated users can see stores, which is better security
-- Store owners can still see their own full settings
-- Customers will need to authenticate to see store listings