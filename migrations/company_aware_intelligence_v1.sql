-- Company-Aware Intelligence System v1
-- Owner: Signal Plane
-- Purpose: Enable per-user company context and competitor tracking
-- Run order: Execute in Supabase SQL Editor after control_plane_v1_upgrade.sql
-- =========================================================

-- =========================================================
-- SECTION 1: User Company Profiles Table
-- =========================================================

-- Table: user_company_profiles - Stores user's company context
CREATE TABLE IF NOT EXISTS public.user_company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Company information
    company_name TEXT NOT NULL,
    company_domain TEXT,
    industry TEXT,
    company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),

    -- User role context
    job_title TEXT,
    department TEXT CHECK (department IN ('marketing', 'sales', 'revops', 'product', 'executive', 'other')),

    -- Onboarding tracking
    onboarding_completed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One profile per user
    UNIQUE(user_id)
);

-- Indexes for user_company_profiles
CREATE INDEX IF NOT EXISTS idx_user_company_profiles_user
ON public.user_company_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_company_profiles_domain
ON public.user_company_profiles(company_domain)
WHERE company_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_company_profiles_onboarding
ON public.user_company_profiles(onboarding_completed_at)
WHERE onboarding_completed_at IS NULL;


-- =========================================================
-- SECTION 2: User Tracked Competitors Table
-- =========================================================

-- Table: user_tracked_competitors - Links users to companies they track
CREATE TABLE IF NOT EXISTS public.user_tracked_competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Link to existing companies table (nullable for custom entries)
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,

    -- Competitor info (denormalized for display even if company_id deleted)
    competitor_name TEXT NOT NULL,
    competitor_domain TEXT,

    -- Tracking preferences
    priority INT DEFAULT 0, -- Higher = more important, used for ranking
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- One entry per user + domain combination
    UNIQUE(user_id, competitor_domain)
);

-- Indexes for user_tracked_competitors
CREATE INDEX IF NOT EXISTS idx_user_tracked_competitors_user
ON public.user_tracked_competitors(user_id);

CREATE INDEX IF NOT EXISTS idx_user_tracked_competitors_company
ON public.user_tracked_competitors(company_id)
WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_tracked_competitors_active
ON public.user_tracked_competitors(user_id, is_active)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_tracked_competitors_priority
ON public.user_tracked_competitors(user_id, priority DESC);


-- =========================================================
-- SECTION 3: Extend battlecard_versions for personalization
-- =========================================================

-- Add user context columns to battlecard_versions
ALTER TABLE gtm_artifacts.battlecard_versions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE gtm_artifacts.battlecard_versions
ADD COLUMN IF NOT EXISTS user_company_name TEXT;

ALTER TABLE gtm_artifacts.battlecard_versions
ADD COLUMN IF NOT EXISTS is_personalized BOOLEAN DEFAULT FALSE;

-- Index for user-specific battlecards
CREATE INDEX IF NOT EXISTS idx_battlecard_user
ON gtm_artifacts.battlecard_versions(user_id)
WHERE user_id IS NOT NULL;

-- Drop old unique constraint and create new one that includes user_id
DROP INDEX IF EXISTS gtm_artifacts.idx_battlecard_competitor_week;

CREATE UNIQUE INDEX IF NOT EXISTS idx_battlecard_user_competitor_week
ON gtm_artifacts.battlecard_versions (
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    competitor_name,
    week_start,
    week_end
);


-- =========================================================
-- SECTION 4: Extend packets for personalization
-- =========================================================

-- Add user context columns to packets
ALTER TABLE control_plane.packets
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE control_plane.packets
ADD COLUMN IF NOT EXISTS user_company_name TEXT;

ALTER TABLE control_plane.packets
ADD COLUMN IF NOT EXISTS is_personalized BOOLEAN DEFAULT FALSE;

-- Index for user-specific packets
CREATE INDEX IF NOT EXISTS idx_packets_user
ON control_plane.packets(user_id)
WHERE user_id IS NOT NULL;


-- =========================================================
-- SECTION 5: Row Level Security Policies
-- =========================================================

-- Enable RLS on new tables
ALTER TABLE public.user_company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tracked_competitors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/modify their own company profile
CREATE POLICY "Users can view own company profile"
ON public.user_company_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company profile"
ON public.user_company_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company profile"
ON public.user_company_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company profile"
ON public.user_company_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Users can only see/modify their own tracked competitors
CREATE POLICY "Users can view own tracked competitors"
ON public.user_tracked_competitors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracked competitors"
ON public.user_tracked_competitors FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracked competitors"
ON public.user_tracked_competitors FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracked competitors"
ON public.user_tracked_competitors FOR DELETE
USING (auth.uid() = user_id);


-- =========================================================
-- SECTION 6: Helper Functions
-- =========================================================

-- Function: Check if user needs onboarding
CREATE OR REPLACE FUNCTION public.user_needs_onboarding(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1
        FROM public.user_company_profiles
        WHERE user_id = p_user_id
        AND onboarding_completed_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's tracked competitor company IDs
CREATE OR REPLACE FUNCTION public.get_user_competitor_ids(p_user_id UUID)
RETURNS UUID[] AS $$
DECLARE
    v_company_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(company_id)
    INTO v_company_ids
    FROM public.user_tracked_competitors
    WHERE user_id = p_user_id
    AND is_active = TRUE
    AND company_id IS NOT NULL;

    RETURN COALESCE(v_company_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete onboarding (upsert profile + competitors)
CREATE OR REPLACE FUNCTION public.complete_onboarding(
    p_user_id UUID,
    p_company_name TEXT,
    p_company_domain TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_company_size TEXT DEFAULT NULL,
    p_job_title TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_competitors JSONB DEFAULT '[]'::jsonb
)
RETURNS public.user_company_profiles AS $$
DECLARE
    v_profile public.user_company_profiles;
    v_competitor JSONB;
    v_company_id UUID;
BEGIN
    -- Upsert user company profile
    INSERT INTO public.user_company_profiles (
        user_id, company_name, company_domain, industry,
        company_size, job_title, department, onboarding_completed_at
    )
    VALUES (
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

    -- Clear existing tracked competitors and add new ones
    DELETE FROM public.user_tracked_competitors WHERE user_id = p_user_id;

    -- Insert each competitor from the JSONB array
    FOR v_competitor IN SELECT * FROM jsonb_array_elements(p_competitors)
    LOOP
        -- Try to find existing company by domain
        SELECT id INTO v_company_id
        FROM public.companies
        WHERE domain = v_competitor->>'domain'
        LIMIT 1;

        INSERT INTO public.user_tracked_competitors (
            user_id, company_id, competitor_name, competitor_domain, priority
        )
        VALUES (
            p_user_id,
            v_company_id,
            v_competitor->>'name',
            v_competitor->>'domain',
            COALESCE((v_competitor->>'priority')::INT, 0)
        )
        ON CONFLICT (user_id, competitor_domain) DO UPDATE SET
            competitor_name = EXCLUDED.competitor_name,
            company_id = EXCLUDED.company_id,
            priority = EXCLUDED.priority;
    END LOOP;

    RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user context for signal filtering (used by n8n)
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID)
RETURNS TABLE (
    company_name TEXT,
    company_domain TEXT,
    competitor_ids UUID[],
    competitor_names TEXT[],
    competitor_domains TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ucp.company_name,
        ucp.company_domain,
        ARRAY_AGG(DISTINCT utc.company_id) FILTER (WHERE utc.company_id IS NOT NULL),
        ARRAY_AGG(utc.competitor_name),
        ARRAY_AGG(utc.competitor_domain)
    FROM public.user_company_profiles ucp
    LEFT JOIN public.user_tracked_competitors utc
        ON ucp.user_id = utc.user_id AND utc.is_active = TRUE
    WHERE ucp.user_id = p_user_id
    GROUP BY ucp.company_name, ucp.company_domain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================
-- SECTION 7: Comments
-- =========================================================

COMMENT ON TABLE public.user_company_profiles IS 'Stores user company context for personalized intelligence';
COMMENT ON TABLE public.user_tracked_competitors IS 'Links users to competitors they want to track';

COMMENT ON FUNCTION public.user_needs_onboarding IS 'Returns TRUE if user has not completed company onboarding';
COMMENT ON FUNCTION public.get_user_competitor_ids IS 'Returns array of company_ids the user is tracking';
COMMENT ON FUNCTION public.complete_onboarding IS 'Saves user company profile and tracked competitors in one transaction';
COMMENT ON FUNCTION public.get_user_context IS 'Returns full user context for n8n workflow signal filtering';
