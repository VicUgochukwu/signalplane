#!/usr/bin/env python3
"""
Deploy YouTube Channel Monitor workflow to n8n Cloud.

Creates a workflow that:
  - Runs daily at 8am UTC (or manual trigger)
  - Fetches tracked companies from Supabase
  - Searches YouTube for recent competitor videos
  - Analyzes videos with Claude for competitive signals
  - Emits signals to the ingest-external-signal edge function
"""

import json
import requests
import sys

# Config
N8N_BASE = "https://replyra.app.n8n.cloud"
N8N_API_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiJiZGY5MTZmZC1hOGJlLTQzMzUtOTMzNy0wMGNlNjBkYTk3MTIiLCJpc3Mi"
    "OiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwODEzOTUxLCJleHAiOjE3"
    "NzMzNTY0MDB9.RookISGjaLn_SAjDiHutnwLMNEsExekfHG7kFOegRl8"
)

SUPABASE_URL = "https://dnqjzgfunvbofsuibcsk.supabase.co"
SUPABASE_CRED = {'id': 'H8tMhKgDqMwTB6An', 'name': 'Supabase – Messaging Tracker'}
ANTHROPIC_CRED = {'id': 'tiqqmgq14G2sygfA', 'name': 'Anthropic API Key'}

FILTER_CODE = "const items = $input.all();\nconst searchResult = items[0].json;\nconst sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);\n\nconst ytItems = searchResult.items || [];\n\nconst recentVideos = ytItems.filter(item => {\n  const published = new Date(item.snippet.publishedAt);\n  return published >= sevenDaysAgo;\n});\n\nconst videoIds = recentVideos.map(v => v.id.videoId);\n\nreturn [{\n  json: {\n    videoIds: videoIds,\n    videoIds_csv: videoIds.join(','),\n    count: videoIds.length,\n    company_name: items[0].json.name || ''\n  }\n}];"

PREPARE_CODE = "const items = $input.all();\nconst result = items[0].json;\nconst ytItems = result.items || [];\n\nconst companyName = $('Filter Recent Videos').first().json.company_name;\n\nconst videos = ytItems.map(v => ({\n  title: v.snippet.title,\n  description: v.snippet.description,\n  view_count: parseInt(v.statistics.viewCount || '0'),\n  channel_name: v.snippet.channelTitle,\n  published_date: v.snippet.publishedAt,\n  video_url: `https://www.youtube.com/watch?v=${v.id}`,\n  duration: v.contentDetails.duration\n}));\n\nreturn [{\n  json: {\n    company_name: companyName,\n    videos: videos,\n    videos_json: JSON.stringify(videos, null, 2)\n  }\n}];"

PARSE_CODE = "const items = $input.all();\nconst response = items[0].json;\n\nconst companyName = $('Prepare Video Data').first().json.company_name;\nconst videos = $('Prepare Video Data').first().json.videos;\n\nlet text = '';\nif (response.content && response.content.length > 0) {\n  text = response.content[0].text;\n}\n\nlet signals = [];\ntry {\n  const codeBlockMatch = text.match(/```(?:json)?\\s*([\\s\\S]*?)```/);\n  if (codeBlockMatch) {\n    signals = JSON.parse(codeBlockMatch[1].trim());\n  } else {\n    const arrayMatch = text.match(/(\\[.*\\])/s);\n    if (arrayMatch) {\n      signals = JSON.parse(arrayMatch[1]);\n    }\n  }\n} catch (e) {\n  signals = [];\n}\n\nsignals = signals.map(s => ({\n  ...s,\n  source_platform: 'youtube',\n  company_name: companyName,\n  evidence_urls: videos.map(v => v.video_url)\n}));\n\nreturn [{\n  json: {\n    signals: signals,\n    count: signals.length\n  }\n}];"

LLM_PROMPT = 'You are a competitive intelligence analyst. Analyze these YouTube videos from competitor {{ $json.company_name }} and identify actionable competitive signals.\n\nFor each video that contains competitive intelligence, extract:\n- signal_type: "video"\n- severity: 1-5 (5 = major product launch/demo, 3 = feature update, 1 = routine content)\n- confidence: 0-1\n- title: concise signal title\n- summary: what the video reveals about the competitor\'s strategy (max 200 words)\n- decision_type: one of positioning/packaging/distribution/proof/enablement/risk\n- time_sensitivity: now/this_week/monitor\n\nOnly flag videos that contain genuine competitive signals (product demos, pricing announcements, partnership announcements, customer case studies). Skip generic marketing content.\n\nReturn a JSON array of signal objects. Return empty array [] if no signals found.\n\nVideos data:\n{{ $json.videos_json }}'


def build_nodes():
    nodes = []

    # 1. Schedule Trigger - daily 8am UTC
    nodes.append({
        "id": "node-schedule",
        "name": "Schedule Trigger",
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "position": [0, 0],
        "parameters": {
            "rule": {
                "interval": [
                    {
                        "field": "cronExpression",
                        "expression": "0 8 * * *"
                    }
                ]
            }
        },
        "credentials": {}
    })

    # 2. Manual Trigger
    nodes.append({
        "id": "node-manual",
        "name": "Manual Trigger",
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": [0, 200],
        "parameters": {},
        "credentials": {}
    })

    # 3. Get Tracked Companies
    nodes.append({
        "id": "node-get-companies",
        "name": "Get Tracked Companies",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [300, 100],
        "parameters": {
            "method": "GET",
            "url": SUPABASE_URL + "/rest/v1/companies?select=id,name,slug",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "supabaseApi",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "Accept-Profile", "value": "core"}
                ]
            },
            "options": {}
        },
        "credentials": {
            "supabaseApi": SUPABASE_CRED
        }
    })

    # 4. Loop Over Companies
    nodes.append({
        "id": "node-loop",
        "name": "Loop Over Companies",
        "type": "n8n-nodes-base.splitInBatches",
        "typeVersion": 3,
        "position": [550, 100],
        "parameters": {
            "batchSize": 1,
            "options": {}
        },
        "credentials": {}
    })

    # 5. YouTube Search API
    nodes.append({
        "id": "node-yt-search",
        "name": "YouTube Search API",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [800, 200],
        "parameters": {
            "method": "GET",
            "url": "https://www.googleapis.com/youtube/v3/search",
            "authentication": "none",
            "sendQuery": True,
            "queryParameters": {
                "parameters": [
                    {"name": "part", "value": "snippet"},
                    {"name": "q", "value": "={{ $json.name }} product OR demo OR webinar"},
                    {"name": "type", "value": "video"},
                    {"name": "order", "value": "date"},
                    {"name": "maxResults", "value": "10"},
                    {"name": "publishedAfter", "value": "={{ new Date(Date.now() - 7*24*60*60*1000).toISOString() }}"},
                    {"name": "key", "value": '={{ $env.YOUTUBE_API_KEY || "YOUR_API_KEY_HERE" }}'}
                ]
            },
            "options": {}
        },
        "credentials": {}
    })

    # 6. Filter Recent Videos
    nodes.append({
        "id": "node-filter-videos",
        "name": "Filter Recent Videos",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1050, 200],
        "parameters": {
            "jsCode": FILTER_CODE
        },
        "credentials": {}
    })

    # 7. If Videos Found
    nodes.append({
        "id": "node-if-videos",
        "name": "If Videos Found",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [1300, 200],
        "parameters": {
            "conditions": {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "strict"
                },
                "conditions": [
                    {
                        "id": "cond-videos",
                        "leftValue": "={{ $json.count }}",
                        "rightValue": "0",
                        "operator": {
                            "type": "number",
                            "operation": "gt"
                        }
                    }
                ],
                "combinator": "and"
            },
            "options": {}
        },
        "credentials": {}
    })

    # 8. Get Video Details
    nodes.append({
        "id": "node-video-details",
        "name": "Get Video Details",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [1550, 100],
        "parameters": {
            "method": "GET",
            "url": "https://www.googleapis.com/youtube/v3/videos",
            "authentication": "none",
            "sendQuery": True,
            "queryParameters": {
                "parameters": [
                    {"name": "part", "value": "snippet,statistics,contentDetails"},
                    {"name": "id", "value": "={{ $json.videoIds_csv }}"},
                    {"name": "key", "value": '={{ $env.YOUTUBE_API_KEY || "YOUR_API_KEY_HERE" }}'}
                ]
            },
            "options": {}
        },
        "credentials": {}
    })

    # 9. Prepare Video Data
    nodes.append({
        "id": "node-prepare-data",
        "name": "Prepare Video Data",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1800, 100],
        "parameters": {
            "jsCode": PREPARE_CODE
        },
        "credentials": {}
    })

    # 10. LLM Analyze Videos
    llm_body = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 2000,
        "messages": [
            {
                "role": "user",
                "content": LLM_PROMPT
            }
        ]
    }

    nodes.append({
        "id": "node-llm-analyze",
        "name": "LLM Analyze Videos",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [2050, 100],
        "parameters": {
            "method": "POST",
            "url": "https://api.anthropic.com/v1/messages",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "httpHeaderAuth",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "x-api-key", "value": "={{ $credentials.httpHeaderAuth.value }}"},
                    {"name": "anthropic-version", "value": "2023-06-01"},
                    {"name": "content-type", "value": "application/json"}
                ]
            },
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": json.dumps(llm_body),
            "options": {}
        },
        "credentials": {
            "httpHeaderAuth": ANTHROPIC_CRED
        }
    })

    # 11. Parse LLM Response
    nodes.append({
        "id": "node-parse-llm",
        "name": "Parse LLM Response",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [2300, 100],
        "parameters": {
            "jsCode": PARSE_CODE
        },
        "credentials": {}
    })

    # 12. If Signals Found
    nodes.append({
        "id": "node-if-signals",
        "name": "If Signals Found",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [2550, 100],
        "parameters": {
            "conditions": {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "strict"
                },
                "conditions": [
                    {
                        "id": "cond-signals",
                        "leftValue": "={{ $json.count }}",
                        "rightValue": "0",
                        "operator": {
                            "type": "number",
                            "operation": "gt"
                        }
                    }
                ],
                "combinator": "and"
            },
            "options": {}
        },
        "credentials": {}
    })

    # 13. Emit Signals
    nodes.append({
        "id": "node-emit-signals",
        "name": "Emit Signals",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [2800, 0],
        "parameters": {
            "method": "POST",
            "url": SUPABASE_URL + "/functions/v1/ingest-external-signal",
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
            "jsonBody": "={{ JSON.stringify($json.signals) }}",
            "options": {}
        },
        "credentials": {}
    })

    # 14. Done (no-op)
    nodes.append({
        "id": "node-noop-done",
        "name": "Done",
        "type": "n8n-nodes-base.noOp",
        "typeVersion": 1,
        "position": [800, 0],
        "parameters": {},
        "credentials": {}
    })

    # 15. No Videos (no-op)
    nodes.append({
        "id": "node-noop-no-videos",
        "name": "No Videos",
        "type": "n8n-nodes-base.noOp",
        "typeVersion": 1,
        "position": [1550, 300],
        "parameters": {},
        "credentials": {}
    })

    # 16. No Signals (no-op)
    nodes.append({
        "id": "node-noop-no-signals",
        "name": "No Signals",
        "type": "n8n-nodes-base.noOp",
        "typeVersion": 1,
        "position": [2800, 200],
        "parameters": {},
        "credentials": {}
    })

    return nodes


def build_connections():
    return {
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
                [{"node": "Done", "type": "main", "index": 0}],
                [{"node": "YouTube Search API", "type": "main", "index": 0}]
            ]
        },
        "YouTube Search API": {
            "main": [[{"node": "Filter Recent Videos", "type": "main", "index": 0}]]
        },
        "Filter Recent Videos": {
            "main": [[{"node": "If Videos Found", "type": "main", "index": 0}]]
        },
        "If Videos Found": {
            "main": [
                [{"node": "Get Video Details", "type": "main", "index": 0}],
                [{"node": "No Videos", "type": "main", "index": 0}]
            ]
        },
        "No Videos": {
            "main": [[{"node": "Loop Over Companies", "type": "main", "index": 0}]]
        },
        "Get Video Details": {
            "main": [[{"node": "Prepare Video Data", "type": "main", "index": 0}]]
        },
        "Prepare Video Data": {
            "main": [[{"node": "LLM Analyze Videos", "type": "main", "index": 0}]]
        },
        "LLM Analyze Videos": {
            "main": [[{"node": "Parse LLM Response", "type": "main", "index": 0}]]
        },
        "Parse LLM Response": {
            "main": [[{"node": "If Signals Found", "type": "main", "index": 0}]]
        },
        "If Signals Found": {
            "main": [
                [{"node": "Emit Signals", "type": "main", "index": 0}],
                [{"node": "No Signals", "type": "main", "index": 0}]
            ]
        },
        "Emit Signals": {
            "main": [[{"node": "Loop Over Companies", "type": "main", "index": 0}]]
        },
        "No Signals": {
            "main": [[{"node": "Loop Over Companies", "type": "main", "index": 0}]]
        },
    }


def build_workflow():
    return {
        "name": "YouTube Channel Monitor",
        "nodes": build_nodes(),
        "connections": build_connections(),
        "settings": {"executionOrder": "v1"}
    }


def deploy():
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }

    workflow = build_workflow()

    # Step 1: Create workflow
    print("[1/3] Creating workflow...")
    resp = requests.post(
        N8N_BASE + "/api/v1/workflows",
        headers=headers,
        json=workflow,
        timeout=30
    )

    if resp.status_code not in (200, 201):
        print("ERROR creating workflow: " + str(resp.status_code))
        print(resp.text)
        sys.exit(1)

    data = resp.json()
    wf_id = data["id"]
    print("      Created workflow: " + wf_id)
    print("      Name: " + data["name"])

    # Step 2: Activate workflow
    print("[2/3] Activating workflow...")
    resp2 = requests.post(
        N8N_BASE + "/api/v1/workflows/" + wf_id + "/activate",
        headers=headers,
        timeout=30
    )

    if resp2.status_code not in (200, 201):
        print("WARNING: Could not activate: " + str(resp2.status_code))
        print(resp2.text)
    else:
        print("      Workflow activated.")

    # Step 3: Summary
    print("[3/3] Done!")
    print("")
    print("      Workflow ID : " + wf_id)
    print("      URL         : " + N8N_BASE + "/workflow/" + wf_id)
    status = "active" if resp2.status_code in (200, 201) else "inactive"
    print("      Status      : " + status)
    print("")
    print("      NOTE: Set the YOUTUBE_API_KEY environment variable in n8n")
    print("      or replace YOUR_API_KEY_HERE in the YouTube Search / Details nodes.")

    return wf_id


if __name__ == "__main__":
    deploy()
