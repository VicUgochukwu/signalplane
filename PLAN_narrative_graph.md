# Narrative Graph: Cross-Signal, Cross-Week Campaign Detection

## Problem
Control Plane detects individual narrative drifts per company per week, but cannot:
- Link related shifts across weeks into campaign arcs
- Detect coordinated multi-company narrative convergence
- Surface "this is the 3rd escalation in an 8-week pattern" intelligence
- Build a graph that connects signals to each other over time

## What Exists Today
- `narrative_drifts`: single-company, single-week drift (drift_from, drift_to, severity)
- `narrative_snapshots`: weekly extracted copy per page per company
- `classified_changes`: tagged changes (VALUE_PROP_CHANGE, NARRATIVE_SHIFT, etc.)
- `category_drift_analysis`: schema exists, LLM populates convergence/divergence weekly but no temporal linking
- `control_plane.signals`: emitted per drift, no cross-signal edges

## Architecture

### 1. New DB Tables (one migration)

**`diff_tracker.narrative_arcs`**: A campaign arc grouping related drifts over time
- id UUID PK
- company_id UUID FK
- arc_title TEXT (LLM-generated label, e.g. "AI-Native Repositioning Campaign")
- arc_theme TEXT (the persistent narrative direction)
- arc_status TEXT (building | escalating | peaked | fading)
- first_seen_week DATE
- last_seen_week DATE
- weeks_active INT
- escalation_count INT (number of linked drifts)
- trajectory TEXT (accelerating | steady | decelerating)
- current_severity INT (1-5)
- strategic_summary TEXT (LLM: what this arc means for your GTM)
- meta JSONB
- created_at, updated_at TIMESTAMPTZ

**`diff_tracker.narrative_arc_edges`**: Links individual signals into arcs (the graph edges)
- id UUID PK
- arc_id UUID FK narrative_arcs
- signal_source TEXT (narrative_drift | classified_change | category_drift)
- source_id UUID (FK to the originating row)
- week_start_date DATE
- edge_label TEXT (escalation | reinforcement | pivot | origin)
- llm_reasoning TEXT (why this signal belongs to this arc)
- created_at TIMESTAMPTZ

**`diff_tracker.cross_company_convergences`**: When multiple companies drift toward the same narrative
- id UUID PK
- convergence_theme TEXT
- week_detected DATE
- company_ids UUID[]
- arc_ids UUID[] (the narrative_arcs involved)
- severity INT (1-5)
- summary TEXT (LLM: "3 competitors converging on AI-native positioning")
- meta JSONB
- created_at TIMESTAMPTZ

### 2. RPC Functions

**`get_narrative_arcs_for_user(p_user_id UUID)`**
- Returns active arcs for companies the user tracks
- Joins narrative_arcs with user_tracked_competitors
- Includes edges as a JSONB array

**`get_active_convergences(p_user_id UUID)`**
- Returns convergences involving the user's tracked companies

### 3. Extend Narrative Drift Monitor n8n Workflow

After the existing "Upsert Drift" and "Store Category Analysis" nodes, add 6 new nodes:

**Node A: Fetch Arc History**
- GET narrative_arcs where company_id matches and status != 'fading'
- GET narrative_arc_edges for those arcs (last 12 weeks)
- GET narrative_drifts for those companies (last 12 weeks)

**Node B: LLM Arc Detection** (Claude Sonnet)
- Input: this week's drift + all drifts from last 12 weeks + existing open arcs
- LLM determines: does this drift connect to an existing arc? If yes, update it. If no, create new arc.
- Classifies trajectory, generates strategic_summary
- Output: arc data + edge data

**Node C: Upsert Arc + Edge**
- New arc: INSERT narrative_arcs + INSERT edge
- Existing arc: UPDATE narrative_arcs (last_seen_week, escalation_count, trajectory, strategic_summary) + INSERT edge

**Node D: LLM Cross-Company Convergence**
- Input: all active arcs across all companies
- LLM detects if 2+ companies share similar arc_theme within 4 weeks
- Output: convergence data

**Node E: Store Convergence**
- INSERT into cross_company_convergences if detected

**Node F: Emit Arc Signal**
- For arcs with escalation_count >= 3 or any convergence: emit enhanced control_plane.signal

### 4. Frontend Components

**`NarrativeArcCard.tsx`**: Visual arc timeline card
- Arc title, theme, company name
- Week-axis timeline with dots for each linked drift
- Status badge (building/escalating/peaked/fading)
- Escalation count ("5th shift in 10 weeks")
- Trajectory arrow (accelerating/steady/decelerating)
- Strategic summary
- Expandable: shows each edge with label and reasoning

**`ConvergenceAlert.tsx`**: Banner when multiple companies converge
- "3 competitors converging on AI-native positioning"
- Company names, links to each arc

**Hooks:**
- `useNarrativeArcs()`: fetches arcs + edges for user's tracked companies
- `useConvergences()`: fetches active convergences

**Integration:** Competitor Messaging page (Index.tsx), collapsible section above the signal feed

### 5. Implementation Order

1. Migration: 3 tables + 2 RPC functions + RLS + indexes
2. n8n workflow: 6 new nodes added to Narrative Drift Monitor
3. Frontend: components + hooks
4. Frontend: integrate into Competitor Messaging page
5. Build, deploy, test
