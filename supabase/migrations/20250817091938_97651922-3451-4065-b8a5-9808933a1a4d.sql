-- Improve sales-to-customer sync to handle CRM-only customers (no portal account)
BEGIN;

-- 1) Update function: update_customer_from_sale to support NULL customer_user_id when is_registered_customer=true
CREATE OR REPLACE FUNCTION public.update_customer_from_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if this is marked as a registered customer sale
  IF NEW.is_registered_customer = true THEN
    IF NEW.customer_user_id IS NOT NULL THEN
      -- Preferred path: linked portal account
      UPDATE customers 
      SET 
        total_spent = total_spent + NEW.amount,
        points = points + FLOOR(NEW.amount), -- 1 point per ZMW spent
        last_visit = NOW(),
        updated_at = NOW()
      WHERE customer_user_id = NEW.customer_user_id;
      
      -- If no customer was updated, try to find by store (user_id) + name/email
      IF NOT FOUND THEN
        UPDATE customers 
        SET 
          total_spent = total_spent + NEW.amount,
          points = points + FLOOR(NEW.amount),
          last_visit = NOW(),
          updated_at = NOW()
        WHERE user_id = NEW.store_user_id 
          AND (
            (NEW.customer_name IS NOT NULL AND LOWER(name) = LOWER(NEW.customer_name))
            OR (NEW.customer_name IS NOT NULL AND email ILIKE '%' || SPLIT_PART(NEW.customer_name, ' ', 1) || '%')
          );
      END IF;
    ELSE
      -- CRM-registered (no portal account). Match by store owner and exact customer name.
      IF NEW.customer_name IS NOT NULL THEN
        UPDATE customers 
        SET 
          total_spent = total_spent + NEW.amount,
          points = points + FLOOR(NEW.amount),
          last_visit = NOW(),
          updated_at = NOW()
        WHERE user_id = NEW.store_user_id
          AND LOWER(name) = LOWER(NEW.customer_name);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2) Update function: handle_sale_deletion (subtract even when customer_user_id is NULL)
CREATE OR REPLACE FUNCTION public.handle_sale_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  IF OLD.is_registered_customer = true THEN
    IF OLD.customer_user_id IS NOT NULL THEN
      UPDATE public.customers 
      SET 
        total_spent = GREATEST(0, total_spent - OLD.amount),
        points = GREATEST(0, points - FLOOR(OLD.amount)),
        updated_at = NOW()
      WHERE customer_user_id = OLD.customer_user_id;
    ELSE
      IF OLD.customer_name IS NOT NULL THEN
        UPDATE public.customers 
        SET 
          total_spent = GREATEST(0, total_spent - OLD.amount),
          points = GREATEST(0, points - FLOOR(OLD.amount)),
          updated_at = NOW()
        WHERE user_id = OLD.store_user_id
          AND LOWER(name) = LOWER(OLD.customer_name);
      END IF;
    END IF;
  END IF;

  RETURN OLD;
END;
$function$;

-- 3) Update function: handle_sale_update (apply deltas even when customer_user_id is NULL by name)
CREATE OR REPLACE FUNCTION public.handle_sale_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Adjust customer totals for registered sales
  IF OLD.is_registered_customer = true THEN
    IF OLD.customer_user_id IS NOT NULL THEN
      UPDATE public.customers
      SET
        total_spent = GREATEST(0, total_spent - OLD.amount),
        points = GREATEST(0, points - FLOOR(OLD.amount)),
        updated_at = NOW()
      WHERE customer_user_id = OLD.customer_user_id;
    ELSE
      IF OLD.customer_name IS NOT NULL THEN
        UPDATE public.customers
        SET
          total_spent = GREATEST(0, total_spent - OLD.amount),
          points = GREATEST(0, points - FLOOR(OLD.amount)),
          updated_at = NOW()
        WHERE user_id = OLD.store_user_id
          AND LOWER(name) = LOWER(OLD.customer_name);
      END IF;
    END IF;
  END IF;

  IF NEW.is_registered_customer = true THEN
    IF NEW.customer_user_id IS NOT NULL THEN
      UPDATE public.customers
      SET
        total_spent = total_spent + NEW.amount,
        points = points + FLOOR(NEW.amount),
        updated_at = NOW()
      WHERE customer_user_id = NEW.customer_user_id;
    ELSE
      IF NEW.customer_name IS NOT NULL THEN
        UPDATE public.customers
        SET
          total_spent = total_spent + NEW.amount,
          points = points + FLOOR(NEW.amount),
          updated_at = NOW()
        WHERE user_id = NEW.store_user_id
          AND LOWER(name) = LOWER(NEW.customer_name);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4) Backfill: recompute customer totals from registered sales with NULL customer_user_id (match by name)
WITH sums AS (
  SELECT 
    s.store_user_id, 
    LOWER(s.customer_name) AS cname,
    SUM(s.amount) AS total_amount,
    SUM(FLOOR(s.amount)) AS points,
    MAX(s.created_at) AS last_sale_at
  FROM public.sales s
  WHERE s.is_registered_customer = true
    AND s.customer_user_id IS NULL
    AND s.customer_name IS NOT NULL
  GROUP BY s.store_user_id, LOWER(s.customer_name)
)
UPDATE public.customers c
SET
  total_spent = COALESCE(s.total_amount, 0),
  points = COALESCE(s.points, 0),
  last_visit = GREATEST(COALESCE(c.last_visit, 'epoch'::timestamp), COALESCE(s.last_sale_at, 'epoch'::timestamp)),
  updated_at = NOW()
FROM sums s
WHERE c.user_id = s.store_user_id
  AND LOWER(c.name) = s.cname;

COMMIT;