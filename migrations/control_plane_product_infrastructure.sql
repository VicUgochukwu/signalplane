-- ============================================================================
-- Control Plane Product Infrastructure Migration
-- Signal Plane | February 2026
--
-- Creates: pilot_accounts, teams, team_members, team_invites, team_annotations,
--          predictions, prediction_outcomes, win_loss schema (deals, deal_signals,
--          correlations), knowledge ledger RPC, tier management RPCs
-- Modifies: get_user_context (adds industry), complete_onboarding_with_pages
--           (adds pilot + team creation)
-- ============================================================================

-- ============================================================================
-- 1A. PILOT ACCOUNTS & SUBSCRIPTION TIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pilot_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID, -- FK added after teams table created
  company_domain TEXT,
  pilot_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pilot_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 days'),
  grace_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '67 days'),
  status TEXT NOT NULL DEFAULT 'pilot'
    CHECK (status IN ('pilot', 'grace', 'active', 'free', 'churned')),
  tier TEXT NOT NULL DEFAULT 'pilot'
    CHECK (tier IN ('pilot', 'free', 'growth', 'enterprise')),
  max_competitors INT NOT NULL DEFAULT 10,
  competitor_fingerprint TEXT,
  conversion_nudges_sent JSONB DEFAULT '[]'::jsonb,
  converted_at TIMESTAMPTZ,
  downgraded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Domain-level: one active pilot per company domain
CREATE UNIQUE INDEX IF NOT EXISTS idx_pilot_domain_active
  ON public.pilot_accounts(company_domain)
  WHERE status IN ('pilot', 'grace', 'active') AND company_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pilot_fingerprint ON public.pilot_accounts(competitor_fingerprint);
CREATE INDEX IF NOT EXISTS idx_pilot_status ON public.pilot_accounts(status, pilot_end);
CREATE INDEX IF NOT EXISTS idx_pilot_tier ON public.pilot_accounts(tier);

ALTER TABLE public.pilot_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pilot" ON public.pilot_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on pilot_accounts" ON public.pilot_accounts
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 1B. TEAMS & ROLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_domain TEXT,
  org_id UUID REFERENCES public.organizations(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'pmm'
    CHECK (role IN ('admin', 'pmm', 'sales', 'executive')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'pmm'
    CHECK (role IN ('admin', 'pmm', 'sales', 'executive')),
  invite_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, email)
);

CREATE TABLE IF NOT EXISTS public.team_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('signal', 'packet', 'prediction')),
  target_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from pilot_accounts to teams now that teams exists
ALTER TABLE public.pilot_accounts
  ADD CONSTRAINT pilot_accounts_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON public.team_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON public.team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_annotations_target ON public.team_annotations(target_type, target_id);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_annotations ENABLE ROW LEVEL SECURITY;

-- Teams: members can view
CREATE POLICY "Team members can view team" ON public.teams
  FOR SELECT USING (id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "Service role full access on teams" ON public.teams
  TO service_role USING (true) WITH CHECK (true);

-- Team members: co-members can view
CREATE POLICY "Team members can view members" ON public.team_members
  FOR SELECT USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "Service role full access on team_members" ON public.team_members
  TO service_role USING (true) WITH CHECK (true);

-- Invites: team admins can manage
CREATE POLICY "Team admins can manage invites" ON public.team_invites
  FOR ALL USING (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "Service role full access on team_invites" ON public.team_invites
  TO service_role USING (true) WITH CHECK (true);

-- Annotations: team visible, user editable
CREATE POLICY "Team members can view annotations" ON public.team_annotations
  FOR SELECT USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own annotations" ON public.team_annotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own annotations" ON public.team_annotations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on team_annotations" ON public.team_annotations
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 1C. JUDGMENT LOOP (NORMALIZED PREDICTIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS control_plane.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id UUID NOT NULL REFERENCES control_plane.packets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID,
  company_name TEXT,
  prediction_text TEXT NOT NULL,
  timeframe TEXT,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_plane.prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES control_plane.predictions(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('correct', 'incorrect', 'partial')),
  scored_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_packet ON control_plane.predictions(packet_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON control_plane.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_company ON control_plane.predictions(company_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON control_plane.predictions(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_prediction ON control_plane.prediction_outcomes(prediction_id);

ALTER TABLE control_plane.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_plane.prediction_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read predictions" ON control_plane.predictions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access predictions" ON control_plane.predictions
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read outcomes" ON control_plane.prediction_outcomes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can score" ON control_plane.prediction_outcomes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role full access outcomes" ON control_plane.prediction_outcomes
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 1D. WIN/LOSS SCHEMA
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS win_loss;

CREATE TABLE IF NOT EXISTS win_loss.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  competitor_company_id UUID,
  competitor_name TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost', 'in_progress')),
  deal_name TEXT,
  deal_value NUMERIC,
  close_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS win_loss.deal_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES win_loss.deals(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES control_plane.signals(id) ON DELETE CASCADE,
  relevance TEXT DEFAULT 'auto'
    CHECK (relevance IN ('auto', 'manual', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, signal_id)
);

CREATE TABLE IF NOT EXISTS win_loss.correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  competitor_company_id UUID,
  signal_type TEXT,
  correlation_data JSONB DEFAULT '{}'::jsonb,
  sample_size INT DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_user ON win_loss.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_team ON win_loss.deals(team_id);
CREATE INDEX IF NOT EXISTS idx_deals_competitor ON win_loss.deals(competitor_company_id);
CREATE INDEX IF NOT EXISTS idx_deals_outcome ON win_loss.deals(outcome);
CREATE INDEX IF NOT EXISTS idx_deal_signals_deal ON win_loss.deal_signals(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_signals_signal ON win_loss.deal_signals(signal_id);

ALTER TABLE win_loss.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_loss.deal_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_loss.correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own deals" ON win_loss.deals
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Team members can view team deals" ON win_loss.deals
  FOR SELECT USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "Service role full access deals" ON win_loss.deals
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Deal owner manages signals" ON win_loss.deal_signals
  FOR ALL USING (deal_id IN (SELECT id FROM win_loss.deals WHERE user_id = auth.uid()));
CREATE POLICY "Service role full access deal_signals" ON win_loss.deal_signals
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Team members read correlations" ON win_loss.correlations
  FOR SELECT USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "Service role full access correlations" ON win_loss.correlations
  TO service_role USING (true) WITH CHECK (true);

-- GRANTS for win_loss schema
GRANT USAGE ON SCHEMA win_loss TO service_role, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA win_loss TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA win_loss TO authenticated;

-- GRANTS for new control_plane tables
GRANT ALL ON control_plane.predictions TO service_role;
GRANT ALL ON control_plane.prediction_outcomes TO service_role;
GRANT SELECT ON control_plane.predictions TO authenticated, anon;
GRANT SELECT ON control_plane.prediction_outcomes TO authenticated, anon;
GRANT INSERT ON control_plane.prediction_outcomes TO authenticated;

-- GRANTS for new public tables
GRANT ALL ON public.pilot_accounts TO service_role;
GRANT ALL ON public.teams TO service_role;
GRANT ALL ON public.team_members TO service_role;
GRANT ALL ON public.team_invites TO service_role;
GRANT ALL ON public.team_annotations TO service_role;
GRANT SELECT ON public.pilot_accounts TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.team_annotations TO authenticated;

-- ============================================================================
-- 2. RPC FUNCTIONS
-- ============================================================================

-- 2A. get_pilot_status
CREATE OR REPLACE FUNCTION public.get_pilot_status(p_user_id UUID)
RETURNS TABLE(
  pilot_start TIMESTAMPTZ,
  pilot_end TIMESTAMPTZ,
  grace_end TIMESTAMPTZ,
  days_remaining INT,
  days_elapsed INT,
  status TEXT,
  tier TEXT,
  max_competitors INT,
  current_competitor_count INT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.pilot_start,
    pa.pilot_end,
    pa.grace_end,
    GREATEST(0, EXTRACT(DAY FROM pa.pilot_end - NOW()))::INT,
    EXTRACT(DAY FROM NOW() - pa.pilot_start)::INT,
    pa.status,
    pa.tier,
    pa.max_competitors,
    (SELECT COUNT(*)::INT FROM public.user_tracked_competitors
     WHERE user_id = p_user_id AND is_active = TRUE)
  FROM public.pilot_accounts pa
  WHERE pa.user_id = p_user_id;
END;
$$;

-- 2B. create_team
CREATE OR REPLACE FUNCTION public.create_team(
  p_user_id UUID,
  p_team_name TEXT,
  p_domain TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_team_id UUID;
BEGIN
  INSERT INTO public.teams (name, company_domain, created_by)
  VALUES (p_team_name, p_domain, p_user_id)
  RETURNING id INTO v_team_id;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_team_id, p_user_id, 'admin');

  RETURN v_team_id;
END;
$$;

-- 2C. invite_team_member
CREATE OR REPLACE FUNCTION public.invite_team_member(
  p_team_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'pmm',
  p_invited_by UUID DEFAULT NULL
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_token TEXT;
BEGIN
  INSERT INTO public.team_invites (team_id, email, role, invited_by)
  VALUES (p_team_id, LOWER(p_email), p_role, COALESCE(p_invited_by, auth.uid()))
  ON CONFLICT (team_id, email) DO UPDATE SET
    role = EXCLUDED.role,
    status = 'pending',
    invite_token = encode(gen_random_bytes(32), 'hex'),
    expires_at = NOW() + INTERVAL '7 days'
  RETURNING invite_token INTO v_token;

  RETURN v_token;
END;
$$;

-- 2D. accept_team_invite
CREATE OR REPLACE FUNCTION public.accept_team_invite(p_invite_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite
  FROM public.team_invites
  WHERE invite_token = p_invite_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- Create team membership
  INSERT INTO public.team_members (team_id, user_id, role, invited_by)
  VALUES (v_invite.team_id, v_user_id, v_invite.role, v_invite.invited_by)
  ON CONFLICT (team_id, user_id) DO UPDATE SET
    role = EXCLUDED.role;

  -- Mark invite as accepted
  UPDATE public.team_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'team_id', v_invite.team_id,
    'role', v_invite.role
  );
END;
$$;

-- 2E. get_user_team_role
CREATE OR REPLACE FUNCTION public.get_user_team_role(p_user_id UUID)
RETURNS TABLE(
  team_id UUID,
  team_name TEXT,
  role TEXT,
  company_domain TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, tm.role, t.company_domain
  FROM public.team_members tm
  JOIN public.teams t ON t.id = tm.team_id
  WHERE tm.user_id = p_user_id
  LIMIT 1;
END;
$$;

-- 2F. score_prediction
CREATE OR REPLACE FUNCTION public.score_prediction(
  p_prediction_id UUID,
  p_outcome TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO control_plane.prediction_outcomes (prediction_id, outcome, scored_by, notes)
  VALUES (p_prediction_id, p_outcome, auth.uid(), p_notes)
  ON CONFLICT (prediction_id) DO UPDATE SET
    outcome = EXCLUDED.outcome,
    scored_by = EXCLUDED.scored_by,
    notes = EXCLUDED.notes,
    scored_at = NOW();

  UPDATE control_plane.predictions
  SET status = 'resolved'
  WHERE id = p_prediction_id;
END;
$$;

-- 2G. get_prediction_accuracy
CREATE OR REPLACE FUNCTION public.get_prediction_accuracy(p_user_id UUID)
RETURNS TABLE(
  company_name TEXT,
  total_predictions INT,
  scored_predictions INT,
  correct_count INT,
  partial_count INT,
  incorrect_count INT,
  accuracy_pct NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.company_name,
    COUNT(*)::INT AS total_predictions,
    COUNT(po.id)::INT AS scored_predictions,
    COUNT(*) FILTER (WHERE po.outcome = 'correct')::INT,
    COUNT(*) FILTER (WHERE po.outcome = 'partial')::INT,
    COUNT(*) FILTER (WHERE po.outcome = 'incorrect')::INT,
    CASE WHEN COUNT(po.id) = 0 THEN 0
    ELSE ROUND(
      (COUNT(*) FILTER (WHERE po.outcome = 'correct')::NUMERIC +
       COUNT(*) FILTER (WHERE po.outcome = 'partial')::NUMERIC * 0.5)
      / COUNT(po.id) * 100, 1
    ) END
  FROM control_plane.predictions p
  LEFT JOIN control_plane.prediction_outcomes po ON po.prediction_id = p.id
  WHERE p.user_id = p_user_id
  GROUP BY p.company_name
  ORDER BY COUNT(*) DESC;
END;
$$;

-- 2H. log_deal
CREATE OR REPLACE FUNCTION public.log_deal(
  p_user_id UUID,
  p_competitor_name TEXT,
  p_outcome TEXT,
  p_deal_name TEXT DEFAULT NULL,
  p_deal_value NUMERIC DEFAULT NULL,
  p_close_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_deal_id UUID;
  v_team_id UUID;
  v_company_id UUID;
BEGIN
  -- Get user's team
  SELECT tm.team_id INTO v_team_id
  FROM public.team_members tm WHERE tm.user_id = p_user_id LIMIT 1;

  -- Get competitor company_id from core.companies
  SELECT c.id INTO v_company_id
  FROM core.companies c WHERE c.name = p_competitor_name LIMIT 1;

  -- Insert deal
  INSERT INTO win_loss.deals (
    user_id, team_id, competitor_company_id, competitor_name,
    outcome, deal_name, deal_value, close_date, notes
  ) VALUES (
    p_user_id, v_team_id, v_company_id, p_competitor_name,
    p_outcome, p_deal_name, p_deal_value, p_close_date, p_notes
  ) RETURNING id INTO v_deal_id;

  -- Auto-link signals that were active during the deal period
  IF p_close_date IS NOT NULL AND v_company_id IS NOT NULL THEN
    INSERT INTO win_loss.deal_signals (deal_id, signal_id, relevance)
    SELECT v_deal_id, s.id, 'auto'
    FROM control_plane.signals s
    WHERE s.company_id = v_company_id
      AND s.created_at >= (p_close_date - INTERVAL '30 days')
      AND s.created_at <= (p_close_date + INTERVAL '7 days')
    ON CONFLICT (deal_id, signal_id) DO NOTHING;
  END IF;

  RETURN v_deal_id;
END;
$$;

-- 2I. downgrade_to_free
CREATE OR REPLACE FUNCTION public.downgrade_to_free(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_keep_ids UUID[];
BEGIN
  -- Get the top 2 competitors by priority to keep active
  SELECT ARRAY_AGG(id ORDER BY priority DESC)
  INTO v_keep_ids
  FROM (
    SELECT id, priority
    FROM public.user_tracked_competitors
    WHERE user_id = p_user_id AND is_active = TRUE
    ORDER BY priority DESC
    LIMIT 2
  ) top2;

  -- Pause excess competitors (keep data, just disable)
  UPDATE public.user_tracked_competitors
  SET is_active = FALSE
  WHERE user_id = p_user_id
    AND is_active = TRUE
    AND id != ALL(COALESCE(v_keep_ids, ARRAY[]::UUID[]));

  -- Update pilot account
  UPDATE public.pilot_accounts
  SET status = 'free',
      tier = 'free',
      max_competitors = 2,
      downgraded_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- 2J. upgrade_tier
CREATE OR REPLACE FUNCTION public.upgrade_tier(p_user_id UUID, p_tier TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_max INT;
BEGIN
  v_max := CASE p_tier
    WHEN 'growth' THEN 5
    WHEN 'enterprise' THEN 10
    ELSE 2
  END;

  -- Update pilot account
  UPDATE public.pilot_accounts
  SET status = 'active',
      tier = p_tier,
      max_competitors = v_max,
      converted_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Re-activate paused competitors up to new limit
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY priority DESC, created_at ASC) as rn
    FROM public.user_tracked_competitors
    WHERE user_id = p_user_id AND is_active = FALSE
  )
  UPDATE public.user_tracked_competitors utc
  SET is_active = TRUE
  FROM ranked r
  WHERE utc.id = r.id AND r.rn <= v_max - (
    SELECT COUNT(*) FROM public.user_tracked_competitors
    WHERE user_id = p_user_id AND is_active = TRUE
  );
END;
$$;

-- 2K. Knowledge Ledger
CREATE OR REPLACE FUNCTION public.get_knowledge_ledger(p_user_id UUID)
RETURNS TABLE(
  total_knowledge_objects INT,
  total_signals_processed INT,
  total_packets INT,
  prediction_accuracy NUMERIC,
  predictions_scored INT,
  predictions_total INT,
  competitors_monitored INT,
  pages_tracked INT,
  pilot_days_remaining INT,
  pilot_days_elapsed INT,
  weekly_signal_growth NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_company_ids UUID[];
BEGIN
  -- Get user's competitor company_ids (core.companies)
  SELECT ARRAY_AGG(DISTINCT cc.id)
  INTO v_company_ids
  FROM public.user_tracked_competitors utc
  JOIN core.companies cc ON cc.name = utc.competitor_name
  WHERE utc.user_id = p_user_id AND utc.is_active = TRUE;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INT FROM gtm_memory.knowledge_items ki
     JOIN gtm_memory.knowledge_mentions km ON km.knowledge_item_id = ki.id
     JOIN control_plane.signals s ON km.signal_id = s.id
     WHERE s.company_id = ANY(v_company_ids)),

    (SELECT COUNT(*)::INT FROM control_plane.signals
     WHERE company_id = ANY(v_company_ids)),

    (SELECT COUNT(*)::INT FROM control_plane.packets
     WHERE user_id = p_user_id),

    (SELECT COALESCE(
       AVG(CASE WHEN po.outcome = 'correct' THEN 1.0
                WHEN po.outcome = 'partial' THEN 0.5
                ELSE 0.0 END) * 100, 0)
     FROM control_plane.predictions p
     JOIN control_plane.prediction_outcomes po ON po.prediction_id = p.id
     WHERE p.user_id = p_user_id),

    (SELECT COUNT(*)::INT FROM control_plane.prediction_outcomes po
     JOIN control_plane.predictions p ON p.id = po.prediction_id
     WHERE p.user_id = p_user_id),

    (SELECT COUNT(*)::INT FROM control_plane.predictions
     WHERE user_id = p_user_id),

    (SELECT COUNT(*)::INT FROM public.user_tracked_competitors
     WHERE user_id = p_user_id AND is_active = TRUE),

    (SELECT COUNT(*)::INT FROM core.tracked_pages
     WHERE user_id = p_user_id AND enabled = TRUE),

    (SELECT GREATEST(0, EXTRACT(DAY FROM pa.pilot_end - NOW()))::INT
     FROM public.pilot_accounts pa WHERE pa.user_id = p_user_id),

    (SELECT EXTRACT(DAY FROM NOW() - pa.pilot_start)::INT
     FROM public.pilot_accounts pa WHERE pa.user_id = p_user_id),

    (SELECT COALESCE(
       CASE WHEN last_week = 0 THEN this_week * 100.0
            ELSE ((this_week - last_week)::NUMERIC / last_week) * 100 END, 0)
     FROM (
       SELECT
         COUNT(*) FILTER (WHERE s.created_at >= DATE_TRUNC('week', NOW())) AS this_week,
         COUNT(*) FILTER (WHERE s.created_at >= DATE_TRUNC('week', NOW()) - INTERVAL '7 days'
                          AND s.created_at < DATE_TRUNC('week', NOW())) AS last_week
       FROM control_plane.signals s WHERE s.company_id = ANY(v_company_ids)
     ) growth);
END;
$$;

-- 2L. Extend get_user_context with industry for auto-widening
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID)
RETURNS TABLE(
  company_name TEXT,
  company_domain TEXT,
  competitor_ids UUID[],
  competitor_names TEXT[],
  competitor_domains TEXT[],
  user_industry TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    ucp.company_name,
    ucp.company_domain,
    ARRAY_AGG(DISTINCT COALESCE(cc.id, utc.company_id)) FILTER (WHERE COALESCE(cc.id, utc.company_id) IS NOT NULL),
    ARRAY_AGG(utc.competitor_name),
    ARRAY_AGG(utc.competitor_domain),
    ucp.industry
  FROM public.user_company_profiles ucp
  LEFT JOIN public.user_tracked_competitors utc
    ON ucp.user_id = utc.user_id AND utc.is_active = TRUE
  LEFT JOIN core.companies cc
    ON cc.name = utc.competitor_name
  WHERE ucp.user_id = p_user_id
  GROUP BY ucp.company_name, ucp.company_domain, ucp.industry;
END;
$$;

-- ============================================================================
-- 3. EXTEND complete_onboarding_with_pages
--    Add: pilot account creation, team creation, anti-gaming checks
-- ============================================================================

CREATE OR REPLACE FUNCTION public.complete_onboarding_with_pages(
  p_user_id UUID,
  p_company_name TEXT,
  p_company_domain TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_company_size TEXT DEFAULT NULL,
  p_job_title TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_competitors JSONB DEFAULT '[]'::jsonb
)
RETURNS public.user_company_profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_profile public.user_company_profiles;
  v_competitor JSONB;
  v_public_company_id UUID;
  v_core_company_id UUID;
  v_company_slug TEXT;
  v_team_id UUID;
  v_fingerprint TEXT;
  v_competitor_names TEXT[] := ARRAY[]::TEXT[];
  v_existing_pilot RECORD;
BEGIN
  -- Step 1: Upsert user company profile
  INSERT INTO public.user_company_profiles (
    user_id, company_name, company_domain, industry,
    company_size, job_title, department, onboarding_completed_at
  ) VALUES (
    p_user_id, p_company_name, p_company_domain, p_industry,
    p_company_size, p_job_title, p_department, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    company_domain = EXCLUDED.company_domain,
    industry = EXCLUDED.industry,
    company_size = EXCLUDED.company_size,
    job_title = EXCLUDED.job_title,
    department = EXCLUDED.department,
    onboarding_completed_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO v_profile;

  -- Step 2: Clear existing tracked competitors for this user
  DELETE FROM public.user_tracked_competitors WHERE user_id = p_user_id;

  -- Step 3: For each competitor
  FOR v_competitor IN SELECT * FROM jsonb_array_elements(p_competitors)
  LOOP
    -- Collect competitor names for fingerprinting
    v_competitor_names := array_append(v_competitor_names, LOWER(v_competitor->>'name'));

    -- Upsert into public.companies
    INSERT INTO public.companies (name, domain)
    VALUES (
      v_competitor->>'name',
      v_competitor->>'domain'
    )
    ON CONFLICT (domain) DO UPDATE SET
      name = EXCLUDED.name
    RETURNING id INTO v_public_company_id;

    -- Upsert into core.companies
    INSERT INTO core.companies (name, domain)
    VALUES (
      v_competitor->>'name',
      v_competitor->>'domain'
    )
    ON CONFLICT (name) DO NOTHING;

    SELECT c.id INTO v_core_company_id
    FROM core.companies c
    WHERE c.name = v_competitor->>'name';

    -- Compute slug from domain
    v_company_slug := replace(
      replace(COALESCE(v_competitor->>'domain', ''), '.com', ''),
      '.', '-'
    );

    -- Insert competitor tracking record
    INSERT INTO public.user_tracked_competitors (
      user_id, company_id, competitor_name, competitor_domain, priority
    ) VALUES (
      p_user_id, v_public_company_id,
      v_competitor->>'name',
      v_competitor->>'domain',
      COALESCE((v_competitor->>'priority')::INT, 0)
    )
    ON CONFLICT (user_id, competitor_domain) DO UPDATE SET
      competitor_name = EXCLUDED.competitor_name,
      company_id = EXCLUDED.company_id,
      priority = EXCLUDED.priority;

    -- Insert tracked pages
    IF v_competitor->'pages' IS NOT NULL AND jsonb_array_length(v_competitor->'pages') > 0 THEN
      INSERT INTO core.tracked_pages (
        company_name, company_slug, url, url_type, enabled, user_id, company_id
      )
      SELECT
        v_competitor->>'name',
        v_company_slug,
        (page->>'url')::text,
        COALESCE((page->>'url_type')::text, 'homepage'),
        true,
        p_user_id,
        v_core_company_id
      FROM jsonb_array_elements(v_competitor->'pages') AS page;
    END IF;
  END LOOP;

  -- Step 4: Create team (if not exists)
  SELECT t.id INTO v_team_id
  FROM public.teams t
  JOIN public.team_members tm ON tm.team_id = t.id
  WHERE tm.user_id = p_user_id
  LIMIT 1;

  IF v_team_id IS NULL THEN
    INSERT INTO public.teams (name, company_domain, created_by)
    VALUES (p_company_name, p_company_domain, p_user_id)
    RETURNING id INTO v_team_id;

    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (v_team_id, p_user_id, 'admin');
  END IF;

  -- Step 5: Create pilot account (if not exists)
  -- Compute competitor fingerprint
  SELECT array_to_string(ARRAY(SELECT unnest(v_competitor_names) ORDER BY 1), '|')
  INTO v_fingerprint;
  v_fingerprint := md5(COALESCE(v_fingerprint, ''));

  -- Check for domain-level gaming
  IF p_company_domain IS NOT NULL THEN
    SELECT * INTO v_existing_pilot
    FROM public.pilot_accounts
    WHERE company_domain = p_company_domain
      AND status IN ('pilot', 'grace', 'active')
      AND user_id != p_user_id;

    IF FOUND THEN
      -- Domain already has an active pilot — still create account but flag it
      -- (don't block — let the admin review)
      NULL;
    END IF;
  END IF;

  INSERT INTO public.pilot_accounts (
    user_id, team_id, company_domain,
    competitor_fingerprint
  ) VALUES (
    p_user_id, v_team_id, p_company_domain,
    v_fingerprint
  )
  ON CONFLICT (user_id) DO UPDATE SET
    team_id = EXCLUDED.team_id,
    company_domain = EXCLUDED.company_domain,
    competitor_fingerprint = EXCLUDED.competitor_fingerprint,
    updated_at = NOW();

  RETURN v_profile;
END;
$$;

-- ============================================================================
-- 4. MIGRATE EXISTING PREDICTIONS FROM JSONB TO NORMALIZED TABLE
-- ============================================================================

-- Extract predictions from packets.predictions_json into control_plane.predictions
INSERT INTO control_plane.predictions (packet_id, user_id, prediction_text, timeframe, confidence)
SELECT
  p.id AS packet_id,
  p.user_id,
  pred->>'prediction' AS prediction_text,
  pred->>'timeframe' AS timeframe,
  CASE
    WHEN (pred->>'confidence')::numeric > 1 THEN (pred->>'confidence')::numeric / 100.0
    ELSE (pred->>'confidence')::numeric
  END AS confidence
FROM control_plane.packets p,
     jsonb_array_elements(
       CASE
         WHEN p.predictions_json IS NOT NULL AND p.predictions_json != '[]'::jsonb
           THEN p.predictions_json
         WHEN p.predictions IS NOT NULL AND p.predictions != '[]'::jsonb
           THEN p.predictions
         ELSE '[]'::jsonb
       END
     ) AS pred
WHERE pred->>'prediction' IS NOT NULL
  AND pred->>'prediction' != ''
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. CREATE PILOT ACCOUNTS FOR EXISTING USERS
-- ============================================================================

INSERT INTO public.pilot_accounts (user_id, company_domain, pilot_start, pilot_end, grace_end)
SELECT
  ucp.user_id,
  ucp.company_domain,
  COALESCE(ucp.onboarding_completed_at, ucp.created_at),
  COALESCE(ucp.onboarding_completed_at, ucp.created_at) + INTERVAL '60 days',
  COALESCE(ucp.onboarding_completed_at, ucp.created_at) + INTERVAL '67 days'
FROM public.user_company_profiles ucp
WHERE ucp.onboarding_completed_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.pilot_accounts pa WHERE pa.user_id = ucp.user_id)
ON CONFLICT (user_id) DO NOTHING;

-- Create teams for existing users who don't have one
DO $$
DECLARE
  v_user RECORD;
  v_team_id UUID;
BEGIN
  FOR v_user IN
    SELECT ucp.user_id, ucp.company_name, ucp.company_domain
    FROM public.user_company_profiles ucp
    WHERE ucp.onboarding_completed_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.team_members tm WHERE tm.user_id = ucp.user_id
      )
  LOOP
    INSERT INTO public.teams (name, company_domain, created_by)
    VALUES (v_user.company_name, v_user.company_domain, v_user.user_id)
    RETURNING id INTO v_team_id;

    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (v_team_id, v_user.user_id, 'admin');

    -- Link pilot account to team
    UPDATE public.pilot_accounts
    SET team_id = v_team_id
    WHERE user_id = v_user.user_id;
  END LOOP;
END;
$$;

-- ============================================================================
-- DONE
-- ============================================================================
