-- Demo Schema: Public read-only tables for interactive demo mode
-- Each table mirrors the real data structure + a sector_slug column

CREATE SCHEMA IF NOT EXISTS demo;

-- ============================================================================
-- demo.packets — mirrors public.packets
-- ============================================================================
CREATE TABLE IF NOT EXISTS demo.packets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_slug TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  packet_title TEXT NOT NULL,
  exec_summary JSONB DEFAULT '[]'::jsonb,
  sections JSONB DEFAULT '{}'::jsonb,
  key_questions JSONB DEFAULT '[]'::jsonb,
  bets JSONB DEFAULT '[]'::jsonb,
  predictions JSONB DEFAULT '[]'::jsonb,
  action_mapping JSONB DEFAULT '{}'::jsonb,
  market_winners JSONB,
  status TEXT DEFAULT 'published',
  is_personalized BOOLEAN DEFAULT false,
  user_company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_packets_sector ON demo.packets(sector_slug);
CREATE INDEX IF NOT EXISTS idx_demo_packets_week ON demo.packets(week_start DESC);

-- ============================================================================
-- demo.objection_library_versions — mirrors gtm_artifacts.objection_library_versions
-- ============================================================================
CREATE TABLE IF NOT EXISTS demo.objection_library_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_slug TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  packet_id UUID,
  content_json JSONB DEFAULT '{}'::jsonb,
  content_md TEXT DEFAULT '',
  included_signal_ids TEXT[] DEFAULT '{}',
  objection_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_objections_sector ON demo.objection_library_versions(sector_slug);

-- ============================================================================
-- demo.swipe_file_versions — mirrors gtm_artifacts.swipe_file_versions
-- ============================================================================
CREATE TABLE IF NOT EXISTS demo.swipe_file_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_slug TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  packet_id UUID,
  content_json JSONB DEFAULT '{}'::jsonb,
  content_md TEXT DEFAULT '',
  included_signal_ids TEXT[] DEFAULT '{}',
  phrase_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_swipe_sector ON demo.swipe_file_versions(sector_slug);

-- ============================================================================
-- demo.battlecard_versions — mirrors gtm_artifacts.battlecard_versions
-- ============================================================================
CREATE TABLE IF NOT EXISTS demo.battlecard_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_slug TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  packet_id UUID,
  content_json JSONB DEFAULT '{}'::jsonb,
  content_md TEXT DEFAULT '',
  included_signal_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_battlecards_sector ON demo.battlecard_versions(sector_slug);

-- ============================================================================
-- Grants: anon read-only for public demo access
-- ============================================================================
GRANT USAGE ON SCHEMA demo TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA demo TO anon;

-- Also grant to authenticated and service_role
GRANT USAGE ON SCHEMA demo TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA demo TO authenticated;

GRANT USAGE ON SCHEMA demo TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA demo TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA demo TO service_role;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA demo GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA demo GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA demo GRANT ALL ON TABLES TO service_role;
