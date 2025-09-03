-- Fix security warnings: Set search path for functions
CREATE OR REPLACE FUNCTION public.update_daily_sales_summary_with_refunds()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle refund processing
  IF TG_TABLE_NAME = 'refunds' THEN
    -- Subtract refund from daily summary
    UPDATE public.daily_sales_summary
    SET 
      total_amount = total_amount - NEW.refund_amount,
      registered_customer_sales = CASE 
        WHEN EXISTS (SELECT 1 FROM sales WHERE id = NEW.original_sale_id AND is_registered_customer = true)
        THEN registered_customer_sales - NEW.refund_amount
        ELSE registered_customer_sales
      END,
      unregistered_customer_sales = CASE 
        WHEN EXISTS (SELECT 1 FROM sales WHERE id = NEW.original_sale_id AND is_registered_customer = false)
        THEN unregistered_customer_sales - NEW.refund_amount
        ELSE unregistered_customer_sales
      END
    WHERE store_user_id = NEW.store_user_id 
      AND sale_date = NEW.refund_date;
      
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';