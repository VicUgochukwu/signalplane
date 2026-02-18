-- Migration: Add missing APIs to admin.api_registry
-- Currently registered: Anthropic Claude, Supabase, Slack, Notion, Apify, n8n Cloud
-- Missing: Loops.so, Resend
-- Date: 2026-02-13

INSERT INTO admin.api_registry (api_name, api_slug, health_check_url, health_check_method, health_check_headers, health_check_body, expected_status_codes, timeout_ms, category, docs_url) VALUES
(
  'Loops',
  'loops',
  'https://app.loops.so/api/v1/contacts?limit=1',
  'GET',
  '{"Authorization": "ENV:LOOPS_API_KEY"}',
  NULL,
  '{200}',
  10000,
  'integration',
  'https://loops.so/docs/api-reference'
),
(
  'Resend',
  'resend',
  'https://api.resend.com/domains',
  'GET',
  '{"Authorization": "Bearer ENV:RESEND_API_KEY"}',
  NULL,
  '{200,401}',
  10000,
  'integration',
  'https://resend.com/docs/api-reference'
)
ON CONFLICT (api_slug) DO UPDATE SET expected_status_codes = EXCLUDED.expected_status_codes;
