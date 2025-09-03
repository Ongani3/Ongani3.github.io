-- Create function to update customer data when sales are recorded
CREATE OR REPLACE FUNCTION public.update_customer_from_sale()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if this is a registered customer sale
  IF NEW.is_registered_customer = true AND NEW.customer_user_id IS NOT NULL THEN
    -- Update the customer's total_spent and points
    UPDATE customers 
    SET 
      total_spent = total_spent + NEW.amount,
      points = points + FLOOR(NEW.amount), -- 1 point per ZMW spent
      last_visit = NOW(),
      updated_at = NOW()
    WHERE customer_user_id = NEW.customer_user_id;
    
    -- If no customer was updated, try to find by user_id and store relationship
    IF NOT FOUND THEN
      UPDATE customers 
      SET 
        total_spent = total_spent + NEW.amount,
        points = points + FLOOR(NEW.amount),
        last_visit = NOW(),
        updated_at = NOW()
      WHERE user_id = NEW.store_user_id 
        AND (name = NEW.customer_name OR email LIKE '%' || SPLIT_PART(NEW.customer_name, ' ', 1) || '%');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update customer data on sale insert
DROP TRIGGER IF EXISTS trigger_update_customer_from_sale ON sales;
CREATE TRIGGER trigger_update_customer_from_sale
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_from_sale();

-- Enable realtime for customers table so changes are reflected immediately
ALTER TABLE customers REPLICA IDENTITY FULL;

-- Add customers table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE customers;