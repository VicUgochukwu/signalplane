#!/usr/bin/env python3
"""Deploy Twitter/X Monitor workflow to n8n Cloud."""

import json
import requests
import sys

N8N_BASE = "https://replyra.app.n8n.cloud/api/v1"
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZGY5MTZmZC1hOGJlLTQzMzUtOTMzNy0wMGNlNjBkYTk3MTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwODEzOTUxLCJleHAiOjE3NzMzNTY0MDB9.RookISGjaLn_SAjDiHutnwLMNEsExekfHG7kFOegRl8"

SUPABASE_PROJECT = "dnqjzgfunvbofsuibcsk"
SUPABASE_REST = f"https://{SUPABASE_PROJECT}.supabase.co/rest/v1"
SUPABASE_FUNCTIONS = f"https://{SUPABASE_PROJECT}.supabase.co/functions/v1"


def build_workflow():
    nodes = []
    connections = {}

    def connect(from_name, to_name, from_index=0, to_index=0):
        if from_name not in connections:
            connections[from_name] = {"main": []}
        main = connections[from_name]["main"]
        while len(main) <= from_index:
            main.append([])
        main[from_index].append({"node": to_name, "type": "main", "index": to_index})

    # 1. Schedule Trigger
    nodes.append({
        "id": "a1b2c3d4-1111-4000-8000-000000000001",
        "name": "Daily 7am UTC",
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "position": [0, 0],
        "parameters": {
            "rule": {
                "interval": [{"field": "cronExpression", "expression": "0 7 * * *"}]
            }
        }
    })

    # 2. Manual Trigger
    nodes.append({
        "id": "a1b2c3d4-2222-4000-8000-000000000002",
        "name": "Manual Trigger",
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": [0, 200],
        "parameters": {}
    })

    # 3. Load Companies from Supabase
    nodes.append({
        "id": "a1b2c3d4-3333-4000-8000-000000000003",
        "name": "Load Companies",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [300, 100],
        "parameters": {
            "method": "GET",
            "url": f"{SUPABASE_REST}/companies?select=id,name,slug",
            "authentication": "genericCredentialType",
            "genericAuthType": "httpHeaderAuth",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "Accept-Profile", "value": "core"},
                    {"name": "Accept", "value": "application/json"}
                ]
            },
            "options": {}
        },
        "credentials": {
            "httpHeaderAuth": {
                "id": "H8tMhKgDqMwTB6An",
                "name": "Supabase – Messaging Tracker"
            }
        }
    })
    connect("Daily 7am UTC", "Load Companies")
    connect("Manual Trigger", "Load Companies")

    # 4. Loop Companies
    nodes.append({
        "id": "a1b2c3d4-4444-4000-8000-000000000004",
        "name": "Loop Companies",
        "type": "n8n-nodes-base.splitInBatches",
        "typeVersion": 3,
        "position": [550, 100],
        "parameters": {"batchSize": 1, "options": {}}
    })
    connect("Load Companies", "Loop Companies")

    # 5. Scrape Twitter via Apify
    nodes.append({
        "id": "a1b2c3d4-5555-4000-8000-000000000005",
        "name": "Scrape Twitter",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [800, 200],
        "parameters": {
            "method": "POST",
            "url": "https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items",
            "authentication": "genericCredentialType",
            "genericAuthType": "httpHeaderAuth",
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify({\"searchTerms\": [$json.name], \"maxTweets\": 15, \"searchMode\": \"live\"}) }}",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [{"name": "Content-Type", "value": "application/json"}]
            },
            "options": {"timeout": 120000}
        },
        "credentials": {
            "httpHeaderAuth": {"id": "zg9J7ZGw7o888S6t", "name": "Header Auth account"}
        }
    })
    connect("Loop Companies", "Scrape Twitter", from_index=1)
