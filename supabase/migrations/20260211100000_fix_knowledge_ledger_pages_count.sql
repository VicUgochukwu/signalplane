-- Fix get_knowledge_ledger: pages_tracked should only count pages for tracked competitors
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
  -- Get user's competitor company_ids (core.companies matched via domain)
  SELECT ARRAY_AGG(DISTINCT cc.id)
  INTO v_company_ids
  FROM public.user_tracked_competitors utc
  JOIN core.companies cc ON cc.domain = utc.competitor_domain
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

    -- pages_tracked: only count pages for companies the user actively tracks
    (SELECT COUNT(*)::INT FROM core.tracked_pages tp
     INNER JOIN core.companies cc ON cc.id = tp.company_id
     INNER JOIN public.user_tracked_competitors utc
       ON utc.competitor_domain = cc.domain AND utc.user_id = p_user_id
     WHERE tp.user_id = p_user_id AND tp.enabled = TRUE),

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
