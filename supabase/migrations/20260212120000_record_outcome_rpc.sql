-- ============================================================
-- RPC: Record outcome for a completed action board card
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_board_card_outcome(
  p_card_id UUID,
  p_outcome TEXT,
  p_outcome_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE learning.action_board_cards
  SET
    outcome = p_outcome,
    outcome_notes = p_outcome_notes,
    outcome_recorded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_card_id
    AND user_id = auth.uid();
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.record_board_card_outcome(UUID, TEXT, TEXT) TO authenticated;
