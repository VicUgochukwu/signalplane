-- Rebuttal Usage Tracking — Feedback loop for objection library
-- Tracks which rebuttals reps actually used in deals and whether they helped

CREATE TABLE IF NOT EXISTS objection_tracker.rebuttal_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  objection_id TEXT NOT NULL,
  library_version_id UUID NOT NULL,
  outcome TEXT CHECK (outcome IN ('helped', 'not_helpful', 'pending')) DEFAULT 'pending',
  context_note TEXT,
  deal_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by version
CREATE INDEX IF NOT EXISTS idx_rebuttal_usage_version
  ON objection_tracker.rebuttal_usage (library_version_id, user_id);

-- Index for fast lookups by objection
CREATE INDEX IF NOT EXISTS idx_rebuttal_usage_objection
  ON objection_tracker.rebuttal_usage (objection_id, user_id);

-- RLS
ALTER TABLE objection_tracker.rebuttal_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own usage"
  ON objection_tracker.rebuttal_usage
  FOR ALL
  USING (auth.uid() = user_id);

-- RPC: Record a rebuttal usage event
CREATE OR REPLACE FUNCTION objection_tracker.record_rebuttal_usage(
  p_objection_id TEXT,
  p_library_version_id UUID,
  p_outcome TEXT DEFAULT 'pending',
  p_context_note TEXT DEFAULT NULL,
  p_deal_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO objection_tracker.rebuttal_usage (
    user_id, objection_id, library_version_id, outcome, context_note, deal_name
  )
  VALUES (
    auth.uid(), p_objection_id, p_library_version_id, p_outcome, p_context_note, p_deal_name
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- RPC: Get aggregated usage stats for a library version
CREATE OR REPLACE FUNCTION objection_tracker.get_rebuttal_usage_stats(
  p_library_version_id UUID
) RETURNS TABLE(
  objection_id TEXT,
  helped_count INT,
  not_helpful_count INT,
  total_uses INT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    objection_id,
    COUNT(*) FILTER (WHERE outcome = 'helped')::INT AS helped_count,
    COUNT(*) FILTER (WHERE outcome = 'not_helpful')::INT AS not_helpful_count,
    COUNT(*)::INT AS total_uses
  FROM objection_tracker.rebuttal_usage
  WHERE library_version_id = p_library_version_id
    AND user_id = auth.uid()
  GROUP BY objection_id;
$$;
