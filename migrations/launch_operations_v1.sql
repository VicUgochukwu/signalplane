-- =============================================================================
-- LAUNCH OPERATIONS CENTER — Phase 2 Migration
-- Signal Plane Control Plane
-- =============================================================================
-- Creates:
--   1. launch schema (separate from launch_tracker which tracks COMPETITOR launches)
--   2. launch.launches — YOUR OWN product launch registry
--   3. launch.briefs — All 4 brief types (intelligence/packet/decay/playbook)
--   4. launch.readiness_checks — Daily pre-launch readiness snapshots
--   5. launch.decay_reports — Weekly post-launch decay (4 weeks)
--   6. launch.playbooks — T+30 retrospective
--   7. RPCs: register_launch, get_user_launches, get_launch_detail
--   8. Feature flag for launch_ops
-- =============================================================================

-- ─── 1. Schema ───────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS launch;

-- ─── 2. Launches (your own product launch registry) ──────────────────────────
CREATE TABLE IF NOT EXISTS launch.launches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id),
  launch_name           TEXT NOT NULL,
  product_name          TEXT NOT NULL,
  launch_type           TEXT NOT NULL CHECK (launch_type IN ('major_release', 'feature_launch', 'pricing_change', 'market_expansion', 'reposition', 'competitive_response')),
  description           TEXT,
  target_launch_date    DATE NOT NULL,
  actual_launch_date    DATE,
  phase                 TEXT NOT NULL DEFAULT 'planning' CHECK (phase IN ('planning', 'pre_launch', 'launch_day', 'post_launch', 'retrospective', 'completed')),
  readiness_score       SMALLINT DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100),
  readiness_breakdown   JSONB DEFAULT '{}'::jsonb,
  /*
    readiness_breakdown schema:
    {
      competitor_landscape: number (0-100),
      messaging_readiness: number (0-100),
      market_timing: number (0-100),
      objection_coverage: number (0-100),
      battlecard_freshness: number (0-100)
    }
  */
  competitor_ids        UUID[],             -- FK refs to tracked competitor companies
  competitor_names      TEXT[],             -- human-readable competitor names
  initial_messaging     JSONB DEFAULT '{}'::jsonb,  -- snapshot of your messaging at launch start
  initial_positioning   JSONB DEFAULT '{}'::jsonb,  -- snapshot of your positioning at launch start
  weeks_tracked         SMALLINT DEFAULT 0, -- post-launch weeks tracked so far (max 4)
  tags                  TEXT[],
  meta                  JSONB DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_launch_launches_user_id ON launch.launches(user_id);
CREATE INDEX IF NOT EXISTS idx_launch_launches_phase ON launch.launches(phase);
CREATE INDEX IF NOT EXISTS idx_launch_launches_target_date ON launch.launches(target_launch_date);
CREATE INDEX IF NOT EXISTS idx_launch_launches_user_phase ON launch.launches(user_id, phase);

-- RLS
ALTER TABLE launch.launches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own launches"
  ON launch.launches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own launches"
  ON launch.launches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own launches"
  ON launch.launches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on launches"
  ON launch.launches FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 3. Briefs (intelligence, packet, decay, playbook) ──────────────────────
CREATE TABLE IF NOT EXISTS launch.briefs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id         UUID NOT NULL REFERENCES launch.launches(id) ON DELETE CASCADE,
  brief_type        TEXT NOT NULL CHECK (brief_type IN ('intelligence', 'packet', 'decay', 'playbook')),
  brief_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  title             TEXT NOT NULL,
  content_json      JSONB DEFAULT '{}'::jsonb,   -- structured brief content
  content_md        TEXT DEFAULT '',              -- markdown renderable content
  included_signal_ids UUID[],                     -- signals consumed for this brief
  signal_count      INT DEFAULT 0,
  days_to_launch    INT,                          -- negative = after launch
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_launch_briefs_launch_id ON launch.briefs(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_briefs_type ON launch.briefs(brief_type);
CREATE INDEX IF NOT EXISTS idx_launch_briefs_date ON launch.briefs(brief_date DESC);

ALTER TABLE launch.briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own briefs"
  ON launch.briefs FOR SELECT
  USING (EXISTS (SELECT 1 FROM launch.launches l WHERE l.id = launch_id AND l.user_id = auth.uid()));

CREATE POLICY "Service role full access on briefs"
  ON launch.briefs FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 4. Readiness Checks (daily pre-launch snapshots) ───────────────────────
CREATE TABLE IF NOT EXISTS launch.readiness_checks (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id                   UUID NOT NULL REFERENCES launch.launches(id) ON DELETE CASCADE,
  check_date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  score                       SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  competitor_landscape_score  SMALLINT DEFAULT 0 CHECK (competitor_landscape_score BETWEEN 0 AND 100),
  messaging_readiness_score   SMALLINT DEFAULT 0 CHECK (messaging_readiness_score BETWEEN 0 AND 100),
  market_timing_score         SMALLINT DEFAULT 0 CHECK (market_timing_score BETWEEN 0 AND 100),
  objection_coverage_score    SMALLINT DEFAULT 0 CHECK (objection_coverage_score BETWEEN 0 AND 100),
  battlecard_freshness_score  SMALLINT DEFAULT 0 CHECK (battlecard_freshness_score BETWEEN 0 AND 100),
  risk_factors                JSONB DEFAULT '[]'::jsonb,
  opportunities               JSONB DEFAULT '[]'::jsonb,
  recommendations             JSONB DEFAULT '[]'::jsonb,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(launch_id, check_date)
);

CREATE INDEX IF NOT EXISTS idx_launch_readiness_launch_id ON launch.readiness_checks(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_readiness_date ON launch.readiness_checks(check_date DESC);

ALTER TABLE launch.readiness_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own readiness checks"
  ON launch.readiness_checks FOR SELECT
  USING (EXISTS (SELECT 1 FROM launch.launches l WHERE l.id = launch_id AND l.user_id = auth.uid()));

CREATE POLICY "Service role full access on readiness_checks"
  ON launch.readiness_checks FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 5. Decay Reports (weekly post-launch, 4 weeks) ─────────────────────────
CREATE TABLE IF NOT EXISTS launch.decay_reports (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id                 UUID NOT NULL REFERENCES launch.launches(id) ON DELETE CASCADE,
  report_date               DATE NOT NULL DEFAULT CURRENT_DATE,
  week_number               SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 4),
  messaging_drift_score     NUMERIC(4,2) DEFAULT 0,  -- 0-100 how much messaging changed
  homepage_change_count     INT DEFAULT 0,
  competitor_response_count INT DEFAULT 0,
  momentum_status           TEXT NOT NULL DEFAULT 'holding' CHECK (momentum_status IN ('strong', 'holding', 'fading', 'pivoted')),
  competitor_reactions       JSONB DEFAULT '[]'::jsonb,
  recommendations            JSONB DEFAULT '[]'::jsonb,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(launch_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_launch_decay_launch_id ON launch.decay_reports(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_decay_week ON launch.decay_reports(week_number);

ALTER TABLE launch.decay_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own decay reports"
  ON launch.decay_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM launch.launches l WHERE l.id = launch_id AND l.user_id = auth.uid()));

CREATE POLICY "Service role full access on decay_reports"
  ON launch.decay_reports FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 6. Playbooks (T+30 retrospective) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS launch.playbooks (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id                 UUID NOT NULL REFERENCES launch.launches(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  content_json              JSONB DEFAULT '{}'::jsonb,
  content_md                TEXT DEFAULT '',
  total_briefs_generated    INT DEFAULT 0,
  total_signals_consumed    INT DEFAULT 0,
  peak_readiness_score      SMALLINT DEFAULT 0,
  final_momentum_status     TEXT CHECK (final_momentum_status IN ('strong', 'holding', 'fading', 'pivoted')),
  knowledge_items_created   UUID[],    -- references to gtm_memory.knowledge_items
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(launch_id)  -- one playbook per launch
);

CREATE INDEX IF NOT EXISTS idx_launch_playbooks_launch_id ON launch.playbooks(launch_id);

ALTER TABLE launch.playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own playbooks"
  ON launch.playbooks FOR SELECT
  USING (EXISTS (SELECT 1 FROM launch.launches l WHERE l.id = launch_id AND l.user_id = auth.uid()));

CREATE POLICY "Service role full access on playbooks"
  ON launch.playbooks FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- RPCs
-- =============================================================================

-- ─── 7a. Register a launch ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.register_launch(
  p_user_id         UUID,
  p_launch_name     TEXT,
  p_product_name    TEXT,
  p_launch_type     TEXT,
  p_target_date     DATE,
  p_description     TEXT DEFAULT NULL,
  p_competitor_ids  UUID[] DEFAULT NULL,
  p_competitor_names TEXT[] DEFAULT NULL,
  p_tags            TEXT[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_phase TEXT;
  v_days_until INT;
BEGIN
  -- Auto-determine initial phase based on target date
  v_days_until := p_target_date - CURRENT_DATE;

  IF v_days_until <= 0 THEN
    v_phase := 'launch_day';
  ELSIF v_days_until <= 7 THEN
    v_phase := 'pre_launch';
  ELSE
    v_phase := 'planning';
  END IF;

  INSERT INTO launch.launches (
    user_id, launch_name, product_name, launch_type,
    target_launch_date, description, phase,
    competitor_ids, competitor_names, tags
  )
  VALUES (
    p_user_id, p_launch_name, p_product_name, p_launch_type,
    p_target_date, p_description, v_phase,
    p_competitor_ids, p_competitor_names, p_tags
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ─── 7b. Get user launches (list view) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_launches(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  launch_name TEXT,
  product_name TEXT,
  launch_type TEXT,
  target_launch_date DATE,
  actual_launch_date DATE,
  phase TEXT,
  readiness_score SMALLINT,
  competitor_names TEXT[],
  tags TEXT[],
  weeks_tracked SMALLINT,
  days_until_launch INT,
  brief_count BIGINT,
  latest_brief_date DATE,
  decay_week SMALLINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.launch_name,
    l.product_name,
    l.launch_type,
    l.target_launch_date,
    l.actual_launch_date,
    l.phase,
    l.readiness_score,
    l.competitor_names,
    l.tags,
    l.weeks_tracked,
    (l.target_launch_date - CURRENT_DATE)::INT AS days_until_launch,
    (SELECT COUNT(*) FROM launch.briefs b WHERE b.launch_id = l.id) AS brief_count,
    (SELECT MAX(b.brief_date) FROM launch.briefs b WHERE b.launch_id = l.id) AS latest_brief_date,
    (SELECT MAX(dr.week_number) FROM launch.decay_reports dr WHERE dr.launch_id = l.id) AS decay_week,
    l.created_at,
    l.updated_at
  FROM launch.launches l
  WHERE l.user_id = p_user_id
  ORDER BY
    CASE l.phase
      WHEN 'launch_day' THEN 1
      WHEN 'pre_launch' THEN 2
      WHEN 'post_launch' THEN 3
      WHEN 'planning' THEN 4
      WHEN 'retrospective' THEN 5
      WHEN 'completed' THEN 6
    END,
    l.target_launch_date ASC;
END;
$$;

-- ─── 7c. Get launch detail (full nested view) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.get_launch_detail(
  p_launch_id UUID,
  p_user_id   UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'launch', (
      SELECT row_to_json(l.*)
      FROM launch.launches l
      WHERE l.id = p_launch_id AND l.user_id = p_user_id
    ),
    'briefs', COALESCE((
      SELECT json_agg(row_to_json(b.*) ORDER BY b.brief_date DESC)
      FROM launch.briefs b
      WHERE b.launch_id = p_launch_id
    ), '[]'::json),
    'readiness_checks', COALESCE((
      SELECT json_agg(row_to_json(rc.*) ORDER BY rc.check_date DESC)
      FROM launch.readiness_checks rc
      WHERE rc.launch_id = p_launch_id
    ), '[]'::json),
    'decay_reports', COALESCE((
      SELECT json_agg(row_to_json(dr.*) ORDER BY dr.week_number ASC)
      FROM launch.decay_reports dr
      WHERE dr.launch_id = p_launch_id
    ), '[]'::json),
    'playbook', (
      SELECT row_to_json(pb.*)
      FROM launch.playbooks pb
      WHERE pb.launch_id = p_launch_id
      LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- Feature Flag
-- =============================================================================
INSERT INTO admin.feature_flags (flag_key, label, description, is_enabled, applies_to)
VALUES ('launch_ops', 'Launch Operations', 'Launch Operations Center — manage your own product launches through their full lifecycle', true, 'all')
ON CONFLICT (flag_key) DO NOTHING;

-- =============================================================================
-- Updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION launch.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_launches_updated_at
  BEFORE UPDATE ON launch.launches
  FOR EACH ROW
  EXECUTE FUNCTION launch.update_updated_at();
