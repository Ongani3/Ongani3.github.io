-- Phase 1 & 2: Link customer accounts and sync data

-- First, add a customer_id column to customer_profiles to link to CRM customers
ALTER TABLE customer_profiles 
ADD COLUMN customer_id uuid REFERENCES customers(id);

-- Add a customer_user_id column to customers to link back to auth users
ALTER TABLE customers 
ADD COLUMN customer_user_id uuid;

-- Create the missing customer_profiles record for the existing user
-- Get the user_id from the existing loyalty_accounts record
INSERT INTO customer_profiles (
  user_id, 
  store_id, 
  first_name, 
  last_name,
  phone,
  customer_id
)
SELECT 
  la.customer_user_id,
  (SELECT id FROM store_settings LIMIT 1), -- Link to the store
  c.name,
  '',
  c.phone,
  c.id
FROM loyalty_accounts la
JOIN customers c ON c.name = 'Prod. Onga' -- Link to the existing CRM customer
WHERE la.customer_user_id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  customer_id = EXCLUDED.customer_id,
  first_name = EXCLUDED.first_name,
  phone = EXCLUDED.phone;

-- Update the customers table to link back to the user
UPDATE customers 
SET customer_user_id = (
  SELECT customer_user_id 
  FROM loyalty_accounts 
  WHERE customer_user_id IS NOT NULL 
  LIMIT 1
)
WHERE name = 'Prod. Onga';

-- Sync the loyalty account data with CRM customer data
UPDATE loyalty_accounts 
SET 
  tier = 'gold',
  current_points = (SELECT points FROM customers WHERE name = 'Prod. Onga'),
  lifetime_points = (SELECT points FROM customers WHERE name = 'Prod. Onga')
WHERE customer_user_id = (
  SELECT customer_user_id 
  FROM customers 
  WHERE name = 'Prod. Onga'
);

-- Create a function to keep customer data synced
CREATE OR REPLACE FUNCTION sync_customer_data()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers to keep data synced
CREATE TRIGGER sync_customer_to_loyalty
  AFTER UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_data();

CREATE TRIGGER sync_loyalty_to_customer  
  AFTER UPDATE ON loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_data();