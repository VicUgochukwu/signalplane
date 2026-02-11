-- ============================================================
-- Competitor Suggestions Cache
-- Stores AI-generated competitor suggestions per user.
-- Invalidated when profile changes (via profile_hash) or TTL expires.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.competitor_suggestions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestions JSONB      NOT NULL DEFAULT '[]'::jsonb,
  -- Each element: {name, domain, reason, confidence}
  profile_hash TEXT      NOT NULL,
  -- md5(company_name || industry || domain) — detect when profile changes
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  CONSTRAINT uq_competitor_suggestions_user UNIQUE (user_id)
);

COMMENT ON TABLE public.competitor_suggestions IS 'Cached AI-generated competitor suggestions per user';

-- RLS
ALTER TABLE public.competitor_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own suggestions"
  ON public.competitor_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (edge function uses service role to upsert)
CREATE POLICY "Service role full access"
  ON public.competitor_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitor_suggestions_user
  ON public.competitor_suggestions(user_id);

CREATE INDEX IF NOT EXISTS idx_competitor_suggestions_expires
  ON public.competitor_suggestions(expires_at);

-- Grants
GRANT SELECT ON public.competitor_suggestions TO authenticated;
GRANT ALL ON public.competitor_suggestions TO service_role;
