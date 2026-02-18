#!/usr/bin/env python3
"""
Deploy the Product Hunt Launch Monitor workflow to n8n Cloud.

Creates the workflow via POST, prints the workflow ID, then activates it via POST /activate.
"""

import json
import requests
import sys

N8N_BASE = "https://replyra.app.n8n.cloud"
N8N_API_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiJiZGY5MTZmZC1hOGJlLTQzMzUtOTMzNy0wMGNlNjBkYTk3MTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwODEzOTUxLCJleHAiOjE3NzMzNTY0MDB9."
    "RookISGjaLn_SAjDiHutnwLMNEsExekfHG7kFOegRl8"
)

SUPABASE_CRED = {"id": "H8tMhKgDqMwTB6An", "name": "Supabase \u2013 Messaging Tracker"}
ANTHROPIC_CRED = {"id": "tiqqmgq14G2sygfA", "name": "Anthropic API Key"}

# ---------------------------------------------------------------------------
# Node definitions
# ---------------------------------------------------------------------------

nodes = [
    # 1. Schedule Trigger
    {
        "id": "schedule-trigger",
        "name": "Schedule Trigger",
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "position": [0, 0],
        "parameters": {
            "rule": {
                "interval": [
                    {
                        "triggerAtHour": 11,
                        "field": "cronExpression",
                        "expression": "0 11 * * *"
                    }
                ]
            }
        },
    },
    # 2. Manual Trigger
    {
        "id": "manual-trigger",
        "name": "Manual Trigger",
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": [0, 200],
        "parameters": {},
    },
    # 3. Get Tracked Companies
    {
        "id": "get-tracked-companies",
        "name": "Get Tracked Companies",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [260, 100],
        "parameters": {
            "method": "GET",
            "url": "https://dnqjzgfunvbofsuibcsk.supabase.co/rest/v1/companies?select=id,name,slug",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "supabaseApi",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "Accept-Profile", "value": "core"}
                ]
            },
        },
        "credentials": {
            "supabaseApi": SUPABASE_CRED,
        },
    },
    # 4. Fetch PH Daily Feed
    {
        "id": "fetch-ph-feed",
        "name": "Fetch PH Daily Feed",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [520, 100],
        "parameters": {
            "method": "GET",
            "url": "https://www.producthunt.com/feed?category=tech",
            "authentication": "none",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "User-Agent", "value": "SignalPlane-Bot/1.0"},
                    {"name": "Accept", "value": "application/rss+xml,application/xml,text/xml"},
                ]
            },
        },
    },
    # 5. Parse Feed & Match Companies
    {
        "id": "parse-feed-match",
        "name": "Parse Feed & Match Companies",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [780, 100],
        "parameters": {
            "jsCode": "// Parse the RSS feed XML and match against tracked companies\nconst feedText = $('Fetch PH Daily Feed').first().json.data || $('Fetch PH Daily Feed').first().binary?.data?.data || '';\nconst companies = $('Get Tracked Companies').all().map(i => i.json);\n\n// Simple XML parsing for RSS items\nconst items = [];\nconst itemRegex = /<item>([\\s\\S]*?)<\\/item>/g;\nlet match;\nconst rawFeed = typeof feedText === 'string' ? feedText : JSON.stringify($('Fetch PH Daily Feed').first().json);\n\nwhile ((match = itemRegex.exec(rawFeed)) !== null) {\n  const itemXml = match[1];\n  const getTag = (tag) => {\n    const m = itemXml.match(new RegExp(`<${tag}[^>]*>(?:<!\\\\[CDATA\\\\[)?(.*?)(?:\\\\]\\\\]>)?<\\\\/${tag}>`, 's'));\n    return m ? m[1].trim() : '';\n  };\n  items.push({\n    title: getTag('title'),\n    link: getTag('link'),\n    description: getTag('description'),\n    pubDate: getTag('pubDate'),\n  });\n}\n\n// Match items against tracked company names\nconst matched = [];\nfor (const item of items) {\n  const text = (item.title + ' ' + item.description).toLowerCase();\n  for (const company of companies) {\n    const name = company.name.toLowerCase();\n    if (text.includes(name) || text.includes(name.replace(/\\s+/g, ''))) {\n      matched.push({\n        ...item,\n        company_name: company.name,\n        company_id: company.id,\n        company_slug: company.slug\n      });\n      break;\n    }\n  }\n}\n\nif (matched.length === 0) {\n  return [{ json: { hasMatches: false, total_items: items.length } }];\n}\n\nreturn [{ json: { hasMatches: true, launches: matched, total_items: items.length } }];\n",
        },
    },
    # 6. If Has Matches
    {
        "id": "if-has-matches",
        "name": "If Has Matches",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [1040, 100],
        "parameters": {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": ""},
                "conditions": [
                    {
                        "id": "match-check",
                        "leftValue": "={{ $json.hasMatches }}",
                        "rightValue": True,
                        "operator": {
                            "type": "boolean",
                            "operation": "equals",
                            "singleValue": True,
                        },
                    }
                ],
                "combinator": "and",
            }
        },
    },
    # 7. LLM: Analyze Launches
    {
        "id": "llm-analyze-launches",
        "name": "LLM: Analyze Launches",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [1300, 0],
        "parameters": {
            "method": "POST",
            "url": "https://api.anthropic.com/v1/messages",
            "authentication": "genericCredentialType",
            "genericAuthType": "httpHeaderAuth",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "anthropic-version", "value": "2023-06-01"},
                ]
            },
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": '={{ JSON.stringify({"model":"claude-sonnet-4-20250514","max_tokens":2000,"messages":[{"role":"user","content":"You are a competitive intelligence analyst. These Product Hunt launches were detected for tracked competitors:\\n\\n" + JSON.stringify($json.launches, null, 2) + "\\n\\nFor each launch, analyze its competitive significance:\\n- Is this a new product, a major update, or a minor feature?\\n- Does this represent a strategic shift (new market, new pricing, new ICP)?\\n- How does this threaten our positioning?\\n\\nFor each signal provide:\\n- signal_type: \\"launch\\"\\n- source_platform: \\"product_hunt\\"\\n- severity: 1-5 (5=new competing product, 4=major feature threatening us, 3=notable update, 2=minor, 1=routine)\\n- confidence: 0-1\\n- title: concise signal title\\n- summary: competitive implication (max 150 words)\\n- company_name: the competitor name\\n- company_id: the company UUID\\n- evidence_urls: [product hunt URL]\\n- decision_type: positioning/packaging/distribution/proof/enablement/risk\\n- time_sensitivity: now/this_week/monitor\\n\\nReturn JSON array. Empty [] if no significant signals."}]}) }}',
        },
        "credentials": {
            "httpHeaderAuth": ANTHROPIC_CRED,
        },
    },
    # 8. Parse LLM Response
    {
        "id": "parse-llm-response",
        "name": "Parse LLM Response",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1560, 0],
        "parameters": {
            "jsCode": "const response = $input.first().json;\nconst content = response.content?.[0]?.text || '[]';\n\n// Extract JSON from response\nlet signals = [];\ntry {\n  const jsonMatch = content.match(/\\[[\\s\\S]*\\]/);\n  if (jsonMatch) {\n    signals = JSON.parse(jsonMatch[0]);\n  }\n} catch (e) {\n  signals = [];\n}\n\nif (signals.length === 0) {\n  return [{ json: { hasSignals: false } }];\n}\n\n// Ensure required fields\nsignals = signals.map(s => ({\n  signal_type: s.signal_type || 'launch',\n  source_platform: 'product_hunt',\n  company_id: s.company_id || null,\n  company_name: s.company_name || '',\n  severity: Math.min(5, Math.max(1, s.severity || 3)),\n  confidence: Math.min(1, Math.max(0, s.confidence || 0.7)),\n  title: (s.title || '').slice(0, 500),\n  summary: (s.summary || '').slice(0, 5000),\n  evidence_urls: s.evidence_urls || [],\n  source_schema: 'external',\n  source_table: 'product_hunt',\n  source_id: (s.evidence_urls?.[0] || '') + '_' + new Date().toISOString().slice(0, 10),\n  meta: { company_name: s.company_name, decision_type: s.decision_type, time_sensitivity: s.time_sensitivity },\n  decision_type: s.decision_type || null,\n  time_sensitivity: s.time_sensitivity || 'this_week'\n}));\n\nreturn [{ json: { hasSignals: true, signals } }];\n",
        },
    },
    # 9. If Signals Found
    {
        "id": "if-signals-found",
        "name": "If Signals Found",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [1820, 0],
        "parameters": {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": ""},
                "conditions": [
                    {
                        "id": "signal-check",
                        "leftValue": "={{ $json.hasSignals }}",
                        "rightValue": True,
                        "operator": {
                            "type": "boolean",
                            "operation": "equals",
                            "singleValue": True,
                        },
                    }
                ],
                "combinator": "and",
            }
        },
    },
    # 10. Emit Signals
    {
        "id": "emit-signals",
        "name": "Emit Signals",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [2080, -100],
        "parameters": {
            "method": "POST",
            "url": "https://dnqjzgfunvbofsuibcsk.supabase.co/functions/v1/ingest-external-signal",
            "authentication": "none",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "x-n8n-secret", "value": "sp-n8n-ingest-2026"},
                    {"name": "Content-Type", "value": "application/json"},
                ]
            },
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify($json.signals) }}",
        },
    },
]

# ---------------------------------------------------------------------------
# Connections
# ---------------------------------------------------------------------------

connections = {
    "Schedule Trigger": {
        "main": [
            [{"node": "Get Tracked Companies", "type": "main", "index": 0}]
        ]
    },
    "Manual Trigger": {
        "main": [
            [{"node": "Get Tracked Companies", "type": "main", "index": 0}]
        ]
    },
    "Get Tracked Companies": {
        "main": [
            [{"node": "Fetch PH Daily Feed", "type": "main", "index": 0}]
        ]
    },
    "Fetch PH Daily Feed": {
        "main": [
            [{"node": "Parse Feed & Match Companies", "type": "main", "index": 0}]
        ]
    },
    "Parse Feed & Match Companies": {
        "main": [
            [{"node": "If Has Matches", "type": "main", "index": 0}]
        ]
    },
    "If Has Matches": {
        "main": [
            # true branch (index 0)
            [{"node": "LLM: Analyze Launches", "type": "main", "index": 0}],
            # false branch (index 1) - empty, workflow ends
            [],
        ]
    },
    "LLM: Analyze Launches": {
        "main": [
            [{"node": "Parse LLM Response", "type": "main", "index": 0}]
        ]
    },
    "Parse LLM Response": {
        "main": [
            [{"node": "If Signals Found", "type": "main", "index": 0}]
        ]
    },
    "If Signals Found": {
        "main": [
            # true branch
            [{"node": "Emit Signals", "type": "main", "index": 0}],
            # false branch - empty
            [],
        ]
    },
}

# ---------------------------------------------------------------------------
# Build workflow payload
# ---------------------------------------------------------------------------

workflow_payload = {
    "name": "Product Hunt Launch Monitor",
    "nodes": nodes,
    "connections": connections,
    "settings": {"executionOrder": "v1"},
}


def main():
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
    }

    # ------------------------------------------------------------------
    # Step 1: Create the workflow
    # ------------------------------------------------------------------
    print("=== Creating workflow: Product Hunt Launch Monitor ===")
    resp = requests.post(
        f"{N8N_BASE}/api/v1/workflows",
        headers=headers,
        json=workflow_payload,
    )

    if resp.status_code not in (200, 201):
        print(f"ERROR creating workflow: {resp.status_code}")
        print(resp.text)
        sys.exit(1)

    data = resp.json()
    workflow_id = data["id"]
    print(f"Workflow created -- ID: {workflow_id}")
    print(f"URL: {N8N_BASE}/workflow/{workflow_id}")

    # ------------------------------------------------------------------
    # Step 2: Activate the workflow (POST /activate)
    # ------------------------------------------------------------------
    print("\n=== Activating workflow ===")
    resp2 = requests.post(
        f"{N8N_BASE}/api/v1/workflows/{workflow_id}/activate",
        headers=headers,
    )

    if resp2.status_code not in (200, 201):
        print(f"ERROR activating workflow: {resp2.status_code}")
        print(resp2.text)
        sys.exit(1)

    active_status = resp2.json().get("active", False)
    print(f"Workflow {workflow_id} active={active_status}")

    # ------------------------------------------------------------------
    # Also save the workflow JSON locally for reference
    # ------------------------------------------------------------------
    local_path = "/Users/victor/60_Day_Shipping/messaging-tracker/n8n_workflows/producthunt_launch_monitor.json"
    with open(local_path, "w") as f:
        json.dump(workflow_payload, f, indent=2)
    print(f"\nLocal copy saved to: {local_path}")

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
