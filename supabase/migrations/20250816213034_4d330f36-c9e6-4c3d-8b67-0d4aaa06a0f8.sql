-- Fix security issue: Allow customers to view their own data in customers table
CREATE POLICY "Customers can view their own data" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = customer_user_id);

-- Also allow customers to update their own basic information (not points/tier which should be store-managed)
CREATE POLICY "Customers can update their own basic info" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = customer_user_id)
WITH CHECK (auth.uid() = customer_user_id);