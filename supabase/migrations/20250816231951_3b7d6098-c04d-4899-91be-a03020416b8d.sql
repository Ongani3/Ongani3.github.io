BEGIN;

-- Fix search_path for handle_sale_deletion and harden function
CREATE OR REPLACE FUNCTION public.handle_sale_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Update customer totals for registered sales
  IF OLD.is_registered_customer = true AND OLD.customer_user_id IS NOT NULL THEN
    UPDATE public.customers 
    SET 
      total_spent = GREATEST(0, total_spent - OLD.amount),
      points = GREATEST(0, points - FLOOR(OLD.amount)),
      updated_at = NOW()
    WHERE customer_user_id = OLD.customer_user_id;
  END IF;

  RETURN OLD;
END;
$$;

-- Ensure realtime emits complete row data
ALTER TABLE public.sales REPLICA IDENTITY FULL;
ALTER TABLE public.daily_sales_summary REPLICA IDENTITY FULL;

-- Add tables to realtime publication (idempotent)
DO $$ BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sales';
  EXCEPTION WHEN duplicate_object THEN
    -- already added
    NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_sales_summary';
  EXCEPTION WHEN duplicate_object THEN
    -- already added
    NULL;
  END;
END $$;

COMMIT;