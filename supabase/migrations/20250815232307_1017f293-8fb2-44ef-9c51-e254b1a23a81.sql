-- Add store relationship to customer profiles
ALTER TABLE customer_profiles ADD COLUMN store_id UUID REFERENCES store_settings(id);

-- Create index for better query performance
CREATE INDEX idx_customer_profiles_store_id ON customer_profiles(store_id);