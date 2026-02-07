-- Phase 5: Sector Packs Schema
-- Shared intelligence across users via curated company packs
-- Run this in Supabase SQL Editor

-- =========================================
-- 1. CREATE SCHEMA
-- =========================================

CREATE SCHEMA IF NOT EXISTS sector_packs;

-- =========================================
-- 2. PACK DEFINITIONS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS sector_packs.packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  pack_slug TEXT NOT NULL UNIQUE, -- 'gtm-engineering', 'devtools', 'cybersecurity'
  pack_name TEXT NOT NULL,
  description TEXT,

  -- Targeting
  sector TEXT NOT NULL,
  motion TEXT, -- 'plg', 'sales_led', 'hybrid'

  -- Configuration
  default_pages TEXT[] DEFAULT ARRAY['homepage', 'pricing', 'customers', 'integrations'],
  crawl_frequency TEXT DEFAULT 'weekly',

  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  company_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 3. COMPANIES IN PACKS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS sector_packs.pack_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES sector_packs.packs(id) ON DELETE CASCADE,

  -- Company info
  company_id UUID, -- links to tracked company if exists
  company_name TEXT NOT NULL,
  company_domain TEXT NOT NULL,

  -- Classification
  tier TEXT DEFAULT 'leader', -- 'leader', 'challenger', 'emerging'
  weight NUMERIC DEFAULT 1.0, -- for scoring

  -- Pages to track
  tracked_urls JSONB NOT NULL, -- [{"url": "...", "page_type": "pricing"}]

  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, company_domain)
);

-- =========================================
-- 4. USER SUBSCRIPTIONS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS sector_packs.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pack_id UUID NOT NULL REFERENCES sector_packs.packs(id) ON DELETE CASCADE,

  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pack_id)
);

-- =========================================
-- 5. PACK WINNERS TABLE (WEEKLY)
-- =========================================

CREATE TABLE IF NOT EXISTS sector_packs.pack_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES sector_packs.packs(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,

  -- Winners from experiment surveillance
  proven_winners JSONB NOT NULL, -- top 3 proven patterns
  emerging_winners JSONB NOT NULL, -- top 3 emerging patterns

  -- Aggregates
  total_patterns_tracked INT,
  new_patterns_this_week INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, week_start)
);

-- =========================================
-- 6. FUNCTION: EMIT WINNERS TO SIGNALS
-- =========================================

CREATE OR REPLACE FUNCTION sector_packs.emit_winners_to_signals(p_pack_id UUID, p_week_start DATE)
RETURNS void AS $$
DECLARE
  v_winner RECORD;
  v_user RECORD;
BEGIN
  -- Get this week's winners
  SELECT * INTO v_winner
  FROM sector_packs.pack_winners
  WHERE pack_id = p_pack_id AND week_start = p_week_start;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- For each subscribed user, emit pack signals
  FOR v_user IN
    SELECT user_id FROM sector_packs.user_subscriptions WHERE pack_id = p_pack_id
  LOOP
    -- Emit proven winners
    INSERT INTO control_plane.signals (
      id, signal_type, severity, confidence,
      title, summary,
      source_schema, source_table, source_id,
      decision_type, time_sensitivity,
      meta, created_at
    )
    SELECT
      gen_random_uuid(),
      'experiment',
      4,
      0.9,
      'Market Winner: ' || (w->>'pattern_label'),
      w->>'description',
      'sector_packs', 'pack_winners', v_winner.id,
      COALESCE(w->>'category', 'strategy'),
      'this_week',
      jsonb_build_object(
        'pack_id', p_pack_id,
        'user_id', v_user.user_id,
        'scope', 'sector_pack',
        'survivorship', w->>'survivorship_score',
        'propagation', w->>'propagation_score'
      ),
      NOW()
    FROM jsonb_array_elements(v_winner.proven_winners) AS w;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 7. INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_pack_companies_pack ON sector_packs.pack_companies(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON sector_packs.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_pack ON sector_packs.user_subscriptions(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_winners_pack_week ON sector_packs.pack_winners(pack_id, week_start DESC);

-- =========================================
-- 8. GRANTS
-- =========================================

GRANT USAGE ON SCHEMA sector_packs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sector_packs TO authenticated;

-- =========================================
-- 9. SEED INITIAL PACKS
-- =========================================

INSERT INTO sector_packs.packs (pack_slug, pack_name, description, sector, motion) VALUES
  ('gtm-engineering', 'GTM Engineering Leaders', 'Top PLG companies with strong GTM engineering', 'gtm_engineering', 'plg'),
  ('devtools', 'Developer Tools', 'Leading developer tools and platforms', 'devtools', 'plg'),
  ('cybersecurity', 'Cybersecurity', 'Enterprise security vendors', 'cybersecurity', 'sales_led'),
  ('data-ai-infra', 'Data & AI Infrastructure', 'Data platforms and AI infrastructure', 'data_ai', 'hybrid'),
  ('product-analytics', 'Product Analytics', 'Product analytics and experimentation', 'analytics', 'plg')
ON CONFLICT (pack_slug) DO NOTHING;

-- =========================================
-- 10. SEED GTM ENGINEERING PACK COMPANIES
-- =========================================

INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT
  p.id,
  c.company_name,
  c.company_domain,
  c.tier,
  c.tracked_urls
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Stripe', 'stripe.com', 'leader', '[{"url": "https://stripe.com", "page_type": "homepage"}, {"url": "https://stripe.com/pricing", "page_type": "pricing"}]'::JSONB),
  ('Segment', 'segment.com', 'leader', '[{"url": "https://segment.com", "page_type": "homepage"}, {"url": "https://segment.com/pricing", "page_type": "pricing"}]'::JSONB),
  ('Amplitude', 'amplitude.com', 'leader', '[{"url": "https://amplitude.com", "page_type": "homepage"}, {"url": "https://amplitude.com/pricing", "page_type": "pricing"}]'::JSONB),
  ('Mixpanel', 'mixpanel.com', 'challenger', '[{"url": "https://mixpanel.com", "page_type": "homepage"}, {"url": "https://mixpanel.com/pricing", "page_type": "pricing"}]'::JSONB),
  ('Heap', 'heap.io', 'challenger', '[{"url": "https://heap.io", "page_type": "homepage"}, {"url": "https://heap.io/pricing", "page_type": "pricing"}]'::JSONB)
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'gtm-engineering'
ON CONFLICT (pack_id, company_domain) DO NOTHING;

-- =========================================
-- 11. UPDATE COMPANY COUNTS
-- =========================================

UPDATE sector_packs.packs SET company_count = (
  SELECT COUNT(*) FROM sector_packs.pack_companies WHERE pack_id = packs.id AND enabled = true
);

-- =========================================
-- DONE
-- =========================================

SELECT 'Phase 5: Sector Packs schema created successfully' AS status;
