-- Fix customer account store association issue
-- Insert missing customer_profiles record for existing customer account

INSERT INTO public.customer_profiles (
  user_id, 
  store_id,
  first_name,
  last_name,
  communication_preferences,
  created_at,
  updated_at
) 
SELECT 
  u.id as user_id,
  ss.id as store_id,
  COALESCE(u.raw_user_meta_data->>'display_name', 'Customer') as first_name,
  NULL as last_name,
  '{"sms": false, "push": true, "email": true}'::jsonb as communication_preferences,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
CROSS JOIN store_settings ss
LEFT JOIN customer_profiles cp ON u.id = cp.user_id
WHERE u.email = 'prodbyonga@gmail.com' 
  AND cp.id IS NULL
  AND ss.store_name = 'Onga''s Fresh Grocery Store';