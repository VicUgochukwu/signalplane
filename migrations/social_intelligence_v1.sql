-- ============================================================================
-- Social Intelligence v1: LinkedIn, X (Twitter), & Reddit Monitoring
-- ============================================================================
-- Adds infrastructure for monitoring competitor employees and ambassadors
-- on social platforms. Includes monitoring targets, raw post staging,
-- classification output, and signal emission pipeline support.
-- ============================================================================

-- ── 0. Add missing source_platform column to signals ──────────────────────
-- The ingest-external-signal edge function already writes source_platform
-- but the column was never added. Without this, external signal ingestion fails.
ALTER TABLE control_plane.signals
  ADD COLUMN IF NOT EXISTS source_platform TEXT;

CREATE INDEX IF NOT EXISTS idx_signals_source_platform
  ON control_plane.signals (source_platform) WHERE source_platform IS NOT NULL;

-- ── 1. Create social_intel schema ─────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS social_intel;

-- ── 2. Monitoring targets table ───────────────────────────────────────────
-- Tracks what to scrape: competitor LinkedIn pages, employee profiles,
-- X handles, subreddits, hashtags, etc.
CREATE TABLE social_intel.monitoring_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES core.companies(id) ON DELETE SET NULL,
  company_name    TEXT,
  platform        TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'reddit')),
  target_type     TEXT NOT NULL CHECK (target_type IN (
    'company_page', 'employee', 'subreddit', 'hashtag', 'handle', 'search_query'
  )),
  target_identifier TEXT NOT NULL,          -- URL, handle, subreddit name, etc.
  target_label      TEXT,                   -- Display name ("VP Marketing at Acme")
  auto_derived      BOOLEAN DEFAULT false,  -- true = system-generated from competitor domain
  enabled           BOOLEAN DEFAULT true,
  last_scraped_at   TIMESTAMPTZ,
  scrape_status     TEXT DEFAULT 'pending' CHECK (scrape_status IN (
    'pending', 'success', 'failed', 'rate_limited', 'blocked'
  )),
  error_message     TEXT,
  meta              JSONB DEFAULT '{}',     -- platform-specific config
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  deleted_at        TIMESTAMPTZ             -- soft delete
);

-- Per-user unique constraint (same user can't track the same target twice)
CREATE UNIQUE INDEX idx_monitoring_targets_unique_per_user
  ON social_intel.monitoring_targets (user_id, platform, target_identifier)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_monitoring_targets_user     ON social_intel.monitoring_targets (user_id);
CREATE INDEX idx_monitoring_targets_company  ON social_intel.monitoring_targets (company_id);
CREATE INDEX idx_monitoring_targets_platform ON social_intel.monitoring_targets (platform) WHERE enabled = true AND deleted_at IS NULL;
CREATE INDEX idx_monitoring_targets_scrape   ON social_intel.monitoring_targets (last_scraped_at);

-- RLS
ALTER TABLE social_intel.monitoring_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monitoring targets"
  ON social_intel.monitoring_targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monitoring targets"
  ON social_intel.monitoring_targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monitoring targets"
  ON social_intel.monitoring_targets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on monitoring_targets"
  ON social_intel.monitoring_targets
  TO service_role USING (true) WITH CHECK (true);

-- ── 3. Raw posts staging table ────────────────────────────────────────────
-- Stores scraped content before LLM classification. Deduped by platform + external_id.
CREATE TABLE social_intel.raw_posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitoring_target_id  UUID REFERENCES social_intel.monitoring_targets(id) ON DELETE SET NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id            UUID REFERENCES core.companies(id) ON DELETE SET NULL,
  company_name          TEXT,
  platform              TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'reddit')),
  external_id           TEXT NOT NULL,        -- tweet ID, LinkedIn post URN, reddit post ID
  -- Author info
  author_name           TEXT,
  author_handle         TEXT,                 -- @handle or profile slug
  author_title          TEXT,                 -- LinkedIn: "VP Marketing at Acme Corp"
  author_company        TEXT,                 -- Company name if detectable
  author_is_employee    BOOLEAN DEFAULT false,-- true if confirmed competitor employee
  -- Content
  content_text          TEXT NOT NULL,
  post_url              TEXT,
  post_type             TEXT DEFAULT 'post' CHECK (post_type IN (
    'post', 'comment', 'reply', 'repost', 'article', 'thread', 'question', 'answer'
  )),
  -- Engagement metrics
  engagement_likes      INTEGER DEFAULT 0,
  engagement_comments   INTEGER DEFAULT 0,
  engagement_shares     INTEGER DEFAULT 0,
  engagement_views      INTEGER DEFAULT 0,
  -- Timing
  posted_at             TIMESTAMPTZ,
  scraped_at            TIMESTAMPTZ DEFAULT now(),
  week_start            DATE,
  -- Reddit-specific
  subreddit             TEXT,
  upvote_ratio          FLOAT,
  -- Classification output (filled by n8n LLM classification step)
  classified            BOOLEAN DEFAULT false,
  classification_type   TEXT CHECK (classification_type IS NULL OR classification_type IN (
    'messaging_shift', 'hiring_signal', 'sentiment', 'competitive_mention',
    'thought_leadership', 'product_direction', 'pain_point', 'feature_request',
    'comparison', 'noise'
  )),
  sentiment             TEXT CHECK (sentiment IS NULL OR sentiment IN (
    'positive', 'negative', 'neutral', 'mixed'
  )),
  severity              INTEGER CHECK (severity IS NULL OR (severity >= 1 AND severity <= 5)),
  confidence            FLOAT CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  classification_summary TEXT,               -- LLM-generated one-liner
  classification_meta   JSONB DEFAULT '{}',  -- full LLM output (decision_type, signal_type, etc.)
  -- Signal emission tracking
  signal_emitted        BOOLEAN DEFAULT false,
  signal_id             UUID,                -- FK to control_plane.signals if emitted
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Dedup: same post from same platform can't be stored twice
CREATE UNIQUE INDEX idx_raw_posts_unique
  ON social_intel.raw_posts (platform, external_id);

CREATE INDEX idx_raw_posts_target       ON social_intel.raw_posts (monitoring_target_id);
CREATE INDEX idx_raw_posts_user         ON social_intel.raw_posts (user_id);
CREATE INDEX idx_raw_posts_company      ON social_intel.raw_posts (company_id);
CREATE INDEX idx_raw_posts_week         ON social_intel.raw_posts (week_start);
CREATE INDEX idx_raw_posts_unclassified ON social_intel.raw_posts (classified) WHERE classified = false;
CREATE INDEX idx_raw_posts_platform_ts  ON social_intel.raw_posts (platform, posted_at DESC);
CREATE INDEX idx_raw_posts_classification ON social_intel.raw_posts (classification_type) WHERE classified = true AND classification_type != 'noise';

-- RLS
ALTER TABLE social_intel.raw_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own raw posts"
  ON social_intel.raw_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on raw_posts"
  ON social_intel.raw_posts
  TO service_role USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════════════════
-- RPCs
-- ══════════════════════════════════════════════════════════════════════════

-- ── User: list monitoring targets ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_social_monitoring_targets(p_user_id UUID)
RETURNS TABLE (
  id                UUID,
  company_id        UUID,
  company_name      TEXT,
  platform          TEXT,
  target_type       TEXT,
  target_identifier TEXT,
  target_label      TEXT,
  auto_derived      BOOLEAN,
  enabled           BOOLEAN,
  last_scraped_at   TIMESTAMPTZ,
  scrape_status     TEXT,
  error_message     TEXT,
  post_count        BIGINT,
  signal_count      BIGINT,
  created_at        TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    mt.id,
    mt.company_id,
    mt.company_name,
    mt.platform,
    mt.target_type,
    mt.target_identifier,
    mt.target_label,
    mt.auto_derived,
    mt.enabled,
    mt.last_scraped_at,
    mt.scrape_status,
    mt.error_message,
    COALESCE(pc.cnt, 0) AS post_count,
    COALESCE(sc.cnt, 0) AS signal_count,
    mt.created_at
  FROM social_intel.monitoring_targets mt
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM social_intel.raw_posts rp
    WHERE rp.monitoring_target_id = mt.id
  ) pc ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM social_intel.raw_posts rp
    WHERE rp.monitoring_target_id = mt.id AND rp.signal_emitted = true
  ) sc ON true
  WHERE mt.user_id = p_user_id
    AND mt.deleted_at IS NULL
  ORDER BY mt.company_name, mt.platform, mt.created_at;
$$;

-- ── User: add a monitoring target ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_social_monitoring_target(
  p_user_id           UUID,
  p_company_id        UUID DEFAULT NULL,
  p_company_name      TEXT DEFAULT NULL,
  p_platform          TEXT DEFAULT 'linkedin',
  p_target_type       TEXT DEFAULT 'company_page',
  p_target_identifier TEXT DEFAULT '',
  p_target_label      TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validate platform
  IF p_platform NOT IN ('linkedin', 'twitter', 'reddit') THEN
    RAISE EXCEPTION 'Invalid platform: %. Must be linkedin, twitter, or reddit.', p_platform;
  END IF;

  -- Validate target_type
  IF p_target_type NOT IN ('company_page', 'employee', 'subreddit', 'hashtag', 'handle', 'search_query') THEN
    RAISE EXCEPTION 'Invalid target_type: %', p_target_type;
  END IF;

  -- Validate identifier not empty
  IF TRIM(p_target_identifier) = '' THEN
    RAISE EXCEPTION 'target_identifier cannot be empty';
  END IF;

  INSERT INTO social_intel.monitoring_targets (
    user_id, company_id, company_name, platform,
    target_type, target_identifier, target_label
  ) VALUES (
    p_user_id, p_company_id, p_company_name, p_platform,
    p_target_type, TRIM(p_target_identifier), p_target_label
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ── User: toggle target enabled/disabled ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_social_monitoring_target(
  p_target_id UUID,
  p_enabled   BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE social_intel.monitoring_targets
  SET enabled = p_enabled, updated_at = now()
  WHERE id = p_target_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target not found or not owned by you';
  END IF;
END;
$$;

-- ── User: soft-delete a monitoring target ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_social_monitoring_target(p_target_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE social_intel.monitoring_targets
  SET deleted_at = now(), updated_at = now(), enabled = false
  WHERE id = p_target_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target not found or not owned by you';
  END IF;
END;
$$;

-- ── n8n / Service role: get targets for scraping ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_social_targets_for_scraping(p_platform TEXT)
RETURNS TABLE (
  id                UUID,
  user_id           UUID,
  company_id        UUID,
  company_name      TEXT,
  target_type       TEXT,
  target_identifier TEXT,
  target_label      TEXT,
  meta              JSONB
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    mt.id, mt.user_id, mt.company_id, mt.company_name,
    mt.target_type, mt.target_identifier, mt.target_label, mt.meta
  FROM social_intel.monitoring_targets mt
  WHERE mt.platform = p_platform
    AND mt.enabled = true
    AND mt.deleted_at IS NULL
  ORDER BY mt.company_name, mt.target_type;
$$;

-- ── Admin: list all social monitoring targets ─────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_social_targets(
  p_platform  TEXT    DEFAULT NULL,
  p_status    TEXT    DEFAULT NULL,
  p_search    TEXT    DEFAULT NULL,
  p_limit     INTEGER DEFAULT 50,
  p_offset    INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                UUID,
  user_id           UUID,
  user_email        TEXT,
  company_id        UUID,
  company_name      TEXT,
  platform          TEXT,
  target_type       TEXT,
  target_identifier TEXT,
  target_label      TEXT,
  auto_derived      BOOLEAN,
  enabled           BOOLEAN,
  last_scraped_at   TIMESTAMPTZ,
  scrape_status     TEXT,
  error_message     TEXT,
  post_count        BIGINT,
  created_at        TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    mt.id,
    mt.user_id,
    u.email::TEXT AS user_email,
    mt.company_id,
    mt.company_name,
    mt.platform,
    mt.target_type,
    mt.target_identifier,
    mt.target_label,
    mt.auto_derived,
    mt.enabled,
    mt.last_scraped_at,
    mt.scrape_status,
    mt.error_message,
    COALESCE(pc.cnt, 0) AS post_count,
    mt.created_at
  FROM social_intel.monitoring_targets mt
  JOIN auth.users u ON u.id = mt.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM social_intel.raw_posts rp
    WHERE rp.monitoring_target_id = mt.id
  ) pc ON true
  WHERE mt.deleted_at IS NULL
    AND (p_platform IS NULL OR mt.platform = p_platform)
    AND (p_status IS NULL OR mt.scrape_status = p_status)
    AND (p_search IS NULL OR mt.company_name ILIKE '%' || p_search || '%'
         OR mt.target_identifier ILIKE '%' || p_search || '%'
         OR mt.target_label ILIKE '%' || p_search || '%'
         OR u.email::TEXT ILIKE '%' || p_search || '%')
  ORDER BY mt.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ── Admin: social intelligence stats ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_social_intel_stats()
RETURNS TABLE (
  total_targets     BIGINT,
  active_targets    BIGINT,
  total_posts       BIGINT,
  classified_posts  BIGINT,
  signals_emitted   BIGINT,
  linkedin_targets  BIGINT,
  twitter_targets   BIGINT,
  reddit_targets    BIGINT,
  last_scrape_at    TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    (SELECT COUNT(*) FROM social_intel.monitoring_targets WHERE deleted_at IS NULL) AS total_targets,
    (SELECT COUNT(*) FROM social_intel.monitoring_targets WHERE deleted_at IS NULL AND enabled = true) AS active_targets,
    (SELECT COUNT(*) FROM social_intel.raw_posts) AS total_posts,
    (SELECT COUNT(*) FROM social_intel.raw_posts WHERE classified = true) AS classified_posts,
    (SELECT COUNT(*) FROM social_intel.raw_posts WHERE signal_emitted = true) AS signals_emitted,
    (SELECT COUNT(*) FROM social_intel.monitoring_targets WHERE deleted_at IS NULL AND platform = 'linkedin') AS linkedin_targets,
    (SELECT COUNT(*) FROM social_intel.monitoring_targets WHERE deleted_at IS NULL AND platform = 'twitter') AS twitter_targets,
    (SELECT COUNT(*) FROM social_intel.monitoring_targets WHERE deleted_at IS NULL AND platform = 'reddit') AS reddit_targets,
    (SELECT MAX(last_scraped_at) FROM social_intel.monitoring_targets WHERE deleted_at IS NULL) AS last_scrape_at;
$$;


-- ══════════════════════════════════════════════════════════════════════════
-- Auto-derive monitoring targets when a competitor is added
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION social_intel.auto_derive_targets()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_company_name TEXT;
  v_company_domain TEXT;
  v_domain_slug TEXT;
BEGIN
  -- Look up company name and domain
  SELECT name, domain INTO v_company_name, v_company_domain
  FROM core.companies WHERE id = NEW.company_id;

  IF v_company_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- Derive a clean domain slug for social handles (e.g., "acme.com" → "acme")
  v_domain_slug := SPLIT_PART(COALESCE(v_company_domain, ''), '.', 1);

  -- LinkedIn company page (use domain as identifier — scraper resolves to page)
  IF v_company_domain IS NOT NULL AND v_company_domain != '' THEN
    INSERT INTO social_intel.monitoring_targets (
      user_id, company_id, company_name, platform, target_type,
      target_identifier, target_label, auto_derived
    ) VALUES (
      NEW.user_id, NEW.company_id, v_company_name,
      'linkedin', 'company_page', v_company_domain,
      v_company_name || ' — LinkedIn', true
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- X (Twitter) search for company name mentions
  INSERT INTO social_intel.monitoring_targets (
    user_id, company_id, company_name, platform, target_type,
    target_identifier, target_label, auto_derived
  ) VALUES (
    NEW.user_id, NEW.company_id, v_company_name,
    'twitter', 'search_query', v_company_name,
    v_company_name || ' — X mentions', true
  ) ON CONFLICT DO NOTHING;

  -- X handle guess (domain slug as handle — user can correct)
  IF v_domain_slug IS NOT NULL AND v_domain_slug != '' THEN
    INSERT INTO social_intel.monitoring_targets (
      user_id, company_id, company_name, platform, target_type,
      target_identifier, target_label, auto_derived
    ) VALUES (
      NEW.user_id, NEW.company_id, v_company_name,
      'twitter', 'handle', v_domain_slug,
      '@' || v_domain_slug || ' (guessed)', true
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- Reddit search for company name
  INSERT INTO social_intel.monitoring_targets (
    user_id, company_id, company_name, platform, target_type,
    target_identifier, target_label, auto_derived
  ) VALUES (
    NEW.user_id, NEW.company_id, v_company_name,
    'reddit', 'search_query', v_company_name,
    v_company_name || ' — Reddit mentions', true
  ) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_derive_social_targets
  AFTER INSERT ON public.user_tracked_competitors
  FOR EACH ROW
  EXECUTE FUNCTION social_intel.auto_derive_targets();


-- ══════════════════════════════════════════════════════════════════════════
-- Backfill: auto-derive targets for all existing tracked competitors
-- ══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
  v_company_name TEXT;
  v_company_domain TEXT;
  v_domain_slug TEXT;
BEGIN
  FOR r IN
    SELECT utc.user_id, utc.company_id
    FROM public.user_tracked_competitors utc
    WHERE utc.is_active = true
      AND utc.deleted_at IS NULL
  LOOP
    SELECT name, domain INTO v_company_name, v_company_domain
    FROM core.companies WHERE id = r.company_id;

    IF v_company_name IS NULL THEN
      CONTINUE;
    END IF;

    v_domain_slug := SPLIT_PART(COALESCE(v_company_domain, ''), '.', 1);

    -- LinkedIn
    IF v_company_domain IS NOT NULL AND v_company_domain != '' THEN
      INSERT INTO social_intel.monitoring_targets (
        user_id, company_id, company_name, platform, target_type,
        target_identifier, target_label, auto_derived
      ) VALUES (
        r.user_id, r.company_id, v_company_name,
        'linkedin', 'company_page', v_company_domain,
        v_company_name || ' — LinkedIn', true
      ) ON CONFLICT DO NOTHING;
    END IF;

    -- X search
    INSERT INTO social_intel.monitoring_targets (
      user_id, company_id, company_name, platform, target_type,
      target_identifier, target_label, auto_derived
    ) VALUES (
      r.user_id, r.company_id, v_company_name,
      'twitter', 'search_query', v_company_name,
      v_company_name || ' — X mentions', true
    ) ON CONFLICT DO NOTHING;

    -- X handle
    IF v_domain_slug IS NOT NULL AND v_domain_slug != '' THEN
      INSERT INTO social_intel.monitoring_targets (
        user_id, company_id, company_name, platform, target_type,
        target_identifier, target_label, auto_derived
      ) VALUES (
        r.user_id, r.company_id, v_company_name,
        'twitter', 'handle', v_domain_slug,
        '@' || v_domain_slug || ' (guessed)', true
      ) ON CONFLICT DO NOTHING;
    END IF;

    -- Reddit
    INSERT INTO social_intel.monitoring_targets (
      user_id, company_id, company_name, platform, target_type,
      target_identifier, target_label, auto_derived
    ) VALUES (
      r.user_id, r.company_id, v_company_name,
      'reddit', 'search_query', v_company_name,
      v_company_name || ' — Reddit mentions', true
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Social monitoring targets backfilled for all existing competitors';
END;
$$;


-- ══════════════════════════════════════════════════════════════════════════
-- Grant schema access to PostgREST roles (required for RPCs to work)
-- ══════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA social_intel TO authenticated, service_role, anon;
GRANT ALL ON ALL TABLES IN SCHEMA social_intel TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA social_intel TO authenticated;
