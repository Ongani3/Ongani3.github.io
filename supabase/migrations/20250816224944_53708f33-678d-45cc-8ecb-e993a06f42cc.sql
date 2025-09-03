-- Create trigger to update customer data when sales are recorded
CREATE TRIGGER update_customer_from_sale_trigger
    AFTER INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_customer_from_sale();

-- Create trigger to update daily sales summary when sales are recorded
CREATE TRIGGER update_daily_sales_summary_trigger
    AFTER INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_daily_sales_summary();

-- Manually update the existing Prod. Onga customer record to reflect the K2000.00 sale
UPDATE public.customers 
SET 
  total_spent = total_spent + 2000,
  points = points + 2000, -- 1 point per ZMW spent
  last_visit = NOW(),
  updated_at = NOW()
WHERE customer_user_id = '5a66bf07-4322-4625-a1ac-652788cecddf';