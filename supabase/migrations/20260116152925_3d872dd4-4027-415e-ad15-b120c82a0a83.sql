-- Create table to track user sessions/visits
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/update their session (for tracking)
CREATE POLICY "Anyone can upsert sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
ON public.user_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Only admin can read all sessions
CREATE POLICY "Only admin can read sessions"
ON public.user_sessions
FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'exploittome@gmail.com'
);

-- Create index for efficient queries
CREATE INDEX idx_user_sessions_last_seen ON public.user_sessions(last_seen);
CREATE INDEX idx_user_sessions_created_at ON public.user_sessions(created_at);