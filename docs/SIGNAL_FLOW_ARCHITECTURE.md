# Signal Flow Architecture

## Overview

Signal Plane's Control Plane aggregates intelligence from multiple "ships" (data collection workflows) into a weekly intelligence packet. This document describes the complete data flow from source to output.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA SOURCES                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Competitor  │  │   Reddit     │  │   G2/       │  │   News/      │     │
│  │  Websites    │  │   Threads    │  │   Capterra  │  │   RSS Feeds  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │                 │              │
└─────────┼─────────────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SHIPS (n8n Workflows)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Messaging Diff  │  │ Narrative Drift │  │ ICP Evolution   │              │
│  │    Tracker      │  │    Detector     │  │    Tracker      │              │
│  │   (Sat 10PM)    │  │   (Sat 11PM)    │  │   (Sun 12AM)    │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│  ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐              │
│  │ Horizon Scanner │  │ Objection       │  │                 │              │
│  │   (Sun 12AM)    │  │ Tracker v2      │  │   Future Ships  │              │
│  │                 │  │   (Sun 12AM)    │  │                 │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
└───────────┼────────────────────┼────────────────────┼────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SIGNAL AGGREGATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌───────────────────────────┐                             │
│                    │  control_plane.signals    │                             │
│                    │                           │                             │
│                    │  signal_type:             │                             │
│                    │  - messaging              │                             │
│                    │  - narrative              │                             │
│                    │  - icp                    │                             │
│                    │  - horizon                │                             │
│                    │  - objection              │                             │
│                    │                           │                             │
│                    │  Fields:                  │                             │
│                    │  - title, summary         │                             │
│                    │  - priority (1-5)         │                             │
│                    │  - decision_type          │                             │
│                    │  - source_refs            │                             │
│                    │  - metadata               │                             │
│                    └─────────────┬─────────────┘                             │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATION                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Ships Orchestrator (Sun 2PM)                      │    │
│  │                                                                      │    │
│  │  1. Query signals table for last 7 days                             │    │
│  │  2. Check each expected ship has emitted signals                    │    │
│  │  3. Alert if any ship is missing                                    │    │
│  │  4. Pass status to Control Plane                                    │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Control Plane v2 (Sun 6PM)                        │    │
│  │                                                                      │    │
│  │  1. Load all signals for current week (timezone-aware)              │    │
│  │  2. Score & Select top signals per category                         │    │
│  │  3. Call Anthropic to synthesize weekly packet                      │    │
│  │  4. Parse structured JSON response                                  │    │
│  │  5. Upsert packet to database                                       │    │
│  │  6. Trigger builders (parallel)                                     │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
└─────────────────────────────────┼────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BUILDERS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Battlecards   │  │   Objection     │  │   Swipe File    │              │
│  │    Builder      │  │    Library      │  │    Builder      │              │
│  │                 │  │    Builder      │  │                 │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│           ▼                    ▼                    ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    gtm_memory Schema                                 │    │
│  │                                                                      │    │
│  │  Tables:                                                            │    │
│  │  - gtm_memory.battlecards                                           │    │
│  │  - gtm_memory.objection_library                                     │    │
│  │  - gtm_memory.swipe_file                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OUTPUTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    control_plane.packets                             │    │
│  │                                                                      │    │
│  │  Weekly Intelligence Packet:                                        │    │
│  │  - packet_title                                                     │    │
│  │  - exec_summary (5 bullets)                                         │    │
│  │  - sections (messaging, narrative, icp, horizon, objection)         │    │
│  │  - key_questions                                                    │    │
│  │  - predictions                                                      │    │
│  │  - action_mapping (this_week, monitor)                              │    │
│  │  - bets (strategic hypotheses)                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│                                  │                                           │
│                                  ▼                                           │
│                    ┌─────────────────────────┐                               │
│                    │      Frontend UI        │                               │
│                    │   /control-plane        │                               │
│                    │                         │                               │
│                    │  - Packet List          │                               │
│                    │  - Packet Detail        │                               │
│                    │  - Artifacts Tab        │                               │
│                    └─────────────────────────┘                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Ship Details

### 1. Messaging Diff Tracker
**Schedule:** Saturday 10:00 PM UTC
**Source:** Competitor website homepages
**Output:** `messaging` signals

**Process:**
1. Fetch latest snapshots from `page_snapshots`
2. Compare with previous week's snapshots
3. Detect changes in `page_diffs`
4. Classify changes using LLM → `classified_changes`
5. Emit high-priority changes as signals

**Signal Fields:**
- `title`: Summary of messaging change
- `summary`: Detailed description
- `decision_type`: `positioning`
- `priority`: Based on change magnitude

---

### 2. Narrative Drift Detector
**Schedule:** Saturday 11:00 PM UTC
**Source:** Industry news, analyst reports
**Output:** `narrative` signals

**Process:**
1. Monitor industry news feeds
2. Detect shifts in market narrative
3. Identify new terminology or positioning trends
4. Emit signals for significant narrative changes

---

### 3. ICP Evolution Tracker
**Schedule:** Sunday 12:00 AM UTC
**Source:** Competitor customer pages, case studies
**Output:** `icp` signals

**Process:**
1. Track changes to customer logos
2. Monitor case study additions/removals
3. Detect vertical expansion signals
4. Identify persona targeting shifts

---

### 4. Horizon Scanner
**Schedule:** Sunday 12:00 AM UTC
**Source:** News, funding announcements, product launches
**Output:** `horizon` signals

**Process:**
1. Monitor competitor announcements
2. Track funding/acquisition news
3. Detect platform/technology shifts
4. Identify market expansion signals

---

### 5. Objection Tracker v2
**Schedule:** Sunday 12:00 AM UTC
**Source:** Reddit, G2, Capterra reviews
**Output:** `objection` signals

**Process:**
1. Fetch recent reviews/discussions via Apify
2. Classify objections using LLM
3. Detect trending objection patterns
4. Emit signals for new/growing objections

**Objection Categories:**
- Pricing/Value
- Integration/Compatibility
- Ease of Use
- Support/Reliability
- Feature Gaps
- Security/Compliance

---

## Signal Schema

```sql
CREATE TABLE control_plane.signals (
  id UUID PRIMARY KEY,
  signal_type TEXT NOT NULL,  -- messaging, narrative, icp, horizon, objection

  -- Content
  title TEXT NOT NULL,
  summary TEXT,

  -- Scoring
  priority INTEGER DEFAULT 3,  -- 1-5, higher = more important
  confidence NUMERIC,

  -- Classification
  decision_type TEXT,  -- positioning, packaging, distribution, proof, enablement, risk

  -- Source tracking
  source_refs JSONB,  -- URLs, document IDs
  source_schema TEXT,
  source_table TEXT,
  source_id UUID,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Weekly Schedule (UTC)

| Day | Time | Workflow | Purpose |
|-----|------|----------|---------|
| Saturday | 10:00 PM | Messaging Diff Tracker | Detect homepage changes |
| Saturday | 11:00 PM | Narrative Drift Detector | Monitor market narratives |
| Sunday | 12:00 AM | ICP Evolution Tracker | Track customer targeting |
| Sunday | 12:00 AM | Horizon Scanner | Monitor announcements |
| Sunday | 12:00 AM | Objection Tracker v2 | Analyze reviews/feedback |
| Sunday | 2:00 PM | Ships Orchestrator | Validate all ships ran |
| Sunday | 6:00 PM | Control Plane v2 | Generate weekly packet |

---

## Timezone Handling

Control Plane supports timezone-aware week boundaries:

1. **Organization timezone** stored in `public.organizations.timezone`
2. **Week boundaries** calculated using `control_plane.get_week_boundaries(timezone)`
3. **Signals queried** for the org's local week (Sunday-Saturday or Monday-Sunday)
4. **Packet generated** at org's configured delivery time

Supported timezones: 51 IANA timezone identifiers (Americas, Europe, Asia Pacific, Africa, Middle East)

---

## Error Handling

### Dead-Letter Queue
Failed workflow executions are logged to `ops.workflow_failures`:
- Captures workflow ID, execution ID, failed node
- Stores error message and stack trace
- Tracks retry attempts
- Supports manual resolution

### Monitoring
- `ops.ship_status` view shows health of each ship
- `ops.failure_summary` aggregates failures by workflow
- Admin dashboard provides real-time visibility

### Recovery Procedures
1. **Ship failure:** Re-run failed ship, then re-run Orchestrator
2. **API timeout:** Wait 5 minutes, retry workflow
3. **Control Plane failure:** Re-run before Monday AM

---

## Data Retention

| Table | Retention | Notes |
|-------|-----------|-------|
| `page_snapshots` | 90 days | Archived to cold storage |
| `control_plane.signals` | 1 year | Full history for analysis |
| `control_plane.packets` | Indefinite | Weekly packets preserved |
| `ops.workflow_failures` | 30 days | Cleaned up automatically |
| `gtm_memory.*` | Indefinite | Knowledge base grows over time |

---

## Future Ships (Planned)

1. **Pricing Drift Monitor** - Track competitor pricing changes
2. **Proof & Trust Monitor** - Track compliance badges, logos
3. **Distribution Move Monitor** - Track integration ecosystems
4. **Hiring Signal Monitor** - Track competitor hiring patterns
5. **Launch Decay Analyzer** - Track post-launch momentum

These will feed additional signal types to Control Plane and enrich the weekly packet with more intelligence categories.
