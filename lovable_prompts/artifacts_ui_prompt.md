# Lovable UI Prompt: GTM Artifacts Pages

## Context
We're adding an Artifacts section to the Control Plane UI. This displays:
1. Objection Library (weekly versioned)
2. Buyer Swipe File (weekly versioned)
3. Battlecards (per competitor, weekly versioned)

These are generated weekly by AI builders from GTM signals.

## Database Tables (Supabase)
```sql
-- gtm_artifacts.objection_library_versions
id, week_start, week_end, content_md, included_signal_ids, objection_count, created_at

-- gtm_artifacts.swipe_file_versions
id, week_start, week_end, content_md, included_signal_ids, phrase_count, created_at

-- gtm_artifacts.battlecard_versions
id, competitor_name, week_start, week_end, content_md, included_signal_ids, what_changed_summary, created_at
```

---

## Page 1: Artifacts Overview (/artifacts)

### Requirements
1. Navigation tabs: "Objection Library" | "Swipe File" | "Battlecards"
2. Each tab shows:
   - Latest version (default view)
   - Version history dropdown (previous weeks)
3. Header shows:
   - "Week of [date] - [date]"
   - Last updated timestamp
   - "Copy as Markdown" button
4. Content area renders markdown beautifully

### Design
- Clean, documentation-style layout
- Use shadcn/ui components
- Responsive: works on mobile for quick reference
- Dark mode support

### Wireframe
```
+------------------------------------------+
| Artifacts                    [Copy MD]   |
+------------------------------------------+
| [Objection Library] [Swipe File] [Battlecards] |
+------------------------------------------+
| Week of Jan 26 - Feb 1, 2026             |
| Last updated: Feb 3, 2026 07:15 AM       |
| Version: [v3 (latest) ▼]                 |
+------------------------------------------+
|                                          |
|  [Rendered Markdown Content]             |
|                                          |
|  ## Price/Value Objections               |
|  ...                                     |
|                                          |
+------------------------------------------+
```

---

## Page 2: Objection Library Detail

### Sections to Display (from content_md JSON)
1. **Summary Card**
   - Total objections
   - New this week (highlighted)
   - Top category
   - Trending up/down

2. **Objection Cards** (grouped by category)
   - Category header (e.g., "Price/Value")
   - Each objection:
     - Objection text (buyer's words)
     - Frequency badge (high/medium/low)
     - Personas who raise it
     - Segments where common
     - Rebuttal accordion:
       - Acknowledge
       - Reframe
       - Proof
       - Talk track
     - Evidence links (max 2)
     - "New" badge if new_this_week

### Actions
- Copy individual rebuttal to clipboard
- Link to source signals (opens signal detail modal)

---

## Page 3: Swipe File Detail

### Sections to Display
1. **Summary Card**
   - Total phrases
   - By persona breakdown
   - By category breakdown
   - New this week

2. **Filter Controls**
   - By persona (multi-select)
   - By category (multi-select)
   - By funnel stage
   - Show new only toggle

3. **Phrase Cards**
   - The phrase itself (prominent, quotation style)
   - Category badge
   - Persona badge
   - Segment + funnel stage
   - Usage context
   - Trend indicator (↑ rising, → stable, ↓ fading)
   - "New" badge if applicable

### Actions
- Copy phrase to clipboard
- Bulk copy filtered phrases

---

## Page 4: Battlecards

### Sections to Display
1. **Competitor Selector**
   - Cards or tabs for each competitor
   - "Changes this week" count badge

2. **Battlecard Content** (per competitor)
   - What Changed This Week (delta section, highlighted)
     - Change → Implication → Counter-move
   - Talk Tracks
     - Scenario cards with opener + key points + proof
   - Landmines (warning style)
     - What to avoid + why + alternative
   - Win Themes (green)
   - Lose Themes (red/amber)
   - Ideal Battleground

### Actions
- Copy battlecard as markdown
- "Quick view" modal for use during calls

---

## Component Specifications

### VersionSelector
```tsx
interface VersionSelectorProps {
  versions: { id: string; week_start: string; week_end: string; created_at: string }[];
  selectedId: string;
  onChange: (id: string) => void;
}
```

### ArtifactHeader
```tsx
interface ArtifactHeaderProps {
  title: string;
  weekStart: string;
  weekEnd: string;
  updatedAt: string;
  onCopyMarkdown: () => void;
}
```

### ObjectionCard
```tsx
interface ObjectionCardProps {
  objection: {
    category: string;
    objection_text: string;
    frequency: 'high' | 'medium' | 'low';
    personas: string[];
    segments: string[];
    rebuttal: {
      acknowledge: string;
      reframe: string;
      proof: string;
      talk_track: string;
    };
    evidence_urls: string[];
    is_new_this_week: boolean;
  };
  onCopyRebuttal: () => void;
}
```

### PhraseCard
```tsx
interface PhraseCardProps {
  phrase: {
    phrase: string;
    category: string;
    persona: string;
    segment: string;
    funnel_stage: string;
    usage_context: string;
    is_new_this_week: boolean;
    trend: 'rising' | 'stable' | 'fading';
  };
  onCopy: () => void;
}
```

### BattlecardSection
```tsx
interface BattlecardSectionProps {
  competitor: string;
  changes: ChangeItem[];
  talkTracks: TalkTrack[];
  landmines: Landmine[];
  winThemes: string[];
  loseThemes: string[];
  idealBattleground: string;
}
```

---

## Supabase Queries

### Get Latest Objection Library
```typescript
const { data } = await supabase
  .from('gtm_artifacts.objection_library_versions')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### Get Version History
```typescript
const { data } = await supabase
  .from('gtm_artifacts.objection_library_versions')
  .select('id, week_start, week_end, created_at, objection_count')
  .order('created_at', { ascending: false })
  .limit(10);
```

### Get Battlecards by Competitor
```typescript
const { data } = await supabase
  .from('gtm_artifacts.battlecard_versions')
  .select('*')
  .eq('competitor_name', competitorName)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

---

## Styling Notes
- Use `prose` class from Tailwind Typography for markdown rendering
- Category badges: use consistent color coding
- Frequency: high=red, medium=amber, low=green
- Trend arrows: rising=green↑, stable=gray→, fading=red↓
- "New" badges: bright accent color, subtle animation
- Landmines: red/warning background
- Win themes: green tint
- Lose themes: amber tint

---

## Implementation Order
1. Create ArtifactLayout component with tabs
2. Add VersionSelector component
3. Implement ObjectionLibrary page
4. Implement SwipeFile page
5. Implement Battlecards page
6. Add copy-to-clipboard functionality
7. Add routing (/artifacts, /artifacts/objections, etc.)
