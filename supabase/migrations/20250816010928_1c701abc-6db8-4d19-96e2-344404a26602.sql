-- Fix security warning: Set search_path for the sync function
CREATE OR REPLACE FUNCTION sync_customer_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When CRM customer data changes, update loyalty account
  IF TG_TABLE_NAME = 'customers' THEN
    UPDATE loyalty_accounts 
    SET 
      tier = LOWER(NEW.tier),
      current_points = NEW.points,
      lifetime_points = NEW.points,
      updated_at = NOW()
    WHERE customer_user_id = NEW.customer_user_id;
    
    -- Update customer profile
    UPDATE customer_profiles
    SET 
      first_name = NEW.name,
      phone = NEW.phone,
      updated_at = NOW()
    WHERE customer_id = NEW.id;
  END IF;
  
  -- When loyalty account changes, update CRM customer
  IF TG_TABLE_NAME = 'loyalty_accounts' THEN
    UPDATE customers
    SET 
      tier = INITCAP(NEW.tier),
      points = NEW.current_points,
      updated_at = NOW()
    WHERE customer_user_id = NEW.customer_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;