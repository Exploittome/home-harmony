-- Insert subscription for existing user
INSERT INTO public.user_subscriptions (user_id, plan)
SELECT id, 'basic' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions);

-- Recreate the trigger properly (it may not have been created)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();