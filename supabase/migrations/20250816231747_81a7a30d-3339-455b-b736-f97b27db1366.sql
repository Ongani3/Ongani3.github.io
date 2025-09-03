-- Create triggers to handle sales deletion and update totals accordingly
BEGIN;

-- 1) Function to handle daily sales summary updates on DELETE
CREATE OR REPLACE FUNCTION public.handle_sale_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily_sales_summary by subtracting the deleted sale
  UPDATE public.daily_sales_summary
  SET 
    total_amount = total_amount - OLD.amount,
    registered_customer_sales = registered_customer_sales - 
      CASE WHEN OLD.is_registered_customer THEN OLD.amount ELSE 0 END,
    unregistered_customer_sales = unregistered_customer_sales - 
      CASE WHEN OLD.is_registered_customer THEN 0 ELSE OLD.amount END,
    transaction_count = transaction_count - 1
  WHERE store_user_id = OLD.store_user_id 
    AND sale_date = OLD.sale_date;
    
  -- If this was a registered customer sale, update customer totals
  IF OLD.is_registered_customer = true AND OLD.customer_user_id IS NOT NULL THEN
    UPDATE public.customers 
    SET 
      total_spent = total_spent - OLD.amount,
      points = points - FLOOR(OLD.amount),
      updated_at = NOW()
    WHERE customer_user_id = OLD.customer_user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Create trigger for sales deletion
DROP TRIGGER IF EXISTS handle_sale_deletion_trigger ON public.sales;
CREATE TRIGGER handle_sale_deletion_trigger
  AFTER DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_sale_deletion();

-- 3) Ensure the insert triggers exist (in case they were missing)
DROP TRIGGER IF EXISTS update_daily_sales_summary_trigger ON public.sales;
CREATE TRIGGER update_daily_sales_summary_trigger
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_sales_summary();

DROP TRIGGER IF EXISTS update_customer_from_sale_trigger ON public.sales;
CREATE TRIGGER update_customer_from_sale_trigger
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_from_sale();

COMMIT;