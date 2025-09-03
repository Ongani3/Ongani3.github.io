-- Fix function search path for update_daily_sales_summary
CREATE OR REPLACE FUNCTION public.update_daily_sales_summary()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update daily summary
  INSERT INTO public.daily_sales_summary (
    store_user_id, 
    sale_date, 
    total_amount, 
    registered_customer_sales, 
    unregistered_customer_sales, 
    transaction_count
  )
  VALUES (
    NEW.store_user_id,
    NEW.sale_date,
    NEW.amount,
    CASE WHEN NEW.is_registered_customer THEN NEW.amount ELSE 0 END,
    CASE WHEN NOT NEW.is_registered_customer THEN NEW.amount ELSE 0 END,
    1
  )
  ON CONFLICT (store_user_id, sale_date)
  DO UPDATE SET
    total_amount = daily_sales_summary.total_amount + NEW.amount,
    registered_customer_sales = daily_sales_summary.registered_customer_sales + 
      CASE WHEN NEW.is_registered_customer THEN NEW.amount ELSE 0 END,
    unregistered_customer_sales = daily_sales_summary.unregistered_customer_sales + 
      CASE WHEN NOT NEW.is_registered_customer THEN NEW.amount ELSE 0 END,
    transaction_count = daily_sales_summary.transaction_count + 1;
    
  RETURN NEW;
END;
$$;