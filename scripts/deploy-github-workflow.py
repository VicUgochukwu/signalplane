#!/usr/bin/env python3
"""
Build and deploy the GitHub Activity Monitor workflow to n8n Cloud.
"""

import json
import urllib.request
import urllib.error
import sys

N8N_HOST = "https://replyra.app.n8n.cloud"
N8N_API_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiJiZGY5MTZmZC1hOGJlLTQzMzUtOTMzNy0wMGNlNjBkYTk3MTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwODEzOTUxLCJleHAiOjE3NzMzNTY0MDB9."
    "RookISGjaLn_SAjDiHutnwLMNEsExekfHG7kFOegRl8"
)

SUPABASE_CRED = {"id": "H8tMhKgDqMwTB6An", "name": "Supabase \u2013 Messaging Tracker"}
ANTHROPIC_CRED = {"id": "tiqqmgq14G2sygfA", "name": "Anthropic API Key"}

LLM_PROMPT = (
    "You are a competitive intelligence analyst monitoring GitHub activity "
    "for competitor {{ $json.company_name }}.\\n\\n"
    "Analyze this GitHub data and identify competitive signals:\\n\\n"
    "Repositories with recent activity:\\n{{ JSON.stringify($json.repos) }}\\n\\n"
    "Recent releases:\\n{{ JSON.stringify($json.releases) }}\\n\\n"
    "For each actionable signal, provide:\\n"
    '- signal_type: \\"code\\"\\n'
    "- severity: 1-5 (5=major SDK/product release, 3=significant update, 1=minor)\\n"
    "- confidence: 0-1\\n"
    "- title: concise signal title\\n"
    "- summary: what this reveals about their product direction (max 150 words)\\n"
    "- decision_type: positioning/packaging/distribution/proof/enablement/risk\\n"
    "- time_sensitivity: now/this_week/monitor\\n\\n"
    "Only flag genuinely significant activity: major releases, new SDKs, breaking changes, "
    "new integrations, deprecated features. Skip routine maintenance.\\n\\n"
    "Return JSON array of signals. Empty array [] if nothing significant."
)


def build_nodes():
    nodes = []

    # 1. Schedule Trigger
    nodes.append({
        "parameters": {
            "rule": {
                "interval": [
                    {
                        "triggerAtHour": 9,
                        "field": "cronExpression",
                        "expression": "0 9 * * *"
                    }
                ]
            }
        },
        "id": "node-schedule-trigger",
        "name": "Schedule Trigger",
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "position": [0, 0]
    })

    # 2. Manual Trigger
    nodes.append({
        "parameters": {},
        "id": "node-manual-trigger",
        "name": "Manual Trigger",
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": [0, 220]
    })

    # 3. Get Tracked Companies
    nodes.append({
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
            "options": {}
        },
        "id": "node-get-companies",
        "name": "Get Tracked Companies",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [300, 100],
        "credentials": {
            "supabaseApi": SUPABASE_CRED
        }
    })

    # 4. Loop Over Companies
    nodes.append({
        "parameters": {
            "options": {
                "batchSize": 1
            }
        },
        "id": "node-loop",
        "name": "Loop Over Companies",
        "type": "n8n-nodes-base.splitInBatches",
        "typeVersion": 3,
        "position": [560, 100]
    })

    # 5. Search GitHub Repos
    nodes.append({
        "parameters": {
            "method": "GET",
            "url": "=https://api.github.com/search/repositories?q={{ encodeURIComponent($json.name) }}+in:name&sort=updated&per_page=5",
            "authentication": "none",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "Accept", "value": "application/vnd.github.v3+json"},
                    {"name": "User-Agent", "value": "SignalPlane-Bot"}
                ]
            },
            "options": {}
        },
        "id": "node-search-github",
        "name": "Search GitHub Repos",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [820, 0]
    })

    # 6. Get Recent Releases (Code)
    code6 = "\n".join([
        "const repos = $input.first().json.items || [];",
        "const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();",
        "const companyName = $('Loop Over Companies').first().json.name;",
        "const companyId = $('Loop Over Companies').first().json.id;",
        "",
        "// Filter to repos that were pushed to in last 7 days",
        "const recentRepos = repos.filter(r => r.pushed_at > sevenDaysAgo).slice(0, 3);",
        "",
        "if (recentRepos.length === 0) {",
        "  return [{ json: { hasActivity: false, company_name: companyName, company_id: companyId } }];",
        "}",
        "",
        "return [{ json: {",
        "  hasActivity: true,",
        "  company_name: companyName,",
        "  company_id: companyId,",
        "  repos: recentRepos.map(r => ({",
        "    full_name: r.full_name,",
        "    description: r.description,",
        "    stars: r.stargazers_count,",
        "    language: r.language,",
        "    pushed_at: r.pushed_at,",
        "    html_url: r.html_url,",
        "    topics: r.topics || [],",
        "    open_issues: r.open_issues_count",
        "  }))",
        "}}];",
    ])
    nodes.append({
        "parameters": {"jsCode": code6},
        "id": "node-get-releases",
        "name": "Get Recent Releases",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1060, 0]
    })

    # 7. If Has Activity
    nodes.append({
        "parameters": {
            "conditions": {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "strict"
                },
                "conditions": [
                    {
                        "id": "cond-has-activity",
                        "leftValue": "={{ $json.hasActivity }}",
                        "rightValue": True,
                        "operator": {
                            "type": "boolean",
                            "operation": "true"
                        }
                    }
                ],
                "combinator": "and"
            },
            "options": {}
        },
        "id": "node-if-activity",
        "name": "If Has Activity",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [1300, 0]
    })

    # 8. Fetch Release Notes
    nodes.append({
        "parameters": {
            "method": "GET",
            "url": "=https://api.github.com/repos/{{ $json.repos[0].full_name }}/releases?per_page=3",
            "authentication": "none",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "Accept", "value": "application/vnd.github.v3+json"},
                    {"name": "User-Agent", "value": "SignalPlane-Bot"}
                ]
            },
            "options": {}
        },
        "id": "node-fetch-releases",
        "name": "Fetch Release Notes",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [1560, -100]
    })

    # 9. Prepare GitHub Data (Code)
    code9 = "\n".join([
        "const repoData = $('Get Recent Releases').first().json;",
        "const releases = $input.first().json || [];",
        "const releasesArray = Array.isArray(releases) ? releases : [];",
        "",
        "return [{ json: {",
        "  company_name: repoData.company_name,",
        "  company_id: repoData.company_id,",
        "  repos: repoData.repos,",
        "  releases: releasesArray.slice(0, 5).map(r => ({",
        "    tag_name: r.tag_name,",
        "    name: r.name,",
        "    body: (r.body || '').slice(0, 500),",
        "    published_at: r.published_at,",
        "    html_url: r.html_url",
        "  }))",
        "}}];",
    ])
    nodes.append({
        "parameters": {"jsCode": code9},
        "id": "node-prepare-data",
        "name": "Prepare GitHub Data",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1800, -100]
    })

    # 10. LLM: Analyze GitHub Activity
    llm_body = '={"model": "claude-sonnet-4-20250514", "max_tokens": 2000, "messages": [{"role": "user", "content": "' + LLM_PROMPT + '"}]}'
    nodes.append({
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
            "jsonBody": llm_body,
            "options": {}
        },
        "id": "node-llm-analyze",
        "name": "LLM: Analyze GitHub Activity",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [2060, -100],
        "credentials": {
            "httpHeaderAuth": ANTHROPIC_CRED
        }
    })

    # 11. Parse LLM Response (Code)
    code11 = "\n".join([
        "const response = $input.first().json;",
        "let text = '';",
        "if (response.content && response.content[0]) {",
        "  text = response.content[0].text || '';",
        "}",
        "",
        "// Extract JSON array from the response",
        r"const jsonMatch = text.match(/\[[\s\S]*\]/);",
        "let signals = [];",
        "if (jsonMatch) {",
        "  try {",
        "    signals = JSON.parse(jsonMatch[0]);",
        "  } catch (e) {",
        "    signals = [];",
        "  }",
        "}",
        "",
        "const repoData = $('Get Recent Releases').first().json;",
        "",
        "return [{ json: {",
        "  company_name: repoData.company_name,",
        "  company_id: repoData.company_id,",
        "  signals: signals,",
        "  hasSignals: signals.length > 0,",
        "  repos: repoData.repos || []",
        "}}];",
    ])
    nodes.append({
        "parameters": {"jsCode": code11},
        "id": "node-parse-llm",
        "name": "Parse LLM Response",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [2300, -100]
    })

    # 12. If Signals Found
    nodes.append({
        "parameters": {
            "conditions": {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "strict"
                },
                "conditions": [
                    {
                        "id": "cond-has-signals",
                        "leftValue": "={{ $json.hasSignals }}",
                        "rightValue": True,
                        "operator": {
                            "type": "boolean",
                            "operation": "true"
                        }
                    }
                ],
                "combinator": "and"
            },
            "options": {}
        },
        "id": "node-if-signals",
        "name": "If Signals Found",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [2540, -100]
    })

    # 13. Emit Signals
    emit_body = '={{ JSON.stringify({ company_id: $json.company_id, company_name: $json.company_name, source_platform: "github", signals: $json.signals.map(s => ({ ...s, evidence_urls: ($json.repos || []).map(r => r.html_url) })) }) }}'
    nodes.append({
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
            "jsonBody": emit_body,
            "options": {}
        },
        "id": "node-emit-signals",
        "name": "Emit Signals",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [2800, -200]
    })

    return nodes


def build_connections():
    return {
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
                [{"node": "Loop Over Companies", "type": "main", "index": 0}]
            ]
        },
        "Loop Over Companies": {
            "main": [
                [{"node": "Search GitHub Repos", "type": "main", "index": 0}],
                []
            ]
        },
        "Search GitHub Repos": {
            "main": [
                [{"node": "Get Recent Releases", "type": "main", "index": 0}]
            ]
        },
        "Get Recent Releases": {
            "main": [
                [{"node": "If Has Activity", "type": "main", "index": 0}]
            ]
        },
        "If Has Activity": {
            "main": [
                [{"node": "Fetch Release Notes", "type": "main", "index": 0}],
                [{"node": "Loop Over Companies", "type": "main", "index": 0}]
            ]
        },
        "Fetch Release Notes": {
            "main": [
                [{"node": "Prepare GitHub Data", "type": "main", "index": 0}]
            ]
        },
        "Prepare GitHub Data": {
            "main": [
                [{"node": "LLM: Analyze GitHub Activity", "type": "main", "index": 0}]
            ]
        },
        "LLM: Analyze GitHub Activity": {
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
                [{"node": "Emit Signals", "type": "main", "index": 0}],
                [{"node": "Loop Over Companies", "type": "main", "index": 0}]
            ]
        },
        "Emit Signals": {
            "main": [
                [{"node": "Loop Over Companies", "type": "main", "index": 0}]
            ]
        }
    }


def build_workflow():
    return {
        "name": "GitHub Activity Monitor",
        "nodes": build_nodes(),
        "connections": build_connections(),
        "settings": {
            "executionOrder": "v1"
        }
    }


def api_request(method, path, body=None):
    url = f"{N8N_HOST}/api/v1{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("X-N8N-API-KEY", N8N_API_KEY)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"ERROR {e.code}: {err_body}", file=sys.stderr)
        sys.exit(1)


def main():
    workflow = build_workflow()

    # Save local copy for debugging
    local_path = "/Users/victor/60_Day_Shipping/messaging-tracker/scripts/github-activity-monitor.json"
    with open(local_path, "w") as f:
        json.dump(workflow, f, indent=2)
    print(f"[1/3] Workflow JSON saved to {local_path}")

    # Create workflow via POST
    print("[2/3] Creating workflow on n8n Cloud...")
    result = api_request("POST", "/workflows", workflow)
    wf_id = result["id"]
    print(f"       Workflow created: id={wf_id}")

    # Activate via POST to /activate endpoint
    print("[3/3] Activating workflow...")
    api_request("POST", f"/workflows/{wf_id}/activate", {})
    print("       Workflow activated!")

    print(f"\nDone. Workflow ID: {wf_id}")
    print(f"URL: {N8N_HOST}/workflow/{wf_id}")


if __name__ == "__main__":
    main()
