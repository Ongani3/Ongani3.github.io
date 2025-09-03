
BEGIN;

-- 0) Safety: unique index for daily sales upsert
CREATE UNIQUE INDEX IF NOT EXISTS daily_sales_summary_store_date_uidx
ON public.daily_sales_summary (store_user_id, sale_date);

-- 1) Ensure updated-at trigger function exists (already present)
--    Create BEFORE UPDATE triggers to populate updated_at
DROP TRIGGER IF EXISTS set_updated_at_customers ON public.customers;
CREATE TRIGGER set_updated_at_customers
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_sales ON public.sales;
CREATE TRIGGER set_updated_at_sales
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Ensure the insert functions are safe and search_path set (already present)
--    Recreate triggers for INSERT (idempotent)
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

-- 3) Handle DELETE properly (already defined function; ensure trigger)
DROP TRIGGER IF EXISTS handle_sale_deletion_trigger ON public.sales;
CREATE TRIGGER handle_sale_deletion_trigger
AFTER DELETE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_sale_deletion();

-- 4) Handle UPDATEs (amount/date/customer/payment changes) by applying deltas
CREATE OR REPLACE FUNCTION public.handle_sale_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  reg_old numeric := CASE WHEN OLD.is_registered_customer THEN OLD.amount ELSE 0 END;
  reg_new numeric := CASE WHEN NEW.is_registered_customer THEN NEW.amount ELSE 0 END;
  unreg_old numeric := CASE WHEN NOT OLD.is_registered_customer THEN OLD.amount ELSE 0 END;
  unreg_new numeric := CASE WHEN NOT NEW.is_registered_customer THEN NEW.amount ELSE 0 END;
BEGIN
  -- If sale moved to a different store/date bucket, subtract from OLD bucket and add to NEW bucket
  IF OLD.store_user_id <> NEW.store_user_id OR OLD.sale_date <> NEW.sale_date THEN
    -- Subtract from old bucket
    UPDATE public.daily_sales_summary
    SET
      total_amount = total_amount - OLD.amount,
      registered_customer_sales = registered_customer_sales - reg_old,
      unregistered_customer_sales = unregistered_customer_sales - unreg_old,
      transaction_count = GREATEST(0, transaction_count - 1)
    WHERE store_user_id = OLD.store_user_id
      AND sale_date = OLD.sale_date;

    -- Add to new bucket (upsert)
    INSERT INTO public.daily_sales_summary (
      store_user_id, sale_date, total_amount, registered_customer_sales, unregistered_customer_sales, transaction_count
    )
    VALUES (NEW.store_user_id, NEW.sale_date, NEW.amount, reg_new, unreg_new, 1)
    ON CONFLICT (store_user_id, sale_date)
    DO UPDATE SET
      total_amount = daily_sales_summary.total_amount + EXCLUDED.total_amount,
      registered_customer_sales = daily_sales_summary.registered_customer_sales + EXCLUDED.registered_customer_sales,
      unregistered_customer_sales = daily_sales_summary.unregistered_customer_sales + EXCLUDED.unregistered_customer_sales,
      transaction_count = daily_sales_summary.transaction_count + 1;
  ELSE
    -- Same bucket: apply deltas
    UPDATE public.daily_sales_summary
    SET
      total_amount = total_amount + (NEW.amount - OLD.amount),
      registered_customer_sales = registered_customer_sales + (reg_new - reg_old),
      unregistered_customer_sales = unregistered_customer_sales + (unreg_new - unreg_old)
    WHERE store_user_id = NEW.store_user_id
      AND sale_date = NEW.sale_date;
  END IF;

  -- Adjust customer totals: subtract OLD (if registered) and add NEW (if registered)
  IF OLD.is_registered_customer = true AND OLD.customer_user_id IS NOT NULL THEN
    UPDATE public.customers
    SET
      total_spent = GREATEST(0, total_spent - OLD.amount),
      points = GREATEST(0, points - FLOOR(OLD.amount)),
      updated_at = NOW()
    WHERE customer_user_id = OLD.customer_user_id;
  END IF;

  IF NEW.is_registered_customer = true AND NEW.customer_user_id IS NOT NULL THEN
    UPDATE public.customers
    SET
      total_spent = total_spent + NEW.amount,
      points = points + FLOOR(NEW.amount),
      updated_at = NOW()
    WHERE customer_user_id = NEW.customer_user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handle_sale_update_trigger ON public.sales;
CREATE TRIGGER handle_sale_update_trigger
AFTER UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_sale_update();

-- 5) Realtime setup for live UI updates
ALTER TABLE public.sales REPLICA IDENTITY FULL;
ALTER TABLE public.daily_sales_summary REPLICA IDENTITY FULL;
ALTER TABLE public.customers REPLICA IDENTITY FULL;

DO $pub$ BEGIN
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sales'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_sales_summary'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.customers'; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $pub$;

-- 6) Keep CRM customers and loyalty in sync (the function exists; add triggers)
DROP TRIGGER IF EXISTS sync_customer_data_customers ON public.customers;
CREATE TRIGGER sync_customer_data_customers
AFTER UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.sync_customer_data();

DROP TRIGGER IF EXISTS sync_customer_data_loyalty ON public.loyalty_accounts;
CREATE TRIGGER sync_customer_data_loyalty
AFTER UPDATE ON public.loyalty_accounts
FOR EACH ROW
EXECUTE FUNCTION public.sync_customer_data();

-- 7) Backfill to correct any stale numbers

-- Recompute/Upsert daily_sales_summary from all existing sales
INSERT INTO public.daily_sales_summary (
  store_user_id, sale_date, total_amount, registered_customer_sales, unregistered_customer_sales, transaction_count
)
SELECT 
  s.store_user_id,
  s.sale_date::date,
  SUM(s.amount) AS total_amount,
  SUM(CASE WHEN s.is_registered_customer THEN s.amount ELSE 0 END) AS registered_customer_sales,
  SUM(CASE WHEN NOT s.is_registered_customer THEN s.amount ELSE 0 END) AS unregistered_customer_sales,
  COUNT(*) AS transaction_count
FROM public.sales s
GROUP BY s.store_user_id, s.sale_date
ON CONFLICT (store_user_id, sale_date)
DO UPDATE SET
  total_amount = EXCLUDED.total_amount,
  registered_customer_sales = EXCLUDED.registered_customer_sales,
  unregistered_customer_sales = EXCLUDED.unregistered_customer_sales,
  transaction_count = EXCLUDED.transaction_count;

-- Recompute customer totals strictly from registered sales
WITH sums AS (
  SELECT
    customer_user_id,
    SUM(amount) AS total_amount,
    SUM(FLOOR(amount)) AS points,
    MAX(created_at) AS last_sale_at
  FROM public.sales
  WHERE is_registered_customer = true
    AND customer_user_id IS NOT NULL
  GROUP BY customer_user_id
)
UPDATE public.customers c
SET
  total_spent = COALESCE(s.total_amount, 0),
  points = COALESCE(s.points, 0),
  last_visit = GREATEST(COALESCE(c.last_visit, 'epoch'::timestamp), COALESCE(s.last_sale_at, 'epoch'::timestamp)),
  updated_at = NOW()
FROM sums s
WHERE c.customer_user_id = s.customer_user_id;

COMMIT;
