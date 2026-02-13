
DROP POLICY IF EXISTS "Only admin can read sessions" ON public.user_sessions;

CREATE POLICY "Only admin can read sessions"
ON public.user_sessions
FOR SELECT
USING (
  (auth.jwt() ->> 'email') IN ('exploittome@gmail.com', 'lmessigo@gmail.com')
);
