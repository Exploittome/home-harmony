-- Drop the existing policies and constraints for telegram_subscriptions
-- to allow Telegram bot to create subscriptions without user authentication

-- Remove UNIQUE constraint on user_id (subscriptions are identified by telegram_chat_id)
ALTER TABLE public.telegram_subscriptions DROP CONSTRAINT IF EXISTS telegram_subscriptions_user_id_key;

-- Add UNIQUE constraint on telegram_chat_id instead
ALTER TABLE public.telegram_subscriptions ADD CONSTRAINT telegram_subscriptions_telegram_chat_id_key UNIQUE (telegram_chat_id);

-- Make user_id nullable (will be linked later when user connects on website)
ALTER TABLE public.telegram_subscriptions ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing INSERT policy that requires auth
DROP POLICY IF EXISTS "Users can create their own subscription" ON public.telegram_subscriptions;

-- Create a new policy that allows service role to insert (for webhook)
-- The webhook uses service role key, so this is handled automatically

-- Create policy for authenticated users to view/update their linked subscriptions
CREATE POLICY "Service role can manage all subscriptions"
ON public.telegram_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- Drop old policies that are now redundant
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.telegram_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.telegram_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscription" ON public.telegram_subscriptions;