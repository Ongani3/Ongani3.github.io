-- Fix user roles for existing users and ensure trigger is working
-- Insert admin roles for existing users (since this appears to be a CRM system)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles);

-- Recreate the trigger for new users to ensure it works
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Also ensure profiles are created for existing users
INSERT INTO public.profiles (user_id, display_name)
SELECT id, raw_user_meta_data ->> 'display_name'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles);