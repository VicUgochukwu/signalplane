# Lovable UI Prompt: Enhanced Packet Detail Page

## Context
We're enhancing the existing packet detail page to show:
1. Predictions (judgment loop)
2. Links to generated artifacts
3. Resolved predictions from previous packets

## Database Changes
```sql
-- control_plane.packets (new fields)
predictions_json JSONB  -- list of {hypothesis, what_to_watch, signal_ids, confidence, timeframe}
resolved_predictions_json JSONB  -- list of {hypothesis, outcome, evidence_urls, resolved_at}
artifacts_generated JSONB  -- {objection_library_id, swipe_file_id, battlecard_ids}
```

---

## Enhanced Packet Detail Page (/packets/:id)

### New Sections to Add

#### 1. Predictions Section
Display after the main packet content.

```
+------------------------------------------+
| Predictions for This Week          [2-5] |
+------------------------------------------+
| ┌────────────────────────────────────┐   |
| │ 🎯 High Confidence                  │   |
| │ "Competitor X will announce pricing │   |
| │  changes within 2 weeks"            │   |
| │                                     │   |
| │ What to watch: Pricing page, blog   │   |
| │ Based on: [signal] [signal]         │   |
| │ Timeframe: Next 2 weeks             │   |
| └────────────────────────────────────┘   |
|                                          |
| ┌────────────────────────────────────┐   |
| │ 🔮 Medium Confidence                │   |
| │ "Enterprise segment will show       │   |
| │  increased interest in security"    │   |
| │ ...                                 │   |
| └────────────────────────────────────┘   |
+------------------------------------------+
```

**Card Structure:**
- Confidence badge (🎯 High, 🔮 Medium, ❓ Low)
- Hypothesis text (prominent)
- "What to watch" field
- Linked signals (clickable)
- Timeframe

#### 2. Resolved Predictions (from previous week)
Show at the top if there are resolved predictions.

```
+------------------------------------------+
| Resolved Predictions (from last week)    |
+------------------------------------------+
| ✅ CORRECT: "Competitor X pricing..."    |
|    Outcome: They announced 15% increase  |
|    Evidence: [link] [link]               |
+------------------------------------------+
| ❌ INCORRECT: "Enterprise interest..."   |
|    Outcome: No significant change        |
|    Learning: Signals were too noisy      |
+------------------------------------------+
```

**Resolution States:**
- ✅ Correct (green)
- ❌ Incorrect (red)
- ⏳ Partially correct (amber)
- 🔄 Still monitoring (gray)

#### 3. Generated Artifacts Section
Link to the artifacts generated from this packet.

```
+------------------------------------------+
| Generated Artifacts                      |
+------------------------------------------+
| 📋 Objection Library (12 objections)     |
|    → View Objection Library              |
+------------------------------------------+
| 💬 Swipe File (28 phrases)               |
|    → View Swipe File                     |
+------------------------------------------+
| ⚔️ Battlecards (3 competitors)           |
|    → Competitor A | Competitor B | C     |
+------------------------------------------+
```

---

## Component Specifications

### PredictionCard
```tsx
interface PredictionCardProps {
  prediction: {
    hypothesis: string;
    what_to_watch: string;
    signal_ids: string[];
    confidence: 'low' | 'medium' | 'high';
    timeframe: string;
  };
  signals: Signal[];  // Resolved from signal_ids
}
```

### ResolvedPredictionCard
```tsx
interface ResolvedPredictionCardProps {
  prediction: {
    hypothesis: string;
    outcome: string;
    evidence_urls: string[];
    resolved_at: string;
    status: 'correct' | 'incorrect' | 'partial' | 'monitoring';
  };
}
```

### ArtifactsLinksSection
```tsx
interface ArtifactsLinksSectionProps {
  artifacts: {
    objection_library_id?: string;
    swipe_file_id?: string;
    battlecard_ids?: string[];
  };
  packetWeekStart: string;
  packetWeekEnd: string;
}
```

---

## Interaction: Resolving Predictions

Add ability for user to resolve predictions from previous weeks.

### Resolution Modal
```
+------------------------------------------+
| Resolve Prediction                       |
+------------------------------------------+
| Hypothesis:                              |
| "Competitor X will announce pricing..."  |
+------------------------------------------+
| What happened?                           |
| [________________________]               |
| [________________________]               |
+------------------------------------------+
| Outcome:                                 |
| ( ) ✅ Correct - prediction came true    |
| ( ) ❌ Incorrect - prediction was wrong  |
| ( ) ⏳ Partial - partly correct          |
| ( ) 🔄 Still monitoring                  |
+------------------------------------------+
| Evidence URLs (optional):                |
| [________________________]               |
| [+ Add another]                          |
+------------------------------------------+
|              [Cancel] [Save Resolution]  |
+------------------------------------------+
```

### Data Flow
1. User clicks "Resolve" on unresolved prediction
2. Modal opens with prediction details
3. User enters outcome and status
4. On save:
   - Add to `resolved_predictions_json` in current packet
   - Update knowledge_items if applicable

---

## Supabase Queries

### Get Packet with Predictions
```typescript
const { data } = await supabase
  .from('control_plane.packets')
  .select(`
    *,
    packet_items (
      signal_id,
      signals:control_plane.signals (*)
    )
  `)
  .eq('id', packetId)
  .single();
```

### Get Unresolved Predictions (for resolution)
```typescript
// Get predictions from previous week's packet
const { data } = await supabase
  .from('control_plane.packets')
  .select('id, predictions_json, week_start, week_end')
  .lt('week_end', currentWeekStart)
  .not('predictions_json', 'is', null)
  .order('week_end', { ascending: false })
  .limit(1);
```

### Update Resolved Predictions
```typescript
const { error } = await supabase
  .from('control_plane.packets')
  .update({
    resolved_predictions_json: [
      ...existingResolved,
      {
        hypothesis: prediction.hypothesis,
        outcome: userOutcome,
        status: userStatus,
        evidence_urls: userEvidence,
        resolved_at: new Date().toISOString()
      }
    ]
  })
  .eq('id', packetId);
```

---

## Navigation Updates

Add to sidebar/nav:
- "Artifacts" section with sub-items:
  - Objection Library
  - Swipe File
  - Battlecards

Update packet list to show:
- Prediction count badge
- Artifacts generated indicator

---

## Implementation Order
1. Add PredictionCard component
2. Add predictions section to packet detail
3. Add ResolvedPredictionCard component
4. Add resolution modal and flow
5. Add ArtifactsLinksSection
6. Update navigation
