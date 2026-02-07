# Objection Tracker v1 - Runbook

## Overview

Objection Tracker is a ship that monitors public VoC (Voice of Customer) surfaces to detect, classify, and track buyer objections. It emits signals to `control_plane.signals` with `signal_type = 'objection'` for the Living Objection Library Builder to consume.

### Features
1. **Multi-source monitoring** - G2, Capterra, TrustRadius, Reddit, Twitter, etc.
2. **AI-powered classification** - Anthropic Claude classifies objections into categories
3. **Trend detection** - Tracks rising/fading objections over 7/30/90 day windows
4. **Drift detection** - Alerts when objection patterns shift significantly
5. **Knowledge integration** - Links to `gtm_memory.knowledge_items`

---

## Installation

### Step 1: Run Database Migration

Execute in Supabase SQL Editor:

```sql
-- Run the full migration file
\i migrations/objection_tracker_v1.sql
```

Or copy/paste the contents of `migrations/objection_tracker_v1.sql` into the SQL Editor.

This creates:
- `objection_tracker` schema
- `objection_tracker.sources` - VoC source configuration
- `objection_tracker.events` - Individual objection occurrences
- `objection_tracker.patterns` - Aggregated objection patterns
- `objection_tracker.trend_snapshots` - Weekly snapshots for drift detection
- Helper functions for trend computation and pattern upserts
- Adds `'objection'` to `control_plane.signals.signal_type` constraint

### Step 2: Import n8n Workflow

1. Open n8n
2. Click **Import** (top right)
3. Select `objection_tracker_workflow.json`
4. Configure credentials:
   - **Supabase Postgres**: Your existing Postgres credential
   - **Anthropic API**: Your existing Anthropic credential (x-api-key header auth)

### Step 3: Configure Sources

The migration seeds default sources. To customize:

```sql
-- Add a new source
INSERT INTO objection_tracker.sources (
  source_name,
  source_type,
  fetch_method,
  source_quality,
  fetch_frequency_hours
) VALUES (
  'Product Hunt Reviews',
  'review_site',
  'scrape',
  'medium',
  24
);

-- Disable a source
UPDATE objection_tracker.sources
SET enabled = false
WHERE source_name = 'Twitter/X Mentions';
```

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBJECTION TRACKER SHIP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  VoC Sources │───▶│  Classify    │───▶│   Events     │       │
│  │  (G2, Reddit │    │  (Anthropic) │    │   Table      │       │
│  │  etc.)       │    │              │    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 ▼                │
│                      ┌──────────────┐    ┌──────────────┐       │
│                      │   Pattern    │◀───│   Upsert     │       │
│                      │   Table      │    │   Function   │       │
│                      └──────────────┘    └──────────────┘       │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Drift      │◀───│   Trend      │───▶│   Emit       │       │
│  │   Detection  │    │   Analysis   │    │   Signals    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
└─────────────────────────────────────────────────│────────────────┘
                                                  │
                                                  ▼
                                    ┌───────────────────────┐
                                    │ control_plane.signals │
                                    │ (signal_type='objection')│
                                    └───────────────────────┘
```

### Workflow Triggers

1. **Every 6 hours**: Fetch new items from enabled sources → Classify → Insert events
2. **Weekly (Monday 7am)**: Trend analysis → Drift detection → Emit signals → Create snapshot

---

## Objection Categories

| Category | Description | Example |
|----------|-------------|---------|
| `price_value` | Cost concerns, ROI unclear | "Too expensive for what it does" |
| `timing` | Not the right time | "We're not ready to switch yet" |
| `complexity` | Implementation/learning curve | "Looks too complicated to set up" |
| `risk` | Security, compliance, vendor risk | "Concerned about data security" |
| `fit` | Wrong solution, feature gaps | "Doesn't integrate with our stack" |
| `competition` | Competitor is better | "We prefer [Competitor]" |
| `inertia` | Current solution works | "Our current tool works fine" |
| `authority` | Need buy-in from others | "I need to check with my manager" |
| `trust` | Vendor/product concerns | "Not sure about long-term support" |

---

## Signal Output

Objection Tracker emits signals with:

```json
{
  "signal_type": "objection",
  "severity": 1-5,
  "title": "Rising objection trend: price_value",
  "summary": "\"Too expensive\" - rising trend with 5 occurrences this week",
  "evidence_urls": ["url1", "url2"],
  "source_schema": "objection_tracker",
  "source_table": "patterns",
  "source_id": "pattern-uuid",
  "decision_type": "enablement",
  "recommended_asset": "talk_track",
  "owner_team": "sales",
  "time_sensitivity": "this_week|monitor",
  "meta": {
    "category": "price_value",
    "trend": "rising",
    "signal_reason": "Rising trend|New objection|High severity spike"
  }
}
```

### Signal Triggers

| Trigger | Description | Priority |
|---------|-------------|----------|
| New objection | First time seeing this objection | Highest |
| Rising trend | Objection increasing (3+ in 7 days) | High |
| High severity spike | Avg severity ≥4 with 2+ occurrences | Medium |
| Drift detected | Significant shift in category mix | High |

---

## Implementing Source Fetchers

The workflow includes a placeholder `Fetch Source Items` node. Implement actual fetching per source type:

### RSS Sources
```javascript
const source = $input.first().json;
const Parser = require('rss-parser');
const parser = new Parser();
const feed = await parser.parseURL(source.url_pattern);

return [{
  json: {
    source_id: source.id,
    source_name: source.source_name,
    items: feed.items.map(item => ({
      external_id: item.guid || item.link,
      raw_text: item.contentSnippet || item.content,
      source_url: item.link,
      source_date: item.pubDate
    }))
  }
}];
```

### API Sources (Reddit)
```javascript
const source = $input.first().json;
const response = await fetch(`https://www.reddit.com/${source.url_pattern}.json`);
const data = await response.json();

return [{
  json: {
    source_id: source.id,
    source_name: source.source_name,
    items: data.data.children.map(post => ({
      external_id: post.data.id,
      raw_text: post.data.title + ' ' + (post.data.selftext || ''),
      source_url: `https://reddit.com${post.data.permalink}`,
      source_author: post.data.author,
      source_date: new Date(post.data.created_utc * 1000).toISOString()
    }))
  }
}];
```

---

## Monitoring & Debugging

### Check Recent Events
```sql
SELECT
  category,
  objection_text,
  severity,
  source_url,
  detected_at
FROM objection_tracker.events
ORDER BY detected_at DESC
LIMIT 20;
```

### Check Pattern Trends
```sql
SELECT
  canonical_text,
  category,
  trend,
  count_last_7_days,
  count_last_30_days,
  avg_severity
FROM objection_tracker.patterns
WHERE trend = 'rising'
ORDER BY count_last_7_days DESC;
```

### Check Emitted Signals
```sql
SELECT
  title,
  summary,
  severity,
  time_sensitivity,
  created_at
FROM control_plane.signals
WHERE signal_type = 'objection'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Drift History
```sql
SELECT
  week_start,
  total_events,
  new_objections_detected,
  drift_score,
  category_counts
FROM objection_tracker.trend_snapshots
ORDER BY week_start DESC
LIMIT 5;
```

---

## Constraints & Caps

| Constraint | Value | Reason |
|------------|-------|--------|
| Max signals/week | 8 | Prevent noise |
| Max evidence URLs | 2 | Per spec |
| Trend threshold | ±2 | Score for rising/fading |
| Drift threshold | 15% | Category proportion shift |

---

## Integration with Living Objection Library Builder

The Builder A workflow queries signals from `control_plane.signals` where `signal_type IN ('messaging', 'narrative', 'icp')`. To include objection signals:

1. Update Builder A's query to include `'objection'`:
```sql
WHERE signal_type IN ('messaging', 'narrative', 'icp', 'objection')
```

2. The Builder will now see objection patterns alongside other signals, enriching the Living Objection Library with real-time VoC data.

---

## Files Reference

| File | Purpose |
|------|---------|
| `migrations/objection_tracker_v1.sql` | Database schema |
| `objection_tracker_workflow.json` | n8n workflow |
| `n8n_code/objection_tracker_classify.js` | Classification prompt builder |
| `n8n_code/objection_tracker_parse_classification.js` | Response parser |
| `n8n_code/objection_tracker_trend_analysis.js` | Trend/drift analysis |
| `n8n_code/objection_tracker_emit_signals.js` | Signal emitter |
