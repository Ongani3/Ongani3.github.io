
-- Fix role assignment for a specific user by email:
-- - Remove 'admin' role if it exists
-- - Ensure 'customer' role exists
-- NOTE: This only changes data in public.user_roles. No changes are made to Supabase-reserved schemas.

with target_user as (
  select id
  from auth.users
  where email = 'prodbyonga@gmail.com'
  limit 1
)
-- Remove any admin role
delete from public.user_roles ur
using target_user tu
where ur.user_id = tu.id
  and ur.role = 'admin'::public.app_role;

-- Ensure customer role exists
insert into public.user_roles (user_id, role)
select tu.id, 'customer'::public.app_role
from target_user tu
on conflict (user_id, role) do nothing;
