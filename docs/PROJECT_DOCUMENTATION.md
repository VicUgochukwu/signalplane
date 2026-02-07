# Signal Plane - Complete Project Documentation

> **Version:** 1.0.0
> **Last Updated:** February 7, 2026
> **Owner:** Victor Ugochukwu
> **Status:** Production-Ready (Phase 7 Complete)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What is Signal Plane?](#2-what-is-signal-plane)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Schema](#5-database-schema)
6. [Backend: n8n Workflows](#6-backend-n8n-workflows)
7. [Backend: Supabase Edge Functions](#7-backend-supabase-edge-functions)
8. [Frontend: React Application](#8-frontend-react-application)
9. [The "Ships" Concept](#9-the-ships-concept)
10. [Control Plane & Weekly Packets](#10-control-plane--weekly-packets)
11. [How Data Flows Through the System](#11-how-data-flows-through-the-system)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Configuration & Environment](#13-configuration--environment)
14. [Development Setup](#14-development-setup)
15. [Key Files Reference](#15-key-files-reference)
16. [Glossary](#16-glossary)
17. [Troubleshooting](#17-troubleshooting)
18. [Future Roadmap](#18-future-roadmap)

---

## 1. Executive Summary

**Signal Plane** is a GTM (Go-To-Market) intelligence platform that automatically monitors competitors, market trends, and buyer sentiment, then synthesizes this data into weekly "intelligence packets" for marketing and sales teams.

### The Problem It Solves
Marketing teams make decisions based on hearsay, outdated information, and fragmented data scattered across dozens of sources. Signal Plane replaces this chaos with evidence-based intelligence by:

- **Automating** competitor website monitoring
- **Detecting** changes in competitor messaging and positioning
- **Tracking** buyer objections from reviews and forums
- **Synthesizing** all signals into actionable weekly reports
- **Building** sales enablement artifacts (battlecards, objection libraries, swipe files)

### Key Metrics
- **10+** Live Monitors (automated "ships" collecting data)
- **25** Signals per weekly packet
- **7-day** Recency decay for signal freshness
- **52** Packets generated per year

---

## 2. What is Signal Plane?

Signal Plane operates on a metaphor of **ships** and **control planes**:

- **Ships** are automated workflows that sail out to collect specific types of intelligence (competitor messaging changes, market trends, buyer objections, etc.)
- **Control Plane** is the central hub that aggregates signals from all ships, scores them, and synthesizes them into weekly intelligence packets
- **Builders** are specialized workflows that generate sales enablement artifacts from the intelligence

### Core Value Proposition
> "Every week, your GTM team makes decisions based on what they heard last. Control Plane replaces hearsay with evidence."

---

## 3. System Architecture

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
│  │ Horizon Scanner │  │ Objection       │  │   Future Ships  │              │
│  │   (Sun 12AM)    │  │ Tracker v2      │  │                 │              │
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
│  │  • Query signals table for last 7 days                              │    │
│  │  • Check each expected ship has emitted signals                     │    │
│  │  • Alert if any ship is missing                                     │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Control Plane v2 (Sun 6PM)                        │    │
│  │  • Load all signals for current week (timezone-aware)               │    │
│  │  • Score & select top signals per category                          │    │
│  │  • Call Anthropic to synthesize weekly packet                       │    │
│  │  • Trigger builders (parallel)                                      │    │
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
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Battlecards   │  │   Objection     │  │   Swipe File    │              │
│  │    Builder      │  │    Library      │  │    Builder      │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│           ▼                    ▼                    ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    gtm_artifacts Schema                              │    │
│  │  • gtm_artifacts.battlecard_versions                                │    │
│  │  • gtm_artifacts.objection_library_versions                         │    │
│  │  • gtm_artifacts.swipe_file_versions                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OUTPUTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    control_plane.packets                             │    │
│  │  • packet_title                                                     │    │
│  │  • exec_summary (5 bullets)                                         │    │
│  │  • sections (messaging, narrative, icp, horizon, objection)         │    │
│  │  • key_questions                                                    │    │
│  │  • predictions                                                      │    │
│  │  • action_mapping (this_week, monitor)                              │    │
│  │  • bets (strategic hypotheses)                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                           │
│                                  ▼                                           │
│                    ┌─────────────────────────┐                               │
│                    │      Frontend UI        │                               │
│                    │   /control-plane        │                               │
│                    │   /admin/*              │                               │
│                    └─────────────────────────┘                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 18.3.1 |
| **TypeScript** | Type-safe JavaScript | 5.8.3 |
| **Vite** | Build tool & dev server | 5.4.19 |
| **Tailwind CSS** | Utility-first CSS | 3.4.17 |
| **shadcn/ui** | Component library | Latest |
| **React Router** | Client-side routing | 6.30.1 |
| **TanStack Query** | Data fetching & caching | 5.83.0 |
| **Recharts** | Charts & visualizations | 2.15.4 |
| **Lucide React** | Icon library | 0.462.0 |
| **date-fns** | Date manipulation | 3.6.0 |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, Auth, Edge Functions |
| **n8n** | Workflow automation (self-hosted on replyra.app.n8n.cloud) |
| **Anthropic Claude** | AI for classification, synthesis, and content generation |
| **Apify** | Web scraping (Reddit, G2, Capterra) |

### Hosting
| Service | Purpose |
|---------|---------|
| **Lovable** | Frontend hosting with automatic deploys |
| **Supabase** | Database, auth, and serverless functions |
| **n8n Cloud** | Workflow automation hosting |

---

## 5. Database Schema

The database is organized into multiple PostgreSQL schemas, each handling a specific domain:

### Schema Overview

```
├── public                      # Core application tables
├── control_plane               # Signal aggregation and packets
├── objection_tracker           # Buyer objection monitoring
├── pricing_tracker             # Competitor pricing changes
├── proof_tracker               # Trust signals (badges, logos)
├── hiring_tracker              # Competitor hiring patterns
├── distribution_tracker        # Integration ecosystem changes
├── launch_tracker              # Product/feature launches
├── experiment_surveillance     # A/B test detection
├── gtm_memory                  # Compounding knowledge base
├── gtm_artifacts               # Generated sales enablement content
├── ops                         # Operational monitoring
└── admin                       # Admin panel data
```

### Key Tables

#### `control_plane.signals`
The central table where all ships deposit their findings.

```sql
CREATE TABLE control_plane.signals (
  id UUID PRIMARY KEY,
  signal_type TEXT NOT NULL,     -- 'messaging', 'narrative', 'icp', 'horizon', 'objection'
  title TEXT NOT NULL,
  summary TEXT,
  priority INTEGER DEFAULT 3,    -- 1-5, higher = more important
  confidence NUMERIC,
  decision_type TEXT,            -- 'positioning', 'packaging', 'enablement', etc.
  source_refs JSONB,             -- URLs, document IDs
  source_schema TEXT,
  source_table TEXT,
  source_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `control_plane.packets`
Weekly intelligence packets generated by Control Plane.

```sql
CREATE TABLE control_plane.packets (
  id UUID PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  packet_title TEXT NOT NULL,
  exec_summary TEXT[] NOT NULL,
  sections JSONB NOT NULL,         -- messaging, narrative, icp, horizon, objection
  key_questions TEXT[],
  predictions_json JSONB,
  action_mapping_json JSONB,
  bets JSONB,
  artifacts_generated JSONB,
  status TEXT DEFAULT 'draft',     -- 'draft', 'live', 'published', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `objection_tracker.events`
Raw buyer objections collected from review sites and forums.

```sql
CREATE TABLE objection_tracker.events (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES objection_tracker.sources(id),
  external_id TEXT,                -- For deduplication
  raw_text TEXT NOT NULL,
  objection_text TEXT NOT NULL,
  category TEXT,                   -- 'price_value', 'complexity', 'risk', etc.
  severity INT,                    -- 1-5
  confidence NUMERIC,
  persona TEXT,
  segment TEXT,
  funnel_stage TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `gtm_artifacts.battlecard_versions`
Weekly competitor battlecards.

```sql
CREATE TABLE gtm_artifacts.battlecard_versions (
  id UUID PRIMARY KEY,
  competitor_name TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  content_md TEXT NOT NULL,        -- Markdown content
  included_signal_ids JSONB,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `ops.workflow_failures`
Dead-letter queue for failed workflow executions.

```sql
CREATE TABLE ops.workflow_failures (
  id UUID PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  failed_node TEXT,
  error_message TEXT,
  status TEXT DEFAULT 'failed',    -- 'failed', 'retried', 'resolved', 'ignored'
  retry_count INT DEFAULT 0,
  failed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Migrations

All migrations are in `/migrations/` and should be run in order:

| Migration | Purpose |
|-----------|---------|
| `phase0_signal_types.sql` | Base signal type enums |
| `phase0_page_types.sql` | Page type definitions |
| `phase0_feature_extraction.sql` | Feature extraction tables |
| `phase0_cost_telemetry.sql` | API cost tracking |
| `control_plane_schema.sql` | Core Control Plane schema |
| `control_plane_v1_upgrade.sql` | GTM memory, artifacts, enhanced signals |
| `objection_tracker_v1.sql` | Objection tracking schema |
| `phase2_pricing_tracker.sql` | Pricing change tracking |
| `phase2_proof_tracker.sql` | Trust/proof signal tracking |
| `phase2_hiring_tracker.sql` | Hiring signal tracking |
| `phase3_distribution_tracker.sql` | Integration tracking |
| `phase3_launch_decay_tracker.sql` | Launch momentum tracking |
| `phase4_experiment_surveillance.sql` | A/B test detection |
| `phase5_sector_packs.sql` | Industry-specific packs |
| `timezone_aware_multitenancy.sql` | Multi-timezone support |
| `phase7_dead_letter_queue.sql` | Ops monitoring, dead-letter queue |
| `admin_panel_phase1.sql` | Admin panel tables |
| `admin_panel_phase2_system_monitoring.sql` | System health tables |
| `admin_panel_phase3.sql` | Advanced admin features |
| `admin_panel_phase4.sql` | Feature flags, audit logs |

---

## 6. Backend: n8n Workflows

n8n is the workflow automation engine that powers all backend data collection and processing.

**Access URL:** https://replyra.app.n8n.cloud/projects/VQfJ9QnQVKeiGmRF/workflows

### Workflow Inventory

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| **Control Plane Weekly Packet** | Sunday 6PM UTC | Synthesizes weekly intelligence packet |
| **Ships Orchestrator** | Sunday 2PM UTC | Validates all ships ran successfully |
| **Horizon Lane v0** | Sunday 12AM UTC | Monitors competitor announcements |
| **Objection Tracker v2** | Every 6 hours | Fetches Reddit/G2 objections |
| **Objection Webhook Handler** | On webhook | Processes incoming objection events |
| **Distribution Tracker Weekly** | Weekly | Monitors integration ecosystem changes |
| **Launch Decay Tracker Weekly** | Weekly | Tracks post-launch momentum |
| **Experiment Surveillance Weekly** | Weekly | Detects competitor A/B tests |
| **Health Check Cron** | Every 15 min | System health monitoring |
| **Feature Extractor Test** | Manual | Tests feature extraction |

### Workflow Files
Located in `/n8n_workflows/`:
- `distribution_tracker_weekly.json`
- `experiment_surveillance_weekly.json`
- `feature_extractor_test.json`
- `launch_decay_tracker_weekly.json`
- `launch_detector_from_horizon.json`

Root-level workflow files:
- `control_plane_weekly_packet_workflow.json`
- `health_check_cron_workflow.json`
- `horizon_lane_v0_workflow.json`
- `objection_tracker_workflow.json`
- `objection_tracker_workflow_v2.json`
- `objection_webhook_workflow.json`

### Weekly Schedule (UTC)

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

## 7. Backend: Supabase Edge Functions

Edge Functions provide serverless API endpoints for specific operations.

**Location:** `/supabase/functions/`

### Function Inventory

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `admin-system-monitor` | `/admin-system-monitor` | System health checks for admin panel |
| `csv-upload` | `/csv-upload` | Bulk data upload via CSV |
| `email-send` | `/email-send` | Send transactional emails |
| `email-webhook` | `/email-webhook` | Receive email status webhooks |
| `notion-oauth-start` | `/notion-oauth-start` | Initiate Notion OAuth flow |
| `notion-oauth-callback` | `/notion-oauth-callback` | Handle Notion OAuth callback |
| `send-weekly-report` | `/send-weekly-report` | Send weekly packet via email |
| `slack-oauth-start` | `/slack-oauth-start` | Initiate Slack OAuth flow |
| `slack-oauth-callback` | `/slack-oauth-callback` | Handle Slack OAuth callback |
| `timezone-preferences` | `/timezone-preferences` | Manage organization timezones |

### Shared Utilities
Located in `/supabase/functions/_shared/`:
- `cors.ts` - CORS header handling
- `supabase.ts` - Supabase client initialization
- `oauth-helpers.ts` - OAuth flow utilities
- `oauth-state.ts` - OAuth state management

---

## 8. Frontend: React Application

The frontend is a React SPA built with Vite and TypeScript, using a terminal/hacker aesthetic.

### Directory Structure

```
src/
├── assets/                    # Static assets (images, fonts)
├── components/
│   ├── admin/                 # Admin panel components
│   ├── control-plane/         # Intelligence packet UI
│   │   └── artifacts/         # Artifact viewers
│   ├── landing/               # Marketing/landing page
│   └── ui/                    # shadcn/ui components
├── data/                      # Static data files
├── hooks/                     # Custom React hooks
├── integrations/
│   └── supabase/              # Supabase client & types
├── lib/                       # Utility functions
├── pages/
│   └── admin/                 # Admin page components
├── test/                      # Test utilities
└── types/                     # TypeScript type definitions
```

### Key Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Index.tsx` | Landing page / marketing |
| `/control-plane` | `ControlPlane.tsx` | Weekly intelligence packets |
| `/artifacts` | `Artifacts.tsx` | Battlecards, objection library, swipe file |
| `/login` | `Login.tsx` | Authentication |
| `/settings` | `Settings.tsx` | User preferences |
| `/admin` | `AdminDashboard.tsx` | Admin overview |
| `/admin/users` | `AdminUsers.tsx` | User management |
| `/admin/workflows` | `AdminWorkflows.tsx` | Workflow monitoring |
| `/admin/api-health` | `AdminApiHealth.tsx` | API status |
| `/admin/system-overview` | `AdminSystemOverview.tsx` | System metrics |
| `/admin/csv-upload` | `AdminCsvUpload.tsx` | Bulk data upload |
| `/admin/feature-flags` | `AdminFeatureFlags.tsx` | Feature toggles |
| `/admin/usage-reports` | `AdminUsageReports.tsx` | Usage analytics |
| `/admin/audit-log` | `AdminAuditLog.tsx` | Activity audit trail |

### Key Hooks

| Hook | Purpose |
|------|---------|
| `useReports.ts` | Fetches and manages intelligence packets |
| `useArtifacts.ts` | Fetches battlecards, objection library, swipe file |
| `useAuth.tsx` | Authentication state and methods |
| `useDeliveryPreferences.ts` | Email/Slack delivery settings |
| `useFeatureFlag.ts` | Feature flag checks |
| `useIsAdmin.ts` | Admin role verification |

### TypeScript Types

Located in `/src/types/`:

```typescript
// report.ts
export type PacketStatus = 'live' | 'published' | 'draft' | 'archived';

export interface IntelSection {
  summary: string;
  highlights: string[];
}

export interface Bet {
  hypothesis: string;
  confidence: number; // 0-100
  signal_ids: string[];
}

export interface IntelPacket {
  id: string;
  date: string;
  headline: string;
  exec_summary: string[];
  competitive_intel: IntelSection;
  pipeline_intel: IntelSection;
  market_intel: IntelSection;
  key_questions: string[];
  bets: Bet[];
  status: PacketStatus;
  created_at: string;
  metrics?: {
    signals_detected?: number;
    confidence_score?: number;
    impact_score?: number;
  };
}
```

---

## 9. The "Ships" Concept

Ships are autonomous data collection workflows that "sail out" on a schedule to gather specific types of intelligence.

### Active Ships

#### 1. Messaging Diff Tracker
- **Schedule:** Saturday 10:00 PM UTC
- **Source:** Competitor website homepages
- **Output:** `messaging` signals
- **Process:**
  1. Fetch latest snapshots from `page_snapshots`
  2. Compare with previous week's snapshots
  3. Detect changes in `page_diffs`
  4. Classify changes using LLM → `classified_changes`
  5. Emit high-priority changes as signals

#### 2. Narrative Drift Detector
- **Schedule:** Saturday 11:00 PM UTC
- **Source:** Industry news, analyst reports
- **Output:** `narrative` signals
- **Process:**
  1. Monitor industry news feeds
  2. Detect shifts in market narrative
  3. Identify new terminology or positioning trends
  4. Emit signals for significant narrative changes

#### 3. ICP Evolution Tracker
- **Schedule:** Sunday 12:00 AM UTC
- **Source:** Competitor customer pages, case studies
- **Output:** `icp` signals
- **Process:**
  1. Track changes to customer logos
  2. Monitor case study additions/removals
  3. Detect vertical expansion signals
  4. Identify persona targeting shifts

#### 4. Horizon Scanner
- **Schedule:** Sunday 12:00 AM UTC
- **Source:** News, funding announcements, product launches
- **Output:** `horizon` signals
- **Process:**
  1. Monitor competitor announcements
  2. Track funding/acquisition news
  3. Detect platform/technology shifts
  4. Identify market expansion signals

#### 5. Objection Tracker v2
- **Schedule:** Every 6 hours
- **Source:** Reddit, G2, Capterra reviews
- **Output:** `objection` signals
- **Process:**
  1. Fetch recent reviews/discussions via Apify
  2. Classify objections using LLM
  3. Detect trending objection patterns
  4. Emit signals for new/growing objections

### Planned Ships (Future)
- Pricing Drift Monitor
- Proof & Trust Monitor
- Distribution Move Monitor
- Hiring Signal Monitor
- Launch Decay Analyzer

---

## 10. Control Plane & Weekly Packets

The Control Plane is the brain of Signal Plane. It runs every Sunday at 6PM UTC and:

1. **Loads signals** from the past week (timezone-aware)
2. **Scores and selects** top signals per category using a weighted scoring algorithm
3. **Synthesizes** a weekly intelligence packet using Anthropic Claude
4. **Triggers builders** to generate sales enablement artifacts

### Packet Structure

```json
{
  "packet_title": "Week of Feb 3: Competitive Positioning Shifts Detected",
  "exec_summary": [
    "Competitor A launched new AI positioning...",
    "Market sentiment shifting toward...",
    "3 new objection patterns emerged...",
    "ICP expansion signals from..."
  ],
  "sections": {
    "messaging": {
      "summary": "Two competitors updated homepage messaging...",
      "highlights": ["...", "..."],
      "action_items": ["...", "..."]
    },
    "narrative": { /* ... */ },
    "icp": { /* ... */ },
    "horizon": { /* ... */ },
    "objection": { /* ... */ }
  },
  "key_questions": [
    "How should we respond to...",
    "Is this trend significant..."
  ],
  "predictions": [
    {
      "prediction": "Competitor will announce...",
      "confidence": 75,
      "timeframe": "2-4 weeks"
    }
  ],
  "action_mapping": {
    "this_week": ["Update battlecard for...", "Brief sales on..."],
    "monitor": ["Watch for follow-up from...", "Track customer reaction..."]
  },
  "bets": [
    {
      "hypothesis": "Competitor's new pricing will...",
      "confidence": 70,
      "signal_ids": ["uuid1", "uuid2"]
    }
  ]
}
```

### Builders

After packet generation, three builders run in parallel:

1. **Battlecards Builder** → `gtm_artifacts.battlecard_versions`
2. **Objection Library Builder** → `gtm_artifacts.objection_library_versions`
3. **Swipe File Builder** → `gtm_artifacts.swipe_file_versions`

---

## 11. How Data Flows Through the System

### End-to-End Flow

```
1. DATA COLLECTION (Ships)
   └── Competitor websites, Reddit, G2, news feeds
       └── Ships run on schedule (Saturday night → Sunday morning)
           └── Raw data → processed → classified
               └── Signals emitted to control_plane.signals

2. SIGNAL AGGREGATION (Control Plane)
   └── Sunday 2PM: Ships Orchestrator validates all ships ran
   └── Sunday 6PM: Control Plane loads week's signals
       └── Score & rank signals
       └── Call Anthropic to synthesize
       └── Generate weekly packet
           └── Save to control_plane.packets

3. ARTIFACT GENERATION (Builders)
   └── Battlecards, Objection Library, Swipe File
       └── Generated in parallel
       └── Saved to gtm_artifacts schema

4. DELIVERY
   └── Frontend: /control-plane displays packets
   └── Email: Weekly digest sent via send-weekly-report function
   └── Slack: (Planned) Weekly notification
```

### Signal Lifecycle

```
Raw Event
    │
    ▼
┌─────────────────┐
│  Ship Workflow  │  (n8n)
│  - Fetch data   │
│  - Process      │
│  - Classify     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  control_plane  │
│    .signals     │  (Supabase)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Control Plane  │  (n8n)
│  - Score        │
│  - Synthesize   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  control_plane  │
│    .packets     │  (Supabase)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Frontend     │  (React)
│  /control-plane │
└─────────────────┘
```

---

## 12. Deployment & Infrastructure

### GitHub Repositories

- **Frontend:** `VicUgochukwu/signalplane` (connected to Lovable)
- **Backend:** Supabase project `dnqjzgfunvbofsuibcsk`

### Supabase Project

- **Dashboard:** https://supabase.com/dashboard/project/dnqjzgfunvbofsuibcsk
- **API URL:** https://dnqjzgfunvbofsuibcsk.supabase.co
- **Edge Functions URL:** https://dnqjzgfunvbofsuibcsk.supabase.co/functions/v1/

### n8n Instance

- **URL:** https://replyra.app.n8n.cloud
- **Project:** VQfJ9QnQVKeiGmRF

### Lovable Project

- **Dashboard:** https://lovable.dev/projects/a1a233e9-7ce0-4511-863e-364983c3d37a
- **Live Site:** https://signalplane.dev

### Environment Variables

Required environment variables for local development:

```env
VITE_SUPABASE_URL=https://dnqjzgfunvbofsuibcsk.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

For Supabase Edge Functions:

```env
SUPABASE_URL=<project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ANTHROPIC_API_KEY=<anthropic-key>
RESEND_API_KEY=<resend-key>
SLACK_CLIENT_ID=<slack-client-id>
SLACK_CLIENT_SECRET=<slack-client-secret>
NOTION_CLIENT_ID=<notion-client-id>
NOTION_CLIENT_SECRET=<notion-client-secret>
```

---

## 13. Configuration & Environment

### Timezone Support

Signal Plane supports 51 IANA timezone identifiers stored in `public.supported_timezones`:

- **Americas:** US timezones, Brazil, Argentina, Chile, Colombia, Mexico
- **Europe:** London, Paris, Berlin, Amsterdam, Stockholm, etc.
- **Asia Pacific:** Tokyo, Singapore, Sydney, Hong Kong, Mumbai, etc.
- **Africa:** Lagos (WAT), Johannesburg
- **Middle East:** Dubai, Israel, Saudi Arabia

Organizations can set their preferred timezone, and the Control Plane will respect local week boundaries.

### Feature Flags

Feature flags are stored in `admin.feature_flags` and can be toggled via the admin panel:

```sql
SELECT * FROM admin.feature_flags;
-- flag_name | enabled | description
```

### Cost Tracking

API costs are tracked in `public.cost_telemetry`:

```sql
SELECT
  api_provider,
  SUM(cost_usd) as total_cost,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens
FROM public.cost_telemetry
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY api_provider;
```

---

## 14. Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase CLI (optional, for local development)

### Local Development

```bash
# Clone the repository
git clone https://github.com/VicUgochukwu/signalplane.git
cd signalplane

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Database Migrations

Migrations should be run in Supabase SQL Editor in order:

1. Start with `phase0_*.sql` files
2. Then `control_plane_schema.sql`
3. Then `control_plane_v1_upgrade.sql`
4. Then `objection_tracker_v1.sql`
5. Continue with phase files in numerical order
6. Finally, admin panel migrations

### n8n Workflow Import

1. Go to n8n dashboard
2. Create new workflow
3. Import JSON from workflow files
4. Configure credentials (Supabase Postgres, Anthropic, Apify)
5. Publish and activate

---

## 15. Key Files Reference

### Database
| File | Purpose |
|------|---------|
| `control_plane_schema.sql` | Core Control Plane schema |
| `migrations/*.sql` | All database migrations |

### n8n Code
| File | Purpose |
|------|---------|
| `n8n_code/score_and_select_signals_v2.js` | Signal scoring algorithm |
| `n8n_code/builder_*.js` | Builder workflow code |
| `n8n_code/parse_*.js` | Output parsers |
| `n8n_code/upsert_packet_*.sql` | Packet upsert queries |

### Frontend
| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app component with routing |
| `src/pages/ControlPlane.tsx` | Intelligence packet page |
| `src/hooks/useReports.ts` | Packet data fetching |
| `src/types/report.ts` | TypeScript types |

### Documentation
| File | Purpose |
|------|---------|
| `docs/SIGNAL_FLOW_ARCHITECTURE.md` | Architecture diagrams |
| `docs/PHASE7_ORCHESTRATION_IMPROVEMENTS.md` | Ops documentation |
| `docs/CONTROL_PLANE_V2_IMPLEMENTATION_PLAN.md` | Implementation plan |
| `lovable_prompts/*.md` | Prompts for Lovable AI |

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **Ship** | An automated workflow that collects a specific type of intelligence |
| **Signal** | A discrete piece of intelligence with type, priority, and confidence |
| **Control Plane** | The central orchestration system that aggregates and synthesizes signals |
| **Packet** | A weekly intelligence report containing synthesized signals |
| **Builder** | A workflow that generates sales enablement artifacts |
| **Battlecard** | A competitive intelligence document for a specific competitor |
| **Objection Library** | A collection of buyer objections with responses |
| **Swipe File** | A collection of effective buyer phrases and messaging |
| **GTM** | Go-To-Market (sales and marketing strategy) |
| **ICP** | Ideal Customer Profile |
| **VoC** | Voice of Customer (buyer feedback from reviews, forums, etc.) |

---

## 17. Troubleshooting

### Common Issues

#### Workflow not running
1. Check n8n workflow is published (green badge)
2. Verify credentials are configured
3. Check execution logs in n8n

#### No signals appearing
1. Verify ship workflows are active
2. Check `control_plane.signals` table
3. Look for errors in `ops.workflow_failures`

#### Packet not generating
1. Check Ships Orchestrator ran (Sunday 2PM)
2. Verify signals exist for the week
3. Check Control Plane workflow logs

#### Frontend not loading data
1. Check Supabase connection
2. Verify API key is correct
3. Check browser console for errors

### Monitoring

Use the admin panel at `/admin/system-overview` to monitor:
- System health status
- Ship execution status
- Recent workflow failures
- Budget/cost alerts

### Recovery Procedures

| Scenario | Recovery |
|----------|----------|
| Ship failure | Re-run failed ship, then re-run Orchestrator |
| API timeout | Wait 5 minutes, retry workflow |
| Database connection error | Check Supabase status, retry |
| Control Plane failure | Re-run before Monday AM |

---

## 18. Future Roadmap

### Planned Features

1. **More Ships**
   - Pricing Drift Monitor
   - Proof & Trust Monitor
   - Distribution Move Monitor
   - Hiring Signal Monitor
   - Launch Decay Analyzer

2. **Enhanced Delivery**
   - Slack integration for weekly notifications
   - Notion sync for artifacts
   - Custom webhook delivery

3. **Multi-tenancy**
   - Organization-level isolation
   - Per-org competitor configuration
   - Custom ship schedules

4. **Analytics**
   - Signal trend analysis
   - Prediction accuracy tracking
   - Competitive timeline view

5. **AI Improvements**
   - Better signal deduplication
   - Automated importance weighting
   - Trend detection across weeks

---

## Contact & Support

- **Product Owner:** Victor Ugochukwu
- **Email:** victor@signalplane.dev
- **Website:** https://signalplane.dev

---

*This documentation is auto-generated and maintained as part of the Signal Plane project. Last updated: February 7, 2026.*
