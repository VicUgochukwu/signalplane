# Control Plane v1 Upgrade Runbook

## Overview
This runbook covers the implementation of the Control Plane v1 upgrade including:
- GTM Memory (knowledge that compounds)
- 3 Builders (Objection Library, Swipe File, Battlecards)
- Judgment Loop (predictions tracking)
- Action Mapping (decision_type, owner, timing)
- Enhanced scoring logic

---

## Prerequisites
- [ ] Supabase project access
- [ ] n8n instance access
- [ ] Anthropic API key configured in n8n
- [ ] Lovable project access

---

## Step 1: Database Migrations

### 1.1 Run the main migration
Open Supabase SQL Editor and run:
```
migrations/control_plane_v1_upgrade.sql
```

This creates:
- `gtm_memory` schema with `knowledge_items` and `knowledge_mentions` tables
- `gtm_artifacts` schema with version tables for each builder
- New columns on `control_plane.signals` (action mapping fields)
- New columns on `control_plane.packets` (predictions, artifacts)
- Helper functions for scoring and knowledge upsert

### 1.2 Verify migration
Run these checks:
```sql
-- Check schemas exist
SELECT schema_name FROM information_schema.schemata
WHERE schema_name IN ('gtm_memory', 'gtm_artifacts');

-- Check new signal columns
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'control_plane' AND table_name = 'signals'
AND column_name IN ('decision_type', 'recommended_asset', 'owner_team', 'time_sensitivity', 'promo_score');

-- Check new packet columns
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'control_plane' AND table_name = 'packets'
AND column_name IN ('predictions_json', 'resolved_predictions_json', 'artifacts_generated');

-- Test scoring function
SELECT control_plane.compute_signal_score(4, 0.8, now() - interval '2 days', 'high');
-- Should return ~75-85
```

---

## Step 2: Update n8n Workflow

### 2.1 Update "Score + Select Top Signals" node

1. Open the `ControlPlane_v1_WeeklyPacket` workflow in n8n
2. Double-click "Score + Select Top Signals" node
3. Replace the code with contents of:
   ```
   n8n_code/score_and_select_signals_v2.js
   ```
4. Save the node

**Key changes:**
- Actual scoring algorithm (severity + recency + confidence + source quality)
- Action mapping inference (decision_type, recommended_asset, owner_team, time_sensitivity)
- Per-ship caps from upgrade plan (messaging:8, narrative:5, icp:5, horizon:3)
- Enhanced Anthropic prompt requesting predictions

### 2.2 Update "Parse Packet JSON" node

After the Anthropic response, ensure the parse handles new fields:
```javascript
const response = $input.first().json;
const content = response.content[0].text;
const packet = JSON.parse(content);

// Validate predictions exist
if (!packet.predictions || !Array.isArray(packet.predictions)) {
  packet.predictions = [];
}

// Validate action_mapping exists
if (!packet.action_mapping) {
  packet.action_mapping = { this_week: [], monitor: [] };
}

return [{ json: { packet, ...otherFields } }];
```

### 2.3 Update "Upsert Packet" query

Add the new fields:
```sql
=INSERT INTO control_plane.packets (
  week_start, week_end, packet_title, exec_summary, sections,
  key_questions, bets, predictions_json
)
VALUES (
  '{{ $json.week_start }}'::date,
  '{{ $json.week_end }}'::date,
  '{{ $json.packet.packet_title.replace(/'/g, "''") }}',
  ARRAY[{{ $json.packet.exec_summary.map(s => "'" + s.replace(/'/g, "''") + "'").join(',') }}],
  '{{ JSON.stringify($json.packet.sections).replace(/'/g, "''") }}'::jsonb,
  ARRAY[{{ $json.packet.key_questions.map(q => "'" + q.replace(/'/g, "''") + "'").join(',') }}],
  '{{ JSON.stringify($json.packet.bets || []).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($json.packet.predictions || []).replace(/'/g, "''") }}'::jsonb
)
ON CONFLICT (week_start, week_end) DO UPDATE
SET packet_title = EXCLUDED.packet_title,
    exec_summary = EXCLUDED.exec_summary,
    sections = EXCLUDED.sections,
    key_questions = EXCLUDED.key_questions,
    bets = EXCLUDED.bets,
    predictions_json = EXCLUDED.predictions_json
RETURNING id;
```

### 2.4 Add Builder Sub-workflows

Create 3 new workflows (or add as branches after packet creation):

**Builder 1: Objection Library**
- Code node: `n8n_code/builder_objection_library.js`
- HTTP Request to Anthropic
- Parse JSON response
- Insert into `gtm_artifacts.objection_library_versions`

**Builder 2: Swipe File**
- Code node: `n8n_code/builder_swipe_file.js`
- HTTP Request to Anthropic
- Parse JSON response
- Insert into `gtm_artifacts.swipe_file_versions`

**Builder 3: Battlecards**
- Code node: `n8n_code/builder_battlecards.js`
- HTTP Request to Anthropic
- Parse JSON response
- Insert into `gtm_artifacts.battlecard_versions` (one row per competitor)

### 2.5 Link artifacts to packet

After all builders complete, update the packet:
```sql
UPDATE control_plane.packets
SET artifacts_generated = '{
  "objection_library_id": "{{ $json.objection_library_id }}",
  "swipe_file_id": "{{ $json.swipe_file_id }}",
  "battlecard_ids": {{ JSON.stringify($json.battlecard_ids) }}
}'::jsonb
WHERE id = '{{ $json.packet_id }}';
```

---

## Step 3: Update Lovable UI

### 3.1 Add Artifacts pages
Use prompt: `lovable_prompts/artifacts_ui_prompt.md`

Key pages to create:
- `/artifacts` - Overview with tabs
- `/artifacts/objections` - Objection Library detail
- `/artifacts/swipe-file` - Swipe File detail
- `/artifacts/battlecards` - Battlecards by competitor

### 3.2 Enhance Packet Detail
Use prompt: `lovable_prompts/packet_detail_ui_prompt.md`

Key additions:
- Predictions section
- Resolved predictions from previous week
- Links to generated artifacts
- Resolution modal for predictions

### 3.3 Update Navigation
Add "Artifacts" section to sidebar with sub-items.

---

## Step 4: Test End-to-End

### 4.1 Run workflow manually
1. Go to n8n workflow
2. Click "Execute workflow"
3. Monitor logs for each step

### 4.2 Verify outputs

**Check packet has predictions:**
```sql
SELECT id, predictions_json, artifacts_generated
FROM control_plane.packets
ORDER BY created_at DESC
LIMIT 1;
```

**Check artifacts generated:**
```sql
SELECT * FROM gtm_artifacts.objection_library_versions
ORDER BY created_at DESC LIMIT 1;

SELECT * FROM gtm_artifacts.swipe_file_versions
ORDER BY created_at DESC LIMIT 1;

SELECT * FROM gtm_artifacts.battlecard_versions
ORDER BY created_at DESC LIMIT 3;
```

**Check signals have action mapping:**
```sql
SELECT id, title, decision_type, recommended_asset, owner_team, time_sensitivity, promo_score
FROM control_plane.signals
WHERE is_processed = TRUE
ORDER BY created_at DESC
LIMIT 10;
```

---

## Step 5: Activate Cron Schedule

Once testing passes:
1. Enable the Cron Weekly trigger in n8n
2. Set to Monday 07:00 (or preferred time)
3. Monitor first automated run

---

## Rollback Procedure

If issues occur:

### Rollback database
```sql
-- Drop new schemas (CAUTION: destroys data)
DROP SCHEMA IF EXISTS gtm_memory CASCADE;
DROP SCHEMA IF EXISTS gtm_artifacts CASCADE;

-- Remove new columns from signals
ALTER TABLE control_plane.signals
DROP COLUMN IF EXISTS decision_type,
DROP COLUMN IF EXISTS recommended_asset,
DROP COLUMN IF EXISTS owner_team,
DROP COLUMN IF EXISTS time_sensitivity,
DROP COLUMN IF EXISTS promo_score,
DROP COLUMN IF EXISTS summary_short;

-- Remove new columns from packets
ALTER TABLE control_plane.packets
DROP COLUMN IF EXISTS predictions_json,
DROP COLUMN IF EXISTS resolved_predictions_json,
DROP COLUMN IF EXISTS artifacts_generated;
```

### Rollback n8n
Restore previous Code node from:
```
/tmp/n8n_code.js (if backed up)
```
Or revert to the simpler scoring logic.

---

## Maintenance

### Weekly checks
- [ ] Verify packet generated with predictions
- [ ] Verify all 3 artifacts generated
- [ ] Review prediction accuracy over time

### Monthly checks
- [ ] Review knowledge_items growth
- [ ] Prune duplicate/stale knowledge
- [ ] Analyze builder output quality

### Quarterly
- [ ] Review caps (per-ship, per-builder)
- [ ] Adjust scoring weights if needed
- [ ] Add new objection categories if patterns emerge

---

## File Reference

| File | Purpose |
|------|---------|
| `migrations/control_plane_v1_upgrade.sql` | All database migrations |
| `n8n_code/score_and_select_signals_v2.js` | Enhanced scoring + action mapping |
| `n8n_code/builder_objection_library.js` | Objection Library builder |
| `n8n_code/builder_swipe_file.js` | Swipe File builder |
| `n8n_code/builder_battlecards.js` | Battlecards builder |
| `lovable_prompts/artifacts_ui_prompt.md` | Lovable prompt for artifacts pages |
| `lovable_prompts/packet_detail_ui_prompt.md` | Lovable prompt for enhanced packet detail |

---

## Troubleshooting

### "Invalid JSON from Anthropic"
- Check the system prompt enforces strict JSON
- Increase max_tokens if response is truncated
- Add retry logic with lower temperature

### "No predictions in packet"
- Verify the prompt includes prediction request
- Check Parse Packet JSON handles missing predictions

### "Builders not running"
- Check workflow connections after Upsert Packet
- Verify packet_id is passed to builder inputs

### "Artifacts not linked to packet"
- Check the final UPDATE query runs after all builders
- Verify artifact IDs are captured correctly

---

## Support

If issues persist:
1. Check n8n execution logs
2. Check Supabase query logs
3. Review Anthropic API responses for malformed JSON
