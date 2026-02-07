# Company-Aware Workflow Implementation Guide

This guide explains how to update your n8n workflows to support per-user company context and competitor filtering.

## Overview

The company-aware system:
1. Filters signals to only include user's tracked competitors
2. Generates personalized packets titled for the user's company
3. Creates battlecards in "[Your Company] vs [Competitor]" format

## New Files

| File | Purpose |
|------|---------|
| `score_and_select_signals_v5_company_aware.js` | Updated scoring with competitor filtering |
| `builder_battlecards_v2_company_aware.js` | Battlecards with company framing |
| `load_user_context.js` | Reference code for loading user context |

## Workflow Changes

### Step 1: Add "Load User Context" Node

Add a new node before "Score + Select Top Signals" that queries the user's company profile:

**Option A: Supabase Node**
```sql
SELECT * FROM public.get_user_context($1)
```
Parameter: `{{ $json.user_id }}`

**Option B: HTTP Request to Supabase REST API**
```
POST https://your-project.supabase.co/rest/v1/rpc/get_user_context
Headers:
  apikey: your-anon-key
  Authorization: Bearer your-anon-key
Body: { "p_user_id": "{{ $json.user_id }}" }
```

### Step 2: Update "Score + Select Top Signals" Node

Replace the existing code with `score_and_select_signals_v5_company_aware.js`

Key changes:
- Looks for upstream "Load User Context" node
- Filters signals by `competitor_ids`, `competitor_domains`, and `competitor_names`
- Passes `user_id`, `user_company_name`, `is_personalized` to downstream nodes

### Step 3: Update "Build Battlecards" Node

Replace with `builder_battlecards_v2_company_aware.js`

Key changes:
- Reads user context from scoring node output
- When personalized: outputs "[Company] vs [Competitor]" format
- Adds `positioning_statement` and `head_to_head` sections
- Falls back to generic format when no user context

### Step 4: Update Packet/Battlecard Upsert

Add these columns to your INSERT statements:

```sql
-- For packets
INSERT INTO control_plane.packets (
  ...,
  user_id,
  user_company_name,
  is_personalized
) VALUES (
  ...,
  '{{ $json.user_id }}',
  '{{ $json.user_company_name }}',
  {{ $json.is_personalized }}
)

-- For battlecards
INSERT INTO gtm_artifacts.battlecard_versions (
  ...,
  user_id,
  user_company_name,
  is_personalized
) VALUES (
  ...,
  '{{ $json.user_id }}',
  '{{ $json.user_company_name }}',
  {{ $json.is_personalized }}
)
```

## Running for Multiple Users

For scheduled weekly packet generation, you have two options:

### Option A: Loop Through Users
1. Add "Get All Onboarded Users" node at the start
2. Use "Split In Batches" to process each user
3. Each iteration runs the full workflow with that user's context

```sql
-- Get all users who completed onboarding
SELECT DISTINCT user_id
FROM public.user_company_profiles
WHERE onboarding_completed_at IS NOT NULL
```

### Option B: Generate Generic + User-Specific
1. First run: Generate generic packet (no user context) for explorers
2. Loop run: Generate personalized packets for each onboarded user

## Testing

1. **Generic mode**: Run workflow without user_id input
   - Should produce standard packet with all signals
   - Battlecards in generic format

2. **Personalized mode**: Run with valid user_id
   - Should filter to only tracked competitors
   - Packet mentions company name
   - Battlecards show "[Company] vs [Competitor]"

## Database Functions Reference

```sql
-- Check if user needs onboarding
SELECT public.user_needs_onboarding('user-uuid');

-- Get user's tracked competitor IDs
SELECT public.get_user_competitor_ids('user-uuid');

-- Get full user context for filtering
SELECT * FROM public.get_user_context('user-uuid');
```
