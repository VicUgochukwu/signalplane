#!/usr/bin/env python3
"""
Deploy the App Store Review Monitor workflow to n8n Cloud.

This workflow monitors Apple App Store reviews for competitor apps using
free public RSS feeds, analyzes them with Claude, and emits competitive
intelligence signals to the Signal Plane.
"""

import json
import requests
import sys

# -- Config -------------------------------------------------------------------

N8N_BASE = "https://replyra.app.n8n.cloud"
N8N_API_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiJiZGY5MTZmZC1hOGJlLTQzMzUtOTMzNy0wMGNlNjBkYTk3MTIiLCJpc3Mi"
    "OiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwODEzOTUxLCJleHAiOjE3"
    "NzMzNTY0MDB9.RookISGjaLn_SAjDiHutnwLMNEsExekfHG7kFOegRl8"
)

SUPABASE_CRED = {"id": "H8tMhKgDqMwTB6An", "name": "Supabase \u2013 Messaging Tracker"}
ANTHROPIC_CRED = {"id": "tiqqmgq14G2sygfA", "name": "Anthropic API Key"}

WORKFLOW_NAME = "App Store Review Monitor"


# -- Node helpers -------------------------------------------------------------

def pos(x, y):
    return [x, y]


# -- Build nodes --------------------------------------------------------------

nodes = []

# 1. Schedule Trigger
nodes.append({
    "id": "schedule-trigger",
    "name": "Schedule Trigger",
    "type": "n8n-nodes-base.scheduleTrigger",
    "typeVersion": 1.2,
    "position": pos(0, 0),
    "parameters": {
        "rule": {
            "interval": [
                {
                    "triggerAtHour": 10,
                    "field": "cronExpression",
                    "expression": "0 10 * * *"
                }
            ]
        }
    }
})

# 2. Manual Trigger
nodes.append({
    "id": "manual-trigger",
    "name": "Manual Trigger",
    "type": "n8n-nodes-base.manualTrigger",
    "typeVersion": 1,
    "position": pos(0, 200),
    "parameters": {}
})

# 3. Get Tracked Companies
nodes.append({
    "id": "get-companies",
    "name": "Get Tracked Companies",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": pos(260, 100),
    "parameters": {
        "url": "https://dnqjzgfunvbofsuibcsk.supabase.co/rest/v1/companies?select=id,name,slug",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "supabaseApi",
        "sendHeaders": True,
        "headerParameters": {
            "parameters": [
                {"name": "Accept-Profile", "value": "core"}
            ]
        }
    },
    "credentials": {
        "supabaseApi": SUPABASE_CRED
    }
})

# 4. Loop Over Companies
nodes.append({
    "id": "loop-companies",
    "name": "Loop Over Companies",
    "type": "n8n-nodes-base.splitInBatches",
    "typeVersion": 3,
    "position": pos(500, 100),
    "parameters": {
        "batchSize": 1
    }
})

# 5. Search iTunes for Apps
nodes.append({
    "id": "search-itunes",
    "name": "Search iTunes for Apps",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": pos(740, 0),
    "parameters": {
        "url": "=https://itunes.apple.com/search?term={{ encodeURIComponent($json.name) }}&entity=software&limit=3",
        "authentication": "none"
    }
})

# 6. Extract App IDs
EXTRACT_APP_IDS_CODE = """const results = $input.first().json.results || [];
const companyName = $('Loop Over Companies').first().json.name;
const companyId = $('Loop Over Companies').first().json.id;

if (results.length === 0) {
  return [{ json: { hasApps: false, company_name: companyName, company_id: companyId } }];
}

// Take top 2 most relevant apps
const apps = results.slice(0, 2).map(app => ({
  trackId: app.trackId,
  trackName: app.trackName,
  sellerName: app.sellerName,
  averageUserRating: app.averageUserRating,
  userRatingCount: app.userRatingCount,
  trackViewUrl: app.trackViewUrl,
  description: (app.description || '').slice(0, 200)
}));

return [{ json: { hasApps: true, company_name: companyName, company_id: companyId, apps } }];"""

nodes.append({
    "id": "extract-app-ids",
    "name": "Extract App IDs",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": pos(980, 0),
    "parameters": {
        "jsCode": EXTRACT_APP_IDS_CODE
    }
})

# 7. If Has Apps
nodes.append({
    "id": "if-has-apps",
    "name": "If Has Apps",
    "type": "n8n-nodes-base.if",
    "typeVersion": 2,
    "position": pos(1220, 0),
    "parameters": {
        "conditions": {
            "options": {
                "caseSensitive": True,
                "leftValue": "",
                "typeValidation": "strict"
            },
            "conditions": [
                {
                    "id": "has-apps-cond",
                    "leftValue": "={{ $json.hasApps }}",
                    "rightValue": True,
                    "operator": {
                        "type": "boolean",
                        "operation": "equals",
                        "name": "filter.operator.equals"
                    }
                }
            ],
            "combinator": "and"
        }
    }
})

# 8. Fetch App Reviews RSS
nodes.append({
    "id": "fetch-reviews",
    "name": "Fetch App Reviews RSS",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": pos(1460, -100),
    "parameters": {
        "url": "=https://itunes.apple.com/us/rss/customerreviews/id={{ $json.apps[0].trackId }}/sortBy=mostRecent/json",
        "authentication": "none"
    }
})

# 9. Parse Reviews
PARSE_REVIEWS_CODE = """const feed = $input.first().json.feed || {};
const entries = feed.entry || [];
const appData = $('Extract App IDs').first().json;
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

// Filter to recent reviews (last 7 days)
const recentReviews = entries
  .filter(e => e['im:rating'] && e.updated)
  .filter(e => {
    try { return new Date(e.updated.label) > sevenDaysAgo; } catch { return false; }
  })
  .slice(0, 20)
  .map(e => ({
    title: e.title?.label || '',
    content: e.content?.label || '',
    rating: parseInt(e['im:rating']?.label || '0'),
    author: e.author?.name?.label || '',
    date: e.updated?.label || '',
    version: e['im:version']?.label || ''
  }));

if (recentReviews.length === 0) {
  return [{ json: { hasReviews: false, company_name: appData.company_name, company_id: appData.company_id } }];
}

return [{ json: {
  hasReviews: true,
  company_name: appData.company_name,
  company_id: appData.company_id,
  app_name: appData.apps[0]?.trackName || appData.company_name,
  app_url: appData.apps[0]?.trackViewUrl || '',
  reviews: recentReviews,
  avg_rating: (recentReviews.reduce((s, r) => s + r.rating, 0) / recentReviews.length).toFixed(1)
}}];"""

nodes.append({
    "id": "parse-reviews",
    "name": "Parse Reviews",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": pos(1700, -100),
    "parameters": {
        "jsCode": PARSE_REVIEWS_CODE
    }
})

# 10. If Has Reviews
nodes.append({
    "id": "if-has-reviews",
    "name": "If Has Reviews",
    "type": "n8n-nodes-base.if",
    "typeVersion": 2,
    "position": pos(1940, -100),
    "parameters": {
        "conditions": {
            "options": {
                "caseSensitive": True,
                "leftValue": "",
                "typeValidation": "strict"
            },
            "conditions": [
                {
                    "id": "has-reviews-cond",
                    "leftValue": "={{ $json.hasReviews }}",
                    "rightValue": True,
                    "operator": {
                        "type": "boolean",
                        "operation": "equals",
                        "name": "filter.operator.equals"
                    }
                }
            ],
            "combinator": "and"
        }
    }
})

# 11. LLM: Analyze Reviews
LLM_PROMPT = (
    "You are a competitive intelligence analyst. Analyze these App Store reviews "
    "for {{ $json.app_name }} (by competitor {{ $json.company_name }})."
    "\\n\\nReviews (avg rating: {{ $json.avg_rating }}):"
    "\\n{{ JSON.stringify($json.reviews) }}"
    "\\n\\nIdentify competitive signals:"
    "\\n- Feature gaps or complaints customers mention"
    "\\n- Recent bugs or quality issues"
    "\\n- Praise for specific features (threats to us)"
    "\\n- Pricing/value complaints"
    "\\n- Comparison mentions to other products"
    "\\n\\nFor each signal:"
    '\\n- signal_type: \\"review\\"'
    "\\n- severity: 1-5 (5=widespread critical issue, 3=notable pattern, 1=minor)"
    "\\n- confidence: 0-1"
    "\\n- title: concise signal"
    "\\n- summary: what this means competitively (max 150 words)"
    "\\n- decision_type: positioning/packaging/distribution/proof/enablement/risk"
    "\\n- time_sensitivity: now/this_week/monitor"
    "\\n\\nReturn JSON array. Empty [] if no significant signals."
)

LLM_JSON_BODY = (
    '={"model": "claude-sonnet-4-20250514", "max_tokens": 2000, '
    '"messages": [{"role": "user", "content": "' + LLM_PROMPT + '"}]}'
)

nodes.append({
    "id": "llm-analyze",
    "name": "LLM: Analyze Reviews",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": pos(2180, -200),
    "parameters": {
        "method": "POST",
        "url": "https://api.anthropic.com/v1/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": True,
        "headerParameters": {
            "parameters": [
                {"name": "anthropic-version", "value": "2023-06-01"}
            ]
        },
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": LLM_JSON_BODY
    },
    "credentials": {
        "httpHeaderAuth": ANTHROPIC_CRED
    }
})

# 12. Parse LLM Response
PARSE_LLM_CODE = r"""const response = $input.first().json;
const appData = $('Parse Reviews').first().json;

// Extract text content from Claude response
let text = '';
if (response.content && response.content.length > 0) {
  text = response.content[0].text || '';
}

// Parse JSON from the response (handle markdown code blocks)
let signals = [];
try {
  const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (jsonMatch) {
    signals = JSON.parse(jsonMatch[0]);
  } else if (text.trim().startsWith('[')) {
    signals = JSON.parse(text.trim());
  }
} catch (e) {
  // If parse fails, return empty
  signals = [];
}

// Enrich each signal with company/app context
signals = signals.map(s => ({
  ...s,
  signal_type: 'review',
  company_name: appData.company_name,
  company_id: appData.company_id,
  app_name: appData.app_name,
  app_url: appData.app_url,
  source_platform: 'app_store'
}));

return [{ json: { hasSignals: signals.length > 0, signals, company_name: appData.company_name, company_id: appData.company_id } }];"""

nodes.append({
    "id": "parse-llm",
    "name": "Parse LLM Response",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": pos(2420, -200),
    "parameters": {
        "jsCode": PARSE_LLM_CODE
    }
})

# 13. If Signals Found
nodes.append({
    "id": "if-signals",
    "name": "If Signals Found",
    "type": "n8n-nodes-base.if",
    "typeVersion": 2,
    "position": pos(2660, -200),
    "parameters": {
        "conditions": {
            "options": {
                "caseSensitive": True,
                "leftValue": "",
                "typeValidation": "strict"
            },
            "conditions": [
                {
                    "id": "has-signals-cond",
                    "leftValue": "={{ $json.hasSignals }}",
                    "rightValue": True,
                    "operator": {
                        "type": "boolean",
                        "operation": "equals",
                        "name": "filter.operator.equals"
                    }
                }
            ],
            "combinator": "and"
        }
    }
})

# 14. Emit Signals
nodes.append({
    "id": "emit-signals",
    "name": "Emit Signals",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": pos(2900, -300),
    "parameters": {
        "method": "POST",
        "url": "https://dnqjzgfunvbofsuibcsk.supabase.co/functions/v1/ingest-external-signal",
        "authentication": "none",
        "sendHeaders": True,
        "headerParameters": {
            "parameters": [
                {"name": "x-n8n-secret", "value": "sp-n8n-ingest-2026"},
                {"name": "Content-Type", "value": "application/json"}
            ]
        },
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ signals: $json.signals, source_platform: 'app_store' }) }}"
    }
})

# -- Connections --------------------------------------------------------------

connections = {
    "Schedule Trigger": {
        "main": [[{"node": "Get Tracked Companies", "type": "main", "index": 0}]]
    },
    "Manual Trigger": {
        "main": [[{"node": "Get Tracked Companies", "type": "main", "index": 0}]]
    },
    "Get Tracked Companies": {
        "main": [[{"node": "Loop Over Companies", "type": "main", "index": 0}]]
    },
    "Loop Over Companies": {
        "main": [
            [{"node": "Search iTunes for Apps", "type": "main", "index": 0}],
            []
        ]
    },
    "Search iTunes for Apps": {
        "main": [[{"node": "Extract App IDs", "type": "main", "index": 0}]]
    },
    "Extract App IDs": {
        "main": [[{"node": "If Has Apps", "type": "main", "index": 0}]]
    },
    "If Has Apps": {
        "main": [
            [{"node": "Fetch App Reviews RSS", "type": "main", "index": 0}],
            [{"node": "Loop Over Companies", "type": "main", "index": 0}]
        ]
    },
    "Fetch App Reviews RSS": {
        "main": [[{"node": "Parse Reviews", "type": "main", "index": 0}]]
    },
    "Parse Reviews": {
        "main": [[{"node": "If Has Reviews", "type": "main", "index": 0}]]
    },
    "If Has Reviews": {
        "main": [
            [{"node": "LLM: Analyze Reviews", "type": "main", "index": 0}],
            [{"node": "Loop Over Companies", "type": "main", "index": 0}]
        ]
    },
    "LLM: Analyze Reviews": {
        "main": [[{"node": "Parse LLM Response", "type": "main", "index": 0}]]
    },
    "Parse LLM Response": {
        "main": [[{"node": "If Signals Found", "type": "main", "index": 0}]]
    },
    "If Signals Found": {
        "main": [
            [{"node": "Emit Signals", "type": "main", "index": 0}],
            [{"node": "Loop Over Companies", "type": "main", "index": 0}]
        ]
    },
    "Emit Signals": {
        "main": [[{"node": "Loop Over Companies", "type": "main", "index": 0}]]
    }
}

# -- Build payload ------------------------------------------------------------

workflow_payload = {
    "name": WORKFLOW_NAME,
    "nodes": nodes,
    "connections": connections,
    "settings": {
        "executionOrder": "v1"
    }
}

# -- Deploy -------------------------------------------------------------------

headers = {
    "X-N8N-API-KEY": N8N_API_KEY,
    "Content-Type": "application/json"
}


def main():
    print(f"=== Deploying '{WORKFLOW_NAME}' to n8n Cloud ===")
    print()

    # Step 1: Create workflow
    print("[1/3] Creating workflow...")
    resp = requests.post(
        f"{N8N_BASE}/api/v1/workflows",
        headers=headers,
        json=workflow_payload,
        timeout=30
    )

    if resp.status_code not in (200, 201):
        print(f"FAILED to create workflow: {resp.status_code}")
        print(resp.text)
        sys.exit(1)

    wf = resp.json()
    wf_id = wf["id"]
    print(f"  -> Created workflow ID: {wf_id}")
    print(f"  -> Nodes: {len(wf.get('nodes', []))}")

    # Step 2: Activate
    print()
    print("[2/3] Activating workflow...")
    resp2 = requests.post(
        f"{N8N_BASE}/api/v1/workflows/{wf_id}/activate",
        headers=headers,
        timeout=15
    )

    if resp2.status_code not in (200, 201):
        print(f"FAILED to activate: {resp2.status_code}")
        print(resp2.text)
        sys.exit(1)

    active = resp2.json().get("active", False)
    print(f"  -> Active: {active}")

    # Step 3: Summary
    print()
    print("[3/3] Done!")
    print(f"  Workflow ID:  {wf_id}")
    print(f"  Workflow URL: {N8N_BASE}/workflow/{wf_id}")
    status_label = "ACTIVE" if active else "INACTIVE"
    print(f"  Status:       {status_label}")
    print()
    print("  Nodes deployed:")
    for n in nodes:
        print(f"    - {n['name']} ({n['type']})")

    return wf_id


if __name__ == "__main__":
    main()
