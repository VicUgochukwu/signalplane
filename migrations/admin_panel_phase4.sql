-- =====================================================
-- ADMIN PANEL — Phase 4: Community & Communication
-- Run in Supabase SQL Editor as postgres role
-- =====================================================

-- =====================================================
-- A. NEWSLETTER TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin.newsletter_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  subject       TEXT NOT NULL,
  body_html     TEXT NOT NULL,
  body_text     TEXT,
  variables     TEXT[] NOT NULL DEFAULT '{}',
  category      TEXT NOT NULL DEFAULT 'general'
                CHECK (category IN ('general', 'newsletter', 'announcement', 'onboarding', 're-engagement')),
  is_archived   BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_templates_category
  ON admin.newsletter_templates (category, is_archived);

ALTER TABLE admin.newsletter_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read newsletter_templates"
  ON admin.newsletter_templates FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage newsletter_templates"
  ON admin.newsletter_templates FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on newsletter_templates"
  ON admin.newsletter_templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- B. AUDIENCE SEGMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin.audience_segments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  criteria        JSONB NOT NULL DEFAULT '{}',
  estimated_count INT,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin.audience_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audience_segments"
  ON admin.audience_segments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage audience_segments"
  ON admin.audience_segments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on audience_segments"
  ON admin.audience_segments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- C. EMAIL CAMPAIGNS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin.email_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  template_id      UUID NOT NULL REFERENCES admin.newsletter_templates(id),
  segment_id       UUID NOT NULL REFERENCES admin.audience_segments(id),
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')),
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  total_recipients INT DEFAULT 0,
  from_name        TEXT NOT NULL DEFAULT 'SignalPlane',
  from_email       TEXT NOT NULL DEFAULT 'hello@signalplane.dev',
  reply_to         TEXT DEFAULT 'hello@signalplane.dev',
  metadata         JSONB DEFAULT '{}',
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status
  ON admin.email_campaigns (status, scheduled_at);

ALTER TABLE admin.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email_campaigns"
  ON admin.email_campaigns FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage email_campaigns"
  ON admin.email_campaigns FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on email_campaigns"
  ON admin.email_campaigns FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- D. EMAIL SEND LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin.email_send_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID NOT NULL REFERENCES admin.email_campaigns(id) ON DELETE CASCADE,
  recipient_id        UUID NOT NULL REFERENCES auth.users(id),
  recipient_email     TEXT NOT NULL,
  resend_message_id   TEXT,
  status              TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  opened_at           TIMESTAMPTZ,
  clicked_at          TIMESTAMPTZ,
  bounced_at          TIMESTAMPTZ,
  failed_reason       TEXT,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_send_log_campaign
  ON admin.email_send_log (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient
  ON admin.email_send_log (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_resend_id
  ON admin.email_send_log (resend_message_id)
  WHERE resend_message_id IS NOT NULL;

ALTER TABLE admin.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email_send_log"
  ON admin.email_send_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on email_send_log"
  ON admin.email_send_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- E. EMAIL UNSUBSCRIBE TOKENS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin.email_unsubscribe_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token            TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_unsubscribed  BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unsubscribe_token_user
  ON admin.email_unsubscribe_tokens (user_id);

ALTER TABLE admin.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email_unsubscribe_tokens"
  ON admin.email_unsubscribe_tokens FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Users can read own unsubscribe token"
  ON admin.email_unsubscribe_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access on email_unsubscribe_tokens"
  ON admin.email_unsubscribe_tokens FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- F. FEATURE FLAG SEED
-- =====================================================

INSERT INTO admin.feature_flags (flag_key, label, description, is_enabled, applies_to) VALUES
  ('email_campaigns', 'Email Campaigns', 'Enable email campaign management in admin panel', true, 'admin')
ON CONFLICT (flag_key) DO NOTHING;

-- =====================================================
-- G. TEMPLATE CRUD RPCs
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_create_newsletter_template(
  p_name TEXT,
  p_subject TEXT,
  p_body_html TEXT,
  p_body_text TEXT DEFAULT NULL,
  p_variables TEXT[] DEFAULT '{}',
  p_category TEXT DEFAULT 'general'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_template_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  INSERT INTO admin.newsletter_templates (name, subject, body_html, body_text, variables, category, created_by)
  VALUES (p_name, p_subject, p_body_html, p_body_text, p_variables, p_category, v_admin_id)
  RETURNING id INTO v_template_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'create_newsletter_template', 'newsletter_template', v_template_id::TEXT,
    jsonb_build_object('name', p_name, 'category', p_category));

  RETURN v_template_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_newsletter_templates(
  p_category TEXT DEFAULT NULL,
  p_include_archived BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID, name TEXT, subject TEXT, category TEXT,
  variables TEXT[], is_archived BOOLEAN,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT nt.id, nt.name, nt.subject, nt.category,
    nt.variables, nt.is_archived, nt.created_at, nt.updated_at
  FROM admin.newsletter_templates nt
  WHERE (p_category IS NULL OR nt.category = p_category)
    AND (p_include_archived OR nt.is_archived = false)
  ORDER BY nt.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_newsletter_template(p_template_id UUID)
RETURNS TABLE (
  id UUID, name TEXT, subject TEXT, body_html TEXT, body_text TEXT,
  variables TEXT[], category TEXT, is_archived BOOLEAN,
  created_by UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT nt.id, nt.name, nt.subject, nt.body_html, nt.body_text,
    nt.variables, nt.category, nt.is_archived,
    nt.created_by, nt.created_at, nt.updated_at
  FROM admin.newsletter_templates nt
  WHERE nt.id = p_template_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_newsletter_template(
  p_template_id UUID,
  p_name TEXT DEFAULT NULL,
  p_subject TEXT DEFAULT NULL,
  p_body_html TEXT DEFAULT NULL,
  p_body_text TEXT DEFAULT NULL,
  p_variables TEXT[] DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  UPDATE admin.newsletter_templates SET
    name = COALESCE(p_name, name),
    subject = COALESCE(p_subject, subject),
    body_html = COALESCE(p_body_html, body_html),
    body_text = COALESCE(p_body_text, body_text),
    variables = COALESCE(p_variables, variables),
    category = COALESCE(p_category, category),
    updated_at = now()
  WHERE id = p_template_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'update_newsletter_template', 'newsletter_template', p_template_id::TEXT,
    jsonb_build_object('name', p_name, 'category', p_category));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_newsletter_template(p_template_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  -- Soft delete: archive instead of DELETE to preserve campaign references
  UPDATE admin.newsletter_templates
  SET is_archived = true, updated_at = now()
  WHERE id = p_template_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'archive_newsletter_template', 'newsletter_template', p_template_id::TEXT, '{}');
END;
$$;

-- =====================================================
-- H. SEGMENT CRUD + PREVIEW RPCs
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_create_audience_segment(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_criteria JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_segment_id UUID;
  v_count INT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  -- Count matching users for estimated_count
  SELECT COUNT(*)::INT INTO v_count
  FROM admin.user_profiles up
  JOIN auth.users u ON u.id = up.id
  WHERE up.is_banned = false
    AND (NOT (p_criteria ? 'role') OR up.role = ANY(ARRAY(SELECT jsonb_array_elements_text(p_criteria->'role'))))
    AND (NOT (p_criteria ? 'status') OR
      CASE p_criteria->>'status'
        WHEN 'active' THEN up.is_suspended = false AND up.is_banned = false
        WHEN 'suspended' THEN up.is_suspended = true
        WHEN 'banned' THEN up.is_banned = true
        ELSE true
      END)
    AND (NOT (p_criteria ? 'signup_after') OR u.created_at >= (p_criteria->>'signup_after')::TIMESTAMPTZ)
    AND (NOT (p_criteria ? 'signup_before') OR u.created_at <= (p_criteria->>'signup_before')::TIMESTAMPTZ)
    AND (NOT (p_criteria ? 'active_within_days') OR up.last_active_at >= now() - ((p_criteria->>'active_within_days')::INT || ' days')::INTERVAL);

  INSERT INTO admin.audience_segments (name, description, criteria, estimated_count, created_by)
  VALUES (p_name, p_description, p_criteria, v_count, v_admin_id)
  RETURNING id INTO v_segment_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'create_audience_segment', 'audience_segment', v_segment_id::TEXT,
    jsonb_build_object('name', p_name, 'estimated_count', v_count));

  RETURN v_segment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_audience_segments()
RETURNS TABLE (
  id UUID, name TEXT, description TEXT, criteria JSONB,
  estimated_count INT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT s.id, s.name, s.description, s.criteria,
    s.estimated_count, s.created_at, s.updated_at
  FROM admin.audience_segments s
  ORDER BY s.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_audience_segment(p_segment_id UUID)
RETURNS TABLE (
  id UUID, name TEXT, description TEXT, criteria JSONB,
  estimated_count INT, created_by UUID,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT s.id, s.name, s.description, s.criteria,
    s.estimated_count, s.created_by, s.created_at, s.updated_at
  FROM admin.audience_segments s
  WHERE s.id = p_segment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_audience_segment(
  p_segment_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_criteria JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_count INT;
  v_effective_criteria JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  -- If criteria changed, recalculate estimated_count
  IF p_criteria IS NOT NULL THEN
    v_effective_criteria := p_criteria;
    SELECT COUNT(*)::INT INTO v_count
    FROM admin.user_profiles up
    JOIN auth.users u ON u.id = up.id
    WHERE up.is_banned = false
      AND (NOT (v_effective_criteria ? 'role') OR up.role = ANY(ARRAY(SELECT jsonb_array_elements_text(v_effective_criteria->'role'))))
      AND (NOT (v_effective_criteria ? 'status') OR
        CASE v_effective_criteria->>'status'
          WHEN 'active' THEN up.is_suspended = false AND up.is_banned = false
          WHEN 'suspended' THEN up.is_suspended = true
          WHEN 'banned' THEN up.is_banned = true
          ELSE true
        END)
      AND (NOT (v_effective_criteria ? 'signup_after') OR u.created_at >= (v_effective_criteria->>'signup_after')::TIMESTAMPTZ)
      AND (NOT (v_effective_criteria ? 'signup_before') OR u.created_at <= (v_effective_criteria->>'signup_before')::TIMESTAMPTZ)
      AND (NOT (v_effective_criteria ? 'active_within_days') OR up.last_active_at >= now() - ((v_effective_criteria->>'active_within_days')::INT || ' days')::INTERVAL);

    UPDATE admin.audience_segments SET
      name = COALESCE(p_name, name),
      description = COALESCE(p_description, description),
      criteria = p_criteria,
      estimated_count = v_count,
      updated_at = now()
    WHERE id = p_segment_id;
  ELSE
    UPDATE admin.audience_segments SET
      name = COALESCE(p_name, name),
      description = COALESCE(p_description, description),
      updated_at = now()
    WHERE id = p_segment_id;
  END IF;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'update_audience_segment', 'audience_segment', p_segment_id::TEXT,
    jsonb_build_object('name', p_name, 'criteria_changed', p_criteria IS NOT NULL));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_audience_segment(p_segment_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_active_campaigns INT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  -- Check no active campaigns reference this segment
  SELECT COUNT(*) INTO v_active_campaigns
  FROM admin.email_campaigns
  WHERE segment_id = p_segment_id AND status NOT IN ('sent', 'cancelled', 'failed');

  IF v_active_campaigns > 0 THEN
    RAISE EXCEPTION 'Cannot delete segment: % active campaign(s) reference it', v_active_campaigns;
  END IF;

  DELETE FROM admin.audience_segments WHERE id = p_segment_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'delete_audience_segment', 'audience_segment', p_segment_id::TEXT, '{}');
END;
$$;

-- Preview segment: evaluate criteria and return matching users
CREATE OR REPLACE FUNCTION public.admin_preview_segment(
  p_criteria JSONB,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  tracked_companies BIGINT,
  match_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    up.id AS user_id,
    u.email::TEXT,
    up.display_name,
    up.role,
    up.last_active_at,
    u.created_at,
    COALESCE(tp_count.cnt, 0) AS tracked_companies,
    COUNT(*) OVER() AS match_count
  FROM admin.user_profiles up
  JOIN auth.users u ON u.id = up.id
  LEFT JOIN (
    SELECT tp.user_id, COUNT(*)::BIGINT AS cnt
    FROM core.tracked_pages tp
    WHERE tp.enabled = true
    GROUP BY tp.user_id
  ) tp_count ON tp_count.user_id = up.id
  LEFT JOIN delivery_preferences dp ON dp.user_id = up.id AND dp.enabled = true
  WHERE
    -- Role filter
    (NOT (p_criteria ? 'role') OR up.role = ANY(ARRAY(SELECT jsonb_array_elements_text(p_criteria->'role'))))
    -- Status filter
    AND (NOT (p_criteria ? 'status') OR
      CASE p_criteria->>'status'
        WHEN 'active' THEN up.is_suspended = false AND up.is_banned = false
        WHEN 'suspended' THEN up.is_suspended = true
        WHEN 'banned' THEN up.is_banned = true
        ELSE true
      END)
    -- Signup date range
    AND (NOT (p_criteria ? 'signup_after') OR u.created_at >= (p_criteria->>'signup_after')::TIMESTAMPTZ)
    AND (NOT (p_criteria ? 'signup_before') OR u.created_at <= (p_criteria->>'signup_before')::TIMESTAMPTZ)
    -- Activity filter
    AND (NOT (p_criteria ? 'active_within_days') OR up.last_active_at >= now() - ((p_criteria->>'active_within_days')::INT || ' days')::INTERVAL)
    -- Tracked companies filter
    AND (NOT (p_criteria ? 'min_tracked_companies') OR COALESCE(tp_count.cnt, 0) >= (p_criteria->>'min_tracked_companies')::INT)
    -- Delivery channel filter
    AND (NOT (p_criteria ? 'has_delivery_channel') OR dp.channel_type = p_criteria->>'has_delivery_channel')
  ORDER BY up.last_active_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- I. CAMPAIGN CRUD + ACTIONS RPCs
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_create_email_campaign(
  p_name TEXT,
  p_template_id UUID,
  p_segment_id UUID,
  p_from_name TEXT DEFAULT 'SignalPlane',
  p_from_email TEXT DEFAULT 'hello@signalplane.dev',
  p_reply_to TEXT DEFAULT 'hello@signalplane.dev',
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_campaign_id UUID;
  v_status TEXT;
  v_template_exists BOOLEAN;
  v_segment_exists BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  -- Validate template exists and is not archived
  SELECT EXISTS(
    SELECT 1 FROM admin.newsletter_templates WHERE id = p_template_id AND is_archived = false
  ) INTO v_template_exists;
  IF NOT v_template_exists THEN RAISE EXCEPTION 'Template not found or archived'; END IF;

  -- Validate segment exists
  SELECT EXISTS(
    SELECT 1 FROM admin.audience_segments WHERE id = p_segment_id
  ) INTO v_segment_exists;
  IF NOT v_segment_exists THEN RAISE EXCEPTION 'Segment not found'; END IF;

  v_status := CASE WHEN p_scheduled_at IS NOT NULL THEN 'scheduled' ELSE 'draft' END;

  INSERT INTO admin.email_campaigns (name, template_id, segment_id, status, scheduled_at, from_name, from_email, reply_to, created_by)
  VALUES (p_name, p_template_id, p_segment_id, v_status, p_scheduled_at, p_from_name, p_from_email, p_reply_to, v_admin_id)
  RETURNING id INTO v_campaign_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'create_email_campaign', 'email_campaign', v_campaign_id::TEXT,
    jsonb_build_object('name', p_name, 'status', v_status, 'template_id', p_template_id, 'segment_id', p_segment_id));

  RETURN v_campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_email_campaigns(
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID, name TEXT, status TEXT,
  template_name TEXT, segment_name TEXT,
  total_recipients INT,
  scheduled_at TIMESTAMPTZ, sent_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    ec.id, ec.name, ec.status,
    nt.name AS template_name,
    s.name AS segment_name,
    ec.total_recipients,
    ec.scheduled_at, ec.sent_at, ec.completed_at,
    ec.created_at
  FROM admin.email_campaigns ec
  JOIN admin.newsletter_templates nt ON nt.id = ec.template_id
  JOIN admin.audience_segments s ON s.id = ec.segment_id
  WHERE (p_status IS NULL OR ec.status = p_status)
  ORDER BY ec.created_at DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_email_campaign(p_campaign_id UUID)
RETURNS TABLE (
  id UUID, name TEXT, status TEXT,
  template_id UUID, template_name TEXT, template_subject TEXT,
  segment_id UUID, segment_name TEXT, segment_criteria JSONB,
  total_recipients INT, from_name TEXT, from_email TEXT, reply_to TEXT,
  scheduled_at TIMESTAMPTZ, sent_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  metadata JSONB, created_by UUID, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    ec.id, ec.name, ec.status,
    ec.template_id, nt.name, nt.subject,
    ec.segment_id, s.name, s.criteria,
    ec.total_recipients, ec.from_name, ec.from_email, ec.reply_to,
    ec.scheduled_at, ec.sent_at, ec.completed_at,
    ec.metadata, ec.created_by, ec.created_at
  FROM admin.email_campaigns ec
  JOIN admin.newsletter_templates nt ON nt.id = ec.template_id
  JOIN admin.audience_segments s ON s.id = ec.segment_id
  WHERE ec.id = p_campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_email_campaign(
  p_campaign_id UUID,
  p_name TEXT DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_segment_id UUID DEFAULT NULL,
  p_from_name TEXT DEFAULT NULL,
  p_from_email TEXT DEFAULT NULL,
  p_reply_to TEXT DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_current_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  SELECT status INTO v_current_status FROM admin.email_campaigns WHERE id = p_campaign_id;
  IF v_current_status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Cannot edit campaign with status: %', v_current_status;
  END IF;

  UPDATE admin.email_campaigns SET
    name = COALESCE(p_name, name),
    template_id = COALESCE(p_template_id, template_id),
    segment_id = COALESCE(p_segment_id, segment_id),
    from_name = COALESCE(p_from_name, from_name),
    from_email = COALESCE(p_from_email, from_email),
    reply_to = COALESCE(p_reply_to, reply_to),
    scheduled_at = COALESCE(p_scheduled_at, scheduled_at),
    status = CASE
      WHEN COALESCE(p_scheduled_at, scheduled_at) IS NOT NULL THEN 'scheduled'
      ELSE 'draft'
    END,
    updated_at = now()
  WHERE id = p_campaign_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'update_email_campaign', 'email_campaign', p_campaign_id::TEXT,
    jsonb_build_object('name', p_name, 'scheduled_at', p_scheduled_at));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_cancel_email_campaign(p_campaign_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_current_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  SELECT status INTO v_current_status FROM admin.email_campaigns WHERE id = p_campaign_id;
  IF v_current_status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Cannot cancel campaign with status: %', v_current_status;
  END IF;

  UPDATE admin.email_campaigns SET status = 'cancelled', updated_at = now()
  WHERE id = p_campaign_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'cancel_email_campaign', 'email_campaign', p_campaign_id::TEXT,
    jsonb_build_object('previous_status', v_current_status));
END;
$$;

-- =====================================================
-- J. EMAIL ANALYTICS RPCs
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_get_campaign_stats(p_campaign_id UUID)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_opened BIGINT,
  total_clicked BIGINT,
  total_bounced BIGINT,
  total_complained BIGINT,
  total_failed BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC,
  bounce_rate NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE esl.status IN ('sent','delivered','opened','clicked'))::BIGINT AS total_sent,
    COUNT(*) FILTER (WHERE esl.status IN ('delivered','opened','clicked'))::BIGINT AS total_delivered,
    COUNT(*) FILTER (WHERE esl.status IN ('opened','clicked'))::BIGINT AS total_opened,
    COUNT(*) FILTER (WHERE esl.status = 'clicked')::BIGINT AS total_clicked,
    COUNT(*) FILTER (WHERE esl.status = 'bounced')::BIGINT AS total_bounced,
    COUNT(*) FILTER (WHERE esl.status = 'complained')::BIGINT AS total_complained,
    COUNT(*) FILTER (WHERE esl.status = 'failed')::BIGINT AS total_failed,
    ROUND(
      COUNT(*) FILTER (WHERE esl.status IN ('opened','clicked'))::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE esl.status IN ('delivered','opened','clicked')), 0) * 100, 1
    ) AS open_rate,
    ROUND(
      COUNT(*) FILTER (WHERE esl.status = 'clicked')::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE esl.status IN ('delivered','opened','clicked')), 0) * 100, 1
    ) AS click_rate,
    ROUND(
      COUNT(*) FILTER (WHERE esl.status = 'bounced')::NUMERIC /
      NULLIF(COUNT(*), 0) * 100, 1
    ) AS bounce_rate
  FROM admin.email_send_log esl
  WHERE esl.campaign_id = p_campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_email_analytics_overview(p_days INT DEFAULT 30)
RETURNS TABLE (
  total_campaigns BIGINT,
  total_emails_sent BIGINT,
  avg_open_rate NUMERIC,
  avg_click_rate NUMERIC,
  avg_bounce_rate NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  WITH campaign_stats AS (
    SELECT
      ec.id,
      COUNT(*) FILTER (WHERE esl.status IN ('sent','delivered','opened','clicked'))::NUMERIC AS sent_count,
      COUNT(*) FILTER (WHERE esl.status IN ('delivered','opened','clicked'))::NUMERIC AS delivered_count,
      COUNT(*) FILTER (WHERE esl.status IN ('opened','clicked'))::NUMERIC AS opened_count,
      COUNT(*) FILTER (WHERE esl.status = 'clicked')::NUMERIC AS clicked_count,
      COUNT(*) FILTER (WHERE esl.status = 'bounced')::NUMERIC AS bounced_count
    FROM admin.email_campaigns ec
    LEFT JOIN admin.email_send_log esl ON esl.campaign_id = ec.id
    WHERE ec.status = 'sent'
      AND ec.sent_at >= now() - (p_days || ' days')::INTERVAL
    GROUP BY ec.id
  )
  SELECT
    COUNT(*)::BIGINT AS total_campaigns,
    COALESCE(SUM(sent_count), 0)::BIGINT AS total_emails_sent,
    ROUND(AVG(
      CASE WHEN delivered_count > 0 THEN opened_count / delivered_count * 100 ELSE 0 END
    ), 1) AS avg_open_rate,
    ROUND(AVG(
      CASE WHEN delivered_count > 0 THEN clicked_count / delivered_count * 100 ELSE 0 END
    ), 1) AS avg_click_rate,
    ROUND(AVG(
      CASE WHEN sent_count > 0 THEN bounced_count / sent_count * 100 ELSE 0 END
    ), 1) AS avg_bounce_rate
  FROM campaign_stats;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_campaign_send_log(
  p_campaign_id UUID,
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID, recipient_email TEXT, status TEXT,
  opened_at TIMESTAMPTZ, clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ, failed_reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    esl.id, esl.recipient_email, esl.status,
    esl.opened_at, esl.clicked_at,
    esl.bounced_at, esl.failed_reason,
    esl.created_at
  FROM admin.email_send_log esl
  WHERE esl.campaign_id = p_campaign_id
    AND (p_status IS NULL OR esl.status = p_status)
  ORDER BY esl.created_at DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- K. WEBHOOK HANDLER + UNSUBSCRIBE RPCs
-- =====================================================

-- Called by email-webhook edge function (service_role, no admin guard)
CREATE OR REPLACE FUNCTION public.admin_handle_email_webhook(
  p_resend_message_id TEXT,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  CASE p_event_type
    WHEN 'email.delivered' THEN
      UPDATE admin.email_send_log
      SET status = 'delivered', metadata = metadata || p_event_data, updated_at = now()
      WHERE resend_message_id = p_resend_message_id AND status NOT IN ('opened', 'clicked');

    WHEN 'email.opened' THEN
      UPDATE admin.email_send_log
      SET status = 'opened', opened_at = COALESCE(opened_at, now()), metadata = metadata || p_event_data, updated_at = now()
      WHERE resend_message_id = p_resend_message_id AND status NOT IN ('clicked');

    WHEN 'email.clicked' THEN
      UPDATE admin.email_send_log
      SET status = 'clicked', clicked_at = COALESCE(clicked_at, now()),
          opened_at = COALESCE(opened_at, now()), metadata = metadata || p_event_data, updated_at = now()
      WHERE resend_message_id = p_resend_message_id;

    WHEN 'email.bounced' THEN
      UPDATE admin.email_send_log
      SET status = 'bounced', bounced_at = now(), metadata = metadata || p_event_data, updated_at = now()
      WHERE resend_message_id = p_resend_message_id;

    WHEN 'email.complained' THEN
      UPDATE admin.email_send_log
      SET status = 'complained', metadata = metadata || p_event_data, updated_at = now()
      WHERE resend_message_id = p_resend_message_id;

    ELSE
      -- Unknown event, store in metadata only
      UPDATE admin.email_send_log
      SET metadata = metadata || jsonb_build_object('unknown_event', p_event_type) || p_event_data, updated_at = now()
      WHERE resend_message_id = p_resend_message_id;
  END CASE;
END;
$$;

-- Public-facing unsubscribe handler (no admin guard)
CREATE OR REPLACE FUNCTION public.handle_email_unsubscribe(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_found BOOLEAN;
BEGIN
  UPDATE admin.email_unsubscribe_tokens
  SET is_unsubscribed = true, unsubscribed_at = now()
  WHERE token = p_token AND is_unsubscribed = false;

  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;

-- =====================================================
-- L. GRANT ACCESS TO NEW TABLES
-- =====================================================

GRANT USAGE ON SCHEMA admin TO authenticated;
GRANT USAGE ON SCHEMA admin TO service_role;
GRANT SELECT ON admin.newsletter_templates TO authenticated;
GRANT ALL ON admin.newsletter_templates TO service_role;
GRANT SELECT ON admin.audience_segments TO authenticated;
GRANT ALL ON admin.audience_segments TO service_role;
GRANT SELECT ON admin.email_campaigns TO authenticated;
GRANT ALL ON admin.email_campaigns TO service_role;
GRANT SELECT ON admin.email_send_log TO authenticated;
GRANT ALL ON admin.email_send_log TO service_role;
GRANT SELECT ON admin.email_unsubscribe_tokens TO authenticated;
GRANT ALL ON admin.email_unsubscribe_tokens TO service_role;
