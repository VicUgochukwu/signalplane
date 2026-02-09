--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: admin; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA admin;


--
-- Name: control_plane; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA control_plane;


--
-- Name: core; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA core;


--
-- Name: diff_tracker; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA diff_tracker;


--
-- Name: distribution_tracker; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA distribution_tracker;


--
-- Name: experiment_surveillance; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA experiment_surveillance;


--
-- Name: gtm_artifacts; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA gtm_artifacts;


--
-- Name: gtm_memory; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA gtm_memory;


--
-- Name: horizon; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA horizon;


--
-- Name: icp_drift; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA icp_drift;


--
-- Name: launch_decay; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA launch_decay;


--
-- Name: launch_tracker; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA launch_tracker;


--
-- Name: objection_tracker; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA objection_tracker;


--
-- Name: objections; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA objections;


--
-- Name: ops; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA ops;


--
-- Name: pricing_tracker; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pricing_tracker;


--
-- Name: proof_tracker; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA proof_tracker;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: sector_packs; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA sector_packs;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: admin; Owner: -
--

CREATE FUNCTION admin.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'admin'
    AS $$
BEGIN
  INSERT INTO admin.user_profiles (id, role, display_name, created_at)
  VALUES (
    NEW.id,
    'user',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: compute_signal_score(integer, numeric, timestamp with time zone, text); Type: FUNCTION; Schema: control_plane; Owner: -
--

CREATE FUNCTION control_plane.compute_signal_score(p_severity integer, p_confidence numeric, p_created_at timestamp with time zone, p_source_quality text DEFAULT 'medium'::text) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    severity_weight NUMERIC;
    recency_weight NUMERIC;
    source_weight NUMERIC;
    confidence_weight NUMERIC;
    days_old NUMERIC;
BEGIN
    -- Severity weight (0-40 points based on 1-5 severity)
    severity_weight := COALESCE(p_severity, 3) * 8;

    -- Recency weight (0-30 points, decays over 7 days)
    days_old := EXTRACT(EPOCH FROM (now() - COALESCE(p_created_at, now()))) / 86400;
    recency_weight := GREATEST(0, 30 - (days_old * 4.3));

    -- Source quality weight (0-15 points)
    source_weight := CASE COALESCE(p_source_quality, 'medium')
        WHEN 'high' THEN 15
        WHEN 'medium' THEN 10
        WHEN 'low' THEN 5
        ELSE 10
    END;

    -- Confidence weight (0-15 points)
    confidence_weight := COALESCE(p_confidence, 0.5) * 15;

    RETURN ROUND(severity_weight + recency_weight + source_weight + confidence_weight, 2);
END;
$$;


--
-- Name: get_org_timezone(uuid); Type: FUNCTION; Schema: control_plane; Owner: -
--

CREATE FUNCTION control_plane.get_org_timezone(p_org_id uuid) RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_org_tz TEXT;
BEGIN
    SELECT timezone INTO v_org_tz
    FROM public.organizations
    WHERE id = p_org_id;

    RETURN COALESCE(v_org_tz, 'UTC');
END;
$$;


--
-- Name: FUNCTION get_org_timezone(p_org_id uuid); Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON FUNCTION control_plane.get_org_timezone(p_org_id uuid) IS 'Returns timezone for an organization (defaults to UTC)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: packets; Type: TABLE; Schema: control_plane; Owner: -
--

CREATE TABLE control_plane.packets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    packet_title text NOT NULL,
    exec_summary text[] DEFAULT '{}'::text[] NOT NULL,
    sections jsonb DEFAULT '{}'::jsonb NOT NULL,
    key_questions text[] DEFAULT '{}'::text[] NOT NULL,
    bets jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    predictions_json jsonb DEFAULT '[]'::jsonb,
    resolved_predictions_json jsonb DEFAULT '[]'::jsonb,
    artifacts_generated jsonb DEFAULT '{}'::jsonb,
    predictions jsonb DEFAULT '[]'::jsonb,
    action_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    market_winners jsonb DEFAULT '{}'::jsonb NOT NULL,
    org_id uuid,
    timezone text DEFAULT 'UTC'::text,
    week_start_local timestamp without time zone,
    week_end_local timestamp without time zone,
    generated_for_timezone text,
    is_cached boolean DEFAULT true,
    cache_expires_at timestamp with time zone,
    user_id uuid,
    user_company_name text,
    is_personalized boolean DEFAULT false
);


--
-- Name: COLUMN packets.timezone; Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON COLUMN control_plane.packets.timezone IS 'Timezone used to calculate week boundaries for this packet';


--
-- Name: COLUMN packets.week_start_local; Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON COLUMN control_plane.packets.week_start_local IS 'Week start displayed in local timezone (for UI)';


--
-- Name: COLUMN packets.week_end_local; Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON COLUMN control_plane.packets.week_end_local IS 'Week end displayed in local timezone (for UI)';


--
-- Name: get_packet_for_org_week(uuid, timestamp with time zone); Type: FUNCTION; Schema: control_plane; Owner: -
--

CREATE FUNCTION control_plane.get_packet_for_org_week(p_org_id uuid, p_reference_date timestamp with time zone DEFAULT now()) RETURNS control_plane.packets
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_timezone TEXT;
    v_week_bounds RECORD;
    v_packet control_plane.packets;
BEGIN
    v_timezone := control_plane.get_org_timezone(p_org_id);

    SELECT * INTO v_week_bounds
    FROM control_plane.get_week_boundaries(v_timezone, p_reference_date);

    SELECT * INTO v_packet
    FROM control_plane.packets
    WHERE org_id = p_org_id
      AND generated_for_timezone = v_timezone
      AND week_start = v_week_bounds.week_start::DATE
      AND week_end = v_week_bounds.week_end::DATE
      AND (cache_expires_at IS NULL OR cache_expires_at > NOW())
    LIMIT 1;

    IF FOUND THEN
        RETURN v_packet;
    END IF;

    RETURN NULL;
END;
$$;


--
-- Name: FUNCTION get_packet_for_org_week(p_org_id uuid, p_reference_date timestamp with time zone); Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON FUNCTION control_plane.get_packet_for_org_week(p_org_id uuid, p_reference_date timestamp with time zone) IS 'Gets cached packet for org week or returns NULL if not found';


--
-- Name: get_signals_for_org_week(uuid, timestamp with time zone); Type: FUNCTION; Schema: control_plane; Owner: -
--

CREATE FUNCTION control_plane.get_signals_for_org_week(p_org_id uuid, p_reference_date timestamp with time zone DEFAULT now()) RETURNS TABLE(id uuid, signal_type text, title text, summary text, priority integer, decision_type text, source_refs jsonb, metadata jsonb, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_timezone TEXT;
    v_week_start TIMESTAMPTZ;
    v_week_end TIMESTAMPTZ;
BEGIN
    v_timezone := control_plane.get_org_timezone(p_org_id);

    SELECT wb.week_start, wb.week_end
    INTO v_week_start, v_week_end
    FROM control_plane.get_week_boundaries(v_timezone, p_reference_date) wb;

    RETURN QUERY
    SELECT
        s.id,
        s.signal_type,
        s.title,
        s.summary,
        s.priority,
        s.decision_type,
        s.source_refs,
        s.metadata,
        s.created_at
    FROM control_plane.signals s
    WHERE s.created_at >= v_week_start
      AND s.created_at < v_week_end
    ORDER BY s.priority DESC, s.created_at DESC;
END;
$$;


--
-- Name: FUNCTION get_signals_for_org_week(p_org_id uuid, p_reference_date timestamp with time zone); Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON FUNCTION control_plane.get_signals_for_org_week(p_org_id uuid, p_reference_date timestamp with time zone) IS 'Returns all signals within the current week for an org based on their timezone';


--
-- Name: get_user_packets(uuid, integer); Type: FUNCTION; Schema: control_plane; Owner: -
--

CREATE FUNCTION control_plane.get_user_packets(p_user_id uuid, p_limit integer DEFAULT 10) RETURNS SETOF control_plane.packets
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- First try to get personalized packets for this user
  IF EXISTS (
    SELECT 1 FROM control_plane.packets
    WHERE user_id = p_user_id
    LIMIT 1
  ) THEN
    -- User has personalized packets
    RETURN QUERY
    SELECT * FROM control_plane.packets
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT p_limit;
  ELSE
    -- Fall back to generic packets
    RETURN QUERY
    SELECT * FROM control_plane.packets
    WHERE user_id IS NULL
    ORDER BY created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;


--
-- Name: FUNCTION get_user_packets(p_user_id uuid, p_limit integer); Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON FUNCTION control_plane.get_user_packets(p_user_id uuid, p_limit integer) IS 'Returns personalized packets for user if available, otherwise generic packets.';


--
-- Name: get_week_boundaries(text, timestamp with time zone, text); Type: FUNCTION; Schema: control_plane; Owner: -
--

CREATE FUNCTION control_plane.get_week_boundaries(p_timezone text, p_reference_date timestamp with time zone DEFAULT now(), p_week_start_day text DEFAULT 'sunday'::text) RETURNS TABLE(week_start timestamp with time zone, week_end timestamp with time zone, week_start_local timestamp without time zone, week_end_local timestamp without time zone)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_local_date DATE;
    v_days_since_week_start INTEGER;
    v_week_start_local TIMESTAMP;
    v_week_end_local TIMESTAMP;
BEGIN
    v_local_date := (p_reference_date AT TIME ZONE p_timezone)::DATE;

    IF p_week_start_day = 'monday' THEN
        v_days_since_week_start := EXTRACT(ISODOW FROM v_local_date)::INTEGER - 1;
        IF v_days_since_week_start < 0 THEN v_days_since_week_start := 6; END IF;
    ELSE
        v_days_since_week_start := EXTRACT(DOW FROM v_local_date)::INTEGER;
    END IF;

    v_week_start_local := (v_local_date - v_days_since_week_start * INTERVAL '1 day')::TIMESTAMP;
    v_week_end_local := v_week_start_local + INTERVAL '7 days' - INTERVAL '1 second';

    RETURN QUERY SELECT
        (v_week_start_local::TEXT || ' ' || p_timezone)::TIMESTAMPTZ AS week_start,
        (v_week_end_local::TEXT || ' ' || p_timezone)::TIMESTAMPTZ AS week_end,
        v_week_start_local,
        v_week_end_local;
END;
$$;


--
-- Name: FUNCTION get_week_boundaries(p_timezone text, p_reference_date timestamp with time zone, p_week_start_day text); Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON FUNCTION control_plane.get_week_boundaries(p_timezone text, p_reference_date timestamp with time zone, p_week_start_day text) IS 'Calculates week start/end in both UTC and local time for a given timezone';


--
-- Name: populate_packet_items(uuid); Type: FUNCTION; Schema: control_plane; Owner: -
--

CREATE FUNCTION control_plane.populate_packet_items(p_packet_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_packet RECORD;
  v_count INT := 0;
BEGIN
  -- Get the packet's date range
  SELECT * INTO v_packet FROM control_plane.packets WHERE id = p_packet_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Packet not found: %', p_packet_id;
  END IF;
  
  -- Clear existing items for this packet
  DELETE FROM control_plane.packet_items WHERE packet_id = p_packet_id;
  
  -- Insert items from signals within the packet's week
  INSERT INTO control_plane.packet_items (packet_id, item_type, rank, title, detail, related_signal_id)
  SELECT 
    p_packet_id,
    s.signal_type,
    ROW_NUMBER() OVER (PARTITION BY s.signal_type ORDER BY s.severity DESC, s.confidence DESC),
    s.title,
    s.summary,
    s.id
  FROM control_plane.signals s
  WHERE s.created_at >= v_packet.week_start 
    AND s.created_at < v_packet.week_end + INTERVAL '1 day';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;


--
-- Name: compute_propagation(uuid); Type: FUNCTION; Schema: experiment_surveillance; Owner: -
--

CREATE FUNCTION experiment_surveillance.compute_propagation(p_pattern_id uuid) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_score NUMERIC := 0;
  v_company_count INT;
  v_first_seen DATE;
  v_spread_weeks INT;
BEGIN
  SELECT COUNT(DISTINCT company_id), MIN(observed_at)
  INTO v_company_count, v_first_seen
  FROM experiment_surveillance.pattern_instances
  WHERE pattern_id = p_pattern_id;

  SELECT COALESCE(EXTRACT(WEEK FROM (MAX(observed_at) - MIN(observed_at))), 0)::INT
  INTO v_spread_weeks
  FROM experiment_surveillance.pattern_instances
  WHERE pattern_id = p_pattern_id;

  IF v_spread_weeks > 0 THEN
    v_score := (v_company_count * 10) / GREATEST(v_spread_weeks, 1);
  ELSE
    v_score := v_company_count * 5;
  END IF;

  RETURN v_score;
END;
$$;


--
-- Name: compute_survivorship(uuid); Type: FUNCTION; Schema: experiment_surveillance; Owner: -
--

CREATE FUNCTION experiment_surveillance.compute_survivorship(p_pattern_id uuid) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_score NUMERIC := 0;
  v_company_count INT;
  v_max_weeks INT;
  v_reverted_count INT;
BEGIN
  SELECT COUNT(DISTINCT company_id), COALESCE(MAX(consecutive_weeks), 0)
  INTO v_company_count, v_max_weeks
  FROM experiment_surveillance.pattern_survival
  WHERE pattern_id = p_pattern_id
    AND consecutive_weeks >= 4
    AND NOT reverted;

  SELECT COUNT(*) INTO v_reverted_count
  FROM experiment_surveillance.pattern_survival
  WHERE pattern_id = p_pattern_id AND reverted;

  v_score := (v_company_count * LEAST(v_max_weeks, 12)) - (v_reverted_count * 5);

  RETURN GREATEST(v_score, 0);
END;
$$;


--
-- Name: detect_pattern(text, text, uuid, uuid, text, text, jsonb); Type: FUNCTION; Schema: experiment_surveillance; Owner: -
--

CREATE FUNCTION experiment_surveillance.detect_pattern(p_source_schema text, p_source_table text, p_source_id uuid, p_company_id uuid, p_page_type text, p_change_type text, p_change_details jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_pattern_key TEXT;
  v_pattern_id UUID;
  v_pattern_label TEXT;
  v_category TEXT;
BEGIN
  v_pattern_key := p_source_schema || ':' || p_change_type || ':' ||
    COALESCE(p_change_details->>'variant', 'default');

  v_pattern_label := REPLACE(p_change_type, '_', ' ');
  v_pattern_label := UPPER(SUBSTRING(v_pattern_label FROM 1 FOR 1)) || SUBSTRING(v_pattern_label FROM 2);

  v_category := CASE p_source_schema
    WHEN 'pricing_tracker' THEN 'packaging'
    WHEN 'proof_tracker' THEN 'proof'
    WHEN 'distribution_tracker' THEN 'distribution'
    WHEN 'launch_tracker' THEN 'positioning'
    WHEN 'hiring_tracker' THEN 'strategy'
    ELSE 'positioning'
  END;

  INSERT INTO experiment_surveillance.patterns (
    id, pattern_key, pattern_label, pattern_category, first_seen, last_seen
  ) VALUES (
    gen_random_uuid(),
    v_pattern_key,
    v_pattern_label,
    v_category,
    CURRENT_DATE,
    CURRENT_DATE
  )
  ON CONFLICT (pattern_key) DO UPDATE SET
    last_seen = CURRENT_DATE,
    updated_at = NOW()
  RETURNING id INTO v_pattern_id;

  INSERT INTO experiment_surveillance.pattern_instances (
    pattern_id, company_id, page_type, observed_at,
    extracted_fields, detection_method, confidence
  ) VALUES (
    v_pattern_id, p_company_id, p_page_type, CURRENT_DATE,
    p_change_details, 'ship_signal', 0.9
  )
  ON CONFLICT (pattern_id, company_id, page_type, observed_at) DO NOTHING;

  RETURN v_pattern_id;
END;
$$;


--
-- Name: emit_emerging_patterns(); Type: FUNCTION; Schema: experiment_surveillance; Owner: -
--

CREATE FUNCTION experiment_surveillance.emit_emerging_patterns() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_pattern RECORD;
  v_signal_id UUID;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_count INT := 0;
  v_companies TEXT[];
BEGIN
  FOR v_pattern IN
    SELECT p.*
    FROM experiment_surveillance.patterns p
    WHERE p.status = 'emerging'
      AND NOT EXISTS (
        SELECT 1 FROM experiment_surveillance.signal_emissions se
        WHERE se.pattern_id = p.id
          AND se.emission_type = 'emerging'
          AND se.week_start = v_week_start
      )
    ORDER BY p.combined_score DESC
    LIMIT 3
  LOOP
    SELECT ARRAY_AGG(DISTINCT c.name)
    INTO v_companies
    FROM experiment_surveillance.pattern_instances pi
    JOIN public.companies c ON c.id = pi.company_id
    WHERE pi.pattern_id = v_pattern.id
    LIMIT 3;

    INSERT INTO control_plane.signals (
      id, signal_type, severity, confidence,
      title, summary,
      source_schema, source_table, source_id,
      decision_type, time_sensitivity,
      meta, created_at
    ) VALUES (
      gen_random_uuid(),
      'experiment',
      2,
      0.7,
      'Emerging Pattern: ' || v_pattern.pattern_label,
      'Pattern gaining traction. Category: ' || v_pattern.pattern_category,
      'experiment_surveillance', 'patterns', v_pattern.id,
      v_pattern.pattern_category,
      'monitor',
      jsonb_build_object(
        'pattern_key', v_pattern.pattern_key,
        'survivorship_score', v_pattern.survivorship_score,
        'propagation_score', v_pattern.propagation_score,
        'companies', v_companies,
        'scope', 'experiment_surveillance'
      ),
      NOW()
    )
    RETURNING id INTO v_signal_id;

    INSERT INTO experiment_surveillance.signal_emissions (
      pattern_id, signal_id, emission_type, week_start
    ) VALUES (
      v_pattern.id, v_signal_id, 'emerging', v_week_start
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;


--
-- Name: emit_proven_patterns(); Type: FUNCTION; Schema: experiment_surveillance; Owner: -
--

CREATE FUNCTION experiment_surveillance.emit_proven_patterns() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_pattern RECORD;
  v_signal_id UUID;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_count INT := 0;
  v_companies TEXT[];
  v_evidence TEXT[];
BEGIN
  FOR v_pattern IN
    SELECT p.*
    FROM experiment_surveillance.patterns p
    WHERE p.status = 'proven'
      AND NOT EXISTS (
        SELECT 1 FROM experiment_surveillance.signal_emissions se
        WHERE se.pattern_id = p.id
          AND se.emission_type = 'proven'
          AND se.week_start = v_week_start
      )
    ORDER BY p.combined_score DESC
    LIMIT 5
  LOOP
    SELECT ARRAY_AGG(DISTINCT c.name)
    INTO v_companies
    FROM experiment_surveillance.pattern_instances pi
    JOIN public.companies c ON c.id = pi.company_id
    WHERE pi.pattern_id = v_pattern.id
      AND pi.observed_at >= CURRENT_DATE - INTERVAL '30 days'
    LIMIT 5;

    SELECT ARRAY_AGG(DISTINCT evidence_url)
    INTO v_evidence
    FROM experiment_surveillance.pattern_instances
    WHERE pattern_id = v_pattern.id
      AND evidence_url IS NOT NULL
    LIMIT 3;

    INSERT INTO control_plane.signals (
      id, signal_type, severity, confidence,
      title, summary, evidence_urls,
      source_schema, source_table, source_id,
      decision_type, time_sensitivity,
      meta, created_at
    ) VALUES (
      gen_random_uuid(),
      'experiment',
      4,
      0.9,
      'Market Winner: ' || v_pattern.pattern_label,
      'Pattern observed across ' || COALESCE(ARRAY_LENGTH(v_companies, 1), 0) ||
        ' companies with ' || v_pattern.survivorship_score || ' survivorship score. ' ||
        'Category: ' || v_pattern.pattern_category,
      COALESCE(v_evidence, ARRAY[]::TEXT[]),
      'experiment_surveillance', 'patterns', v_pattern.id,
      v_pattern.pattern_category,
      'this_week',
      jsonb_build_object(
        'pattern_key', v_pattern.pattern_key,
        'survivorship_score', v_pattern.survivorship_score,
        'propagation_score', v_pattern.propagation_score,
        'combined_score', v_pattern.combined_score,
        'companies', v_companies,
        'first_seen', v_pattern.first_seen,
        'scope', 'experiment_surveillance'
      ),
      NOW()
    )
    RETURNING id INTO v_signal_id;

    INSERT INTO experiment_surveillance.signal_emissions (
      pattern_id, signal_id, emission_type, week_start
    ) VALUES (
      v_pattern.id, v_signal_id, 'proven', v_week_start
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;


--
-- Name: update_pattern_scores(); Type: FUNCTION; Schema: experiment_surveillance; Owner: -
--

CREATE FUNCTION experiment_surveillance.update_pattern_scores() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE experiment_surveillance.patterns p
  SET
    survivorship_score = experiment_surveillance.compute_survivorship(p.id),
    propagation_score = experiment_surveillance.compute_propagation(p.id),
    combined_score = (
      experiment_surveillance.compute_survivorship(p.id) * 0.6 +
      experiment_surveillance.compute_propagation(p.id) * 0.4
    ),
    status = CASE
      WHEN experiment_surveillance.compute_survivorship(p.id) >= 50
           AND experiment_surveillance.compute_propagation(p.id) >= 30 THEN 'proven'
      WHEN experiment_surveillance.compute_survivorship(p.id) >= 20 THEN 'emerging'
      WHEN p.last_seen < CURRENT_DATE - INTERVAL '4 weeks' THEN 'fading'
      ELSE 'candidate'
    END,
    updated_at = NOW();
END;
$$;


--
-- Name: update_survival_tracking(); Type: FUNCTION; Schema: experiment_surveillance; Owner: -
--

CREATE FUNCTION experiment_surveillance.update_survival_tracking() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_pattern RECORD;
  v_company RECORD;
  v_previous RECORD;
  v_still_present BOOLEAN;
  v_consecutive INT;
BEGIN
  FOR v_pattern IN SELECT id FROM experiment_surveillance.patterns WHERE status != 'fading' LOOP
    FOR v_company IN
      SELECT DISTINCT company_id
      FROM experiment_surveillance.pattern_instances
      WHERE pattern_id = v_pattern.id
    LOOP
      SELECT EXISTS(
        SELECT 1 FROM experiment_surveillance.pattern_instances
        WHERE pattern_id = v_pattern.id
          AND company_id = v_company.company_id
          AND observed_at >= v_week_start
      ) INTO v_still_present;

      SELECT * INTO v_previous
      FROM experiment_surveillance.pattern_survival
      WHERE pattern_id = v_pattern.id
        AND company_id = v_company.company_id
        AND week_start = v_week_start - INTERVAL '7 days';

      IF v_still_present THEN
        v_consecutive := COALESCE(v_previous.consecutive_weeks, 0) + 1;
      ELSE
        v_consecutive := 0;
      END IF;

      INSERT INTO experiment_surveillance.pattern_survival (
        pattern_id, company_id, week_start,
        consecutive_weeks, still_present, reverted
      ) VALUES (
        v_pattern.id, v_company.company_id, v_week_start,
        v_consecutive, v_still_present,
        NOT v_still_present AND COALESCE(v_previous.consecutive_weeks, 0) >= 2
      )
      ON CONFLICT (pattern_id, company_id, week_start) DO UPDATE SET
        consecutive_weeks = EXCLUDED.consecutive_weeks,
        still_present = EXCLUDED.still_present,
        reverted = EXCLUDED.reverted;
    END LOOP;
  END LOOP;
END;
$$;


--
-- Name: upsert_knowledge_item(text, text, text, jsonb, text, text, text, jsonb, text); Type: FUNCTION; Schema: gtm_memory; Owner: -
--

CREATE FUNCTION gtm_memory.upsert_knowledge_item(p_kind text, p_title text, p_body text DEFAULT NULL::text, p_tags jsonb DEFAULT '[]'::jsonb, p_persona text DEFAULT NULL::text, p_segment text DEFAULT NULL::text, p_funnel_stage text DEFAULT NULL::text, p_evidence_urls jsonb DEFAULT '[]'::jsonb, p_confidence text DEFAULT 'medium'::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO gtm_memory.knowledge_items (
        kind, title, body, tags, persona, segment, funnel_stage,
        evidence_urls, evidence_count, confidence
    )
    VALUES (
        p_kind, p_title, p_body, p_tags, p_persona, p_segment, p_funnel_stage,
        p_evidence_urls, jsonb_array_length(p_evidence_urls), p_confidence
    )
    ON CONFLICT (kind, title) DO UPDATE SET
        body = COALESCE(EXCLUDED.body, gtm_memory.knowledge_items.body),
        tags = gtm_memory.knowledge_items.tags || EXCLUDED.tags,
        evidence_urls = gtm_memory.knowledge_items.evidence_urls || EXCLUDED.evidence_urls,
        evidence_count = jsonb_array_length(
            gtm_memory.knowledge_items.evidence_urls || EXCLUDED.evidence_urls
        ),
        last_seen_at = now(),
        updated_at = now(),
        confidence = CASE
            WHEN EXCLUDED.confidence = 'high' OR gtm_memory.knowledge_items.confidence = 'high' THEN 'high'
            WHEN EXCLUDED.confidence = 'medium' OR gtm_memory.knowledge_items.confidence = 'medium' THEN 'medium'
            ELSE 'low'
        END
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: icp_drift; Owner: -
--

CREATE FUNCTION icp_drift.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN new.updated_at = now(); RETURN new; END; $$;


--
-- Name: compute_trend_score(integer, integer, integer); Type: FUNCTION; Schema: objection_tracker; Owner: -
--

CREATE FUNCTION objection_tracker.compute_trend_score(p_count_7 integer, p_count_30 integer, p_count_90 integer) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    recent_rate NUMERIC;
    medium_rate NUMERIC;
    historical_rate NUMERIC;
    trend_score NUMERIC;
BEGIN
    recent_rate := COALESCE(p_count_7, 0);
    medium_rate := COALESCE(p_count_30 - p_count_7, 0) / 3.0;
    historical_rate := COALESCE(p_count_90 - p_count_30, 0) / 8.0;
    IF medium_rate = 0 AND historical_rate = 0 THEN
        trend_score := CASE WHEN recent_rate > 0 THEN recent_rate * 2 ELSE 0 END;
    ELSE
        trend_score := (recent_rate - medium_rate) * 2 + (medium_rate - historical_rate);
    END IF;
    RETURN ROUND(trend_score, 2);
END;
$$;


--
-- Name: create_weekly_snapshot(date, date); Type: FUNCTION; Schema: objection_tracker; Owner: -
--

CREATE FUNCTION objection_tracker.create_weekly_snapshot(p_week_start date, p_week_end date) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_snapshot_id UUID;
    v_total_events INT;
    v_new_objections INT;
    v_category_counts JSONB;
    v_top_patterns JSONB;
    v_drift_score NUMERIC;
    v_prev_category_counts JSONB;
BEGIN
    -- Count events this week
    SELECT COUNT(*) INTO v_total_events
    FROM objection_tracker.events
    WHERE detected_at >= p_week_start AND detected_at < p_week_end + interval '1 day';

    -- Count new objection patterns (first seen this week)
    SELECT COUNT(*) INTO v_new_objections
    FROM objection_tracker.patterns
    WHERE first_seen_at >= p_week_start AND first_seen_at < p_week_end + interval '1 day';

    -- Category breakdown
    SELECT jsonb_object_agg(category, cnt) INTO v_category_counts
    FROM (
        SELECT category, COUNT(*) as cnt
        FROM objection_tracker.events
        WHERE detected_at >= p_week_start AND detected_at < p_week_end + interval '1 day'
        AND category IS NOT NULL
        GROUP BY category
    ) subq;

    -- Top patterns
    SELECT jsonb_agg(pattern_data) INTO v_top_patterns
    FROM (
        SELECT jsonb_build_object(
            'pattern_id', p.id,
            'canonical_text', p.canonical_text,
            'count', p.count_last_7_days,
            'trend', p.trend
        ) as pattern_data
        FROM objection_tracker.patterns p
        WHERE p.last_seen_at >= p_week_start
        ORDER BY p.count_last_7_days DESC
        LIMIT 10
    ) subq;

    -- Calculate drift score (compare to previous week)
    SELECT category_counts INTO v_prev_category_counts
    FROM objection_tracker.trend_snapshots
    WHERE week_end < p_week_start
    ORDER BY week_end DESC
    LIMIT 1;

    IF v_prev_category_counts IS NOT NULL THEN
        v_drift_score := 0;
    ELSE
        v_drift_score := 0;
    END IF;

    -- Insert snapshot
    INSERT INTO objection_tracker.trend_snapshots (
        snapshot_date,
        week_start,
        week_end,
        total_events,
        new_objections_detected,
        category_counts,
        top_patterns,
        drift_score
    ) VALUES (
        p_week_start,
        p_week_start,
        p_week_end,
        COALESCE(v_total_events, 0),
        COALESCE(v_new_objections, 0),
        COALESCE(v_category_counts, '{}'::jsonb),
        COALESCE(v_top_patterns, '[]'::jsonb),
        v_drift_score
    )
    ON CONFLICT (week_start, week_end) DO UPDATE SET
        total_events = EXCLUDED.total_events,
        new_objections_detected = EXCLUDED.new_objections_detected,
        category_counts = EXCLUDED.category_counts,
        top_patterns = EXCLUDED.top_patterns,
        drift_score = EXCLUDED.drift_score
    RETURNING id INTO v_snapshot_id;

    RETURN v_snapshot_id;
END;
$$;


--
-- Name: get_trend_label(numeric); Type: FUNCTION; Schema: objection_tracker; Owner: -
--

CREATE FUNCTION objection_tracker.get_trend_label(p_trend_score numeric) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    IF p_trend_score > 2 THEN
        RETURN 'rising';
    ELSIF p_trend_score < -2 THEN
        RETURN 'fading';
    ELSE
        RETURN 'stable';
    END IF;
END;
$$;


--
-- Name: update_all_trend_counts(); Type: FUNCTION; Schema: objection_tracker; Owner: -
--

CREATE FUNCTION objection_tracker.update_all_trend_counts() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE objection_tracker.patterns p SET
        count_last_7_days = (
            SELECT COUNT(*) FROM objection_tracker.events e
            WHERE e.category = p.category
            AND lower(regexp_replace(e.objection_text, '[^a-z0-9 ]', '', 'gi')) LIKE p.objection_key || '%'
            AND e.detected_at >= now() - interval '7 days'
        ),
        count_last_30_days = (
            SELECT COUNT(*) FROM objection_tracker.events e
            WHERE e.category = p.category
            AND lower(regexp_replace(e.objection_text, '[^a-z0-9 ]', '', 'gi')) LIKE p.objection_key || '%'
            AND e.detected_at >= now() - interval '30 days'
        ),
        count_last_90_days = (
            SELECT COUNT(*) FROM objection_tracker.events e
            WHERE e.category = p.category
            AND lower(regexp_replace(e.objection_text, '[^a-z0-9 ]', '', 'gi')) LIKE p.objection_key || '%'
            AND e.detected_at >= now() - interval '90 days'
        ),
        trend_score = objection_tracker.compute_trend_score(
            count_last_7_days, count_last_30_days, count_last_90_days
        ),
        trend = objection_tracker.get_trend_label(
            objection_tracker.compute_trend_score(
                count_last_7_days, count_last_30_days, count_last_90_days
            )
        ),
        trend_updated_at = now(),
        updated_at = now();
END;
$$;


--
-- Name: upsert_pattern_from_event(uuid); Type: FUNCTION; Schema: objection_tracker; Owner: -
--

CREATE FUNCTION objection_tracker.upsert_pattern_from_event(p_event_id uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_event objection_tracker.events;
        v_objection_key TEXT;
            v_pattern_id UUID;
            BEGIN
                SELECT * INTO v_event FROM objection_tracker.events WHERE id = p_event_id;
                    IF v_event IS NULL then        RAISE EXCEPTION 'Event not found: %', p_event_id;
                        END IF;
                            v_objection_key := lower(regexp_replace(COALESCE(v_event.objection_text, ''), '[^a-z0-9 ]', '', 'gi'));
                                v_objection_key := regexp_replace(v_objection_key, '\s+', ' ', 'g');
                                    v_objection_key := trim(v_objection_key);
                                        v_objection_key := left(v_objection_key, 100);
                                            INSERT INTO objection_tracker.patterns (objection_key, canonical_text, category, total_count, avg_severity, max_severity, evidence_urls, recent_event_ids, first_seen_at, last_seen_at)
                                                VALUES (v_objection_key, v_event.objection_text, v_event.category, 1, COALESCE(v_event.severity, 3), COALESCE(v_event.severity, 3), CASE WHEN v_event.source_url IS NOT NULL THEN ARRAY[v_event.source_url] ELSE '{}' END, ARRAY[p_event_id], COALESCE(v_event.detected_at, now()), COALESCE(v_event.detected_at, now()))
                                                    ON CONFLICT (objection_key) DO UPDATE set        total_count = objection_tracker.patterns.total_count + 1,
                                                            last_seen_at = COALESCE(v_event.detected_at, now()),
                                                                    updated_at = now()
                                                                        RETURNING id INTO v_pattern_id;
                                                                            RETURN v_pattern_id;
                                                                            END;
                                                                            $$;


--
-- Name: check_budget(text, text, text, integer); Type: FUNCTION; Schema: ops; Owner: -
--

CREATE FUNCTION ops.check_budget(p_scope text, p_scope_id text, p_limit_type text, p_increment integer DEFAULT 1) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_limit_value INT;
  v_current_value INT;
  v_period_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  SELECT limit_value, current_value
  INTO v_limit_value, v_current_value
  FROM ops.budget_limits
  WHERE scope = p_scope
    AND (scope_id = p_scope_id OR scope_id IS NULL)
    AND limit_type = p_limit_type
    AND period_start = v_period_start
    AND enabled = true;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  IF v_current_value + p_increment > v_limit_value THEN
    RETURN false;
  END IF;

  UPDATE ops.budget_limits
  SET current_value = current_value + p_increment
  WHERE scope = p_scope
    AND (scope_id = p_scope_id OR scope_id IS NULL)
    AND limit_type = p_limit_type
    AND period_start = v_period_start;

  RETURN true;
END;
$$;


--
-- Name: log_cost(text, text, uuid, integer, integer, integer, integer, integer, integer, integer, integer, jsonb); Type: FUNCTION; Schema: ops; Owner: -
--

CREATE FUNCTION ops.log_cost(p_run_type text, p_ship_name text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_pages_checked integer DEFAULT 0, p_pages_changed integer DEFAULT 0, p_headless_renders integer DEFAULT 0, p_anthropic_calls integer DEFAULT 0, p_tokens_in integer DEFAULT 0, p_tokens_out integer DEFAULT 0, p_duration_ms integer DEFAULT 0, p_errors_count integer DEFAULT 0, p_error_details jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO ops.cost_events (
    run_type, ship_name, user_id,
    pages_checked, pages_changed, headless_renders,
    anthropic_calls, tokens_in, tokens_out,
    duration_ms, errors_count, error_details
  ) VALUES (
    p_run_type, p_ship_name, p_user_id,
    p_pages_checked, p_pages_changed, p_headless_renders,
    p_anthropic_calls, p_tokens_in, p_tokens_out,
    p_duration_ms, p_errors_count, p_error_details
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


--
-- Name: log_workflow_failure(text, text, text, text, text, text, text, jsonb); Type: FUNCTION; Schema: ops; Owner: -
--

CREATE FUNCTION ops.log_workflow_failure(p_workflow_id text, p_workflow_name text, p_execution_id text, p_failed_node text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text, p_error_stack text DEFAULT NULL::text, p_execution_mode text DEFAULT 'production'::text, p_input_data jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_failure_id UUID;
BEGIN
  INSERT INTO ops.workflow_failures (
    workflow_id, workflow_name, execution_id,
    failed_node, error_message, error_stack,
    execution_mode, input_data
  ) VALUES (
    p_workflow_id, p_workflow_name, p_execution_id,
    p_failed_node, p_error_message, p_error_stack,
    p_execution_mode, p_input_data
  )
  RETURNING id INTO v_failure_id;
  RETURN v_failure_id;
END;
$$;


--
-- Name: add_company(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_company(p_company_name text, p_company_slug text) RETURNS TABLE(company_id uuid, company_name text, company_slug text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_company_count int;
  v_company_id uuid;
BEGIN
  SELECT COUNT(DISTINCT tp.company_id) INTO v_company_count
  FROM core.tracked_pages tp WHERE tp.user_id = auth.uid();

  IF v_company_count >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 companies allowed. Please delete one before adding another.';
  END IF;

  INSERT INTO core.companies (name, domain)
  VALUES (p_company_name, lower(p_company_slug) || '.com')
  ON CONFLICT (name) DO NOTHING;

  SELECT c.id INTO v_company_id FROM core.companies c WHERE c.name = p_company_name;

  RETURN QUERY SELECT v_company_id, p_company_name, p_company_slug;
END;
$$;


--
-- Name: add_company_pages(uuid, json); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_company_pages(p_company_id uuid, p_pages json) RETURNS TABLE(page_id uuid, url text, url_type text, is_active boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_page_count int;
  v_company_name text;
  v_company_slug text;
BEGIN
  SELECT c.name, replace(replace(c.domain, '.com', ''), '.', '-')
  INTO v_company_name, v_company_slug
  FROM core.companies c WHERE c.id = p_company_id;

  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  SELECT COUNT(*) INTO v_page_count
  FROM core.tracked_pages
  WHERE company_id = p_company_id AND user_id = auth.uid();

  IF v_page_count + json_array_length(p_pages) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 pages per company.';
  END IF;

  RETURN QUERY
  INSERT INTO core.tracked_pages (company_name, company_slug, url, url_type, enabled, user_id, company_id)
  SELECT
    v_company_name,
    v_company_slug,
    (page->>'url')::text,
    (page->>'url_type')::text,
    true,
    auth.uid(),
    p_company_id
  FROM json_array_elements(p_pages) AS page
  RETURNING core.tracked_pages.id, core.tracked_pages.url, core.tracked_pages.url_type, core.tracked_pages.enabled;
END;
$$;


--
-- Name: add_tracked_page(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_tracked_page(p_company_name text, p_company_slug text, p_url text, p_url_type text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_count int; v_id uuid; v_company_id uuid;
BEGIN
  SELECT count(*) INTO v_count FROM core.tracked_pages WHERE user_id = auth.uid();
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'You can track a maximum of 5 companies. Please delete one before adding another.';
  END IF;
  INSERT INTO core.companies (name, domain)
  VALUES (p_company_name, lower(replace(p_company_slug, '-', '') || '.com'))
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_company_id FROM core.companies WHERE name = p_company_name;
  INSERT INTO core.tracked_pages (company_name, company_slug, url, url_type, user_id, company_id)
  VALUES (p_company_name, p_company_slug, p_url, p_url_type, auth.uid(), v_company_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


--
-- Name: admin_add_tracked_page(text, text, text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_add_tracked_page(p_company_name text, p_company_slug text, p_url text, p_page_type text DEFAULT 'homepage'::text, p_url_type text DEFAULT 'homepage'::text, p_company_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_page_id UUID;
  v_company_id UUID := p_company_id;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  IF v_company_id IS NULL THEN
    v_company_id := gen_random_uuid();
  END IF;

  INSERT INTO core.tracked_pages (
    company_id, company_name, company_slug, url, url_type, page_type, enabled, user_id
  ) VALUES (
    v_company_id, p_company_name, p_company_slug, p_url, p_url_type, p_page_type, true, v_admin_id
  )
  RETURNING id INTO v_page_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'add_tracked_page', 'tracked_page', v_page_id::TEXT,
    jsonb_build_object('company_name', p_company_name, 'url', p_url, 'page_type', p_page_type));

  RETURN v_page_id;
END;
$$;


--
-- Name: admin_ban_user(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_ban_user(p_user_id uuid, p_reason text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Cannot ban yourself';
  END IF;

  IF EXISTS (
    SELECT 1 FROM admin.user_profiles WHERE id = p_user_id AND role = 'super_admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM admin.user_profiles WHERE id = v_admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super_admins can ban other super_admins';
  END IF;

  UPDATE admin.user_profiles
  SET
    is_banned = true,
    banned_at = now(),
    banned_reason = p_reason,
    is_suspended = false,
    suspended_at = NULL,
    suspended_reason = NULL,
    updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'ban_user', 'user', p_user_id::TEXT, jsonb_build_object('reason', p_reason));
END;
$$;


--
-- Name: admin_cancel_email_campaign(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_cancel_email_campaign(p_campaign_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_create_audience_segment(text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_create_audience_segment(p_name text, p_description text DEFAULT NULL::text, p_criteria jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_create_email_campaign(text, uuid, uuid, text, text, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_create_email_campaign(p_name text, p_template_id uuid, p_segment_id uuid, p_from_name text DEFAULT 'SignalPlane'::text, p_from_email text DEFAULT 'hello@signalplane.dev'::text, p_reply_to text DEFAULT 'hello@signalplane.dev'::text, p_scheduled_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_create_feature_flag(text, text, text, boolean, text, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_create_feature_flag(p_flag_key text, p_label text, p_description text DEFAULT NULL::text, p_is_enabled boolean DEFAULT false, p_applies_to text DEFAULT 'all'::text, p_allowed_user_ids uuid[] DEFAULT '{}'::uuid[]) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_flag_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  IF p_applies_to NOT IN ('all', 'admin', 'specific_users') THEN
    RAISE EXCEPTION 'Invalid applies_to value: %', p_applies_to;
  END IF;

  INSERT INTO admin.feature_flags (flag_key, label, description, is_enabled, applies_to, allowed_user_ids)
  VALUES (p_flag_key, p_label, p_description, p_is_enabled, p_applies_to, p_allowed_user_ids)
  RETURNING id INTO v_flag_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'create_feature_flag', 'feature_flag', p_flag_key,
    jsonb_build_object('label', p_label, 'enabled', p_is_enabled, 'applies_to', p_applies_to));

  RETURN v_flag_id;
END;
$$;


--
-- Name: admin_create_newsletter_template(text, text, text, text, text[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_create_newsletter_template(p_name text, p_subject text, p_body_html text, p_body_text text DEFAULT NULL::text, p_variables text[] DEFAULT '{}'::text[], p_category text DEFAULT 'general'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_daily_signups(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_daily_signups(p_days integer DEFAULT 30) RETURNS TABLE(signup_date date, count bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    d::DATE AS signup_date,
    COUNT(u.id)::BIGINT AS count
  FROM generate_series(
    (now() - (p_days || ' days')::INTERVAL)::DATE,
    now()::DATE,
    '1 day'::INTERVAL
  ) d
  LEFT JOIN auth.users u ON u.created_at::DATE = d::DATE
  GROUP BY d::DATE
  ORDER BY d::DATE;
END;
$$;


--
-- Name: admin_delete_audience_segment(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_delete_audience_segment(p_segment_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_delete_feature_flag(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_delete_feature_flag(p_flag_key text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  DELETE FROM admin.feature_flags WHERE flag_key = p_flag_key;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'delete_feature_flag', 'feature_flag', p_flag_key, '{}');
END;
$$;


--
-- Name: admin_delete_newsletter_template(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_delete_newsletter_template(p_template_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_delete_tracked_page(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_delete_tracked_page(p_page_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_page RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  SELECT company_name, url INTO v_page FROM core.tracked_pages WHERE id = p_page_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tracked page not found: %', p_page_id; END IF;
  DELETE FROM diff_tracker.page_diffs WHERE old_snapshot_id IN (SELECT id FROM diff_tracker.page_snapshots WHERE tracked_page_id = p_page_id) OR new_snapshot_id IN (SELECT id FROM diff_tracker.page_snapshots WHERE tracked_page_id = p_page_id);
  DELETE FROM diff_tracker.page_snapshots WHERE tracked_page_id = p_page_id;
  DELETE FROM core.tracked_pages WHERE id = p_page_id;
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'delete_tracked_page', 'tracked_page', p_page_id::TEXT, jsonb_build_object('company_name', v_page.company_name, 'url', v_page.url));
END;
$$;


--
-- Name: admin_get_abuse_flags(boolean, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_abuse_flags(p_resolved boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 50) RETURNS TABLE(id uuid, user_id uuid, user_email text, display_name text, flag_type text, severity text, description text, resolved boolean, resolved_at timestamp with time zone, metadata jsonb, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    af.id, af.user_id, u.email::TEXT, up.display_name,
    af.flag_type, af.severity, af.description,
    af.resolved, af.resolved_at, af.metadata, af.created_at
  FROM admin.abuse_flags af
  JOIN auth.users u ON u.id = af.user_id
  LEFT JOIN admin.user_profiles up ON up.id = af.user_id
  WHERE (p_resolved IS NULL OR af.resolved = p_resolved)
  ORDER BY af.created_at DESC
  LIMIT p_limit;
END;
$$;


--
-- Name: admin_get_api_registry(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_api_registry() RETURNS TABLE(id uuid, api_name text, api_slug text, health_check_url text, category text, enabled boolean, docs_url text, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  SELECT ar.id, ar.api_name, ar.api_slug, ar.health_check_url,
         ar.category, ar.enabled, ar.docs_url, ar.created_at
  FROM admin.api_registry ar
  ORDER BY ar.category, ar.api_name;
END;
$$;


--
-- Name: admin_get_audience_segment(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_audience_segment(p_segment_id uuid) RETURNS TABLE(id uuid, name text, description text, criteria jsonb, estimated_count integer, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_get_audit_log(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_audit_log(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, admin_email text, action text, target_type text, target_id text, details jsonb, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    al.id,
    u.email::TEXT AS admin_email,
    al.action,
    al.target_type,
    al.target_id,
    al.details,
    al.created_at
  FROM admin.audit_log al
  JOIN auth.users u ON u.id = al.admin_user_id
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


--
-- Name: admin_get_campaign_send_log(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_campaign_send_log(p_campaign_id uuid, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 100) RETURNS TABLE(id uuid, recipient_email text, status text, opened_at timestamp with time zone, clicked_at timestamp with time zone, bounced_at timestamp with time zone, failed_reason text, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_get_campaign_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_campaign_stats(p_campaign_id uuid) RETURNS TABLE(total_sent bigint, total_delivered bigint, total_opened bigint, total_clicked bigint, total_bounced bigint, total_complained bigint, total_failed bigint, open_rate numeric, click_rate numeric, bounce_rate numeric)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_get_email_analytics_overview(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_email_analytics_overview(p_days integer DEFAULT 30) RETURNS TABLE(total_campaigns bigint, total_emails_sent bigint, avg_open_rate numeric, avg_click_rate numeric, avg_bounce_rate numeric)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_get_email_campaign(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_email_campaign(p_campaign_id uuid) RETURNS TABLE(id uuid, name text, status text, template_id uuid, template_name text, template_subject text, segment_id uuid, segment_name text, segment_criteria jsonb, total_recipients integer, from_name text, from_email text, reply_to text, scheduled_at timestamp with time zone, sent_at timestamp with time zone, completed_at timestamp with time zone, metadata jsonb, created_by uuid, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_get_feature_flags(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_feature_flags() RETURNS TABLE(id uuid, flag_key text, label text, description text, is_enabled boolean, applies_to text, allowed_user_ids uuid[], created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  RETURN QUERY
  SELECT ff.id, ff.flag_key, ff.label, ff.description, ff.is_enabled,
    ff.applies_to, ff.allowed_user_ids, ff.created_at, ff.updated_at
  FROM admin.feature_flags ff ORDER BY ff.created_at;
END;
$$;


--
-- Name: admin_get_health_history(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_health_history(p_api_slug text, p_hours integer DEFAULT 24) RETURNS TABLE(status text, response_time_ms integer, http_status_code integer, error_message text, checked_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  SELECT hc.status, hc.response_time_ms, hc.http_status_code,
         hc.error_message, hc.checked_at
  FROM admin.system_health_checks hc
  JOIN admin.api_registry ar ON ar.id = hc.api_registry_id
  WHERE ar.api_slug = p_api_slug
    AND hc.checked_at >= now() - (p_hours || ' hours')::INTERVAL
  ORDER BY hc.checked_at DESC;
END;
$$;


--
-- Name: admin_get_health_overview(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_health_overview() RETURNS TABLE(api_name text, api_slug text, category text, status text, response_time_ms integer, http_status_code integer, error_message text, checked_at timestamp with time zone, enabled boolean)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  SELECT DISTINCT ON (ar.id)
    ar.api_name, ar.api_slug, ar.category,
    COALESCE(hc.status, 'unknown')::TEXT,
    hc.response_time_ms, hc.http_status_code, hc.error_message,
    hc.checked_at, ar.enabled
  FROM admin.api_registry ar
  LEFT JOIN admin.system_health_checks hc ON hc.api_registry_id = ar.id
  ORDER BY ar.id, hc.checked_at DESC;
END;
$$;


--
-- Name: admin_get_newsletter_template(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_newsletter_template(p_template_id uuid) RETURNS TABLE(id uuid, name text, subject text, body_html text, body_text text, variables text[], category text, is_archived boolean, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_get_system_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_system_summary() RETURNS TABLE(total_apis integer, healthy_apis integer, degraded_apis integer, down_apis integer, avg_response_time_ms numeric, last_check_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  WITH latest_checks AS (
    SELECT DISTINCT ON (ar.id) ar.id, hc.status, hc.response_time_ms, hc.checked_at
    FROM admin.api_registry ar
    LEFT JOIN admin.system_health_checks hc ON hc.api_registry_id = ar.id
    WHERE ar.enabled = true
    ORDER BY ar.id, hc.checked_at DESC
  )
  SELECT
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE status = 'healthy')::INT,
    COUNT(*) FILTER (WHERE status = 'degraded')::INT,
    COUNT(*) FILTER (WHERE status IN ('down', 'timeout', 'error'))::INT,
    ROUND(AVG(response_time_ms)::NUMERIC, 0),
    MAX(checked_at)
  FROM latest_checks;
END;
$$;


--
-- Name: admin_get_usage_leaderboard(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_usage_leaderboard(p_days integer DEFAULT 30, p_limit integer DEFAULT 25) RETURNS TABLE(user_id uuid, user_email text, display_name text, upload_count bigint, total_rows_processed bigint, last_active timestamp with time zone, abuse_flag_count bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    ut.user_id,
    u.email::TEXT,
    up.display_name,
    COUNT(*)::BIGINT AS upload_count,
    COALESCE(SUM(ut.resource_count), 0)::BIGINT AS total_rows,
    MAX(ut.created_at) AS last_active,
    (SELECT COUNT(*)::BIGINT FROM admin.abuse_flags af
     WHERE af.user_id = ut.user_id AND af.resolved = false) AS abuse_flags
  FROM admin.usage_tracking ut
  JOIN auth.users u ON u.id = ut.user_id
  LEFT JOIN admin.user_profiles up ON up.id = ut.user_id
  WHERE ut.created_at >= now() - (p_days || ' days')::INTERVAL
  GROUP BY ut.user_id, u.email, up.display_name
  ORDER BY COALESCE(SUM(ut.resource_count), 0) DESC
  LIMIT p_limit;
END;
$$;


--
-- Name: admin_get_usage_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_usage_summary() RETURNS TABLE(total_uploads bigint, total_rows_processed bigint, active_users_7d bigint, active_users_30d bigint, flagged_users bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM admin.usage_tracking WHERE action_type = 'csv_upload'),
    (SELECT COALESCE(SUM(resource_count), 0)::BIGINT FROM admin.usage_tracking WHERE action_type = 'csv_upload'),
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM admin.usage_tracking WHERE created_at >= now() - INTERVAL '7 days'),
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM admin.usage_tracking WHERE created_at >= now() - INTERVAL '30 days'),
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM admin.abuse_flags WHERE resolved = false);
END;
$$;


--
-- Name: admin_get_user_usage(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_user_usage(p_user_id uuid, p_days integer DEFAULT 30) RETURNS TABLE(action_type text, action_count bigint, total_resources bigint, last_action_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    ut.action_type,
    COUNT(*)::BIGINT,
    COALESCE(SUM(ut.resource_count), 0)::BIGINT,
    MAX(ut.created_at)
  FROM admin.usage_tracking ut
  WHERE ut.user_id = p_user_id
    AND ut.created_at >= now() - (p_days || ' days')::INTERVAL
  GROUP BY ut.action_type
  ORDER BY COUNT(*) DESC;
END;
$$;


--
-- Name: admin_handle_email_webhook(text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_handle_email_webhook(p_resend_message_id text, p_event_type text, p_event_data jsonb DEFAULT '{}'::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_list_audience_segments(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_list_audience_segments() RETURNS TABLE(id uuid, name text, description text, criteria jsonb, estimated_count integer, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_list_email_campaigns(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_list_email_campaigns(p_status text DEFAULT NULL::text, p_limit integer DEFAULT 50) RETURNS TABLE(id uuid, name text, status text, template_name text, segment_name text, total_recipients integer, scheduled_at timestamp with time zone, sent_at timestamp with time zone, completed_at timestamp with time zone, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_list_newsletter_templates(text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_list_newsletter_templates(p_category text DEFAULT NULL::text, p_include_archived boolean DEFAULT false) RETURNS TABLE(id uuid, name text, subject text, category text, variables text[], is_archived boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_list_tracked_pages(text, text, boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_list_tracked_pages(p_search text DEFAULT NULL::text, p_page_type text DEFAULT NULL::text, p_enabled boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, company_id uuid, company_name text, company_slug text, url text, url_type text, page_type text, enabled boolean, created_at timestamp with time zone, user_id uuid, snapshot_count bigint, last_snapshot_at timestamp with time zone, last_snapshot_status text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    tp.id,
    tp.company_id,
    tp.company_name,
    tp.company_slug,
    tp.url,
    tp.url_type,
    tp.page_type,
    tp.enabled,
    tp.created_at,
    tp.user_id,
    COALESCE(stats.snapshot_count, 0) AS snapshot_count,
    stats.last_snapshot_at,
    stats.last_snapshot_status
  FROM core.tracked_pages tp
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS snapshot_count,
      MAX(ps.fetched_at) AS last_snapshot_at,
      (SELECT ps2.status FROM diff_tracker.page_snapshots ps2
       WHERE ps2.tracked_page_id = tp.id
       ORDER BY ps2.fetched_at DESC LIMIT 1) AS last_snapshot_status
    FROM diff_tracker.page_snapshots ps
    WHERE ps.tracked_page_id = tp.id
  ) stats ON true
  WHERE
    (p_search IS NULL OR (
      tp.company_name ILIKE '%' || p_search || '%'
      OR tp.url ILIKE '%' || p_search || '%'
      OR tp.company_slug ILIKE '%' || p_search || '%'
    ))
    AND (p_page_type IS NULL OR tp.page_type = p_page_type)
    AND (p_enabled IS NULL OR tp.enabled = p_enabled)
  ORDER BY tp.company_name, tp.url
  LIMIT p_limit OFFSET p_offset;
END;
$$;


--
-- Name: admin_list_users(text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_list_users(p_search text DEFAULT NULL::text, p_role text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, email text, display_name text, role text, is_suspended boolean, is_banned boolean, last_active_at timestamp with time zone, profile_created_at timestamp with time zone, auth_created_at timestamp with time zone, tracked_companies_count bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    u.email::TEXT,
    up.display_name,
    up.role,
    up.is_suspended,
    up.is_banned,
    up.last_active_at,
    up.created_at AS profile_created_at,
    u.created_at AS auth_created_at,
    (SELECT COUNT(DISTINCT c.id) FROM core.companies c WHERE c.user_id = up.id) AS tracked_companies_count
  FROM admin.user_profiles up
  JOIN auth.users u ON u.id = up.id
  WHERE
    (p_search IS NULL OR u.email ILIKE '%' || p_search || '%' OR up.display_name ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR up.role = p_role)
    AND (
      p_status IS NULL
      OR (p_status = 'active' AND up.is_suspended = false AND up.is_banned = false)
      OR (p_status = 'suspended' AND up.is_suspended = true)
      OR (p_status = 'banned' AND up.is_banned = true)
    )
  ORDER BY u.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


--
-- Name: admin_preview_segment(jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_preview_segment(p_criteria jsonb, p_limit integer DEFAULT 20) RETURNS TABLE(user_id uuid, email text, display_name text, role text, last_active_at timestamp with time zone, created_at timestamp with time zone, tracked_companies bigint, match_count bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_resolve_abuse_flag(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_resolve_abuse_flag(p_flag_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_admin_id UUID := auth.uid(); v_user_id UUID; v_flag_type TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  SELECT user_id, flag_type INTO v_user_id, v_flag_type
  FROM admin.abuse_flags WHERE id = p_flag_id;

  UPDATE admin.abuse_flags
  SET resolved = true, resolved_by = v_admin_id, resolved_at = now()
  WHERE id = p_flag_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'resolve_abuse_flag', 'abuse_flag', p_flag_id::TEXT,
    jsonb_build_object('user_id', v_user_id, 'flag_type', v_flag_type));
END;
$$;


--
-- Name: admin_set_user_role(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_set_user_role(p_user_id uuid, p_role text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old_role TEXT;
BEGIN
  -- Only super_admin can change roles
  IF NOT EXISTS (
    SELECT 1 FROM admin.user_profiles WHERE id = v_admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: super_admin access required';
  END IF;

  IF p_role NOT IN ('user', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  SELECT role INTO v_old_role FROM admin.user_profiles WHERE id = p_user_id;

  UPDATE admin.user_profiles
  SET role = p_role, updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'set_user_role', 'user', p_user_id::TEXT,
    jsonb_build_object('old_role', v_old_role, 'new_role', p_role));
END;
$$;


--
-- Name: admin_suspend_user(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_suspend_user(p_user_id uuid, p_reason text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Cannot suspend yourself
  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Cannot suspend yourself';
  END IF;

  -- Cannot suspend super_admins unless you are super_admin
  IF EXISTS (
    SELECT 1 FROM admin.user_profiles WHERE id = p_user_id AND role = 'super_admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM admin.user_profiles WHERE id = v_admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super_admins can suspend other super_admins';
  END IF;

  UPDATE admin.user_profiles
  SET
    is_suspended = true,
    suspended_at = now(),
    suspended_reason = p_reason,
    updated_at = now()
  WHERE id = p_user_id;

  -- Audit log
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'suspend_user', 'user', p_user_id::TEXT, jsonb_build_object('reason', p_reason));
END;
$$;


--
-- Name: admin_toggle_feature_flag(text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_toggle_feature_flag(p_flag_key text, p_enabled boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  UPDATE admin.feature_flags
  SET is_enabled = p_enabled, updated_at = now()
  WHERE flag_key = p_flag_key;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'toggle_feature_flag', 'feature_flag', p_flag_key,
    jsonb_build_object('enabled', p_enabled));
END;
$$;


--
-- Name: admin_toggle_tracked_page(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_toggle_tracked_page(p_page_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_new_enabled BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  UPDATE core.tracked_pages SET enabled = NOT enabled WHERE id = p_page_id RETURNING enabled INTO v_new_enabled;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tracked page not found: %', p_page_id; END IF;
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'toggle_tracked_page', 'tracked_page', p_page_id::TEXT, jsonb_build_object('enabled', v_new_enabled));
  RETURN v_new_enabled;
END;
$$;


--
-- Name: admin_tracked_page_companies(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_tracked_page_companies() RETURNS TABLE(company_id uuid, company_name text, company_slug text, page_count bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  RETURN QUERY
  SELECT tp.company_id, tp.company_name, tp.company_slug, COUNT(*)::BIGINT AS page_count
  FROM core.tracked_pages tp
  GROUP BY tp.company_id, tp.company_name, tp.company_slug
  ORDER BY tp.company_name;
END;
$$;


--
-- Name: admin_tracked_pages_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_tracked_pages_stats() RETURNS TABLE(total_pages bigint, enabled_pages bigint, disabled_pages bigint, unique_companies bigint, pages_with_snapshots bigint, total_snapshots bigint, failed_snapshots bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_pages,
    COUNT(*) FILTER (WHERE tp.enabled = true)::BIGINT AS enabled_pages,
    COUNT(*) FILTER (WHERE tp.enabled = false)::BIGINT AS disabled_pages,
    COUNT(DISTINCT tp.company_name)::BIGINT AS unique_companies,
    COUNT(DISTINCT ps.tracked_page_id)::BIGINT AS pages_with_snapshots,
    COUNT(ps.id)::BIGINT AS total_snapshots,
    COUNT(ps.id) FILTER (WHERE ps.status = 'failed')::BIGINT AS failed_snapshots
  FROM core.tracked_pages tp
  LEFT JOIN diff_tracker.page_snapshots ps ON ps.tracked_page_id = tp.id;
END;
$$;


--
-- Name: admin_unban_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_unban_user(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  UPDATE admin.user_profiles
  SET
    is_banned = false,
    banned_at = NULL,
    banned_reason = NULL,
    updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'unban_user', 'user', p_user_id::TEXT, '{}');
END;
$$;


--
-- Name: admin_unsuspend_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_unsuspend_user(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  UPDATE admin.user_profiles
  SET
    is_suspended = false,
    suspended_at = NULL,
    suspended_reason = NULL,
    updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'unsuspend_user', 'user', p_user_id::TEXT, '{}');
END;
$$;


--
-- Name: admin_update_audience_segment(uuid, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_update_audience_segment(p_segment_id uuid, p_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_criteria jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_update_email_campaign(uuid, text, uuid, uuid, text, text, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_update_email_campaign(p_campaign_id uuid, p_name text DEFAULT NULL::text, p_template_id uuid DEFAULT NULL::uuid, p_segment_id uuid DEFAULT NULL::uuid, p_from_name text DEFAULT NULL::text, p_from_email text DEFAULT NULL::text, p_reply_to text DEFAULT NULL::text, p_scheduled_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_update_feature_flag(text, text, text, text, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_update_feature_flag(p_flag_key text, p_label text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_applies_to text DEFAULT NULL::text, p_allowed_user_ids uuid[] DEFAULT NULL::uuid[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  IF p_applies_to IS NOT NULL AND p_applies_to NOT IN ('all', 'admin', 'specific_users') THEN
    RAISE EXCEPTION 'Invalid applies_to value: %', p_applies_to;
  END IF;

  UPDATE admin.feature_flags SET
    label = COALESCE(p_label, label),
    description = COALESCE(p_description, description),
    applies_to = COALESCE(p_applies_to, applies_to),
    allowed_user_ids = COALESCE(p_allowed_user_ids, allowed_user_ids),
    updated_at = now()
  WHERE flag_key = p_flag_key;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'update_feature_flag', 'feature_flag', p_flag_key,
    jsonb_build_object('label', p_label, 'applies_to', p_applies_to));
END;
$$;


--
-- Name: admin_update_newsletter_template(uuid, text, text, text, text, text[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_update_newsletter_template(p_template_id uuid, p_name text DEFAULT NULL::text, p_subject text DEFAULT NULL::text, p_body_html text DEFAULT NULL::text, p_body_text text DEFAULT NULL::text, p_variables text[] DEFAULT NULL::text[], p_category text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: admin_update_tracked_page(uuid, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_update_tracked_page(p_page_id uuid, p_url text DEFAULT NULL::text, p_page_type text DEFAULT NULL::text, p_url_type text DEFAULT NULL::text, p_company_name text DEFAULT NULL::text, p_company_slug text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  UPDATE core.tracked_pages SET
    url = COALESCE(p_url, url),
    page_type = COALESCE(p_page_type, page_type),
    url_type = COALESCE(p_url_type, url_type),
    company_name = COALESCE(p_company_name, company_name),
    company_slug = COALESCE(p_company_slug, company_slug)
  WHERE id = p_page_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tracked page not found: %', p_page_id; END IF;
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'update_tracked_page', 'tracked_page', p_page_id::TEXT,
    jsonb_build_object('url', p_url, 'page_type', p_page_type, 'url_type', p_url_type, 'company_name', p_company_name, 'company_slug', p_company_slug));
END;
$$;


--
-- Name: admin_user_growth_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_user_growth_stats() RETURNS TABLE(total_users bigint, active_users bigint, suspended_users bigint, banned_users bigint, admins bigint, users_last_7_days bigint, users_last_30_days bigint, users_last_90_days bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE up.is_suspended = false AND up.is_banned = false)::BIGINT AS active_users,
    COUNT(*) FILTER (WHERE up.is_suspended = true)::BIGINT AS suspended_users,
    COUNT(*) FILTER (WHERE up.is_banned = true)::BIGINT AS banned_users,
    COUNT(*) FILTER (WHERE up.role IN ('admin', 'super_admin'))::BIGINT AS admins,
    COUNT(*) FILTER (WHERE u.created_at >= now() - INTERVAL '7 days')::BIGINT AS users_last_7_days,
    COUNT(*) FILTER (WHERE u.created_at >= now() - INTERVAL '30 days')::BIGINT AS users_last_30_days,
    COUNT(*) FILTER (WHERE u.created_at >= now() - INTERVAL '90 days')::BIGINT AS users_last_90_days
  FROM admin.user_profiles up
  JOIN auth.users u ON u.id = up.id;
END;
$$;


--
-- Name: user_company_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_company_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_name text NOT NULL,
    company_domain text,
    industry text,
    company_size text,
    job_title text,
    department text,
    onboarding_completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_company_profiles_company_size_check CHECK ((company_size = ANY (ARRAY['1-10'::text, '11-50'::text, '51-200'::text, '201-500'::text, '501-1000'::text, '1000+'::text]))),
    CONSTRAINT user_company_profiles_department_check CHECK ((department = ANY (ARRAY['marketing'::text, 'sales'::text, 'revops'::text, 'product'::text, 'executive'::text, 'other'::text])))
);


--
-- Name: TABLE user_company_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_company_profiles IS 'Stores user company context for personalized intelligence';


--
-- Name: complete_onboarding(uuid, text, text, text, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.complete_onboarding(p_user_id uuid, p_company_name text, p_company_domain text DEFAULT NULL::text, p_industry text DEFAULT NULL::text, p_company_size text DEFAULT NULL::text, p_job_title text DEFAULT NULL::text, p_department text DEFAULT NULL::text, p_competitors jsonb DEFAULT '[]'::jsonb) RETURNS public.user_company_profiles
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: FUNCTION complete_onboarding(p_user_id uuid, p_company_name text, p_company_domain text, p_industry text, p_company_size text, p_job_title text, p_department text, p_competitors jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.complete_onboarding(p_user_id uuid, p_company_name text, p_company_domain text, p_industry text, p_company_size text, p_job_title text, p_department text, p_competitors jsonb) IS 'Saves user company profile and tracked competitors in one transaction';


--
-- Name: delete_company(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_company(p_company_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_page_ids uuid[];
BEGIN
  -- Get all page ids for this company + user
  SELECT array_agg(id) INTO v_page_ids
  FROM core.tracked_pages
  WHERE company_id = p_company_id AND user_id = auth.uid();

  IF v_page_ids IS NULL THEN
    RETURN false;
  END IF;

  -- Cascade delete child rows
  DELETE FROM diff_tracker.classified_changes
    WHERE page_diff_id IN (SELECT pd.id FROM diff_tracker.page_diffs pd WHERE pd.tracked_page_id = ANY(v_page_ids));
  DELETE FROM diff_tracker.narrative_snapshots WHERE tracked_page_id = ANY(v_page_ids);
  DELETE FROM diff_tracker.page_diffs WHERE tracked_page_id = ANY(v_page_ids);
  DELETE FROM diff_tracker.page_snapshots WHERE tracked_page_id = ANY(v_page_ids);

  -- Delete all tracked pages for this company + user
  DELETE FROM core.tracked_pages
  WHERE company_id = p_company_id AND user_id = auth.uid();

  RETURN true;
END;
$$;


--
-- Name: delete_tracked_page(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_tracked_page(page_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM diff_tracker.classified_changes
    WHERE page_diff_id IN (SELECT id FROM diff_tracker.page_diffs WHERE tracked_page_id = page_id);
  DELETE FROM diff_tracker.narrative_snapshots WHERE tracked_page_id = page_id;
  DELETE FROM diff_tracker.narrative_drifts WHERE company_id IN (
    SELECT company_id FROM core.tracked_pages WHERE id = page_id
  );
  DELETE FROM diff_tracker.page_diffs WHERE tracked_page_id = page_id;
  DELETE FROM diff_tracker.page_snapshots WHERE tracked_page_id = page_id;
  DELETE FROM core.tracked_pages WHERE id = page_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;


--
-- Name: get_decrypted_delivery_channels(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_decrypted_delivery_channels() RETURNS TABLE(user_id uuid, user_email text, channel_type text, channel_config jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_key text := current_setting('app.settings.encryption_key', true);
BEGIN
  RETURN QUERY
  SELECT
    dp.user_id,
    u.email::text as user_email,
    dp.channel_type,
    CASE
      WHEN dp.channel_config->>'encrypted' = 'true' AND v_key IS NOT NULL AND v_key != '' THEN
        jsonb_build_object(
          'access_token', pgp_sym_decrypt(decode(dp.channel_config->>'access_token', 'base64'), v_key),
          'database_id', dp.channel_config->>'database_id'
        )
      ELSE
        dp.channel_config - 'encrypted'
    END as channel_config
  FROM public.delivery_preferences dp
  JOIN auth.users u ON u.id = dp.user_id
  WHERE dp.enabled = true;
END;
$$;


--
-- Name: get_enabled_delivery_channels(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_enabled_delivery_channels() RETURNS TABLE(user_id uuid, user_email text, channel_type text, channel_config jsonb)
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT dp.user_id, u.email::text as user_email, dp.channel_type, dp.channel_config
  FROM public.delivery_preferences dp
  JOIN auth.users u ON u.id = dp.user_id
  WHERE dp.enabled = true;
$$;


--
-- Name: get_feature_flags(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_feature_flags() RETURNS TABLE(flag_key text, label text, description text, is_enabled boolean, applies_to text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    ff.flag_key,
    ff.label,
    ff.description,
    CASE
      WHEN ff.applies_to = 'all' THEN ff.is_enabled
      WHEN ff.applies_to = 'admin' THEN
        ff.is_enabled AND EXISTS (
          SELECT 1 FROM admin.user_profiles up
          WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
        )
      WHEN ff.applies_to = 'specific_users' THEN
        ff.is_enabled AND auth.uid() = ANY(ff.allowed_user_ids)
      ELSE false
    END AS is_enabled,
    ff.applies_to
  FROM admin.feature_flags ff;
$$;


--
-- Name: get_my_changelog(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_changelog() RETURNS TABLE(week_start_date text, company_name text, company_slug text, url text, url_type text, primary_tag text, diff_summary text, implication text, confidence numeric, change_magnitude text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    d.week_start_date,
    tp.company_name,
    tp.company_slug,
    tp.url,
    tp.url_type,
    cc.primary_tag,
    d.diff_summary,
    cc.implication,
    cc.confidence,
    d.change_magnitude
  FROM diff_tracker.page_diffs d
  JOIN core.tracked_pages tp ON tp.id = d.tracked_page_id
  JOIN diff_tracker.classified_changes cc ON cc.page_diff_id = d.id
  WHERE tp.user_id = auth.uid()
    AND tp.enabled = true
  ORDER BY d.week_start_date DESC, tp.company_name;
$$;


--
-- Name: get_my_tracked_pages(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_tracked_pages() RETURNS TABLE(id uuid, company_id uuid, company_name text, company_slug text, url text, url_type text, enabled boolean, created_at timestamp with time zone)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id, company_id, company_name, company_slug, url, url_type, enabled, created_at
  FROM core.tracked_pages
  WHERE user_id = auth.uid()
  ORDER BY company_name, url_type;
$$;


--
-- Name: get_public_changelog(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_public_changelog() RETURNS TABLE(week_start_date date, company_name text, company_slug text, url text, url_type text, primary_tag text, diff_summary text, implication text, confidence numeric, change_magnitude text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select * from public.public_changelog;
$$;


--
-- Name: get_user_competitor_ids(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_competitor_ids(p_user_id uuid) RETURNS uuid[]
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: FUNCTION get_user_competitor_ids(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_competitor_ids(p_user_id uuid) IS 'Returns array of company_ids the user is tracking';


--
-- Name: get_user_context(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_context(p_user_id uuid) RETURNS TABLE(company_name text, company_domain text, competitor_ids uuid[], competitor_names text[], competitor_domains text[])
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: FUNCTION get_user_context(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_context(p_user_id uuid) IS 'Returns full user context for n8n workflow signal filtering';


--
-- Name: handle_email_unsubscribe(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_email_unsubscribe(p_token text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.user_profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_banned = false
      AND is_suspended = false
  );
$$;


--
-- Name: log_csv_upload(uuid, text, integer, integer, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_csv_upload(p_user_id uuid, p_filename text, p_total_rows integer, p_valid_rows integer, p_skipped_rows integer, p_source_type text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uploads_last_hour INT;
BEGIN
  -- Log the upload event
  INSERT INTO admin.usage_tracking (user_id, action_type, action_detail, resource_count, metadata)
  VALUES (
    p_user_id,
    'csv_upload',
    p_filename,
    p_valid_rows,
    jsonb_build_object(
      'total_rows', p_total_rows,
      'valid_rows', p_valid_rows,
      'skipped_rows', p_skipped_rows,
      'source_type', p_source_type
    )
  );

  -- Check for abuse: large upload (>1000 rows)
  IF p_total_rows > 1000 THEN
    INSERT INTO admin.abuse_flags (user_id, flag_type, severity, description, metadata)
    VALUES (p_user_id, 'large_upload', 'medium',
      'User uploaded a CSV with ' || p_total_rows || ' rows (threshold: 1000)',
      jsonb_build_object('filename', p_filename, 'total_rows', p_total_rows));
  END IF;

  -- Check for abuse: high volume (>500 valid rows)
  IF p_valid_rows > 500 THEN
    INSERT INTO admin.abuse_flags (user_id, flag_type, severity, description, metadata)
    VALUES (p_user_id, 'high_volume', 'low',
      'User imported ' || p_valid_rows || ' valid rows in a single upload (threshold: 500)',
      jsonb_build_object('filename', p_filename, 'valid_rows', p_valid_rows));
  END IF;

  -- Check for abuse: rapid requests (>10 uploads in last hour)
  SELECT COUNT(*) INTO v_uploads_last_hour
  FROM admin.usage_tracking
  WHERE user_id = p_user_id
    AND action_type = 'csv_upload'
    AND created_at >= now() - INTERVAL '1 hour';

  IF v_uploads_last_hour > 10 THEN
    INSERT INTO admin.abuse_flags (user_id, flag_type, severity, description, metadata)
    VALUES (p_user_id, 'rapid_requests', 'high',
      'User made ' || v_uploads_last_hour || ' CSV uploads in the last hour (threshold: 10)',
      jsonb_build_object('uploads_last_hour', v_uploads_last_hour));
  END IF;
END;
$$;


--
-- Name: save_notion_config(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_notion_config(p_api_token text, p_database_id text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_key text := current_setting('app.settings.encryption_key', true);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    -- Fallback: store with basic obfuscation if no encryption key set
    INSERT INTO public.delivery_preferences (user_id, channel_type, channel_config, enabled)
    VALUES (
      v_user_id,
      'notion',
      jsonb_build_object(
        'access_token', p_api_token,
        'database_id', p_database_id,
        'encrypted', false
      ),
      true
    )
    ON CONFLICT (user_id, channel_type)
    DO UPDATE SET
      channel_config = jsonb_build_object(
        'access_token', p_api_token,
        'database_id', p_database_id,
        'encrypted', false
      ),
      enabled = true,
      updated_at = now();
  ELSE
    INSERT INTO public.delivery_preferences (user_id, channel_type, channel_config, enabled)
    VALUES (
      v_user_id,
      'notion',
      jsonb_build_object(
        'access_token', encode(pgp_sym_encrypt(p_api_token, v_key), 'base64'),
        'database_id', p_database_id,
        'encrypted', true
      ),
      true
    )
    ON CONFLICT (user_id, channel_type)
    DO UPDATE SET
      channel_config = jsonb_build_object(
        'access_token', encode(pgp_sym_encrypt(p_api_token, v_key), 'base64'),
        'database_id', p_database_id,
        'encrypted', true
      ),
      enabled = true,
      updated_at = now();
  END IF;
END;
$$;


--
-- Name: toggle_tracked_page(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.toggle_tracked_page(page_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE new_enabled boolean;
BEGIN
  UPDATE core.tracked_pages SET enabled = NOT enabled
  WHERE id = page_id AND user_id = auth.uid()
  RETURNING enabled INTO new_enabled;
  RETURN new_enabled;
END;
$$;


--
-- Name: update_delivery_prefs_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_delivery_prefs_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN new.updated_at = now(); RETURN new; END; $$;


--
-- Name: user_needs_onboarding(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_needs_onboarding(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1
        FROM public.user_company_profiles
        WHERE user_id = p_user_id
        AND onboarding_completed_at IS NOT NULL
    );
END;
$$;


--
-- Name: FUNCTION user_needs_onboarding(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_needs_onboarding(p_user_id uuid) IS 'Returns TRUE if user has not completed company onboarding';


--
-- Name: compute_all_pack_winners(date); Type: FUNCTION; Schema: sector_packs; Owner: -
--

CREATE FUNCTION sector_packs.compute_all_pack_winners(p_week_start date) RETURNS TABLE(pack_id uuid, pack_slug text, winner_id uuid)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_pack RECORD;
  v_winner_id UUID;
BEGIN
  FOR v_pack IN SELECT id, pack_slug FROM sector_packs.packs WHERE enabled = true
  LOOP
    v_winner_id := sector_packs.compute_pack_winners(v_pack.id, p_week_start);
    
    IF v_winner_id IS NOT NULL THEN
      PERFORM sector_packs.emit_winners_to_signals(v_pack.id, p_week_start);
    END IF;
    
    pack_id := v_pack.id;
    pack_slug := v_pack.pack_slug;
    winner_id := v_winner_id;
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$;


--
-- Name: compute_pack_winners(uuid, date); Type: FUNCTION; Schema: sector_packs; Owner: -
--

CREATE FUNCTION sector_packs.compute_pack_winners(p_pack_id uuid, p_week_start date) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_pack RECORD;
  v_winner_id UUID;
  v_proven_winners JSONB;
  v_emerging_winners JSONB;
  v_total_patterns INT;
  v_new_patterns INT;
BEGIN
  -- Get the pack
  SELECT * INTO v_pack FROM sector_packs.packs WHERE id = p_pack_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pack not found: %', p_pack_id;
  END IF;

  -- Get proven winners (patterns with high survivorship from pack companies)
  -- These are patterns that have survived 4+ weeks with high propagation
  SELECT COALESCE(jsonb_agg(winners ORDER BY survivorship_score DESC), '[]'::jsonb)
  INTO v_proven_winners
  FROM (
    SELECT 
      jsonb_build_object(
        'pattern_label', p.label,
        'category', p.category,
        'description', p.description,
        'survivorship_score', p.survivorship_score,
        'propagation_score', p.propagation_score,
        'survival_weeks', EXTRACT(days FROM NOW() - p.first_seen_at) / 7,
        'companies', (
          SELECT jsonb_agg(DISTINCT pc.company_name)
          FROM experiment_surveillance.pattern_instances pi
          JOIN sector_packs.pack_companies pc ON pc.company_domain = pi.company_domain
          WHERE pi.pattern_id = p.id AND pc.pack_id = p_pack_id
        )
      ) AS winners,
      p.survivorship_score
    FROM experiment_surveillance.patterns p
    WHERE p.survivorship_score >= 0.7
      AND p.propagation_score >= 0.5
      AND EXISTS (
        SELECT 1 FROM experiment_surveillance.pattern_instances pi
        JOIN sector_packs.pack_companies pc ON pc.company_domain = pi.company_domain
        WHERE pi.pattern_id = p.id AND pc.pack_id = p_pack_id
      )
    LIMIT 3
  ) sub;

  -- Get emerging winners (newer patterns gaining traction)
  SELECT COALESCE(jsonb_agg(winners ORDER BY propagation_score DESC), '[]'::jsonb)
  INTO v_emerging_winners
  FROM (
    SELECT 
      jsonb_build_object(
        'pattern_label', p.label,
        'category', p.category,
        'description', p.description,
        'survivorship_score', p.survivorship_score,
        'propagation_score', p.propagation_score,
        'survival_weeks', EXTRACT(days FROM NOW() - p.first_seen_at) / 7,
        'companies', (
          SELECT jsonb_agg(DISTINCT pc.company_name)
          FROM experiment_surveillance.pattern_instances pi
          JOIN sector_packs.pack_companies pc ON pc.company_domain = pi.company_domain
          WHERE pi.pattern_id = p.id AND pc.pack_id = p_pack_id
        )
      ) AS winners,
      p.propagation_score
    FROM experiment_surveillance.patterns p
    WHERE p.survivorship_score < 0.7
      AND p.propagation_score >= 0.3
      AND p.first_seen_at >= NOW() - INTERVAL '4 weeks'
      AND EXISTS (
        SELECT 1 FROM experiment_surveillance.pattern_instances pi
        JOIN sector_packs.pack_companies pc ON pc.company_domain = pi.company_domain
        WHERE pi.pattern_id = p.id AND pc.pack_id = p_pack_id
      )
    LIMIT 3
  ) sub;

  -- Count total and new patterns
  SELECT COUNT(*) INTO v_total_patterns
  FROM experiment_surveillance.patterns p
  WHERE EXISTS (
    SELECT 1 FROM experiment_surveillance.pattern_instances pi
    JOIN sector_packs.pack_companies pc ON pc.company_domain = pi.company_domain
    WHERE pi.pattern_id = p.id AND pc.pack_id = p_pack_id
  );

  SELECT COUNT(*) INTO v_new_patterns
  FROM experiment_surveillance.patterns p
  WHERE p.first_seen_at >= p_week_start
    AND EXISTS (
      SELECT 1 FROM experiment_surveillance.pattern_instances pi
      JOIN sector_packs.pack_companies pc ON pc.company_domain = pi.company_domain
      WHERE pi.pattern_id = p.id AND pc.pack_id = p_pack_id
    );

  -- Insert or update pack winners
  INSERT INTO sector_packs.pack_winners (
    pack_id, week_start, proven_winners, emerging_winners,
    total_patterns_tracked, new_patterns_this_week
  ) VALUES (
    p_pack_id, p_week_start, v_proven_winners, v_emerging_winners,
    v_total_patterns, v_new_patterns
  )
  ON CONFLICT (pack_id, week_start) DO UPDATE SET
    proven_winners = EXCLUDED.proven_winners,
    emerging_winners = EXCLUDED.emerging_winners,
    total_patterns_tracked = EXCLUDED.total_patterns_tracked,
    new_patterns_this_week = EXCLUDED.new_patterns_this_week,
    created_at = NOW()
  RETURNING id INTO v_winner_id;

  RETURN v_winner_id;
END;
$$;


--
-- Name: emit_winners_to_signals(uuid, date); Type: FUNCTION; Schema: sector_packs; Owner: -
--

CREATE FUNCTION sector_packs.emit_winners_to_signals(p_pack_id uuid, p_week_start date) RETURNS void
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: abuse_flags; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.abuse_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    flag_type text NOT NULL,
    severity text DEFAULT 'low'::text NOT NULL,
    description text NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT abuse_flags_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: api_registry; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.api_registry (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_name text NOT NULL,
    api_slug text NOT NULL,
    health_check_url text NOT NULL,
    health_check_method text DEFAULT 'GET'::text NOT NULL,
    health_check_headers jsonb DEFAULT '{}'::jsonb,
    health_check_body jsonb,
    expected_status_codes integer[] DEFAULT '{200}'::integer[],
    timeout_ms integer DEFAULT 10000 NOT NULL,
    category text DEFAULT 'external'::text NOT NULL,
    icon_url text,
    docs_url text,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT api_registry_category_check CHECK ((category = ANY (ARRAY['core'::text, 'external'::text, 'integration'::text]))),
    CONSTRAINT api_registry_health_check_method_check CHECK ((health_check_method = ANY (ARRAY['GET'::text, 'POST'::text, 'HEAD'::text])))
);


--
-- Name: audience_segments; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.audience_segments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    criteria jsonb DEFAULT '{}'::jsonb NOT NULL,
    estimated_count integer,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_user_id uuid NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_campaigns; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.email_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    template_id uuid NOT NULL,
    segment_id uuid NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    completed_at timestamp with time zone,
    total_recipients integer DEFAULT 0,
    from_name text DEFAULT 'SignalPlane'::text NOT NULL,
    from_email text DEFAULT 'hello@signalplane.dev'::text NOT NULL,
    reply_to text DEFAULT 'hello@signalplane.dev'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT email_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'cancelled'::text, 'failed'::text])))
);


--
-- Name: email_send_log; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.email_send_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    recipient_email text NOT NULL,
    resend_message_id text,
    status text DEFAULT 'queued'::text NOT NULL,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    bounced_at timestamp with time zone,
    failed_reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT email_send_log_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'bounced'::text, 'complained'::text, 'failed'::text])))
);


--
-- Name: email_unsubscribe_tokens; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.email_unsubscribe_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL,
    is_unsubscribed boolean DEFAULT false NOT NULL,
    unsubscribed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: feature_flags; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flag_key text NOT NULL,
    label text NOT NULL,
    description text,
    is_enabled boolean DEFAULT false NOT NULL,
    applies_to text DEFAULT 'all'::text NOT NULL,
    allowed_user_ids uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feature_flags_applies_to_check CHECK ((applies_to = ANY (ARRAY['all'::text, 'admin'::text, 'specific_users'::text])))
);


--
-- Name: newsletter_templates; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.newsletter_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    body_html text NOT NULL,
    body_text text,
    variables text[] DEFAULT '{}'::text[] NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT newsletter_templates_category_check CHECK ((category = ANY (ARRAY['general'::text, 'newsletter'::text, 'announcement'::text, 'onboarding'::text, 're-engagement'::text])))
);


--
-- Name: system_health_checks; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.system_health_checks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_registry_id uuid NOT NULL,
    status text NOT NULL,
    response_time_ms integer,
    http_status_code integer,
    error_message text,
    response_body_preview text,
    checked_at timestamp with time zone DEFAULT now() NOT NULL,
    check_source text DEFAULT 'scheduled'::text NOT NULL,
    CONSTRAINT system_health_checks_check_source_check CHECK ((check_source = ANY (ARRAY['scheduled'::text, 'manual'::text, 'incident'::text]))),
    CONSTRAINT system_health_checks_status_check CHECK ((status = ANY (ARRAY['healthy'::text, 'degraded'::text, 'down'::text, 'timeout'::text, 'error'::text])))
);


--
-- Name: usage_tracking; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.usage_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action_type text NOT NULL,
    action_detail text,
    resource_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_profiles; Type: TABLE; Schema: admin; Owner: -
--

CREATE TABLE admin.user_profiles (
    id uuid NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    display_name text,
    is_suspended boolean DEFAULT false NOT NULL,
    suspended_at timestamp with time zone,
    suspended_reason text,
    is_banned boolean DEFAULT false NOT NULL,
    banned_at timestamp with time zone,
    banned_reason text,
    last_active_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'super_admin'::text])))
);


--
-- Name: decision_verbs; Type: TABLE; Schema: control_plane; Owner: -
--

CREATE TABLE control_plane.decision_verbs (
    verb text NOT NULL
);


--
-- Name: packet_items; Type: TABLE; Schema: control_plane; Owner: -
--

CREATE TABLE control_plane.packet_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    packet_id uuid NOT NULL,
    item_type text NOT NULL,
    rank integer DEFAULT 1 NOT NULL,
    title text NOT NULL,
    detail text,
    related_signal_id uuid
);


--
-- Name: supported_timezones; Type: TABLE; Schema: control_plane; Owner: -
--

CREATE TABLE control_plane.supported_timezones (
    timezone_id text NOT NULL,
    display_name text NOT NULL,
    utc_offset text NOT NULL,
    region text NOT NULL
);


--
-- Name: packets_with_timezone; Type: VIEW; Schema: control_plane; Owner: -
--

CREATE VIEW control_plane.packets_with_timezone AS
 SELECT p.id,
    p.week_start,
    p.week_end,
    p.packet_title,
    p.exec_summary,
    p.sections,
    p.key_questions,
    p.bets,
    p.created_at,
    p.predictions_json,
    p.resolved_predictions_json,
    p.artifacts_generated,
    p.predictions,
    p.action_mapping,
    p.market_winners,
    p.org_id,
    p.timezone,
    p.week_start_local,
    p.week_end_local,
    p.generated_for_timezone,
    p.is_cached,
    p.cache_expires_at,
    st.display_name AS timezone_display_name,
    st.utc_offset,
    st.region
   FROM (control_plane.packets p
     LEFT JOIN control_plane.supported_timezones st ON ((p.generated_for_timezone = st.timezone_id)));


--
-- Name: signals; Type: TABLE; Schema: control_plane; Owner: -
--

CREATE TABLE control_plane.signals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    signal_type text NOT NULL,
    company_id uuid,
    severity integer NOT NULL,
    confidence numeric,
    title text NOT NULL,
    summary text NOT NULL,
    evidence_urls text[] DEFAULT '{}'::text[] NOT NULL,
    source_schema text NOT NULL,
    source_table text NOT NULL,
    source_id uuid NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_processed boolean DEFAULT false,
    processed_at timestamp with time zone,
    packet_id uuid,
    decision_type text,
    recommended_asset text,
    owner_team text,
    time_sensitivity text DEFAULT 'monitor'::text,
    promo_score numeric,
    summary_short text,
    CONSTRAINT signals_decision_type_check CHECK ((decision_type = ANY (ARRAY['positioning'::text, 'packaging'::text, 'distribution'::text, 'proof'::text, 'enablement'::text, 'risk'::text]))),
    CONSTRAINT signals_owner_team_check CHECK ((owner_team = ANY (ARRAY['PMM'::text, 'sales'::text, 'CS'::text, 'product'::text, 'exec'::text]))),
    CONSTRAINT signals_recommended_asset_check CHECK ((recommended_asset = ANY (ARRAY['homepage'::text, 'pricing'::text, 'deck'::text, 'talk_track'::text, 'email'::text, 'onboarding'::text, 'none'::text]))),
    CONSTRAINT signals_severity_check CHECK (((severity >= 1) AND (severity <= 5))),
    CONSTRAINT signals_signal_type_check CHECK ((signal_type = ANY (ARRAY['messaging'::text, 'narrative'::text, 'icp'::text, 'horizon'::text, 'objection'::text, 'pricing'::text, 'proof'::text, 'distribution'::text, 'hiring'::text, 'launch_decay'::text, 'experiment'::text]))),
    CONSTRAINT signals_time_sensitivity_check CHECK ((time_sensitivity = ANY (ARRAY['now'::text, 'this_week'::text, 'monitor'::text])))
);


--
-- Name: user_packets; Type: VIEW; Schema: control_plane; Owner: -
--

CREATE VIEW control_plane.user_packets AS
 SELECT id,
    week_start,
    week_end,
    packet_title,
    exec_summary,
    sections,
    key_questions,
    bets,
    created_at,
    predictions_json,
    resolved_predictions_json,
    artifacts_generated,
    predictions,
    action_mapping,
    market_winners,
    org_id,
    timezone,
    week_start_local,
    week_end_local,
    generated_for_timezone,
    is_cached,
    cache_expires_at,
    user_id,
    user_company_name,
    is_personalized,
        CASE
            WHEN (user_id IS NOT NULL) THEN 'personalized'::text
            ELSE 'generic'::text
        END AS packet_type
   FROM control_plane.packets p;


--
-- Name: VIEW user_packets; Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON VIEW control_plane.user_packets IS 'View for fetching packets with packet_type indicator (personalized vs generic).';


--
-- Name: weekly_packets; Type: TABLE; Schema: control_plane; Owner: -
--

CREATE TABLE control_plane.weekly_packets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    week_start date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    summary text
);


--
-- Name: companies; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    domain text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tracked_pages; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.tracked_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    company_slug text NOT NULL,
    url text NOT NULL,
    url_type text,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    company_id uuid,
    page_type text DEFAULT 'homepage'::text
);


--
-- Name: category_drift_analysis; Type: TABLE; Schema: diff_tracker; Owner: -
--

CREATE TABLE diff_tracker.category_drift_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    week_start_date date NOT NULL,
    category text DEFAULT 'RevOps / Sales Tech'::text NOT NULL,
    convergence_signals jsonb,
    divergence_signals jsonb,
    pressure_indicators jsonb,
    summary text,
    raw_llm_response jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: classified_changes; Type: TABLE; Schema: diff_tracker; Owner: -
--

CREATE TABLE diff_tracker.classified_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_diff_id uuid NOT NULL,
    primary_tag text,
    secondary_tags text[],
    rationale text,
    implication text,
    confidence numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: narrative_drifts; Type: TABLE; Schema: diff_tracker; Owner: -
--

CREATE TABLE diff_tracker.narrative_drifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    week_start_date date NOT NULL,
    drift_detected boolean DEFAULT false NOT NULL,
    drift_from text,
    drift_to text,
    drift_direction text,
    scope text DEFAULT 'single_company'::text NOT NULL,
    gtm_implication text,
    severity integer DEFAULT 1 NOT NULL,
    raw_llm_response jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: narrative_snapshots; Type: TABLE; Schema: diff_tracker; Owner: -
--

CREATE TABLE diff_tracker.narrative_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tracked_page_id uuid NOT NULL,
    company_id uuid NOT NULL,
    week_start_date date NOT NULL,
    extracted_copy text NOT NULL,
    copy_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_diffs; Type: TABLE; Schema: diff_tracker; Owner: -
--

CREATE TABLE diff_tracker.page_diffs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tracked_page_id uuid NOT NULL,
    week_start_date date NOT NULL,
    old_snapshot_id uuid,
    new_snapshot_id uuid,
    old_hash text,
    new_hash text,
    diff_summary text,
    change_magnitude text
);


--
-- Name: page_snapshots; Type: TABLE; Schema: diff_tracker; Owner: -
--

CREATE TABLE diff_tracker.page_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tracked_page_id uuid NOT NULL,
    week_start_date date NOT NULL,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    status text,
    http_status integer,
    text_content text,
    content_hash text
);


--
-- Name: distribution_changes; Type: TABLE; Schema: distribution_tracker; Owner: -
--

CREATE TABLE distribution_tracker.distribution_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    old_snapshot_id uuid,
    new_snapshot_id uuid,
    detected_at date NOT NULL,
    change_type text NOT NULL,
    change_details jsonb NOT NULL,
    significance text NOT NULL,
    interpretation text,
    strategic_signal text,
    confidence numeric,
    signal_emitted boolean DEFAULT false,
    signal_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: integration_snapshots; Type: TABLE; Schema: distribution_tracker; Owner: -
--

CREATE TABLE distribution_tracker.integration_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    tracked_page_id uuid,
    snapshot_date date NOT NULL,
    integration_count integer,
    integration_names text[],
    integration_categories jsonb,
    marketplace_presence text[],
    partner_mentions text[],
    has_public_api boolean,
    api_doc_url text,
    page_features_id uuid,
    content_hash text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pattern_instances; Type: TABLE; Schema: experiment_surveillance; Owner: -
--

CREATE TABLE experiment_surveillance.pattern_instances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pattern_id uuid NOT NULL,
    company_id uuid NOT NULL,
    page_type text NOT NULL,
    observed_at date NOT NULL,
    snapshot_id uuid,
    evidence_url text,
    extracted_fields jsonb,
    detection_method text,
    confidence numeric,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pattern_survival; Type: TABLE; Schema: experiment_surveillance; Owner: -
--

CREATE TABLE experiment_surveillance.pattern_survival (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pattern_id uuid NOT NULL,
    company_id uuid NOT NULL,
    week_start date NOT NULL,
    consecutive_weeks integer NOT NULL,
    still_present boolean NOT NULL,
    reverted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: patterns; Type: TABLE; Schema: experiment_surveillance; Owner: -
--

CREATE TABLE experiment_surveillance.patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pattern_key text NOT NULL,
    pattern_label text NOT NULL,
    pattern_category text NOT NULL,
    description text,
    first_seen date NOT NULL,
    last_seen date,
    status text DEFAULT 'candidate'::text,
    survivorship_score numeric DEFAULT 0,
    propagation_score numeric DEFAULT 0,
    combined_score numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: signal_emissions; Type: TABLE; Schema: experiment_surveillance; Owner: -
--

CREATE TABLE experiment_surveillance.signal_emissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pattern_id uuid NOT NULL,
    signal_id uuid,
    emission_type text NOT NULL,
    week_start date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: battlecard_versions; Type: TABLE; Schema: gtm_artifacts; Owner: -
--

CREATE TABLE gtm_artifacts.battlecard_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    competitor_name text NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    content_md text,
    included_signal_ids jsonb DEFAULT '[]'::jsonb,
    what_changed_summary text,
    created_at timestamp with time zone DEFAULT now(),
    content_json jsonb,
    packet_id uuid,
    user_id uuid,
    user_company_name text,
    is_personalized boolean DEFAULT false
);


--
-- Name: objection_library_versions; Type: TABLE; Schema: gtm_artifacts; Owner: -
--

CREATE TABLE gtm_artifacts.objection_library_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    content_md text,
    included_signal_ids jsonb DEFAULT '[]'::jsonb,
    included_knowledge_item_ids jsonb DEFAULT '[]'::jsonb,
    objection_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    content_json jsonb,
    packet_id uuid
);


--
-- Name: swipe_file_versions; Type: TABLE; Schema: gtm_artifacts; Owner: -
--

CREATE TABLE gtm_artifacts.swipe_file_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    content_md text,
    included_signal_ids jsonb DEFAULT '[]'::jsonb,
    included_knowledge_item_ids jsonb DEFAULT '[]'::jsonb,
    phrase_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    content_json jsonb,
    packet_id uuid
);


--
-- Name: knowledge_items; Type: TABLE; Schema: gtm_memory; Owner: -
--

CREATE TABLE gtm_memory.knowledge_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text NOT NULL,
    title text NOT NULL,
    body text,
    tags jsonb DEFAULT '[]'::jsonb,
    persona text,
    segment text,
    funnel_stage text,
    first_seen_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now(),
    evidence_urls jsonb DEFAULT '[]'::jsonb,
    evidence_count integer DEFAULT 1,
    confidence text DEFAULT 'medium'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT knowledge_items_confidence_check CHECK ((confidence = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT knowledge_items_funnel_stage_check CHECK ((funnel_stage = ANY (ARRAY['awareness'::text, 'consideration'::text, 'decision'::text, 'onboarding'::text, 'expansion'::text]))),
    CONSTRAINT knowledge_items_kind_check CHECK ((kind = ANY (ARRAY['objection'::text, 'buyer_phrase'::text, 'competitor_claim'::text, 'proof_point'::text, 'tactic'::text, 'risk_signal'::text])))
);


--
-- Name: knowledge_mentions; Type: TABLE; Schema: gtm_memory; Owner: -
--

CREATE TABLE gtm_memory.knowledge_mentions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    knowledge_item_id uuid NOT NULL,
    signal_id uuid,
    packet_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: events; Type: TABLE; Schema: horizon; Owner: -
--

CREATE TABLE horizon.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id uuid NOT NULL,
    item_id uuid NOT NULL,
    company_id uuid,
    category text NOT NULL,
    is_candidate boolean DEFAULT true NOT NULL,
    severity integer DEFAULT 1 NOT NULL,
    title text NOT NULL,
    summary text,
    evidence_urls jsonb DEFAULT '[]'::jsonb,
    promotion_rule text DEFAULT 'candidate'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT events_category_check CHECK ((category = ANY (ARRAY['platform_shift'::text, 'distribution_shift'::text, 'buyer_risk'::text, 'category_formation'::text]))),
    CONSTRAINT events_promotion_rule_check CHECK ((promotion_rule = ANY (ARRAY['primary'::text, 'candidate'::text]))),
    CONSTRAINT events_severity_check CHECK (((severity >= 1) AND (severity <= 5)))
);


--
-- Name: items; Type: TABLE; Schema: horizon; Owner: -
--

CREATE TABLE horizon.items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id uuid NOT NULL,
    company_id uuid,
    published_at timestamp with time zone,
    title text NOT NULL,
    url text,
    content_text text,
    raw jsonb DEFAULT '{}'::jsonb,
    item_hash text NOT NULL,
    discovered_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sources; Type: TABLE; Schema: horizon; Owner: -
--

CREATE TABLE horizon.sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    source_type text NOT NULL,
    channel text NOT NULL,
    feed_url text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    domain_focus text[] DEFAULT '{}'::text[],
    cadence text DEFAULT 'weekly'::text NOT NULL,
    trust_weight integer DEFAULT 5 NOT NULL,
    noise_level text DEFAULT 'medium'::text NOT NULL,
    keywords text[] DEFAULT '{}'::text[],
    last_checked_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sources_cadence_check CHECK ((cadence = ANY (ARRAY['daily'::text, '2x_weekly'::text, 'weekly'::text]))),
    CONSTRAINT sources_channel_check CHECK ((channel = ANY (ARRAY['rss'::text, 'url'::text, 'api'::text, 'email'::text, 'manual'::text]))),
    CONSTRAINT sources_noise_level_check CHECK ((noise_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT sources_source_type_check CHECK ((source_type = ANY (ARRAY['primary'::text, 'secondary'::text, 'social'::text]))),
    CONSTRAINT sources_trust_weight_check CHECK (((trust_weight >= 1) AND (trust_weight <= 10)))
);


--
-- Name: baseline_hypothesis; Type: TABLE; Schema: icp_drift; Owner: -
--

CREATE TABLE icp_drift.baseline_hypothesis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    expected_segment text,
    expected_buyer text,
    expected_buyer_type text,
    expected_verticality text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT baseline_hypothesis_expected_buyer_check CHECK ((expected_buyer = ANY (ARRAY['operator'::text, 'manager'::text, 'executive'::text]))),
    CONSTRAINT baseline_hypothesis_expected_buyer_type_check CHECK ((expected_buyer_type = ANY (ARRAY['technical'::text, 'economic'::text]))),
    CONSTRAINT baseline_hypothesis_expected_segment_check CHECK ((expected_segment = ANY (ARRAY['SMB'::text, 'Mid-market'::text, 'Enterprise'::text]))),
    CONSTRAINT baseline_hypothesis_expected_verticality_check CHECK ((expected_verticality = ANY (ARRAY['horizontal'::text, 'vertical'::text])))
);


--
-- Name: drift_events; Type: TABLE; Schema: icp_drift; Owner: -
--

CREATE TABLE icp_drift.drift_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    tracked_page_id uuid NOT NULL,
    page_type text NOT NULL,
    prev_snapshot_id uuid,
    snapshot_id uuid NOT NULL,
    changed boolean DEFAULT false NOT NULL,
    drift_directions text[] DEFAULT '{}'::text[],
    evidence_sources text[] DEFAULT '{}'::text[],
    confidence text,
    summary text,
    detected_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT drift_events_confidence_check CHECK ((confidence = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: indicators; Type: TABLE; Schema: icp_drift; Owner: -
--

CREATE TABLE icp_drift.indicators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    snapshot_id uuid NOT NULL,
    page_type text NOT NULL,
    buyer_titles jsonb DEFAULT '[]'::jsonb,
    org_size_language jsonb DEFAULT '[]'::jsonb,
    seniority_signals jsonb DEFAULT '[]'::jsonb,
    functional_emphasis jsonb DEFAULT '[]'::jsonb,
    integration_mix jsonb DEFAULT '[]'::jsonb,
    extracted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: snapshots; Type: TABLE; Schema: icp_drift; Owner: -
--

CREATE TABLE icp_drift.snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    tracked_page_id uuid NOT NULL,
    page_type text NOT NULL,
    snapshot_hash text NOT NULL,
    normalized_text text,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT snapshots_page_type_check CHECK ((page_type = ANY (ARRAY['careers'::text, 'case_studies'::text, 'pricing'::text, 'integrations'::text])))
);


--
-- Name: surface_config; Type: TABLE; Schema: icp_drift; Owner: -
--

CREATE TABLE icp_drift.surface_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    surface text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT surface_config_surface_check CHECK ((surface = ANY (ARRAY['careers'::text, 'case_studies'::text, 'pricing'::text, 'integrations'::text])))
);


--
-- Name: decay_signals; Type: TABLE; Schema: launch_tracker; Owner: -
--

CREATE TABLE launch_tracker.decay_signals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    launch_id uuid NOT NULL,
    detected_at date NOT NULL,
    signal_type text NOT NULL,
    decay_percentage numeric,
    weeks_since_launch integer,
    details jsonb,
    signal_emitted boolean DEFAULT false,
    signal_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: launches; Type: TABLE; Schema: launch_tracker; Owner: -
--

CREATE TABLE launch_tracker.launches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    horizon_signal_id uuid,
    launch_name text NOT NULL,
    launch_type text NOT NULL,
    launch_date date NOT NULL,
    initial_momentum_score numeric,
    current_momentum_score numeric,
    peak_momentum_score numeric,
    peak_momentum_date date,
    decay_rate numeric,
    status text DEFAULT 'tracking'::text,
    meta jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: momentum_snapshots; Type: TABLE; Schema: launch_tracker; Owner: -
--

CREATE TABLE launch_tracker.momentum_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    launch_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    momentum_score numeric NOT NULL,
    mentions_count integer,
    sentiment_score numeric,
    reach_estimate integer,
    source_breakdown jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: events; Type: TABLE; Schema: objection_tracker; Owner: -
--

CREATE TABLE objection_tracker.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id uuid NOT NULL,
    external_id text,
    raw_text text NOT NULL,
    objection_text text NOT NULL,
    context_text text,
    category text,
    severity integer,
    confidence numeric,
    persona text,
    segment text,
    funnel_stage text,
    source_url text,
    source_author text,
    source_date timestamp with time zone,
    meta jsonb DEFAULT '{}'::jsonb,
    processed boolean DEFAULT false,
    signal_emitted boolean DEFAULT false,
    signal_id uuid,
    detected_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT events_category_check CHECK ((category = ANY (ARRAY['price_value'::text, 'timing'::text, 'complexity'::text, 'risk'::text, 'fit'::text, 'competition'::text, 'inertia'::text, 'authority'::text, 'trust'::text]))),
    CONSTRAINT events_confidence_check CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric))),
    CONSTRAINT events_funnel_stage_check CHECK ((funnel_stage = ANY (ARRAY['awareness'::text, 'consideration'::text, 'decision'::text, 'onboarding'::text, 'expansion'::text]))),
    CONSTRAINT events_severity_check CHECK (((severity >= 1) AND (severity <= 5)))
);


--
-- Name: patterns; Type: TABLE; Schema: objection_tracker; Owner: -
--

CREATE TABLE objection_tracker.patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    objection_key text NOT NULL,
    canonical_text text NOT NULL,
    category text NOT NULL,
    total_count integer DEFAULT 1,
    count_last_7_days integer DEFAULT 0,
    count_last_30_days integer DEFAULT 0,
    count_last_90_days integer DEFAULT 0,
    trend text DEFAULT 'stable'::text,
    trend_score numeric DEFAULT 0,
    trend_updated_at timestamp with time zone DEFAULT now(),
    avg_severity numeric DEFAULT 3,
    max_severity integer DEFAULT 3,
    top_personas text[],
    top_segments text[],
    top_funnel_stages text[],
    evidence_urls text[] DEFAULT '{}'::text[],
    recent_event_ids uuid[] DEFAULT '{}'::uuid[],
    knowledge_item_id uuid,
    first_seen_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT patterns_category_check CHECK ((category = ANY (ARRAY['price_value'::text, 'timing'::text, 'complexity'::text, 'risk'::text, 'fit'::text, 'competition'::text, 'inertia'::text, 'authority'::text, 'trust'::text]))),
    CONSTRAINT patterns_trend_check CHECK ((trend = ANY (ARRAY['rising'::text, 'stable'::text, 'fading'::text])))
);


--
-- Name: sources; Type: TABLE; Schema: objection_tracker; Owner: -
--

CREATE TABLE objection_tracker.sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_name text NOT NULL,
    source_type text NOT NULL,
    url_pattern text,
    api_endpoint text,
    fetch_method text NOT NULL,
    fetch_config jsonb DEFAULT '{}'::jsonb,
    fetch_frequency_hours integer DEFAULT 24,
    last_fetched_at timestamp with time zone,
    source_quality text DEFAULT 'medium'::text,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sources_fetch_method_check CHECK ((fetch_method = ANY (ARRAY['rss'::text, 'api'::text, 'scrape'::text, 'webhook'::text, 'manual'::text, 'reddit_api'::text, 'apify'::text]))),
    CONSTRAINT sources_source_quality_check CHECK ((source_quality = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]))),
    CONSTRAINT sources_source_type_check CHECK ((source_type = ANY (ARRAY['review_site'::text, 'social_media'::text, 'forum'::text, 'support_channel'::text, 'sales_call'::text, 'email'::text, 'linkedin'::text, 'crm'::text, 'call_recording'::text, 'chat'::text, 'survey'::text, 'support_ticket'::text, 'manual'::text])))
);


--
-- Name: trend_snapshots; Type: TABLE; Schema: objection_tracker; Owner: -
--

CREATE TABLE objection_tracker.trend_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    snapshot_date date NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    total_events integer DEFAULT 0,
    new_objections_detected integer DEFAULT 0,
    category_counts jsonb DEFAULT '{}'::jsonb,
    top_patterns jsonb DEFAULT '[]'::jsonb,
    drift_score numeric DEFAULT 0,
    drift_signals jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: budget_alerts; Type: TABLE; Schema: ops; Owner: -
--

CREATE TABLE ops.budget_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alert_type text NOT NULL,
    scope text NOT NULL,
    scope_id text,
    current_usage numeric NOT NULL,
    limit_value numeric NOT NULL,
    percentage_used numeric NOT NULL,
    message text NOT NULL,
    acknowledged boolean DEFAULT false,
    acknowledged_by text,
    acknowledged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE budget_alerts; Type: COMMENT; Schema: ops; Owner: -
--

COMMENT ON TABLE ops.budget_alerts IS 'Budget threshold alerts for cost monitoring';


--
-- Name: budget_limits; Type: TABLE; Schema: ops; Owner: -
--

CREATE TABLE ops.budget_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scope text NOT NULL,
    scope_id text,
    limit_type text NOT NULL,
    limit_value integer NOT NULL,
    current_value integer DEFAULT 0,
    period_start date,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cost_events; Type: TABLE; Schema: ops; Owner: -
--

CREATE TABLE ops.cost_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    run_id uuid,
    run_type text NOT NULL,
    ship_name text,
    user_id uuid,
    pages_checked integer DEFAULT 0,
    pages_changed integer DEFAULT 0,
    headless_renders integer DEFAULT 0,
    anthropic_calls integer DEFAULT 0,
    tokens_in integer DEFAULT 0,
    tokens_out integer DEFAULT 0,
    duration_ms integer,
    errors_count integer DEFAULT 0,
    error_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflow_failures; Type: TABLE; Schema: ops; Owner: -
--

CREATE TABLE ops.workflow_failures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id text NOT NULL,
    workflow_name text NOT NULL,
    execution_id text NOT NULL,
    failed_node text,
    error_message text,
    error_stack text,
    input_data jsonb,
    execution_mode text,
    status text DEFAULT 'failed'::text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    resolved_at timestamp with time zone,
    resolved_by text,
    resolution_notes text,
    failed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE workflow_failures; Type: COMMENT; Schema: ops; Owner: -
--

COMMENT ON TABLE ops.workflow_failures IS 'Dead-letter queue for failed n8n workflow executions';


--
-- Name: failure_summary; Type: VIEW; Schema: ops; Owner: -
--

CREATE VIEW ops.failure_summary AS
 SELECT workflow_name,
    status,
    count(*) AS count,
    max(failed_at) AS last_failure
   FROM ops.workflow_failures
  WHERE (failed_at > (now() - '7 days'::interval))
  GROUP BY workflow_name, status
  ORDER BY (count(*)) DESC;


--
-- Name: ship_status; Type: VIEW; Schema: ops; Owner: -
--

CREATE VIEW ops.ship_status AS
 WITH latest_signals AS (
         SELECT signals.signal_type,
            max(signals.created_at) AS last_signal_at,
            count(*) AS signal_count_7d
           FROM control_plane.signals
          WHERE (signals.created_at > (now() - '7 days'::interval))
          GROUP BY signals.signal_type
        ), expected_ships AS (
         SELECT unnest(ARRAY['messaging'::text, 'narrative'::text, 'icp'::text, 'horizon'::text, 'objection'::text]) AS ship_name
        )
 SELECT es.ship_name,
    ls.last_signal_at,
    ls.signal_count_7d,
        CASE
            WHEN (ls.last_signal_at IS NULL) THEN 'missing'::text
            WHEN (ls.last_signal_at < (now() - '8 days'::interval)) THEN 'stale'::text
            WHEN (ls.last_signal_at > (now() - '2 days'::interval)) THEN 'healthy'::text
            ELSE 'ok'::text
        END AS status,
    (EXTRACT(epoch FROM (now() - ls.last_signal_at)) / (3600)::numeric) AS hours_since_last_signal
   FROM (expected_ships es
     LEFT JOIN latest_signals ls ON ((es.ship_name = ls.signal_type)))
  ORDER BY es.ship_name;


--
-- Name: VIEW ship_status; Type: COMMENT; Schema: ops; Owner: -
--

COMMENT ON VIEW ops.ship_status IS 'Real-time status of all signal-emitting ships';


--
-- Name: weekly_cost_summary; Type: VIEW; Schema: ops; Owner: -
--

CREATE VIEW ops.weekly_cost_summary AS
 SELECT date_trunc('week'::text, created_at) AS week_start,
    ship_name,
    count(*) AS runs,
    sum(pages_checked) AS total_pages,
    sum(headless_renders) AS total_headless,
    sum(anthropic_calls) AS total_llm_calls,
    sum((tokens_in + tokens_out)) AS total_tokens,
    sum(duration_ms) AS total_duration_ms,
    sum(errors_count) AS total_errors
   FROM ops.cost_events
  GROUP BY (date_trunc('week'::text, created_at)), ship_name
  ORDER BY (date_trunc('week'::text, created_at)) DESC, ship_name;


--
-- Name: pricing_changes; Type: TABLE; Schema: pricing_tracker; Owner: -
--

CREATE TABLE pricing_tracker.pricing_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    old_snapshot_id uuid,
    new_snapshot_id uuid,
    detected_at date NOT NULL,
    change_type text NOT NULL,
    change_details jsonb NOT NULL,
    significance text NOT NULL,
    interpretation text,
    strategic_signal text,
    confidence numeric,
    signal_emitted boolean DEFAULT false,
    signal_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pricing_snapshots; Type: TABLE; Schema: pricing_tracker; Owner: -
--

CREATE TABLE pricing_tracker.pricing_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    tracked_page_id uuid,
    snapshot_date date NOT NULL,
    plan_count integer,
    plan_names text[],
    has_free_tier boolean,
    has_enterprise boolean,
    trial_days integer,
    pricing_model text,
    gating_signals text[],
    limits jsonb,
    page_features_id uuid,
    content_hash text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: proof_changes; Type: TABLE; Schema: proof_tracker; Owner: -
--

CREATE TABLE proof_tracker.proof_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    page_type text NOT NULL,
    old_snapshot_id uuid,
    new_snapshot_id uuid,
    detected_at date NOT NULL,
    change_type text NOT NULL,
    change_details jsonb NOT NULL,
    significance text NOT NULL,
    interpretation text,
    buyer_signal text,
    confidence numeric,
    signal_emitted boolean DEFAULT false,
    signal_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: proof_snapshots; Type: TABLE; Schema: proof_tracker; Owner: -
--

CREATE TABLE proof_tracker.proof_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    tracked_page_id uuid,
    page_type text NOT NULL,
    snapshot_date date NOT NULL,
    logo_count integer,
    logo_companies text[],
    case_study_count integer,
    case_study_industries text[],
    testimonial_count integer,
    testimonial_titles text[],
    compliance_badges text[],
    security_claims text[],
    page_features_id uuid,
    content_hash text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: classified_changes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.classified_changes AS
 SELECT id,
    page_diff_id,
    primary_tag,
    secondary_tags,
    rationale,
    implication,
    confidence,
    created_at
   FROM diff_tracker.classified_changes;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    domain text,
    website_url text,
    description text,
    industry text,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: delivery_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    channel_type text NOT NULL,
    week_start_date date NOT NULL,
    status text NOT NULL,
    error_message text,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT delivery_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'skipped'::text])))
);


--
-- Name: delivery_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channel_type text NOT NULL,
    channel_config jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT delivery_preferences_channel_type_check CHECK ((channel_type = ANY (ARRAY['slack'::text, 'notion'::text, 'email'::text])))
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text,
    timezone text DEFAULT 'America/New_York'::text,
    packet_delivery_day text DEFAULT 'sunday'::text,
    packet_delivery_hour integer DEFAULT 18,
    week_start_day text DEFAULT 'sunday'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT organizations_packet_delivery_day_check CHECK ((packet_delivery_day = ANY (ARRAY['sunday'::text, 'monday'::text]))),
    CONSTRAINT organizations_packet_delivery_hour_check CHECK (((packet_delivery_hour >= 0) AND (packet_delivery_hour <= 23))),
    CONSTRAINT organizations_week_start_day_check CHECK ((week_start_day = ANY (ARRAY['sunday'::text, 'monday'::text])))
);


--
-- Name: COLUMN organizations.timezone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.organizations.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London, Asia/Tokyo)';


--
-- Name: COLUMN organizations.packet_delivery_day; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.organizations.packet_delivery_day IS 'Day of week when weekly packet should be ready';


--
-- Name: COLUMN organizations.packet_delivery_hour; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.organizations.packet_delivery_hour IS 'Hour (0-23) when packet should be ready in org timezone';


--
-- Name: COLUMN organizations.week_start_day; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.organizations.week_start_day IS 'What day starts the business week for this org';


--
-- Name: packets; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.packets AS
 SELECT id,
    week_start,
    week_end,
    packet_title,
    exec_summary,
    sections,
    key_questions,
    bets,
    created_at,
    predictions_json,
    resolved_predictions_json,
    artifacts_generated,
    predictions,
    action_mapping,
    market_winners,
    org_id,
    timezone,
    week_start_local,
    week_end_local,
    generated_for_timezone,
    is_cached,
    cache_expires_at,
    user_id,
    user_company_name,
    is_personalized
   FROM control_plane.packets;


--
-- Name: page_diffs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.page_diffs AS
 SELECT id,
    tracked_page_id,
    week_start_date,
    old_snapshot_id,
    new_snapshot_id,
    old_hash,
    new_hash,
    diff_summary,
    change_magnitude
   FROM diff_tracker.page_diffs;


--
-- Name: page_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_features (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    snapshot_id uuid NOT NULL,
    page_type text NOT NULL,
    cta_count integer,
    cta_labels text[],
    cta_destinations text[],
    nav_labels text[],
    h1_text text,
    plan_count integer,
    plan_names text[],
    has_free_tier boolean,
    has_enterprise boolean,
    trial_days integer,
    pricing_model text,
    gating_signals text[],
    limit_mentions jsonb,
    logo_count integer,
    logo_companies text[],
    case_study_count integer,
    case_study_industries text[],
    testimonial_count integer,
    testimonial_titles text[],
    compliance_badges text[],
    security_claims text[],
    integration_count integer,
    integration_names text[],
    integration_categories jsonb,
    marketplace_presence text[],
    extraction_version text DEFAULT 'v1'::text,
    extraction_confidence numeric,
    extracted_at timestamp with time zone DEFAULT now()
);


--
-- Name: page_snapshots; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.page_snapshots AS
 SELECT id,
    tracked_page_id,
    week_start_date,
    fetched_at,
    status,
    http_status,
    text_content,
    content_hash
   FROM diff_tracker.page_snapshots;


--
-- Name: public_changelog; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_changelog AS
 SELECT d.week_start_date,
    tp.company_name,
    tp.company_slug,
    tp.url,
    tp.url_type,
    cc.primary_tag,
    d.diff_summary,
    cc.implication,
    cc.confidence,
    d.change_magnitude
   FROM ((diff_tracker.page_diffs d
     JOIN core.tracked_pages tp ON ((tp.id = d.tracked_page_id)))
     JOIN diff_tracker.classified_changes cc ON ((cc.page_diff_id = d.id)))
  ORDER BY d.week_start_date DESC, tp.company_name;


--
-- Name: tracked_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracked_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    url text NOT NULL,
    page_type text DEFAULT 'homepage'::text,
    enabled boolean DEFAULT true,
    fetch_frequency text DEFAULT 'weekly'::text,
    last_fetched_at timestamp with time zone,
    last_changed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_tracked_competitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_tracked_competitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid,
    competitor_name text NOT NULL,
    competitor_domain text,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE user_tracked_competitors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_tracked_competitors IS 'Links users to competitors they want to track';


--
-- Name: pack_companies; Type: TABLE; Schema: sector_packs; Owner: -
--

CREATE TABLE sector_packs.pack_companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pack_id uuid NOT NULL,
    company_id uuid,
    company_name text NOT NULL,
    company_domain text NOT NULL,
    tier text DEFAULT 'leader'::text,
    weight numeric DEFAULT 1.0,
    tracked_urls jsonb NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pack_winners; Type: TABLE; Schema: sector_packs; Owner: -
--

CREATE TABLE sector_packs.pack_winners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pack_id uuid NOT NULL,
    week_start date NOT NULL,
    proven_winners jsonb NOT NULL,
    emerging_winners jsonb NOT NULL,
    total_patterns_tracked integer,
    new_patterns_this_week integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: packs; Type: TABLE; Schema: sector_packs; Owner: -
--

CREATE TABLE sector_packs.packs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pack_slug text NOT NULL,
    pack_name text NOT NULL,
    description text,
    sector text NOT NULL,
    motion text,
    default_pages text[] DEFAULT ARRAY['homepage'::text, 'pricing'::text, 'customers'::text, 'integrations'::text],
    crawl_frequency text DEFAULT 'weekly'::text,
    enabled boolean DEFAULT true,
    company_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: sector_packs; Owner: -
--

CREATE TABLE sector_packs.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pack_id uuid NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: abuse_flags abuse_flags_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.abuse_flags
    ADD CONSTRAINT abuse_flags_pkey PRIMARY KEY (id);


--
-- Name: api_registry api_registry_api_name_key; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.api_registry
    ADD CONSTRAINT api_registry_api_name_key UNIQUE (api_name);


--
-- Name: api_registry api_registry_api_slug_key; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.api_registry
    ADD CONSTRAINT api_registry_api_slug_key UNIQUE (api_slug);


--
-- Name: api_registry api_registry_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.api_registry
    ADD CONSTRAINT api_registry_pkey PRIMARY KEY (id);


--
-- Name: audience_segments audience_segments_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.audience_segments
    ADD CONSTRAINT audience_segments_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: email_campaigns email_campaigns_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_campaigns
    ADD CONSTRAINT email_campaigns_pkey PRIMARY KEY (id);


--
-- Name: email_send_log email_send_log_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_send_log
    ADD CONSTRAINT email_send_log_pkey PRIMARY KEY (id);


--
-- Name: email_unsubscribe_tokens email_unsubscribe_tokens_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_unsubscribe_tokens email_unsubscribe_tokens_token_key; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_token_key UNIQUE (token);


--
-- Name: feature_flags feature_flags_flag_key_key; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.feature_flags
    ADD CONSTRAINT feature_flags_flag_key_key UNIQUE (flag_key);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: newsletter_templates newsletter_templates_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.newsletter_templates
    ADD CONSTRAINT newsletter_templates_pkey PRIMARY KEY (id);


--
-- Name: system_health_checks system_health_checks_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.system_health_checks
    ADD CONSTRAINT system_health_checks_pkey PRIMARY KEY (id);


--
-- Name: usage_tracking usage_tracking_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.usage_tracking
    ADD CONSTRAINT usage_tracking_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: decision_verbs decision_verbs_pkey; Type: CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.decision_verbs
    ADD CONSTRAINT decision_verbs_pkey PRIMARY KEY (verb);


--
-- Name: packet_items packet_items_pkey; Type: CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.packet_items
    ADD CONSTRAINT packet_items_pkey PRIMARY KEY (id);


--
-- Name: packets packets_pkey; Type: CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.packets
    ADD CONSTRAINT packets_pkey PRIMARY KEY (id);


--
-- Name: signals signals_pkey; Type: CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.signals
    ADD CONSTRAINT signals_pkey PRIMARY KEY (id);


--
-- Name: supported_timezones supported_timezones_pkey; Type: CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.supported_timezones
    ADD CONSTRAINT supported_timezones_pkey PRIMARY KEY (timezone_id);


--
-- Name: weekly_packets weekly_packets_pkey; Type: CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.weekly_packets
    ADD CONSTRAINT weekly_packets_pkey PRIMARY KEY (id);


--
-- Name: weekly_packets weekly_packets_week_start_key; Type: CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.weekly_packets
    ADD CONSTRAINT weekly_packets_week_start_key UNIQUE (week_start);


--
-- Name: companies companies_name_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.companies
    ADD CONSTRAINT companies_name_key UNIQUE (name);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: tracked_pages tracked_pages_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.tracked_pages
    ADD CONSTRAINT tracked_pages_pkey PRIMARY KEY (id);


--
-- Name: category_drift_analysis category_drift_analysis_pkey; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.category_drift_analysis
    ADD CONSTRAINT category_drift_analysis_pkey PRIMARY KEY (id);


--
-- Name: category_drift_analysis category_drift_analysis_week_start_date_key; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.category_drift_analysis
    ADD CONSTRAINT category_drift_analysis_week_start_date_key UNIQUE (week_start_date);


--
-- Name: classified_changes classified_changes_page_diff_id_key; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.classified_changes
    ADD CONSTRAINT classified_changes_page_diff_id_key UNIQUE (page_diff_id);


--
-- Name: classified_changes classified_changes_pkey; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.classified_changes
    ADD CONSTRAINT classified_changes_pkey PRIMARY KEY (id);


--
-- Name: narrative_drifts narrative_drifts_company_id_week_start_date_key; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.narrative_drifts
    ADD CONSTRAINT narrative_drifts_company_id_week_start_date_key UNIQUE (company_id, week_start_date);


--
-- Name: narrative_drifts narrative_drifts_pkey; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.narrative_drifts
    ADD CONSTRAINT narrative_drifts_pkey PRIMARY KEY (id);


--
-- Name: narrative_snapshots narrative_snapshots_pkey; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.narrative_snapshots
    ADD CONSTRAINT narrative_snapshots_pkey PRIMARY KEY (id);


--
-- Name: narrative_snapshots narrative_snapshots_tracked_page_id_week_start_date_key; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.narrative_snapshots
    ADD CONSTRAINT narrative_snapshots_tracked_page_id_week_start_date_key UNIQUE (tracked_page_id, week_start_date);


--
-- Name: page_diffs page_diffs_pkey; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.page_diffs
    ADD CONSTRAINT page_diffs_pkey PRIMARY KEY (id);


--
-- Name: page_diffs page_diffs_tracked_page_id_week_start_date_key; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.page_diffs
    ADD CONSTRAINT page_diffs_tracked_page_id_week_start_date_key UNIQUE (tracked_page_id, week_start_date);


--
-- Name: page_snapshots page_snapshots_pkey; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.page_snapshots
    ADD CONSTRAINT page_snapshots_pkey PRIMARY KEY (id);


--
-- Name: page_snapshots page_snapshots_tracked_page_id_week_start_date_key; Type: CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.page_snapshots
    ADD CONSTRAINT page_snapshots_tracked_page_id_week_start_date_key UNIQUE (tracked_page_id, week_start_date);


--
-- Name: distribution_changes distribution_changes_pkey; Type: CONSTRAINT; Schema: distribution_tracker; Owner: -
--

ALTER TABLE ONLY distribution_tracker.distribution_changes
    ADD CONSTRAINT distribution_changes_pkey PRIMARY KEY (id);


--
-- Name: integration_snapshots integration_snapshots_company_id_snapshot_date_key; Type: CONSTRAINT; Schema: distribution_tracker; Owner: -
--

ALTER TABLE ONLY distribution_tracker.integration_snapshots
    ADD CONSTRAINT integration_snapshots_company_id_snapshot_date_key UNIQUE (company_id, snapshot_date);


--
-- Name: integration_snapshots integration_snapshots_pkey; Type: CONSTRAINT; Schema: distribution_tracker; Owner: -
--

ALTER TABLE ONLY distribution_tracker.integration_snapshots
    ADD CONSTRAINT integration_snapshots_pkey PRIMARY KEY (id);


--
-- Name: pattern_instances pattern_instances_pattern_id_company_id_page_type_observed__key; Type: CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.pattern_instances
    ADD CONSTRAINT pattern_instances_pattern_id_company_id_page_type_observed__key UNIQUE (pattern_id, company_id, page_type, observed_at);


--
-- Name: pattern_instances pattern_instances_pkey; Type: CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.pattern_instances
    ADD CONSTRAINT pattern_instances_pkey PRIMARY KEY (id);


--
-- Name: pattern_survival pattern_survival_pattern_id_company_id_week_start_key; Type: CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.pattern_survival
    ADD CONSTRAINT pattern_survival_pattern_id_company_id_week_start_key UNIQUE (pattern_id, company_id, week_start);


--
-- Name: pattern_survival pattern_survival_pkey; Type: CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.pattern_survival
    ADD CONSTRAINT pattern_survival_pkey PRIMARY KEY (id);


--
-- Name: patterns patterns_pattern_key_key; Type: CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.patterns
    ADD CONSTRAINT patterns_pattern_key_key UNIQUE (pattern_key);


--
-- Name: patterns patterns_pkey; Type: CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.patterns
    ADD CONSTRAINT patterns_pkey PRIMARY KEY (id);


--
-- Name: signal_emissions signal_emissions_pattern_id_emission_type_week_start_key; Type: CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.signal_emissions
    ADD CONSTRAINT signal_emissions_pattern_id_emission_type_week_start_key UNIQUE (pattern_id, emission_type, week_start);


--
-- Name: signal_emissions signal_emissions_pkey; Type: CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.signal_emissions
    ADD CONSTRAINT signal_emissions_pkey PRIMARY KEY (id);


--
-- Name: battlecard_versions battlecard_versions_pkey; Type: CONSTRAINT; Schema: gtm_artifacts; Owner: -
--

ALTER TABLE ONLY gtm_artifacts.battlecard_versions
    ADD CONSTRAINT battlecard_versions_pkey PRIMARY KEY (id);


--
-- Name: objection_library_versions objection_library_versions_pkey; Type: CONSTRAINT; Schema: gtm_artifacts; Owner: -
--

ALTER TABLE ONLY gtm_artifacts.objection_library_versions
    ADD CONSTRAINT objection_library_versions_pkey PRIMARY KEY (id);


--
-- Name: swipe_file_versions swipe_file_versions_pkey; Type: CONSTRAINT; Schema: gtm_artifacts; Owner: -
--

ALTER TABLE ONLY gtm_artifacts.swipe_file_versions
    ADD CONSTRAINT swipe_file_versions_pkey PRIMARY KEY (id);


--
-- Name: knowledge_items knowledge_items_pkey; Type: CONSTRAINT; Schema: gtm_memory; Owner: -
--

ALTER TABLE ONLY gtm_memory.knowledge_items
    ADD CONSTRAINT knowledge_items_pkey PRIMARY KEY (id);


--
-- Name: knowledge_mentions knowledge_mentions_pkey; Type: CONSTRAINT; Schema: gtm_memory; Owner: -
--

ALTER TABLE ONLY gtm_memory.knowledge_mentions
    ADD CONSTRAINT knowledge_mentions_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: items items_source_id_item_hash_key; Type: CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.items
    ADD CONSTRAINT items_source_id_item_hash_key UNIQUE (source_id, item_hash);


--
-- Name: sources sources_company_id_name_key; Type: CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.sources
    ADD CONSTRAINT sources_company_id_name_key UNIQUE (company_id, name);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (id);


--
-- Name: baseline_hypothesis baseline_hypothesis_pkey; Type: CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.baseline_hypothesis
    ADD CONSTRAINT baseline_hypothesis_pkey PRIMARY KEY (id);


--
-- Name: baseline_hypothesis baseline_hypothesis_user_id_company_id_key; Type: CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.baseline_hypothesis
    ADD CONSTRAINT baseline_hypothesis_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: drift_events drift_events_pkey; Type: CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.drift_events
    ADD CONSTRAINT drift_events_pkey PRIMARY KEY (id);


--
-- Name: indicators indicators_pkey; Type: CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.indicators
    ADD CONSTRAINT indicators_pkey PRIMARY KEY (id);


--
-- Name: snapshots snapshots_pkey; Type: CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.snapshots
    ADD CONSTRAINT snapshots_pkey PRIMARY KEY (id);


--
-- Name: snapshots snapshots_tracked_page_id_snapshot_hash_key; Type: CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.snapshots
    ADD CONSTRAINT snapshots_tracked_page_id_snapshot_hash_key UNIQUE (tracked_page_id, snapshot_hash);


--
-- Name: surface_config surface_config_pkey; Type: CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.surface_config
    ADD CONSTRAINT surface_config_pkey PRIMARY KEY (id);


--
-- Name: surface_config surface_config_user_id_company_id_surface_key; Type: CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.surface_config
    ADD CONSTRAINT surface_config_user_id_company_id_surface_key UNIQUE (user_id, company_id, surface);


--
-- Name: decay_signals decay_signals_pkey; Type: CONSTRAINT; Schema: launch_tracker; Owner: -
--

ALTER TABLE ONLY launch_tracker.decay_signals
    ADD CONSTRAINT decay_signals_pkey PRIMARY KEY (id);


--
-- Name: launches launches_pkey; Type: CONSTRAINT; Schema: launch_tracker; Owner: -
--

ALTER TABLE ONLY launch_tracker.launches
    ADD CONSTRAINT launches_pkey PRIMARY KEY (id);


--
-- Name: momentum_snapshots momentum_snapshots_launch_id_snapshot_date_key; Type: CONSTRAINT; Schema: launch_tracker; Owner: -
--

ALTER TABLE ONLY launch_tracker.momentum_snapshots
    ADD CONSTRAINT momentum_snapshots_launch_id_snapshot_date_key UNIQUE (launch_id, snapshot_date);


--
-- Name: momentum_snapshots momentum_snapshots_pkey; Type: CONSTRAINT; Schema: launch_tracker; Owner: -
--

ALTER TABLE ONLY launch_tracker.momentum_snapshots
    ADD CONSTRAINT momentum_snapshots_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: objection_tracker; Owner: -
--

ALTER TABLE ONLY objection_tracker.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: patterns patterns_pkey; Type: CONSTRAINT; Schema: objection_tracker; Owner: -
--

ALTER TABLE ONLY objection_tracker.patterns
    ADD CONSTRAINT patterns_pkey PRIMARY KEY (id);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: objection_tracker; Owner: -
--

ALTER TABLE ONLY objection_tracker.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (id);


--
-- Name: trend_snapshots trend_snapshots_pkey; Type: CONSTRAINT; Schema: objection_tracker; Owner: -
--

ALTER TABLE ONLY objection_tracker.trend_snapshots
    ADD CONSTRAINT trend_snapshots_pkey PRIMARY KEY (id);


--
-- Name: budget_alerts budget_alerts_pkey; Type: CONSTRAINT; Schema: ops; Owner: -
--

ALTER TABLE ONLY ops.budget_alerts
    ADD CONSTRAINT budget_alerts_pkey PRIMARY KEY (id);


--
-- Name: budget_limits budget_limits_pkey; Type: CONSTRAINT; Schema: ops; Owner: -
--

ALTER TABLE ONLY ops.budget_limits
    ADD CONSTRAINT budget_limits_pkey PRIMARY KEY (id);


--
-- Name: budget_limits budget_limits_scope_scope_id_limit_type_period_start_key; Type: CONSTRAINT; Schema: ops; Owner: -
--

ALTER TABLE ONLY ops.budget_limits
    ADD CONSTRAINT budget_limits_scope_scope_id_limit_type_period_start_key UNIQUE (scope, scope_id, limit_type, period_start);


--
-- Name: cost_events cost_events_pkey; Type: CONSTRAINT; Schema: ops; Owner: -
--

ALTER TABLE ONLY ops.cost_events
    ADD CONSTRAINT cost_events_pkey PRIMARY KEY (id);


--
-- Name: workflow_failures workflow_failures_pkey; Type: CONSTRAINT; Schema: ops; Owner: -
--

ALTER TABLE ONLY ops.workflow_failures
    ADD CONSTRAINT workflow_failures_pkey PRIMARY KEY (id);


--
-- Name: pricing_changes pricing_changes_pkey; Type: CONSTRAINT; Schema: pricing_tracker; Owner: -
--

ALTER TABLE ONLY pricing_tracker.pricing_changes
    ADD CONSTRAINT pricing_changes_pkey PRIMARY KEY (id);


--
-- Name: pricing_snapshots pricing_snapshots_company_id_snapshot_date_key; Type: CONSTRAINT; Schema: pricing_tracker; Owner: -
--

ALTER TABLE ONLY pricing_tracker.pricing_snapshots
    ADD CONSTRAINT pricing_snapshots_company_id_snapshot_date_key UNIQUE (company_id, snapshot_date);


--
-- Name: pricing_snapshots pricing_snapshots_pkey; Type: CONSTRAINT; Schema: pricing_tracker; Owner: -
--

ALTER TABLE ONLY pricing_tracker.pricing_snapshots
    ADD CONSTRAINT pricing_snapshots_pkey PRIMARY KEY (id);


--
-- Name: proof_changes proof_changes_pkey; Type: CONSTRAINT; Schema: proof_tracker; Owner: -
--

ALTER TABLE ONLY proof_tracker.proof_changes
    ADD CONSTRAINT proof_changes_pkey PRIMARY KEY (id);


--
-- Name: proof_snapshots proof_snapshots_company_id_page_type_snapshot_date_key; Type: CONSTRAINT; Schema: proof_tracker; Owner: -
--

ALTER TABLE ONLY proof_tracker.proof_snapshots
    ADD CONSTRAINT proof_snapshots_company_id_page_type_snapshot_date_key UNIQUE (company_id, page_type, snapshot_date);


--
-- Name: proof_snapshots proof_snapshots_pkey; Type: CONSTRAINT; Schema: proof_tracker; Owner: -
--

ALTER TABLE ONLY proof_tracker.proof_snapshots
    ADD CONSTRAINT proof_snapshots_pkey PRIMARY KEY (id);


--
-- Name: companies companies_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_domain_key UNIQUE (domain);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: delivery_logs delivery_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_logs
    ADD CONSTRAINT delivery_logs_pkey PRIMARY KEY (id);


--
-- Name: delivery_preferences delivery_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_preferences
    ADD CONSTRAINT delivery_preferences_pkey PRIMARY KEY (id);


--
-- Name: delivery_preferences delivery_preferences_user_id_channel_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_preferences
    ADD CONSTRAINT delivery_preferences_user_id_channel_type_key UNIQUE (user_id, channel_type);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: page_features page_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_features
    ADD CONSTRAINT page_features_pkey PRIMARY KEY (id);


--
-- Name: page_features page_features_snapshot_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_features
    ADD CONSTRAINT page_features_snapshot_id_key UNIQUE (snapshot_id);


--
-- Name: tracked_pages tracked_pages_company_id_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracked_pages
    ADD CONSTRAINT tracked_pages_company_id_url_key UNIQUE (company_id, url);


--
-- Name: tracked_pages tracked_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracked_pages
    ADD CONSTRAINT tracked_pages_pkey PRIMARY KEY (id);


--
-- Name: user_company_profiles user_company_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_company_profiles
    ADD CONSTRAINT user_company_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_company_profiles user_company_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_company_profiles
    ADD CONSTRAINT user_company_profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_tracked_competitors user_tracked_competitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tracked_competitors
    ADD CONSTRAINT user_tracked_competitors_pkey PRIMARY KEY (id);


--
-- Name: user_tracked_competitors user_tracked_competitors_user_id_competitor_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tracked_competitors
    ADD CONSTRAINT user_tracked_competitors_user_id_competitor_domain_key UNIQUE (user_id, competitor_domain);


--
-- Name: pack_companies pack_companies_pack_id_company_domain_key; Type: CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.pack_companies
    ADD CONSTRAINT pack_companies_pack_id_company_domain_key UNIQUE (pack_id, company_domain);


--
-- Name: pack_companies pack_companies_pkey; Type: CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.pack_companies
    ADD CONSTRAINT pack_companies_pkey PRIMARY KEY (id);


--
-- Name: pack_winners pack_winners_pack_id_week_start_key; Type: CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.pack_winners
    ADD CONSTRAINT pack_winners_pack_id_week_start_key UNIQUE (pack_id, week_start);


--
-- Name: pack_winners pack_winners_pkey; Type: CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.pack_winners
    ADD CONSTRAINT pack_winners_pkey PRIMARY KEY (id);


--
-- Name: packs packs_pack_slug_key; Type: CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.packs
    ADD CONSTRAINT packs_pack_slug_key UNIQUE (pack_slug);


--
-- Name: packs packs_pkey; Type: CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.packs
    ADD CONSTRAINT packs_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_user_id_pack_id_key; Type: CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_pack_id_key UNIQUE (user_id, pack_id);


--
-- Name: idx_abuse_unresolved; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_abuse_unresolved ON admin.abuse_flags USING btree (resolved, created_at DESC);


--
-- Name: idx_abuse_user; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_abuse_user ON admin.abuse_flags USING btree (user_id, created_at DESC);


--
-- Name: idx_email_campaigns_status; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_email_campaigns_status ON admin.email_campaigns USING btree (status, scheduled_at);


--
-- Name: idx_email_send_log_campaign; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_email_send_log_campaign ON admin.email_send_log USING btree (campaign_id, status);


--
-- Name: idx_email_send_log_recipient; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_email_send_log_recipient ON admin.email_send_log USING btree (recipient_id, created_at DESC);


--
-- Name: idx_email_send_log_resend_id; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_email_send_log_resend_id ON admin.email_send_log USING btree (resend_message_id) WHERE (resend_message_id IS NOT NULL);


--
-- Name: idx_health_checks_api_latest; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_health_checks_api_latest ON admin.system_health_checks USING btree (api_registry_id, checked_at DESC);


--
-- Name: idx_health_checks_checked_at; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_health_checks_checked_at ON admin.system_health_checks USING btree (checked_at DESC);


--
-- Name: idx_newsletter_templates_category; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_newsletter_templates_category ON admin.newsletter_templates USING btree (category, is_archived);


--
-- Name: idx_unsubscribe_token_user; Type: INDEX; Schema: admin; Owner: -
--

CREATE UNIQUE INDEX idx_unsubscribe_token_user ON admin.email_unsubscribe_tokens USING btree (user_id);


--
-- Name: idx_usage_created; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_usage_created ON admin.usage_tracking USING btree (created_at DESC);


--
-- Name: idx_usage_user_action; Type: INDEX; Schema: admin; Owner: -
--

CREATE INDEX idx_usage_user_action ON admin.usage_tracking USING btree (user_id, action_type, created_at DESC);


--
-- Name: idx_control_plane_packet_items_packet; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_control_plane_packet_items_packet ON control_plane.packet_items USING btree (packet_id);


--
-- Name: idx_control_plane_signals_created; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_control_plane_signals_created ON control_plane.signals USING btree (created_at DESC);


--
-- Name: idx_control_plane_signals_type; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_control_plane_signals_type ON control_plane.signals USING btree (signal_type);


--
-- Name: idx_packet_items_packet; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_packet_items_packet ON control_plane.packet_items USING btree (packet_id);


--
-- Name: idx_packets_generic; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_packets_generic ON control_plane.packets USING btree (created_at DESC) WHERE (user_id IS NULL);


--
-- Name: idx_packets_has_predictions; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_packets_has_predictions ON control_plane.packets USING btree ((((predictions_json IS NOT NULL) AND (predictions_json <> '[]'::jsonb))));


--
-- Name: idx_packets_org_week; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_packets_org_week ON control_plane.packets USING btree (org_id, week_start, week_end);


--
-- Name: idx_packets_timezone_week; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_packets_timezone_week ON control_plane.packets USING btree (generated_for_timezone, week_start, week_end);


--
-- Name: idx_packets_user; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_packets_user ON control_plane.packets USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_packets_user_created; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_packets_user_created ON control_plane.packets USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL);


--
-- Name: idx_packets_user_week_unique; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE UNIQUE INDEX idx_packets_user_week_unique ON control_plane.packets USING btree (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), week_start, week_end);


--
-- Name: INDEX idx_packets_user_week_unique; Type: COMMENT; Schema: control_plane; Owner: -
--

COMMENT ON INDEX control_plane.idx_packets_user_week_unique IS 'Ensures one packet per user per week. NULL user_id (coalesced to zero UUID) = generic packet.';


--
-- Name: idx_signals_decision_type; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_signals_decision_type ON control_plane.signals USING btree (decision_type) WHERE (decision_type IS NOT NULL);


--
-- Name: idx_signals_owner_team; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_signals_owner_team ON control_plane.signals USING btree (owner_team) WHERE (owner_team IS NOT NULL);


--
-- Name: idx_signals_promo_score; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_signals_promo_score ON control_plane.signals USING btree (promo_score DESC NULLS LAST) WHERE (promo_score IS NOT NULL);


--
-- Name: idx_signals_time_sensitivity; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_signals_time_sensitivity ON control_plane.signals USING btree (time_sensitivity) WHERE (time_sensitivity IS NOT NULL);


--
-- Name: idx_signals_unprocessed; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE INDEX idx_signals_unprocessed ON control_plane.signals USING btree (signal_type, is_processed) WHERE (is_processed = false);


--
-- Name: uq_control_plane_packets_week; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE UNIQUE INDEX uq_control_plane_packets_week ON control_plane.packets USING btree (week_start, week_end);


--
-- Name: uq_control_plane_signals_source; Type: INDEX; Schema: control_plane; Owner: -
--

CREATE UNIQUE INDEX uq_control_plane_signals_source ON control_plane.signals USING btree (signal_type, source_schema, source_table, source_id);


--
-- Name: idx_tracked_pages_page_type; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_tracked_pages_page_type ON core.tracked_pages USING btree (page_type) WHERE (enabled = true);


--
-- Name: idx_tracked_pages_user_id; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_tracked_pages_user_id ON core.tracked_pages USING btree (user_id);


--
-- Name: idx_narrative_drifts_week; Type: INDEX; Schema: diff_tracker; Owner: -
--

CREATE INDEX idx_narrative_drifts_week ON diff_tracker.narrative_drifts USING btree (week_start_date DESC);


--
-- Name: idx_narrative_snapshots_company_week; Type: INDEX; Schema: diff_tracker; Owner: -
--

CREATE INDEX idx_narrative_snapshots_company_week ON diff_tracker.narrative_snapshots USING btree (company_id, week_start_date DESC);


--
-- Name: idx_page_diffs_tracked_page; Type: INDEX; Schema: diff_tracker; Owner: -
--

CREATE INDEX idx_page_diffs_tracked_page ON diff_tracker.page_diffs USING btree (tracked_page_id);


--
-- Name: idx_page_diffs_week; Type: INDEX; Schema: diff_tracker; Owner: -
--

CREATE INDEX idx_page_diffs_week ON diff_tracker.page_diffs USING btree (week_start_date);


--
-- Name: idx_page_snapshots_tracked_page; Type: INDEX; Schema: diff_tracker; Owner: -
--

CREATE INDEX idx_page_snapshots_tracked_page ON diff_tracker.page_snapshots USING btree (tracked_page_id);


--
-- Name: idx_page_snapshots_week; Type: INDEX; Schema: diff_tracker; Owner: -
--

CREATE INDEX idx_page_snapshots_week ON diff_tracker.page_snapshots USING btree (week_start_date);


--
-- Name: idx_distribution_changes_company; Type: INDEX; Schema: distribution_tracker; Owner: -
--

CREATE INDEX idx_distribution_changes_company ON distribution_tracker.distribution_changes USING btree (company_id, detected_at DESC);


--
-- Name: idx_integration_snapshots_company; Type: INDEX; Schema: distribution_tracker; Owner: -
--

CREATE INDEX idx_integration_snapshots_company ON distribution_tracker.integration_snapshots USING btree (company_id, snapshot_date DESC);


--
-- Name: idx_pattern_instances_company; Type: INDEX; Schema: experiment_surveillance; Owner: -
--

CREATE INDEX idx_pattern_instances_company ON experiment_surveillance.pattern_instances USING btree (company_id);


--
-- Name: idx_pattern_instances_observed; Type: INDEX; Schema: experiment_surveillance; Owner: -
--

CREATE INDEX idx_pattern_instances_observed ON experiment_surveillance.pattern_instances USING btree (observed_at DESC);


--
-- Name: idx_pattern_instances_pattern; Type: INDEX; Schema: experiment_surveillance; Owner: -
--

CREATE INDEX idx_pattern_instances_pattern ON experiment_surveillance.pattern_instances USING btree (pattern_id);


--
-- Name: idx_pattern_survival_pattern; Type: INDEX; Schema: experiment_surveillance; Owner: -
--

CREATE INDEX idx_pattern_survival_pattern ON experiment_surveillance.pattern_survival USING btree (pattern_id);


--
-- Name: idx_pattern_survival_week; Type: INDEX; Schema: experiment_surveillance; Owner: -
--

CREATE INDEX idx_pattern_survival_week ON experiment_surveillance.pattern_survival USING btree (week_start DESC);


--
-- Name: idx_patterns_category; Type: INDEX; Schema: experiment_surveillance; Owner: -
--

CREATE INDEX idx_patterns_category ON experiment_surveillance.patterns USING btree (pattern_category);


--
-- Name: idx_patterns_combined_score; Type: INDEX; Schema: experiment_surveillance; Owner: -
--

CREATE INDEX idx_patterns_combined_score ON experiment_surveillance.patterns USING btree (combined_score DESC);


--
-- Name: idx_patterns_status; Type: INDEX; Schema: experiment_surveillance; Owner: -
--

CREATE INDEX idx_patterns_status ON experiment_surveillance.patterns USING btree (status);


--
-- Name: idx_battlecard_competitor; Type: INDEX; Schema: gtm_artifacts; Owner: -
--

CREATE INDEX idx_battlecard_competitor ON gtm_artifacts.battlecard_versions USING btree (competitor_name);


--
-- Name: idx_battlecard_created; Type: INDEX; Schema: gtm_artifacts; Owner: -
--

CREATE INDEX idx_battlecard_created ON gtm_artifacts.battlecard_versions USING btree (created_at DESC);


--
-- Name: idx_battlecard_user; Type: INDEX; Schema: gtm_artifacts; Owner: -
--

CREATE INDEX idx_battlecard_user ON gtm_artifacts.battlecard_versions USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_battlecard_user_competitor_week; Type: INDEX; Schema: gtm_artifacts; Owner: -
--

CREATE UNIQUE INDEX idx_battlecard_user_competitor_week ON gtm_artifacts.battlecard_versions USING btree (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), competitor_name, week_start, week_end);


--
-- Name: INDEX idx_battlecard_user_competitor_week; Type: COMMENT; Schema: gtm_artifacts; Owner: -
--

COMMENT ON INDEX gtm_artifacts.idx_battlecard_user_competitor_week IS 'Ensures one battlecard per user per competitor per week.';


--
-- Name: idx_objection_library_created; Type: INDEX; Schema: gtm_artifacts; Owner: -
--

CREATE INDEX idx_objection_library_created ON gtm_artifacts.objection_library_versions USING btree (created_at DESC);


--
-- Name: idx_objection_library_week; Type: INDEX; Schema: gtm_artifacts; Owner: -
--

CREATE UNIQUE INDEX idx_objection_library_week ON gtm_artifacts.objection_library_versions USING btree (week_start, week_end);


--
-- Name: idx_swipe_file_created; Type: INDEX; Schema: gtm_artifacts; Owner: -
--

CREATE INDEX idx_swipe_file_created ON gtm_artifacts.swipe_file_versions USING btree (created_at DESC);


--
-- Name: idx_swipe_file_week; Type: INDEX; Schema: gtm_artifacts; Owner: -
--

CREATE UNIQUE INDEX idx_swipe_file_week ON gtm_artifacts.swipe_file_versions USING btree (week_start, week_end);


--
-- Name: idx_knowledge_items_body_hash; Type: INDEX; Schema: gtm_memory; Owner: -
--

CREATE INDEX idx_knowledge_items_body_hash ON gtm_memory.knowledge_items USING btree (kind, md5(body)) WHERE (body IS NOT NULL);


--
-- Name: idx_knowledge_items_funnel_stage; Type: INDEX; Schema: gtm_memory; Owner: -
--

CREATE INDEX idx_knowledge_items_funnel_stage ON gtm_memory.knowledge_items USING btree (funnel_stage) WHERE (funnel_stage IS NOT NULL);


--
-- Name: idx_knowledge_items_kind; Type: INDEX; Schema: gtm_memory; Owner: -
--

CREATE INDEX idx_knowledge_items_kind ON gtm_memory.knowledge_items USING btree (kind);


--
-- Name: idx_knowledge_items_kind_title; Type: INDEX; Schema: gtm_memory; Owner: -
--

CREATE UNIQUE INDEX idx_knowledge_items_kind_title ON gtm_memory.knowledge_items USING btree (kind, title);


--
-- Name: idx_knowledge_items_last_seen; Type: INDEX; Schema: gtm_memory; Owner: -
--

CREATE INDEX idx_knowledge_items_last_seen ON gtm_memory.knowledge_items USING btree (last_seen_at DESC);


--
-- Name: idx_knowledge_items_persona; Type: INDEX; Schema: gtm_memory; Owner: -
--

CREATE INDEX idx_knowledge_items_persona ON gtm_memory.knowledge_items USING btree (persona) WHERE (persona IS NOT NULL);


--
-- Name: idx_knowledge_mentions_item; Type: INDEX; Schema: gtm_memory; Owner: -
--

CREATE INDEX idx_knowledge_mentions_item ON gtm_memory.knowledge_mentions USING btree (knowledge_item_id);


--
-- Name: idx_knowledge_mentions_packet; Type: INDEX; Schema: gtm_memory; Owner: -
--

CREATE INDEX idx_knowledge_mentions_packet ON gtm_memory.knowledge_mentions USING btree (packet_id) WHERE (packet_id IS NOT NULL);


--
-- Name: idx_knowledge_mentions_signal; Type: INDEX; Schema: gtm_memory; Owner: -
--

CREATE INDEX idx_knowledge_mentions_signal ON gtm_memory.knowledge_mentions USING btree (signal_id) WHERE (signal_id IS NOT NULL);


--
-- Name: idx_horizon_events_company; Type: INDEX; Schema: horizon; Owner: -
--

CREATE INDEX idx_horizon_events_company ON horizon.events USING btree (company_id);


--
-- Name: idx_horizon_events_created; Type: INDEX; Schema: horizon; Owner: -
--

CREATE INDEX idx_horizon_events_created ON horizon.events USING btree (created_at DESC);


--
-- Name: idx_horizon_events_promoted; Type: INDEX; Schema: horizon; Owner: -
--

CREATE INDEX idx_horizon_events_promoted ON horizon.events USING btree (is_candidate, severity);


--
-- Name: idx_horizon_events_severity; Type: INDEX; Schema: horizon; Owner: -
--

CREATE INDEX idx_horizon_events_severity ON horizon.events USING btree (severity DESC);


--
-- Name: idx_horizon_items_discovered; Type: INDEX; Schema: horizon; Owner: -
--

CREATE INDEX idx_horizon_items_discovered ON horizon.items USING btree (discovered_at DESC);


--
-- Name: idx_horizon_items_hash; Type: INDEX; Schema: horizon; Owner: -
--

CREATE INDEX idx_horizon_items_hash ON horizon.items USING btree (item_hash);


--
-- Name: idx_horizon_items_source; Type: INDEX; Schema: horizon; Owner: -
--

CREATE INDEX idx_horizon_items_source ON horizon.items USING btree (source_id);


--
-- Name: idx_horizon_sources_company; Type: INDEX; Schema: horizon; Owner: -
--

CREATE INDEX idx_horizon_sources_company ON horizon.sources USING btree (company_id);


--
-- Name: idx_horizon_sources_enabled; Type: INDEX; Schema: horizon; Owner: -
--

CREATE INDEX idx_horizon_sources_enabled ON horizon.sources USING btree (enabled) WHERE (enabled = true);


--
-- Name: idx_drift_events_company; Type: INDEX; Schema: icp_drift; Owner: -
--

CREATE INDEX idx_drift_events_company ON icp_drift.drift_events USING btree (company_id, detected_at DESC);


--
-- Name: idx_snapshots_tracked_page; Type: INDEX; Schema: icp_drift; Owner: -
--

CREATE INDEX idx_snapshots_tracked_page ON icp_drift.snapshots USING btree (tracked_page_id, fetched_at DESC);


--
-- Name: idx_launches_company; Type: INDEX; Schema: launch_tracker; Owner: -
--

CREATE INDEX idx_launches_company ON launch_tracker.launches USING btree (company_id, launch_date DESC);


--
-- Name: idx_launches_status; Type: INDEX; Schema: launch_tracker; Owner: -
--

CREATE INDEX idx_launches_status ON launch_tracker.launches USING btree (status) WHERE (status = 'tracking'::text);


--
-- Name: events_source_external_unique; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE UNIQUE INDEX events_source_external_unique ON objection_tracker.events USING btree (source_id, external_id);


--
-- Name: idx_objection_events_category; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE INDEX idx_objection_events_category ON objection_tracker.events USING btree (category) WHERE (category IS NOT NULL);


--
-- Name: idx_objection_events_detected; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE INDEX idx_objection_events_detected ON objection_tracker.events USING btree (detected_at DESC);


--
-- Name: idx_objection_events_source; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE INDEX idx_objection_events_source ON objection_tracker.events USING btree (source_id);


--
-- Name: idx_objection_events_source_external; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE UNIQUE INDEX idx_objection_events_source_external ON objection_tracker.events USING btree (source_id, external_id) WHERE (external_id IS NOT NULL);


--
-- Name: idx_objection_events_unprocessed; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE INDEX idx_objection_events_unprocessed ON objection_tracker.events USING btree (processed) WHERE (processed = false);


--
-- Name: idx_objection_patterns_category; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE INDEX idx_objection_patterns_category ON objection_tracker.patterns USING btree (category);


--
-- Name: idx_objection_patterns_count; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE INDEX idx_objection_patterns_count ON objection_tracker.patterns USING btree (total_count DESC);


--
-- Name: idx_objection_patterns_key; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE UNIQUE INDEX idx_objection_patterns_key ON objection_tracker.patterns USING btree (objection_key);


--
-- Name: idx_objection_patterns_last_seen; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE INDEX idx_objection_patterns_last_seen ON objection_tracker.patterns USING btree (last_seen_at DESC);


--
-- Name: idx_objection_patterns_trend; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE INDEX idx_objection_patterns_trend ON objection_tracker.patterns USING btree (trend);


--
-- Name: idx_objection_sources_name; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE UNIQUE INDEX idx_objection_sources_name ON objection_tracker.sources USING btree (source_name);


--
-- Name: idx_trend_snapshots_date; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE INDEX idx_trend_snapshots_date ON objection_tracker.trend_snapshots USING btree (snapshot_date DESC);


--
-- Name: idx_trend_snapshots_week; Type: INDEX; Schema: objection_tracker; Owner: -
--

CREATE UNIQUE INDEX idx_trend_snapshots_week ON objection_tracker.trend_snapshots USING btree (week_start, week_end);


--
-- Name: idx_budget_alerts_type; Type: INDEX; Schema: ops; Owner: -
--

CREATE INDEX idx_budget_alerts_type ON ops.budget_alerts USING btree (alert_type, created_at DESC);


--
-- Name: idx_cost_events_run_type; Type: INDEX; Schema: ops; Owner: -
--

CREATE INDEX idx_cost_events_run_type ON ops.cost_events USING btree (run_type, created_at DESC);


--
-- Name: idx_cost_events_ship; Type: INDEX; Schema: ops; Owner: -
--

CREATE INDEX idx_cost_events_ship ON ops.cost_events USING btree (ship_name, created_at DESC);


--
-- Name: idx_cost_events_user; Type: INDEX; Schema: ops; Owner: -
--

CREATE INDEX idx_cost_events_user ON ops.cost_events USING btree (user_id, created_at DESC);


--
-- Name: idx_workflow_failures_status; Type: INDEX; Schema: ops; Owner: -
--

CREATE INDEX idx_workflow_failures_status ON ops.workflow_failures USING btree (status, failed_at DESC);


--
-- Name: idx_workflow_failures_workflow; Type: INDEX; Schema: ops; Owner: -
--

CREATE INDEX idx_workflow_failures_workflow ON ops.workflow_failures USING btree (workflow_name, failed_at DESC);


--
-- Name: idx_pricing_changes_company; Type: INDEX; Schema: pricing_tracker; Owner: -
--

CREATE INDEX idx_pricing_changes_company ON pricing_tracker.pricing_changes USING btree (company_id, detected_at DESC);


--
-- Name: idx_pricing_snapshots_company; Type: INDEX; Schema: pricing_tracker; Owner: -
--

CREATE INDEX idx_pricing_snapshots_company ON pricing_tracker.pricing_snapshots USING btree (company_id, snapshot_date DESC);


--
-- Name: idx_page_features_page_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_features_page_type ON public.page_features USING btree (page_type);


--
-- Name: idx_page_features_snapshot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_features_snapshot ON public.page_features USING btree (snapshot_id);


--
-- Name: idx_public_companies_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_public_companies_domain ON public.companies USING btree (domain);


--
-- Name: idx_public_companies_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_public_companies_enabled ON public.companies USING btree (enabled) WHERE (enabled = true);


--
-- Name: idx_public_tracked_pages_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_public_tracked_pages_company ON public.tracked_pages USING btree (company_id);


--
-- Name: idx_public_tracked_pages_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_public_tracked_pages_type ON public.tracked_pages USING btree (page_type) WHERE (enabled = true);


--
-- Name: idx_user_company_profiles_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_company_profiles_domain ON public.user_company_profiles USING btree (company_domain) WHERE (company_domain IS NOT NULL);


--
-- Name: idx_user_company_profiles_onboarding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_company_profiles_onboarding ON public.user_company_profiles USING btree (onboarding_completed_at) WHERE (onboarding_completed_at IS NULL);


--
-- Name: idx_user_company_profiles_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_company_profiles_user ON public.user_company_profiles USING btree (user_id);


--
-- Name: idx_user_tracked_competitors_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tracked_competitors_active ON public.user_tracked_competitors USING btree (user_id, is_active) WHERE (is_active = true);


--
-- Name: idx_user_tracked_competitors_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tracked_competitors_company ON public.user_tracked_competitors USING btree (company_id) WHERE (company_id IS NOT NULL);


--
-- Name: idx_user_tracked_competitors_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tracked_competitors_priority ON public.user_tracked_competitors USING btree (user_id, priority DESC);


--
-- Name: idx_user_tracked_competitors_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tracked_competitors_user ON public.user_tracked_competitors USING btree (user_id);


--
-- Name: idx_pack_companies_pack; Type: INDEX; Schema: sector_packs; Owner: -
--

CREATE INDEX idx_pack_companies_pack ON sector_packs.pack_companies USING btree (pack_id);


--
-- Name: idx_pack_winners_pack_week; Type: INDEX; Schema: sector_packs; Owner: -
--

CREATE INDEX idx_pack_winners_pack_week ON sector_packs.pack_winners USING btree (pack_id, week_start DESC);


--
-- Name: idx_user_subscriptions_pack; Type: INDEX; Schema: sector_packs; Owner: -
--

CREATE INDEX idx_user_subscriptions_pack ON sector_packs.user_subscriptions USING btree (pack_id);


--
-- Name: idx_user_subscriptions_user; Type: INDEX; Schema: sector_packs; Owner: -
--

CREATE INDEX idx_user_subscriptions_user ON sector_packs.user_subscriptions USING btree (user_id);


--
-- Name: baseline_hypothesis baseline_hypothesis_updated_at; Type: TRIGGER; Schema: icp_drift; Owner: -
--

CREATE TRIGGER baseline_hypothesis_updated_at BEFORE UPDATE ON icp_drift.baseline_hypothesis FOR EACH ROW EXECUTE FUNCTION icp_drift.update_updated_at();


--
-- Name: surface_config surface_config_updated_at; Type: TRIGGER; Schema: icp_drift; Owner: -
--

CREATE TRIGGER surface_config_updated_at BEFORE UPDATE ON icp_drift.surface_config FOR EACH ROW EXECUTE FUNCTION icp_drift.update_updated_at();


--
-- Name: delivery_preferences delivery_prefs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER delivery_prefs_updated_at BEFORE UPDATE ON public.delivery_preferences FOR EACH ROW EXECUTE FUNCTION public.update_delivery_prefs_updated_at();


--
-- Name: abuse_flags abuse_flags_resolved_by_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.abuse_flags
    ADD CONSTRAINT abuse_flags_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: abuse_flags abuse_flags_user_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.abuse_flags
    ADD CONSTRAINT abuse_flags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audience_segments audience_segments_created_by_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.audience_segments
    ADD CONSTRAINT audience_segments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: audit_log audit_log_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.audit_log
    ADD CONSTRAINT audit_log_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users(id);


--
-- Name: email_campaigns email_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_campaigns
    ADD CONSTRAINT email_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: email_campaigns email_campaigns_segment_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_campaigns
    ADD CONSTRAINT email_campaigns_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES admin.audience_segments(id);


--
-- Name: email_campaigns email_campaigns_template_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_campaigns
    ADD CONSTRAINT email_campaigns_template_id_fkey FOREIGN KEY (template_id) REFERENCES admin.newsletter_templates(id);


--
-- Name: email_send_log email_send_log_campaign_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_send_log
    ADD CONSTRAINT email_send_log_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES admin.email_campaigns(id) ON DELETE CASCADE;


--
-- Name: email_send_log email_send_log_recipient_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_send_log
    ADD CONSTRAINT email_send_log_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id);


--
-- Name: email_unsubscribe_tokens email_unsubscribe_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: newsletter_templates newsletter_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.newsletter_templates
    ADD CONSTRAINT newsletter_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: system_health_checks system_health_checks_api_registry_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.system_health_checks
    ADD CONSTRAINT system_health_checks_api_registry_id_fkey FOREIGN KEY (api_registry_id) REFERENCES admin.api_registry(id) ON DELETE CASCADE;


--
-- Name: usage_tracking usage_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.usage_tracking
    ADD CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: -
--

ALTER TABLE ONLY admin.user_profiles
    ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: packet_items packet_items_packet_id_fkey; Type: FK CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.packet_items
    ADD CONSTRAINT packet_items_packet_id_fkey FOREIGN KEY (packet_id) REFERENCES control_plane.packets(id) ON DELETE CASCADE;


--
-- Name: packets packets_org_id_fkey; Type: FK CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.packets
    ADD CONSTRAINT packets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: packets packets_user_id_fkey; Type: FK CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.packets
    ADD CONSTRAINT packets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: signals signals_packet_id_fkey; Type: FK CONSTRAINT; Schema: control_plane; Owner: -
--

ALTER TABLE ONLY control_plane.signals
    ADD CONSTRAINT signals_packet_id_fkey FOREIGN KEY (packet_id) REFERENCES control_plane.packets(id);


--
-- Name: tracked_pages tracked_pages_company_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.tracked_pages
    ADD CONSTRAINT tracked_pages_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id);


--
-- Name: tracked_pages tracked_pages_user_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.tracked_pages
    ADD CONSTRAINT tracked_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: classified_changes classified_changes_page_diff_id_fkey; Type: FK CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.classified_changes
    ADD CONSTRAINT classified_changes_page_diff_id_fkey FOREIGN KEY (page_diff_id) REFERENCES diff_tracker.page_diffs(id) ON DELETE CASCADE;


--
-- Name: narrative_drifts narrative_drifts_company_id_fkey; Type: FK CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.narrative_drifts
    ADD CONSTRAINT narrative_drifts_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id);


--
-- Name: narrative_snapshots narrative_snapshots_company_id_fkey; Type: FK CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.narrative_snapshots
    ADD CONSTRAINT narrative_snapshots_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id);


--
-- Name: narrative_snapshots narrative_snapshots_tracked_page_id_fkey; Type: FK CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.narrative_snapshots
    ADD CONSTRAINT narrative_snapshots_tracked_page_id_fkey FOREIGN KEY (tracked_page_id) REFERENCES core.tracked_pages(id);


--
-- Name: page_diffs page_diffs_new_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.page_diffs
    ADD CONSTRAINT page_diffs_new_snapshot_id_fkey FOREIGN KEY (new_snapshot_id) REFERENCES diff_tracker.page_snapshots(id);


--
-- Name: page_diffs page_diffs_old_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.page_diffs
    ADD CONSTRAINT page_diffs_old_snapshot_id_fkey FOREIGN KEY (old_snapshot_id) REFERENCES diff_tracker.page_snapshots(id);


--
-- Name: page_diffs page_diffs_tracked_page_id_fkey; Type: FK CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.page_diffs
    ADD CONSTRAINT page_diffs_tracked_page_id_fkey FOREIGN KEY (tracked_page_id) REFERENCES core.tracked_pages(id) ON DELETE CASCADE;


--
-- Name: page_snapshots page_snapshots_tracked_page_id_fkey; Type: FK CONSTRAINT; Schema: diff_tracker; Owner: -
--

ALTER TABLE ONLY diff_tracker.page_snapshots
    ADD CONSTRAINT page_snapshots_tracked_page_id_fkey FOREIGN KEY (tracked_page_id) REFERENCES core.tracked_pages(id) ON DELETE CASCADE;


--
-- Name: distribution_changes distribution_changes_new_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: distribution_tracker; Owner: -
--

ALTER TABLE ONLY distribution_tracker.distribution_changes
    ADD CONSTRAINT distribution_changes_new_snapshot_id_fkey FOREIGN KEY (new_snapshot_id) REFERENCES distribution_tracker.integration_snapshots(id);


--
-- Name: distribution_changes distribution_changes_old_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: distribution_tracker; Owner: -
--

ALTER TABLE ONLY distribution_tracker.distribution_changes
    ADD CONSTRAINT distribution_changes_old_snapshot_id_fkey FOREIGN KEY (old_snapshot_id) REFERENCES distribution_tracker.integration_snapshots(id);


--
-- Name: pattern_instances pattern_instances_pattern_id_fkey; Type: FK CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.pattern_instances
    ADD CONSTRAINT pattern_instances_pattern_id_fkey FOREIGN KEY (pattern_id) REFERENCES experiment_surveillance.patterns(id) ON DELETE CASCADE;


--
-- Name: pattern_survival pattern_survival_pattern_id_fkey; Type: FK CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.pattern_survival
    ADD CONSTRAINT pattern_survival_pattern_id_fkey FOREIGN KEY (pattern_id) REFERENCES experiment_surveillance.patterns(id) ON DELETE CASCADE;


--
-- Name: signal_emissions signal_emissions_pattern_id_fkey; Type: FK CONSTRAINT; Schema: experiment_surveillance; Owner: -
--

ALTER TABLE ONLY experiment_surveillance.signal_emissions
    ADD CONSTRAINT signal_emissions_pattern_id_fkey FOREIGN KEY (pattern_id) REFERENCES experiment_surveillance.patterns(id) ON DELETE CASCADE;


--
-- Name: battlecard_versions battlecard_versions_user_id_fkey; Type: FK CONSTRAINT; Schema: gtm_artifacts; Owner: -
--

ALTER TABLE ONLY gtm_artifacts.battlecard_versions
    ADD CONSTRAINT battlecard_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: knowledge_mentions knowledge_mentions_knowledge_item_id_fkey; Type: FK CONSTRAINT; Schema: gtm_memory; Owner: -
--

ALTER TABLE ONLY gtm_memory.knowledge_mentions
    ADD CONSTRAINT knowledge_mentions_knowledge_item_id_fkey FOREIGN KEY (knowledge_item_id) REFERENCES gtm_memory.knowledge_items(id) ON DELETE CASCADE;


--
-- Name: knowledge_mentions knowledge_mentions_packet_id_fkey; Type: FK CONSTRAINT; Schema: gtm_memory; Owner: -
--

ALTER TABLE ONLY gtm_memory.knowledge_mentions
    ADD CONSTRAINT knowledge_mentions_packet_id_fkey FOREIGN KEY (packet_id) REFERENCES control_plane.packets(id) ON DELETE SET NULL;


--
-- Name: knowledge_mentions knowledge_mentions_signal_id_fkey; Type: FK CONSTRAINT; Schema: gtm_memory; Owner: -
--

ALTER TABLE ONLY gtm_memory.knowledge_mentions
    ADD CONSTRAINT knowledge_mentions_signal_id_fkey FOREIGN KEY (signal_id) REFERENCES control_plane.signals(id) ON DELETE SET NULL;


--
-- Name: events events_company_id_fkey; Type: FK CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.events
    ADD CONSTRAINT events_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE CASCADE;


--
-- Name: events events_item_id_fkey; Type: FK CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.events
    ADD CONSTRAINT events_item_id_fkey FOREIGN KEY (item_id) REFERENCES horizon.items(id) ON DELETE CASCADE;


--
-- Name: events events_source_id_fkey; Type: FK CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.events
    ADD CONSTRAINT events_source_id_fkey FOREIGN KEY (source_id) REFERENCES horizon.sources(id) ON DELETE CASCADE;


--
-- Name: items items_company_id_fkey; Type: FK CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.items
    ADD CONSTRAINT items_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE CASCADE;


--
-- Name: items items_source_id_fkey; Type: FK CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.items
    ADD CONSTRAINT items_source_id_fkey FOREIGN KEY (source_id) REFERENCES horizon.sources(id) ON DELETE CASCADE;


--
-- Name: sources sources_company_id_fkey; Type: FK CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.sources
    ADD CONSTRAINT sources_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE CASCADE;


--
-- Name: sources sources_user_id_fkey; Type: FK CONSTRAINT; Schema: horizon; Owner: -
--

ALTER TABLE ONLY horizon.sources
    ADD CONSTRAINT sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: baseline_hypothesis baseline_hypothesis_company_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.baseline_hypothesis
    ADD CONSTRAINT baseline_hypothesis_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE CASCADE;


--
-- Name: baseline_hypothesis baseline_hypothesis_user_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.baseline_hypothesis
    ADD CONSTRAINT baseline_hypothesis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: drift_events drift_events_company_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.drift_events
    ADD CONSTRAINT drift_events_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE CASCADE;


--
-- Name: drift_events drift_events_prev_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.drift_events
    ADD CONSTRAINT drift_events_prev_snapshot_id_fkey FOREIGN KEY (prev_snapshot_id) REFERENCES icp_drift.snapshots(id);


--
-- Name: drift_events drift_events_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.drift_events
    ADD CONSTRAINT drift_events_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES icp_drift.snapshots(id);


--
-- Name: drift_events drift_events_tracked_page_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.drift_events
    ADD CONSTRAINT drift_events_tracked_page_id_fkey FOREIGN KEY (tracked_page_id) REFERENCES core.tracked_pages(id) ON DELETE CASCADE;


--
-- Name: indicators indicators_company_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.indicators
    ADD CONSTRAINT indicators_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE CASCADE;


--
-- Name: indicators indicators_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.indicators
    ADD CONSTRAINT indicators_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES icp_drift.snapshots(id) ON DELETE CASCADE;


--
-- Name: snapshots snapshots_company_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.snapshots
    ADD CONSTRAINT snapshots_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE CASCADE;


--
-- Name: snapshots snapshots_tracked_page_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.snapshots
    ADD CONSTRAINT snapshots_tracked_page_id_fkey FOREIGN KEY (tracked_page_id) REFERENCES core.tracked_pages(id) ON DELETE CASCADE;


--
-- Name: surface_config surface_config_company_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.surface_config
    ADD CONSTRAINT surface_config_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(id) ON DELETE CASCADE;


--
-- Name: surface_config surface_config_user_id_fkey; Type: FK CONSTRAINT; Schema: icp_drift; Owner: -
--

ALTER TABLE ONLY icp_drift.surface_config
    ADD CONSTRAINT surface_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: decay_signals decay_signals_launch_id_fkey; Type: FK CONSTRAINT; Schema: launch_tracker; Owner: -
--

ALTER TABLE ONLY launch_tracker.decay_signals
    ADD CONSTRAINT decay_signals_launch_id_fkey FOREIGN KEY (launch_id) REFERENCES launch_tracker.launches(id) ON DELETE CASCADE;


--
-- Name: momentum_snapshots momentum_snapshots_launch_id_fkey; Type: FK CONSTRAINT; Schema: launch_tracker; Owner: -
--

ALTER TABLE ONLY launch_tracker.momentum_snapshots
    ADD CONSTRAINT momentum_snapshots_launch_id_fkey FOREIGN KEY (launch_id) REFERENCES launch_tracker.launches(id) ON DELETE CASCADE;


--
-- Name: events events_source_id_fkey; Type: FK CONSTRAINT; Schema: objection_tracker; Owner: -
--

ALTER TABLE ONLY objection_tracker.events
    ADD CONSTRAINT events_source_id_fkey FOREIGN KEY (source_id) REFERENCES objection_tracker.sources(id) ON DELETE CASCADE;


--
-- Name: patterns patterns_knowledge_item_id_fkey; Type: FK CONSTRAINT; Schema: objection_tracker; Owner: -
--

ALTER TABLE ONLY objection_tracker.patterns
    ADD CONSTRAINT patterns_knowledge_item_id_fkey FOREIGN KEY (knowledge_item_id) REFERENCES gtm_memory.knowledge_items(id) ON DELETE SET NULL;


--
-- Name: pricing_changes pricing_changes_new_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: pricing_tracker; Owner: -
--

ALTER TABLE ONLY pricing_tracker.pricing_changes
    ADD CONSTRAINT pricing_changes_new_snapshot_id_fkey FOREIGN KEY (new_snapshot_id) REFERENCES pricing_tracker.pricing_snapshots(id);


--
-- Name: pricing_changes pricing_changes_old_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: pricing_tracker; Owner: -
--

ALTER TABLE ONLY pricing_tracker.pricing_changes
    ADD CONSTRAINT pricing_changes_old_snapshot_id_fkey FOREIGN KEY (old_snapshot_id) REFERENCES pricing_tracker.pricing_snapshots(id);


--
-- Name: proof_changes proof_changes_new_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: proof_tracker; Owner: -
--

ALTER TABLE ONLY proof_tracker.proof_changes
    ADD CONSTRAINT proof_changes_new_snapshot_id_fkey FOREIGN KEY (new_snapshot_id) REFERENCES proof_tracker.proof_snapshots(id);


--
-- Name: proof_changes proof_changes_old_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: proof_tracker; Owner: -
--

ALTER TABLE ONLY proof_tracker.proof_changes
    ADD CONSTRAINT proof_changes_old_snapshot_id_fkey FOREIGN KEY (old_snapshot_id) REFERENCES proof_tracker.proof_snapshots(id);


--
-- Name: delivery_logs delivery_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_logs
    ADD CONSTRAINT delivery_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: delivery_preferences delivery_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_preferences
    ADD CONSTRAINT delivery_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tracked_pages tracked_pages_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracked_pages
    ADD CONSTRAINT tracked_pages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: user_company_profiles user_company_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_company_profiles
    ADD CONSTRAINT user_company_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_tracked_competitors user_tracked_competitors_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tracked_competitors
    ADD CONSTRAINT user_tracked_competitors_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: user_tracked_competitors user_tracked_competitors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tracked_competitors
    ADD CONSTRAINT user_tracked_competitors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pack_companies pack_companies_pack_id_fkey; Type: FK CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.pack_companies
    ADD CONSTRAINT pack_companies_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES sector_packs.packs(id) ON DELETE CASCADE;


--
-- Name: pack_winners pack_winners_pack_id_fkey; Type: FK CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.pack_winners
    ADD CONSTRAINT pack_winners_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES sector_packs.packs(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_pack_id_fkey; Type: FK CONSTRAINT; Schema: sector_packs; Owner: -
--

ALTER TABLE ONLY sector_packs.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES sector_packs.packs(id) ON DELETE CASCADE;


--
-- Name: audit_log Admins can insert audit logs; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can insert audit logs" ON admin.audit_log FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: audience_segments Admins can manage audience_segments; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can manage audience_segments" ON admin.audience_segments TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: email_campaigns Admins can manage email_campaigns; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can manage email_campaigns" ON admin.email_campaigns TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: feature_flags Admins can manage feature flags; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can manage feature flags" ON admin.feature_flags TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: newsletter_templates Admins can manage newsletter_templates; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can manage newsletter_templates" ON admin.newsletter_templates TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: abuse_flags Admins can read all abuse flags; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read all abuse flags" ON admin.abuse_flags FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: user_profiles Admins can read all profiles; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read all profiles" ON admin.user_profiles FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: usage_tracking Admins can read all usage tracking; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read all usage tracking" ON admin.usage_tracking FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: api_registry Admins can read api_registry; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read api_registry" ON admin.api_registry FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: audience_segments Admins can read audience_segments; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read audience_segments" ON admin.audience_segments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: audit_log Admins can read audit logs; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read audit logs" ON admin.audit_log FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: email_campaigns Admins can read email_campaigns; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read email_campaigns" ON admin.email_campaigns FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: email_send_log Admins can read email_send_log; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read email_send_log" ON admin.email_send_log FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: email_unsubscribe_tokens Admins can read email_unsubscribe_tokens; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read email_unsubscribe_tokens" ON admin.email_unsubscribe_tokens FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: system_health_checks Admins can read health checks; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read health checks" ON admin.system_health_checks FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: newsletter_templates Admins can read newsletter_templates; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can read newsletter_templates" ON admin.newsletter_templates FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: abuse_flags Admins can update abuse flags; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can update abuse flags" ON admin.abuse_flags FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: user_profiles Admins can update profiles; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Admins can update profiles" ON admin.user_profiles FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: feature_flags Authenticated users can read feature flags; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Authenticated users can read feature flags" ON admin.feature_flags FOR SELECT TO authenticated USING (true);


--
-- Name: abuse_flags Service role full access on abuse_flags; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on abuse_flags" ON admin.abuse_flags TO service_role USING (true) WITH CHECK (true);


--
-- Name: api_registry Service role full access on api_registry; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on api_registry" ON admin.api_registry TO service_role USING (true) WITH CHECK (true);


--
-- Name: audience_segments Service role full access on audience_segments; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on audience_segments" ON admin.audience_segments TO service_role USING (true) WITH CHECK (true);


--
-- Name: audit_log Service role full access on audit_log; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on audit_log" ON admin.audit_log TO service_role USING (true) WITH CHECK (true);


--
-- Name: email_campaigns Service role full access on email_campaigns; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on email_campaigns" ON admin.email_campaigns TO service_role USING (true) WITH CHECK (true);


--
-- Name: email_send_log Service role full access on email_send_log; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on email_send_log" ON admin.email_send_log TO service_role USING (true) WITH CHECK (true);


--
-- Name: email_unsubscribe_tokens Service role full access on email_unsubscribe_tokens; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on email_unsubscribe_tokens" ON admin.email_unsubscribe_tokens TO service_role USING (true) WITH CHECK (true);


--
-- Name: feature_flags Service role full access on feature_flags; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on feature_flags" ON admin.feature_flags TO service_role USING (true) WITH CHECK (true);


--
-- Name: newsletter_templates Service role full access on newsletter_templates; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on newsletter_templates" ON admin.newsletter_templates TO service_role USING (true) WITH CHECK (true);


--
-- Name: system_health_checks Service role full access on system_health_checks; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on system_health_checks" ON admin.system_health_checks TO service_role USING (true) WITH CHECK (true);


--
-- Name: usage_tracking Service role full access on usage_tracking; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on usage_tracking" ON admin.usage_tracking TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_profiles Service role full access on user_profiles; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Service role full access on user_profiles" ON admin.user_profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: api_registry Super admins can manage api_registry; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Super admins can manage api_registry" ON admin.api_registry TO authenticated USING ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = 'super_admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM admin.user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.role = 'super_admin'::text)))));


--
-- Name: user_profiles Users can read own profile; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Users can read own profile" ON admin.user_profiles FOR SELECT TO authenticated USING ((id = auth.uid()));


--
-- Name: email_unsubscribe_tokens Users can read own unsubscribe token; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Users can read own unsubscribe token" ON admin.email_unsubscribe_tokens FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: usage_tracking Users can read own usage tracking; Type: POLICY; Schema: admin; Owner: -
--

CREATE POLICY "Users can read own usage tracking" ON admin.usage_tracking FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: abuse_flags; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.abuse_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: api_registry; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.api_registry ENABLE ROW LEVEL SECURITY;

--
-- Name: audience_segments; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.audience_segments ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: email_campaigns; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.email_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: email_send_log; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.email_send_log ENABLE ROW LEVEL SECURITY;

--
-- Name: email_unsubscribe_tokens; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_templates; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.newsletter_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: system_health_checks; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.system_health_checks ENABLE ROW LEVEL SECURITY;

--
-- Name: usage_tracking; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.usage_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: admin; Owner: -
--

ALTER TABLE admin.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: packet_items Allow anonymous read access; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Allow anonymous read access" ON control_plane.packet_items FOR SELECT TO anon USING (true);


--
-- Name: packets Allow anonymous read access; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Allow anonymous read access" ON control_plane.packets FOR SELECT TO anon USING (true);


--
-- Name: signals Allow anonymous read access; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Allow anonymous read access" ON control_plane.signals FOR SELECT TO anon USING (true);


--
-- Name: packet_items Authenticated users read only; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Authenticated users read only" ON control_plane.packet_items FOR SELECT TO authenticated USING (true);


--
-- Name: packets Authenticated users read only; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Authenticated users read only" ON control_plane.packets FOR SELECT TO authenticated USING (true);


--
-- Name: signals Authenticated users read only; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Authenticated users read only" ON control_plane.signals FOR SELECT TO authenticated USING (true);


--
-- Name: packet_items Public read access; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Public read access" ON control_plane.packet_items FOR SELECT TO anon USING (true);


--
-- Name: packets Public read access; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Public read access" ON control_plane.packets FOR SELECT TO anon USING (true);


--
-- Name: signals Public read access; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Public read access" ON control_plane.signals FOR SELECT TO anon USING (true);


--
-- Name: packet_items Service role full access; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Service role full access" ON control_plane.packet_items TO service_role USING (true) WITH CHECK (true);


--
-- Name: packets Service role full access; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Service role full access" ON control_plane.packets TO service_role USING (true) WITH CHECK (true);


--
-- Name: signals Service role full access; Type: POLICY; Schema: control_plane; Owner: -
--

CREATE POLICY "Service role full access" ON control_plane.signals TO service_role USING (true) WITH CHECK (true);


--
-- Name: decision_verbs; Type: ROW SECURITY; Schema: control_plane; Owner: -
--

ALTER TABLE control_plane.decision_verbs ENABLE ROW LEVEL SECURITY;

--
-- Name: packet_items; Type: ROW SECURITY; Schema: control_plane; Owner: -
--

ALTER TABLE control_plane.packet_items ENABLE ROW LEVEL SECURITY;

--
-- Name: packets; Type: ROW SECURITY; Schema: control_plane; Owner: -
--

ALTER TABLE control_plane.packets ENABLE ROW LEVEL SECURITY;

--
-- Name: signals; Type: ROW SECURITY; Schema: control_plane; Owner: -
--

ALTER TABLE control_plane.signals ENABLE ROW LEVEL SECURITY;

--
-- Name: weekly_packets; Type: ROW SECURITY; Schema: control_plane; Owner: -
--

ALTER TABLE control_plane.weekly_packets ENABLE ROW LEVEL SECURITY;

--
-- Name: companies Users can delete companies they own; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can delete companies they own" ON core.companies FOR DELETE USING ((NOT (EXISTS ( SELECT 1
   FROM core.tracked_pages tp
  WHERE ((tp.company_id = companies.id) AND (tp.user_id <> auth.uid()))))));


--
-- Name: tracked_pages Users can delete own tracked pages; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can delete own tracked pages" ON core.tracked_pages FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: tracked_pages Users can delete their own tracked pages; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can delete their own tracked pages" ON core.tracked_pages FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: companies Users can insert companies; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can insert companies" ON core.companies FOR INSERT WITH CHECK (true);


--
-- Name: tracked_pages Users can insert own tracked pages; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can insert own tracked pages" ON core.tracked_pages FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tracked_pages Users can insert their own tracked pages; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can insert their own tracked pages" ON core.tracked_pages FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: tracked_pages Users can update own tracked pages; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can update own tracked pages" ON core.tracked_pages FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: tracked_pages Users can update their own tracked pages; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can update their own tracked pages" ON core.tracked_pages FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: companies Users can view companies they track; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can view companies they track" ON core.companies FOR SELECT USING ((EXISTS ( SELECT 1
   FROM core.tracked_pages tp
  WHERE ((tp.company_id = companies.id) AND (tp.user_id = auth.uid())))));


--
-- Name: tracked_pages Users can view own tracked pages; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can view own tracked pages" ON core.tracked_pages FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tracked_pages Users can view their own tracked pages; Type: POLICY; Schema: core; Owner: -
--

CREATE POLICY "Users can view their own tracked pages" ON core.tracked_pages FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: companies; Type: ROW SECURITY; Schema: core; Owner: -
--

ALTER TABLE core.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: tracked_pages; Type: ROW SECURITY; Schema: core; Owner: -
--

ALTER TABLE core.tracked_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: category_drift_analysis; Type: ROW SECURITY; Schema: diff_tracker; Owner: -
--

ALTER TABLE diff_tracker.category_drift_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: classified_changes; Type: ROW SECURITY; Schema: diff_tracker; Owner: -
--

ALTER TABLE diff_tracker.classified_changes ENABLE ROW LEVEL SECURITY;

--
-- Name: narrative_drifts; Type: ROW SECURITY; Schema: diff_tracker; Owner: -
--

ALTER TABLE diff_tracker.narrative_drifts ENABLE ROW LEVEL SECURITY;

--
-- Name: narrative_snapshots; Type: ROW SECURITY; Schema: diff_tracker; Owner: -
--

ALTER TABLE diff_tracker.narrative_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: page_diffs; Type: ROW SECURITY; Schema: diff_tracker; Owner: -
--

ALTER TABLE diff_tracker.page_diffs ENABLE ROW LEVEL SECURITY;

--
-- Name: page_snapshots; Type: ROW SECURITY; Schema: diff_tracker; Owner: -
--

ALTER TABLE diff_tracker.page_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: battlecard_versions Authenticated users read only; Type: POLICY; Schema: gtm_artifacts; Owner: -
--

CREATE POLICY "Authenticated users read only" ON gtm_artifacts.battlecard_versions FOR SELECT TO authenticated USING (true);


--
-- Name: objection_library_versions Authenticated users read only; Type: POLICY; Schema: gtm_artifacts; Owner: -
--

CREATE POLICY "Authenticated users read only" ON gtm_artifacts.objection_library_versions FOR SELECT TO authenticated USING (true);


--
-- Name: swipe_file_versions Authenticated users read only; Type: POLICY; Schema: gtm_artifacts; Owner: -
--

CREATE POLICY "Authenticated users read only" ON gtm_artifacts.swipe_file_versions FOR SELECT TO authenticated USING (true);


--
-- Name: battlecard_versions Service role full access; Type: POLICY; Schema: gtm_artifacts; Owner: -
--

CREATE POLICY "Service role full access" ON gtm_artifacts.battlecard_versions TO service_role USING (true) WITH CHECK (true);


--
-- Name: objection_library_versions Service role full access; Type: POLICY; Schema: gtm_artifacts; Owner: -
--

CREATE POLICY "Service role full access" ON gtm_artifacts.objection_library_versions TO service_role USING (true) WITH CHECK (true);


--
-- Name: swipe_file_versions Service role full access; Type: POLICY; Schema: gtm_artifacts; Owner: -
--

CREATE POLICY "Service role full access" ON gtm_artifacts.swipe_file_versions TO service_role USING (true) WITH CHECK (true);


--
-- Name: battlecard_versions; Type: ROW SECURITY; Schema: gtm_artifacts; Owner: -
--

ALTER TABLE gtm_artifacts.battlecard_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: objection_library_versions; Type: ROW SECURITY; Schema: gtm_artifacts; Owner: -
--

ALTER TABLE gtm_artifacts.objection_library_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: swipe_file_versions; Type: ROW SECURITY; Schema: gtm_artifacts; Owner: -
--

ALTER TABLE gtm_artifacts.swipe_file_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_items Authenticated users read only; Type: POLICY; Schema: gtm_memory; Owner: -
--

CREATE POLICY "Authenticated users read only" ON gtm_memory.knowledge_items FOR SELECT TO authenticated USING (true);


--
-- Name: knowledge_mentions Authenticated users read only; Type: POLICY; Schema: gtm_memory; Owner: -
--

CREATE POLICY "Authenticated users read only" ON gtm_memory.knowledge_mentions FOR SELECT TO authenticated USING (true);


--
-- Name: knowledge_items Service role full access; Type: POLICY; Schema: gtm_memory; Owner: -
--

CREATE POLICY "Service role full access" ON gtm_memory.knowledge_items TO service_role USING (true) WITH CHECK (true);


--
-- Name: knowledge_mentions Service role full access; Type: POLICY; Schema: gtm_memory; Owner: -
--

CREATE POLICY "Service role full access" ON gtm_memory.knowledge_mentions TO service_role USING (true) WITH CHECK (true);


--
-- Name: knowledge_items; Type: ROW SECURITY; Schema: gtm_memory; Owner: -
--

ALTER TABLE gtm_memory.knowledge_items ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_mentions; Type: ROW SECURITY; Schema: gtm_memory; Owner: -
--

ALTER TABLE gtm_memory.knowledge_mentions ENABLE ROW LEVEL SECURITY;

--
-- Name: events Service role events; Type: POLICY; Schema: horizon; Owner: -
--

CREATE POLICY "Service role events" ON horizon.events USING ((auth.role() = 'service_role'::text));


--
-- Name: items Service role items; Type: POLICY; Schema: horizon; Owner: -
--

CREATE POLICY "Service role items" ON horizon.items USING ((auth.role() = 'service_role'::text));


--
-- Name: sources Service role sources; Type: POLICY; Schema: horizon; Owner: -
--

CREATE POLICY "Service role sources" ON horizon.sources USING ((auth.role() = 'service_role'::text));


--
-- Name: events Users see own events; Type: POLICY; Schema: horizon; Owner: -
--

CREATE POLICY "Users see own events" ON horizon.events USING ((company_id IN ( SELECT sources.company_id
   FROM horizon.sources
  WHERE (sources.user_id = auth.uid()))));


--
-- Name: items Users see own items; Type: POLICY; Schema: horizon; Owner: -
--

CREATE POLICY "Users see own items" ON horizon.items USING ((company_id IN ( SELECT sources.company_id
   FROM horizon.sources
  WHERE (sources.user_id = auth.uid()))));


--
-- Name: sources Users see own sources; Type: POLICY; Schema: horizon; Owner: -
--

CREATE POLICY "Users see own sources" ON horizon.sources USING ((user_id = auth.uid()));


--
-- Name: events; Type: ROW SECURITY; Schema: horizon; Owner: -
--

ALTER TABLE horizon.events ENABLE ROW LEVEL SECURITY;

--
-- Name: items; Type: ROW SECURITY; Schema: horizon; Owner: -
--

ALTER TABLE horizon.items ENABLE ROW LEVEL SECURITY;

--
-- Name: sources; Type: ROW SECURITY; Schema: horizon; Owner: -
--

ALTER TABLE horizon.sources ENABLE ROW LEVEL SECURITY;

--
-- Name: baseline_hypothesis Users manage own baseline hypothesis; Type: POLICY; Schema: icp_drift; Owner: -
--

CREATE POLICY "Users manage own baseline hypothesis" ON icp_drift.baseline_hypothesis USING ((auth.uid() = user_id));


--
-- Name: surface_config Users manage own surface config; Type: POLICY; Schema: icp_drift; Owner: -
--

CREATE POLICY "Users manage own surface config" ON icp_drift.surface_config USING ((auth.uid() = user_id));


--
-- Name: baseline_hypothesis; Type: ROW SECURITY; Schema: icp_drift; Owner: -
--

ALTER TABLE icp_drift.baseline_hypothesis ENABLE ROW LEVEL SECURITY;

--
-- Name: drift_events; Type: ROW SECURITY; Schema: icp_drift; Owner: -
--

ALTER TABLE icp_drift.drift_events ENABLE ROW LEVEL SECURITY;

--
-- Name: indicators; Type: ROW SECURITY; Schema: icp_drift; Owner: -
--

ALTER TABLE icp_drift.indicators ENABLE ROW LEVEL SECURITY;

--
-- Name: snapshots; Type: ROW SECURITY; Schema: icp_drift; Owner: -
--

ALTER TABLE icp_drift.snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: surface_config; Type: ROW SECURITY; Schema: icp_drift; Owner: -
--

ALTER TABLE icp_drift.surface_config ENABLE ROW LEVEL SECURITY;

--
-- Name: events Allow read for authenticated users; Type: POLICY; Schema: objection_tracker; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON objection_tracker.events FOR SELECT TO authenticated USING (true);


--
-- Name: patterns Allow read for authenticated users; Type: POLICY; Schema: objection_tracker; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON objection_tracker.patterns FOR SELECT TO authenticated USING (true);


--
-- Name: sources Allow read for authenticated users; Type: POLICY; Schema: objection_tracker; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON objection_tracker.sources FOR SELECT TO authenticated USING (true);


--
-- Name: trend_snapshots Allow read for authenticated users; Type: POLICY; Schema: objection_tracker; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON objection_tracker.trend_snapshots FOR SELECT TO authenticated USING (true);


--
-- Name: events Service role full access; Type: POLICY; Schema: objection_tracker; Owner: -
--

CREATE POLICY "Service role full access" ON objection_tracker.events TO service_role USING (true) WITH CHECK (true);


--
-- Name: patterns Service role full access; Type: POLICY; Schema: objection_tracker; Owner: -
--

CREATE POLICY "Service role full access" ON objection_tracker.patterns TO service_role USING (true) WITH CHECK (true);


--
-- Name: sources Service role full access; Type: POLICY; Schema: objection_tracker; Owner: -
--

CREATE POLICY "Service role full access" ON objection_tracker.sources TO service_role USING (true) WITH CHECK (true);


--
-- Name: trend_snapshots Service role full access; Type: POLICY; Schema: objection_tracker; Owner: -
--

CREATE POLICY "Service role full access" ON objection_tracker.trend_snapshots TO service_role USING (true) WITH CHECK (true);


--
-- Name: events; Type: ROW SECURITY; Schema: objection_tracker; Owner: -
--

ALTER TABLE objection_tracker.events ENABLE ROW LEVEL SECURITY;

--
-- Name: patterns; Type: ROW SECURITY; Schema: objection_tracker; Owner: -
--

ALTER TABLE objection_tracker.patterns ENABLE ROW LEVEL SECURITY;

--
-- Name: sources; Type: ROW SECURITY; Schema: objection_tracker; Owner: -
--

ALTER TABLE objection_tracker.sources ENABLE ROW LEVEL SECURITY;

--
-- Name: trend_snapshots; Type: ROW SECURITY; Schema: objection_tracker; Owner: -
--

ALTER TABLE objection_tracker.trend_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_logs Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.delivery_logs TO service_role USING (true) WITH CHECK (true);


--
-- Name: delivery_preferences Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.delivery_preferences TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_company_profiles Users can delete own company profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own company profile" ON public.user_company_profiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: delivery_preferences Users can delete own delivery preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own delivery preferences" ON public.delivery_preferences FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_tracked_competitors Users can delete own tracked competitors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own tracked competitors" ON public.user_tracked_competitors FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_company_profiles Users can insert own company profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own company profile" ON public.user_company_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: delivery_preferences Users can insert own delivery preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own delivery preferences" ON public.delivery_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_tracked_competitors Users can insert own tracked competitors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own tracked competitors" ON public.user_tracked_competitors FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_company_profiles Users can update own company profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own company profile" ON public.user_company_profiles FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: delivery_preferences Users can update own delivery preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own delivery preferences" ON public.delivery_preferences FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_tracked_competitors Users can update own tracked competitors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own tracked competitors" ON public.user_tracked_competitors FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_company_profiles Users can view own company profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own company profile" ON public.user_company_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: delivery_logs Users can view own delivery logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own delivery logs" ON public.delivery_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: delivery_preferences Users can view own delivery preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own delivery preferences" ON public.delivery_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_tracked_competitors Users can view own tracked competitors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tracked competitors" ON public.user_tracked_competitors FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: delivery_preferences Users delete own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own" ON public.delivery_preferences FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: delivery_preferences Users insert own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own" ON public.delivery_preferences FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: delivery_preferences Users manage own prefs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own prefs" ON public.delivery_preferences USING ((auth.uid() = user_id));


--
-- Name: delivery_preferences Users update own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own" ON public.delivery_preferences FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: delivery_logs Users view own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own" ON public.delivery_logs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: delivery_preferences Users view own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own" ON public.delivery_preferences FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: delivery_logs Users view own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own logs" ON public.delivery_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: delivery_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_company_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_company_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_tracked_competitors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_tracked_competitors ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 9VKYeZzeL2BzvDYnkaSwNAPnSEhLgGBzCXNBtUsrInNio9Duy6RJefO3STWX6AD

