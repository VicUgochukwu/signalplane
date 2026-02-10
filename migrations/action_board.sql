-- ============================================================================
-- Action Board Migration
-- ============================================================================
-- Kanban-style action board for managing recommended actions from packets.
-- Cards flow: inbox → this_week → in_progress → done | archived
-- Integrates with learning.recommendation_adoptions for adoption tracking.
-- ============================================================================

-- ── 0. Pre-requisite: unique constraint on recommendation_adoptions ──────────
-- The board functions upsert into recommendation_adoptions on (user_id, packet_id, action_text).
-- Add the constraint if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_adoptions_user_packet_action'
  ) THEN
    ALTER TABLE learning.recommendation_adoptions
      ADD CONSTRAINT uq_adoptions_user_packet_action
      UNIQUE (user_id, packet_id, action_text);
  END IF;
END
$$;

-- ── 1. Table ─────────────────────────────────────────────────────────────────

CREATE TABLE learning.action_board_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  packet_id UUID NOT NULL REFERENCES control_plane.packets(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  signal_headline TEXT,
  decision_type TEXT,
  owner_team TEXT,
  priority TEXT DEFAULT 'medium',
  severity INT DEFAULT 3,
  competitor_name TEXT,
  signal_ids UUID[],
  evidence_urls TEXT[],
  column_status TEXT NOT NULL DEFAULT 'inbox'
    CHECK (column_status IN ('inbox', 'this_week', 'in_progress', 'done', 'archived')),
  column_order INT NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  notes TEXT,
  moved_to_inbox_at TIMESTAMPTZ DEFAULT NOW(),
  moved_to_this_week_at TIMESTAMPTZ,
  moved_to_in_progress_at TIMESTAMPTZ,
  moved_to_done_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archive_reason TEXT,
  execution_kit JSONB,
  kit_generated_at TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative')),
  outcome_notes TEXT,
  outcome_recorded_at TIMESTAMPTZ,
  outcome_prompt_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, packet_id, action_text)
);

-- ── 2. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX idx_board_cards_user ON learning.action_board_cards(user_id);
CREATE INDEX idx_board_cards_user_status ON learning.action_board_cards(user_id, column_status);
CREATE INDEX idx_board_cards_packet ON learning.action_board_cards(packet_id);
CREATE INDEX idx_board_cards_stale ON learning.action_board_cards(column_status, moved_to_inbox_at)
  WHERE column_status = 'inbox';

-- ── 3. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE learning.action_board_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own board cards"
  ON learning.action_board_cards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own board cards"
  ON learning.action_board_cards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own board cards"
  ON learning.action_board_cards FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on board cards"
  ON learning.action_board_cards TO service_role
  USING (true) WITH CHECK (true);

-- ── 4. Grants ────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON learning.action_board_cards TO authenticated;
GRANT ALL ON learning.action_board_cards TO service_role;

-- ============================================================================
-- 5. RPC Functions (learning schema)
-- ============================================================================

-- ── 5A. get_action_board_cards ───────────────────────────────────────────────
-- Returns all non-archived cards for a user, joined with packets for context.

CREATE OR REPLACE FUNCTION learning.get_action_board_cards(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  packet_id UUID,
  action_text TEXT,
  signal_headline TEXT,
  decision_type TEXT,
  owner_team TEXT,
  priority TEXT,
  severity INT,
  competitor_name TEXT,
  signal_ids UUID[],
  evidence_urls TEXT[],
  column_status TEXT,
  column_order INT,
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  notes TEXT,
  moved_to_inbox_at TIMESTAMPTZ,
  moved_to_this_week_at TIMESTAMPTZ,
  moved_to_in_progress_at TIMESTAMPTZ,
  moved_to_done_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archive_reason TEXT,
  execution_kit JSONB,
  kit_generated_at TIMESTAMPTZ,
  outcome TEXT,
  outcome_notes TEXT,
  outcome_recorded_at TIMESTAMPTZ,
  outcome_prompt_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  packet_title TEXT,
  packet_week_start DATE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = learning, control_plane, public, auth
AS $$
  SELECT
    c.id,
    c.user_id,
    c.packet_id,
    c.action_text,
    c.signal_headline,
    c.decision_type,
    c.owner_team,
    c.priority,
    c.severity,
    c.competitor_name,
    c.signal_ids,
    c.evidence_urls,
    c.column_status,
    c.column_order,
    c.assigned_to,
    c.assigned_at,
    c.notes,
    c.moved_to_inbox_at,
    c.moved_to_this_week_at,
    c.moved_to_in_progress_at,
    c.moved_to_done_at,
    c.archived_at,
    c.archive_reason,
    c.execution_kit,
    c.kit_generated_at,
    c.outcome,
    c.outcome_notes,
    c.outcome_recorded_at,
    c.outcome_prompt_sent_at,
    c.created_at,
    c.updated_at,
    p.packet_title,
    p.week_start AS packet_week_start
  FROM learning.action_board_cards c
  JOIN control_plane.packets p ON p.id = c.packet_id
  WHERE c.user_id = p_user_id
    AND c.column_status != 'archived'
  ORDER BY c.column_status, c.column_order, c.created_at DESC;
$$;

-- ── 5B. move_board_card ─────────────────────────────────────────────────────
-- Moves a card to a new column and order position. Updates timestamps and
-- syncs adoption status when moved to done.

CREATE OR REPLACE FUNCTION learning.move_board_card(
  p_user_id UUID,
  p_card_id UUID,
  p_new_column TEXT,
  p_new_order INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = learning, control_plane, public, auth
AS $$
DECLARE
  v_card learning.action_board_cards%ROWTYPE;
BEGIN
  -- Update card column, order, and the appropriate timestamp
  UPDATE learning.action_board_cards
  SET
    column_status = p_new_column,
    column_order  = p_new_order,
    moved_to_inbox_at       = CASE WHEN p_new_column = 'inbox'       THEN NOW() ELSE moved_to_inbox_at END,
    moved_to_this_week_at   = CASE WHEN p_new_column = 'this_week'   THEN NOW() ELSE moved_to_this_week_at END,
    moved_to_in_progress_at = CASE WHEN p_new_column = 'in_progress' THEN NOW() ELSE moved_to_in_progress_at END,
    moved_to_done_at        = CASE WHEN p_new_column = 'done'        THEN NOW() ELSE moved_to_done_at END,
    archived_at             = CASE WHEN p_new_column = 'archived'    THEN NOW() ELSE archived_at END,
    updated_at = NOW()
  WHERE id = p_card_id
    AND user_id = p_user_id
  RETURNING * INTO v_card;

  -- If moved to 'done', record adoption
  IF p_new_column = 'done' AND v_card.id IS NOT NULL THEN
    INSERT INTO learning.recommendation_adoptions (
      user_id, packet_id, action_text, decision_type, owner_team,
      priority, status, adopted_at, created_at, updated_at
    )
    VALUES (
      v_card.user_id, v_card.packet_id, v_card.action_text,
      v_card.decision_type, v_card.owner_team, v_card.priority,
      'adopted', NOW(), NOW(), NOW()
    )
    ON CONFLICT (user_id, packet_id, action_text) DO UPDATE SET
      status = 'adopted',
      adopted_at = NOW(),
      updated_at = NOW();
  END IF;
END;
$$;

-- ── 5C. update_board_card ───────────────────────────────────────────────────
-- Updates notes and/or assigned_to on a card. Uses COALESCE to preserve
-- existing values when a parameter is null.

CREATE OR REPLACE FUNCTION learning.update_board_card(
  p_user_id UUID,
  p_card_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = learning, control_plane, public, auth
AS $$
BEGIN
  UPDATE learning.action_board_cards
  SET
    notes       = COALESCE(p_notes, notes),
    assigned_to = COALESCE(p_assigned_to, assigned_to),
    assigned_at = CASE WHEN p_assigned_to IS NOT NULL THEN NOW() ELSE assigned_at END,
    updated_at  = NOW()
  WHERE id = p_card_id
    AND user_id = p_user_id;
END;
$$;

-- ── 5D. archive_board_card ──────────────────────────────────────────────────
-- Archives a card and records a dismissed adoption.

CREATE OR REPLACE FUNCTION learning.archive_board_card(
  p_user_id UUID,
  p_card_id UUID,
  p_reason TEXT DEFAULT 'user_archived'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = learning, control_plane, public, auth
AS $$
DECLARE
  v_card learning.action_board_cards%ROWTYPE;
BEGIN
  UPDATE learning.action_board_cards
  SET
    column_status  = 'archived',
    archive_reason = p_reason,
    archived_at    = NOW(),
    updated_at     = NOW()
  WHERE id = p_card_id
    AND user_id = p_user_id
  RETURNING * INTO v_card;

  IF v_card.id IS NOT NULL THEN
    INSERT INTO learning.recommendation_adoptions (
      user_id, packet_id, action_text, decision_type, owner_team,
      priority, status, dismissed_at, dismiss_reason, created_at, updated_at
    )
    VALUES (
      v_card.user_id, v_card.packet_id, v_card.action_text,
      v_card.decision_type, v_card.owner_team, v_card.priority,
      'dismissed', NOW(), p_reason, NOW(), NOW()
    )
    ON CONFLICT (user_id, packet_id, action_text) DO UPDATE SET
      status         = 'dismissed',
      dismissed_at   = NOW(),
      dismiss_reason = p_reason,
      updated_at     = NOW();
  END IF;
END;
$$;

-- ── 5E. populate_board_from_packet ──────────────────────────────────────────
-- Reads a packet's action_mapping->'this_week' array and creates board cards.
-- Returns the number of new cards inserted.

CREATE OR REPLACE FUNCTION learning.populate_board_from_packet(
  p_user_id UUID,
  p_packet_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = learning, control_plane, public, auth
AS $$
DECLARE
  v_action_mapping JSONB;
  v_this_week JSONB;
  v_inserted INT := 0;
BEGIN
  -- Read the packet's action_mapping
  SELECT action_mapping
  INTO v_action_mapping
  FROM control_plane.packets
  WHERE id = p_packet_id;

  IF v_action_mapping IS NULL THEN
    RETURN 0;
  END IF;

  v_this_week := v_action_mapping -> 'this_week';

  IF v_this_week IS NULL OR jsonb_typeof(v_this_week) != 'array' THEN
    RETURN 0;
  END IF;

  -- Insert each action as a board card
  INSERT INTO learning.action_board_cards (
    user_id, packet_id, action_text, owner_team, priority,
    column_status, column_order
  )
  SELECT
    p_user_id,
    p_packet_id,
    elem.value ->> 'action',
    elem.value ->> 'owner',
    CASE
      WHEN elem.value ->> 'priority' = 'now'       THEN 'high'
      WHEN elem.value ->> 'priority' = 'this_week'  THEN 'medium'
      ELSE 'low'
    END,
    'inbox',
    elem.ordinality::INT
  FROM jsonb_array_elements(v_this_week) WITH ORDINALITY AS elem(value, ordinality)
  ON CONFLICT (user_id, packet_id, action_text) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

-- ── 5F. get_archived_board_cards ────────────────────────────────────────────
-- Returns archived cards for a user, paged.

CREATE OR REPLACE FUNCTION learning.get_archived_board_cards(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  packet_id UUID,
  action_text TEXT,
  signal_headline TEXT,
  decision_type TEXT,
  owner_team TEXT,
  priority TEXT,
  severity INT,
  competitor_name TEXT,
  signal_ids UUID[],
  evidence_urls TEXT[],
  column_status TEXT,
  column_order INT,
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  notes TEXT,
  moved_to_inbox_at TIMESTAMPTZ,
  moved_to_this_week_at TIMESTAMPTZ,
  moved_to_in_progress_at TIMESTAMPTZ,
  moved_to_done_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archive_reason TEXT,
  execution_kit JSONB,
  kit_generated_at TIMESTAMPTZ,
  outcome TEXT,
  outcome_notes TEXT,
  outcome_recorded_at TIMESTAMPTZ,
  outcome_prompt_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  packet_title TEXT,
  packet_week_start DATE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = learning, control_plane, public, auth
AS $$
  SELECT
    c.id,
    c.user_id,
    c.packet_id,
    c.action_text,
    c.signal_headline,
    c.decision_type,
    c.owner_team,
    c.priority,
    c.severity,
    c.competitor_name,
    c.signal_ids,
    c.evidence_urls,
    c.column_status,
    c.column_order,
    c.assigned_to,
    c.assigned_at,
    c.notes,
    c.moved_to_inbox_at,
    c.moved_to_this_week_at,
    c.moved_to_in_progress_at,
    c.moved_to_done_at,
    c.archived_at,
    c.archive_reason,
    c.execution_kit,
    c.kit_generated_at,
    c.outcome,
    c.outcome_notes,
    c.outcome_recorded_at,
    c.outcome_prompt_sent_at,
    c.created_at,
    c.updated_at,
    p.packet_title,
    p.week_start AS packet_week_start
  FROM learning.action_board_cards c
  JOIN control_plane.packets p ON p.id = c.packet_id
  WHERE c.user_id = p_user_id
    AND c.column_status = 'archived'
  ORDER BY c.archived_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================================================
-- 6. Public Wrapper RPCs
-- ============================================================================
-- Thin wrappers that inject auth.uid() so the client never passes user_id.

-- ── 6A. public.get_action_board_cards ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_action_board_cards()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  packet_id UUID,
  action_text TEXT,
  signal_headline TEXT,
  decision_type TEXT,
  owner_team TEXT,
  priority TEXT,
  severity INT,
  competitor_name TEXT,
  signal_ids UUID[],
  evidence_urls TEXT[],
  column_status TEXT,
  column_order INT,
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  notes TEXT,
  moved_to_inbox_at TIMESTAMPTZ,
  moved_to_this_week_at TIMESTAMPTZ,
  moved_to_in_progress_at TIMESTAMPTZ,
  moved_to_done_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archive_reason TEXT,
  execution_kit JSONB,
  kit_generated_at TIMESTAMPTZ,
  outcome TEXT,
  outcome_notes TEXT,
  outcome_recorded_at TIMESTAMPTZ,
  outcome_prompt_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  packet_title TEXT,
  packet_week_start DATE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, learning, auth
AS $$
  SELECT * FROM learning.get_action_board_cards(auth.uid());
$$;

-- ── 6B. public.move_board_card ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.move_board_card(
  p_card_id UUID,
  p_new_column TEXT,
  p_new_order INT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, learning, auth
AS $$
  SELECT learning.move_board_card(auth.uid(), p_card_id, p_new_column, p_new_order);
$$;

-- ── 6C. public.update_board_card ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_board_card(
  p_card_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, learning, auth
AS $$
  SELECT learning.update_board_card(auth.uid(), p_card_id, p_notes, p_assigned_to);
$$;

-- ── 6D. public.archive_board_card ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.archive_board_card(
  p_card_id UUID,
  p_reason TEXT DEFAULT 'user_archived'
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, learning, auth
AS $$
  SELECT learning.archive_board_card(auth.uid(), p_card_id, p_reason);
$$;

-- ── 6E. public.populate_board_from_packet ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.populate_board_from_packet(
  p_packet_id UUID
)
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, learning, auth
AS $$
  SELECT learning.populate_board_from_packet(auth.uid(), p_packet_id);
$$;

-- ── 6F. public.get_archived_board_cards ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_archived_board_cards(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  packet_id UUID,
  action_text TEXT,
  signal_headline TEXT,
  decision_type TEXT,
  owner_team TEXT,
  priority TEXT,
  severity INT,
  competitor_name TEXT,
  signal_ids UUID[],
  evidence_urls TEXT[],
  column_status TEXT,
  column_order INT,
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  notes TEXT,
  moved_to_inbox_at TIMESTAMPTZ,
  moved_to_this_week_at TIMESTAMPTZ,
  moved_to_in_progress_at TIMESTAMPTZ,
  moved_to_done_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archive_reason TEXT,
  execution_kit JSONB,
  kit_generated_at TIMESTAMPTZ,
  outcome TEXT,
  outcome_notes TEXT,
  outcome_recorded_at TIMESTAMPTZ,
  outcome_prompt_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  packet_title TEXT,
  packet_week_start DATE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, learning, auth
AS $$
  SELECT * FROM learning.get_archived_board_cards(auth.uid(), p_limit, p_offset);
$$;

-- ── Grants on functions ─────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION learning.get_action_board_cards(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION learning.move_board_card(UUID, UUID, TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION learning.update_board_card(UUID, UUID, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION learning.archive_board_card(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION learning.populate_board_from_packet(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION learning.get_archived_board_cards(UUID, INT, INT) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_action_board_cards() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.move_board_card(UUID, TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_board_card(UUID, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.archive_board_card(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.populate_board_from_packet(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_archived_board_cards(INT, INT) TO authenticated, service_role;
