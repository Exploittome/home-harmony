-- Harden RLS for telegram_subscriptions (service role bypasses RLS)

-- Drop overly-permissive policy
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.telegram_subscriptions;

-- Recreate strict user-scoped policies
CREATE POLICY "Users can view own telegram subscription"
ON public.telegram_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own telegram subscription"
ON public.telegram_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram subscription"
ON public.telegram_subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram subscription"
ON public.telegram_subscriptions
FOR DELETE
USING (auth.uid() = user_id);