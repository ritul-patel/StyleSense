-- Feedback system schema for StyleSense Beta
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL DEFAULT 'general',
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL DEFAULT '',
  page text DEFAULT '',
  browser text DEFAULT '',
  device text DEFAULT '',
  app_version text DEFAULT '',
  screenshot_url text DEFAULT '',
  sentry_event_id text DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback (type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback (created_at DESC);
