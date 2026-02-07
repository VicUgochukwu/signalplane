-- Seed Sector Packs with Real SaaS Companies (Expanded)
-- Run this in Supabase SQL Editor
-- 15 Sector Packs with 6-8 companies each

-- Clear existing packs (if any test data)
DELETE FROM sector_packs.pack_companies;
DELETE FROM sector_packs.packs;

-- Insert real SaaS sector packs (15 packs)
INSERT INTO sector_packs.packs (pack_slug, pack_name, description, sector, motion) VALUES
  ('developer-tools', 'Developer Tools', 'APIs, SDKs, and developer infrastructure', 'devtools', 'plg'),
  ('product-analytics', 'Product Analytics', 'Product analytics, experimentation, and user behavior', 'analytics', 'plg'),
  ('sales-engagement', 'Sales Engagement', 'Sales automation, outreach, and CRM tools', 'sales', 'sales_led'),
  ('customer-success', 'Customer Success', 'Customer success, support, and retention platforms', 'cs', 'hybrid'),
  ('marketing-automation', 'Marketing Automation', 'Email marketing, ABM, and demand generation', 'marketing', 'hybrid'),
  ('data-infrastructure', 'Data Infrastructure', 'Data warehouses, ETL, and data platforms', 'data', 'plg'),
  ('cybersecurity', 'Cybersecurity', 'Enterprise security, identity, and compliance', 'security', 'sales_led'),
  ('fintech-infrastructure', 'Fintech Infrastructure', 'Payments, banking-as-a-service, and financial APIs', 'fintech', 'hybrid'),
  ('hr-tech', 'HR Tech', 'HRIS, payroll, recruiting, and people operations', 'hr', 'sales_led'),
  ('collaboration', 'Collaboration & Productivity', 'Team collaboration, project management, and docs', 'productivity', 'plg'),
  ('cloud-infrastructure', 'Cloud Infrastructure', 'Cloud platforms, CDN, edge computing, and infrastructure', 'cloud', 'hybrid'),
  ('ai-ml-platforms', 'AI/ML Platforms', 'Foundation models, AI APIs, and machine learning infrastructure', 'ai', 'plg'),
  ('devops-observability', 'DevOps & Observability', 'Monitoring, APM, incident management, and CI/CD', 'devops', 'plg'),
  ('ecommerce-platforms', 'E-commerce Platforms', 'Online storefronts, commerce APIs, and retail tech', 'ecommerce', 'hybrid'),
  ('nocode-lowcode', 'No-Code/Low-Code', 'Visual builders, automation, and citizen developer tools', 'nocode', 'plg');

-- Seed companies for Developer Tools pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Stripe', 'stripe.com', 'leader', '[{"url": "https://stripe.com", "page_type": "homepage"}, {"url": "https://stripe.com/pricing", "page_type": "pricing"}]'),
  ('Twilio', 'twilio.com', 'leader', '[{"url": "https://twilio.com", "page_type": "homepage"}, {"url": "https://twilio.com/pricing", "page_type": "pricing"}]'),
  ('Auth0', 'auth0.com', 'leader', '[{"url": "https://auth0.com", "page_type": "homepage"}, {"url": "https://auth0.com/pricing", "page_type": "pricing"}]'),
  ('Postman', 'postman.com', 'leader', '[{"url": "https://postman.com", "page_type": "homepage"}, {"url": "https://postman.com/pricing", "page_type": "pricing"}]'),
  ('LaunchDarkly', 'launchdarkly.com', 'challenger', '[{"url": "https://launchdarkly.com", "page_type": "homepage"}, {"url": "https://launchdarkly.com/pricing", "page_type": "pricing"}]'),
  ('Algolia', 'algolia.com', 'challenger', '[{"url": "https://algolia.com", "page_type": "homepage"}, {"url": "https://algolia.com/pricing", "page_type": "pricing"}]'),
  ('Vercel', 'vercel.com', 'leader', '[{"url": "https://vercel.com", "page_type": "homepage"}, {"url": "https://vercel.com/pricing", "page_type": "pricing"}]'),
  ('Supabase', 'supabase.com', 'emerging', '[{"url": "https://supabase.com", "page_type": "homepage"}, {"url": "https://supabase.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'developer-tools';

-- Seed companies for Product Analytics pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Amplitude', 'amplitude.com', 'leader', '[{"url": "https://amplitude.com", "page_type": "homepage"}, {"url": "https://amplitude.com/pricing", "page_type": "pricing"}]'),
  ('Mixpanel', 'mixpanel.com', 'leader', '[{"url": "https://mixpanel.com", "page_type": "homepage"}, {"url": "https://mixpanel.com/pricing", "page_type": "pricing"}]'),
  ('Heap', 'heap.io', 'challenger', '[{"url": "https://heap.io", "page_type": "homepage"}, {"url": "https://heap.io/pricing", "page_type": "pricing"}]'),
  ('PostHog', 'posthog.com', 'emerging', '[{"url": "https://posthog.com", "page_type": "homepage"}, {"url": "https://posthog.com/pricing", "page_type": "pricing"}]'),
  ('Pendo', 'pendo.io', 'leader', '[{"url": "https://pendo.io", "page_type": "homepage"}, {"url": "https://pendo.io/pricing", "page_type": "pricing"}]'),
  ('FullStory', 'fullstory.com', 'challenger', '[{"url": "https://fullstory.com", "page_type": "homepage"}, {"url": "https://fullstory.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'product-analytics';

-- Seed companies for Sales Engagement pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Outreach', 'outreach.io', 'leader', '[{"url": "https://outreach.io", "page_type": "homepage"}, {"url": "https://outreach.io/pricing", "page_type": "pricing"}]'),
  ('Salesloft', 'salesloft.com', 'leader', '[{"url": "https://salesloft.com", "page_type": "homepage"}, {"url": "https://salesloft.com/pricing", "page_type": "pricing"}]'),
  ('Gong', 'gong.io', 'leader', '[{"url": "https://gong.io", "page_type": "homepage"}, {"url": "https://gong.io/pricing", "page_type": "pricing"}]'),
  ('Apollo', 'apollo.io', 'challenger', '[{"url": "https://apollo.io", "page_type": "homepage"}, {"url": "https://apollo.io/pricing", "page_type": "pricing"}]'),
  ('ZoomInfo', 'zoominfo.com', 'leader', '[{"url": "https://zoominfo.com", "page_type": "homepage"}, {"url": "https://zoominfo.com/pricing", "page_type": "pricing"}]'),
  ('Clari', 'clari.com', 'challenger', '[{"url": "https://clari.com", "page_type": "homepage"}, {"url": "https://clari.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'sales-engagement';

-- Seed companies for Customer Success pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Gainsight', 'gainsight.com', 'leader', '[{"url": "https://gainsight.com", "page_type": "homepage"}, {"url": "https://gainsight.com/pricing", "page_type": "pricing"}]'),
  ('ChurnZero', 'churnzero.com', 'challenger', '[{"url": "https://churnzero.com", "page_type": "homepage"}, {"url": "https://churnzero.com/pricing", "page_type": "pricing"}]'),
  ('Totango', 'totango.com', 'challenger', '[{"url": "https://totango.com", "page_type": "homepage"}, {"url": "https://totango.com/pricing", "page_type": "pricing"}]'),
  ('Intercom', 'intercom.com', 'leader', '[{"url": "https://intercom.com", "page_type": "homepage"}, {"url": "https://intercom.com/pricing", "page_type": "pricing"}]'),
  ('Zendesk', 'zendesk.com', 'leader', '[{"url": "https://zendesk.com", "page_type": "homepage"}, {"url": "https://zendesk.com/pricing", "page_type": "pricing"}]'),
  ('Freshdesk', 'freshworks.com', 'challenger', '[{"url": "https://freshworks.com/freshdesk", "page_type": "homepage"}, {"url": "https://freshworks.com/freshdesk/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'customer-success';

-- Seed companies for Marketing Automation pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('HubSpot', 'hubspot.com', 'leader', '[{"url": "https://hubspot.com", "page_type": "homepage"}, {"url": "https://hubspot.com/pricing", "page_type": "pricing"}]'),
  ('Marketo', 'marketo.com', 'leader', '[{"url": "https://marketo.com", "page_type": "homepage"}, {"url": "https://business.adobe.com/products/marketo/pricing", "page_type": "pricing"}]'),
  ('Klaviyo', 'klaviyo.com', 'leader', '[{"url": "https://klaviyo.com", "page_type": "homepage"}, {"url": "https://klaviyo.com/pricing", "page_type": "pricing"}]'),
  ('Customer.io', 'customer.io', 'challenger', '[{"url": "https://customer.io", "page_type": "homepage"}, {"url": "https://customer.io/pricing", "page_type": "pricing"}]'),
  ('6sense', '6sense.com', 'leader', '[{"url": "https://6sense.com", "page_type": "homepage"}, {"url": "https://6sense.com/platform/pricing", "page_type": "pricing"}]'),
  ('Demandbase', 'demandbase.com', 'challenger', '[{"url": "https://demandbase.com", "page_type": "homepage"}, {"url": "https://demandbase.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'marketing-automation';

-- Seed companies for Data Infrastructure pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Snowflake', 'snowflake.com', 'leader', '[{"url": "https://snowflake.com", "page_type": "homepage"}, {"url": "https://snowflake.com/pricing", "page_type": "pricing"}]'),
  ('Databricks', 'databricks.com', 'leader', '[{"url": "https://databricks.com", "page_type": "homepage"}, {"url": "https://databricks.com/product/pricing", "page_type": "pricing"}]'),
  ('Fivetran', 'fivetran.com', 'leader', '[{"url": "https://fivetran.com", "page_type": "homepage"}, {"url": "https://fivetran.com/pricing", "page_type": "pricing"}]'),
  ('dbt Labs', 'getdbt.com', 'leader', '[{"url": "https://getdbt.com", "page_type": "homepage"}, {"url": "https://getdbt.com/pricing", "page_type": "pricing"}]'),
  ('Airbyte', 'airbyte.com', 'emerging', '[{"url": "https://airbyte.com", "page_type": "homepage"}, {"url": "https://airbyte.com/pricing", "page_type": "pricing"}]'),
  ('Segment', 'segment.com', 'leader', '[{"url": "https://segment.com", "page_type": "homepage"}, {"url": "https://segment.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'data-infrastructure';

-- Seed companies for Cybersecurity pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('CrowdStrike', 'crowdstrike.com', 'leader', '[{"url": "https://crowdstrike.com", "page_type": "homepage"}, {"url": "https://crowdstrike.com/products/pricing", "page_type": "pricing"}]'),
  ('Okta', 'okta.com', 'leader', '[{"url": "https://okta.com", "page_type": "homepage"}, {"url": "https://okta.com/pricing", "page_type": "pricing"}]'),
  ('Snyk', 'snyk.io', 'leader', '[{"url": "https://snyk.io", "page_type": "homepage"}, {"url": "https://snyk.io/pricing", "page_type": "pricing"}]'),
  ('Wiz', 'wiz.io', 'leader', '[{"url": "https://wiz.io", "page_type": "homepage"}, {"url": "https://wiz.io/pricing", "page_type": "pricing"}]'),
  ('1Password', '1password.com', 'challenger', '[{"url": "https://1password.com", "page_type": "homepage"}, {"url": "https://1password.com/business-pricing", "page_type": "pricing"}]'),
  ('Vanta', 'vanta.com', 'emerging', '[{"url": "https://vanta.com", "page_type": "homepage"}, {"url": "https://vanta.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'cybersecurity';

-- Seed companies for Fintech Infrastructure pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Plaid', 'plaid.com', 'leader', '[{"url": "https://plaid.com", "page_type": "homepage"}, {"url": "https://plaid.com/pricing", "page_type": "pricing"}]'),
  ('Marqeta', 'marqeta.com', 'leader', '[{"url": "https://marqeta.com", "page_type": "homepage"}, {"url": "https://marqeta.com/pricing", "page_type": "pricing"}]'),
  ('Modern Treasury', 'moderntreasury.com', 'challenger', '[{"url": "https://moderntreasury.com", "page_type": "homepage"}, {"url": "https://moderntreasury.com/pricing", "page_type": "pricing"}]'),
  ('Ramp', 'ramp.com', 'leader', '[{"url": "https://ramp.com", "page_type": "homepage"}, {"url": "https://ramp.com/pricing", "page_type": "pricing"}]'),
  ('Brex', 'brex.com', 'leader', '[{"url": "https://brex.com", "page_type": "homepage"}, {"url": "https://brex.com/pricing", "page_type": "pricing"}]'),
  ('Mercury', 'mercury.com', 'challenger', '[{"url": "https://mercury.com", "page_type": "homepage"}, {"url": "https://mercury.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'fintech-infrastructure';

-- Seed companies for HR Tech pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Rippling', 'rippling.com', 'leader', '[{"url": "https://rippling.com", "page_type": "homepage"}, {"url": "https://rippling.com/pricing", "page_type": "pricing"}]'),
  ('Gusto', 'gusto.com', 'leader', '[{"url": "https://gusto.com", "page_type": "homepage"}, {"url": "https://gusto.com/pricing", "page_type": "pricing"}]'),
  ('Lattice', 'lattice.com', 'leader', '[{"url": "https://lattice.com", "page_type": "homepage"}, {"url": "https://lattice.com/pricing", "page_type": "pricing"}]'),
  ('Greenhouse', 'greenhouse.com', 'leader', '[{"url": "https://greenhouse.com", "page_type": "homepage"}, {"url": "https://greenhouse.com/pricing", "page_type": "pricing"}]'),
  ('Lever', 'lever.co', 'challenger', '[{"url": "https://lever.co", "page_type": "homepage"}, {"url": "https://lever.co/pricing", "page_type": "pricing"}]'),
  ('BambooHR', 'bamboohr.com', 'challenger', '[{"url": "https://bamboohr.com", "page_type": "homepage"}, {"url": "https://bamboohr.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'hr-tech';

-- Seed companies for Collaboration pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Notion', 'notion.so', 'leader', '[{"url": "https://notion.so", "page_type": "homepage"}, {"url": "https://notion.so/pricing", "page_type": "pricing"}]'),
  ('Figma', 'figma.com', 'leader', '[{"url": "https://figma.com", "page_type": "homepage"}, {"url": "https://figma.com/pricing", "page_type": "pricing"}]'),
  ('Miro', 'miro.com', 'leader', '[{"url": "https://miro.com", "page_type": "homepage"}, {"url": "https://miro.com/pricing", "page_type": "pricing"}]'),
  ('Loom', 'loom.com', 'challenger', '[{"url": "https://loom.com", "page_type": "homepage"}, {"url": "https://loom.com/pricing", "page_type": "pricing"}]'),
  ('Linear', 'linear.app', 'emerging', '[{"url": "https://linear.app", "page_type": "homepage"}, {"url": "https://linear.app/pricing", "page_type": "pricing"}]'),
  ('Coda', 'coda.io', 'challenger', '[{"url": "https://coda.io", "page_type": "homepage"}, {"url": "https://coda.io/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'collaboration';

-- Seed companies for Cloud Infrastructure pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('AWS', 'aws.amazon.com', 'leader', '[{"url": "https://aws.amazon.com", "page_type": "homepage"}, {"url": "https://aws.amazon.com/pricing", "page_type": "pricing"}]'),
  ('Google Cloud', 'cloud.google.com', 'leader', '[{"url": "https://cloud.google.com", "page_type": "homepage"}, {"url": "https://cloud.google.com/pricing", "page_type": "pricing"}]'),
  ('Microsoft Azure', 'azure.microsoft.com', 'leader', '[{"url": "https://azure.microsoft.com", "page_type": "homepage"}, {"url": "https://azure.microsoft.com/pricing", "page_type": "pricing"}]'),
  ('Cloudflare', 'cloudflare.com', 'leader', '[{"url": "https://cloudflare.com", "page_type": "homepage"}, {"url": "https://cloudflare.com/plans", "page_type": "pricing"}]'),
  ('DigitalOcean', 'digitalocean.com', 'challenger', '[{"url": "https://digitalocean.com", "page_type": "homepage"}, {"url": "https://digitalocean.com/pricing", "page_type": "pricing"}]'),
  ('Fly.io', 'fly.io', 'emerging', '[{"url": "https://fly.io", "page_type": "homepage"}, {"url": "https://fly.io/docs/about/pricing", "page_type": "pricing"}]'),
  ('Render', 'render.com', 'emerging', '[{"url": "https://render.com", "page_type": "homepage"}, {"url": "https://render.com/pricing", "page_type": "pricing"}]'),
  ('Railway', 'railway.app', 'emerging', '[{"url": "https://railway.app", "page_type": "homepage"}, {"url": "https://railway.app/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'cloud-infrastructure';

-- Seed companies for AI/ML Platforms pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('OpenAI', 'openai.com', 'leader', '[{"url": "https://openai.com", "page_type": "homepage"}, {"url": "https://openai.com/pricing", "page_type": "pricing"}]'),
  ('Anthropic', 'anthropic.com', 'leader', '[{"url": "https://anthropic.com", "page_type": "homepage"}, {"url": "https://anthropic.com/pricing", "page_type": "pricing"}]'),
  ('Cohere', 'cohere.com', 'challenger', '[{"url": "https://cohere.com", "page_type": "homepage"}, {"url": "https://cohere.com/pricing", "page_type": "pricing"}]'),
  ('Hugging Face', 'huggingface.co', 'leader', '[{"url": "https://huggingface.co", "page_type": "homepage"}, {"url": "https://huggingface.co/pricing", "page_type": "pricing"}]'),
  ('Replicate', 'replicate.com', 'emerging', '[{"url": "https://replicate.com", "page_type": "homepage"}, {"url": "https://replicate.com/pricing", "page_type": "pricing"}]'),
  ('Stability AI', 'stability.ai', 'challenger', '[{"url": "https://stability.ai", "page_type": "homepage"}, {"url": "https://stability.ai/pricing", "page_type": "pricing"}]'),
  ('Together AI', 'together.ai', 'emerging', '[{"url": "https://together.ai", "page_type": "homepage"}, {"url": "https://together.ai/pricing", "page_type": "pricing"}]'),
  ('Mistral AI', 'mistral.ai', 'challenger', '[{"url": "https://mistral.ai", "page_type": "homepage"}, {"url": "https://mistral.ai/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'ai-ml-platforms';

-- Seed companies for DevOps & Observability pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Datadog', 'datadoghq.com', 'leader', '[{"url": "https://datadoghq.com", "page_type": "homepage"}, {"url": "https://datadoghq.com/pricing", "page_type": "pricing"}]'),
  ('New Relic', 'newrelic.com', 'leader', '[{"url": "https://newrelic.com", "page_type": "homepage"}, {"url": "https://newrelic.com/pricing", "page_type": "pricing"}]'),
  ('PagerDuty', 'pagerduty.com', 'leader', '[{"url": "https://pagerduty.com", "page_type": "homepage"}, {"url": "https://pagerduty.com/pricing", "page_type": "pricing"}]'),
  ('Grafana Labs', 'grafana.com', 'leader', '[{"url": "https://grafana.com", "page_type": "homepage"}, {"url": "https://grafana.com/pricing", "page_type": "pricing"}]'),
  ('Splunk', 'splunk.com', 'leader', '[{"url": "https://splunk.com", "page_type": "homepage"}, {"url": "https://splunk.com/en_us/products/pricing", "page_type": "pricing"}]'),
  ('Sentry', 'sentry.io', 'challenger', '[{"url": "https://sentry.io", "page_type": "homepage"}, {"url": "https://sentry.io/pricing", "page_type": "pricing"}]'),
  ('Honeycomb', 'honeycomb.io', 'emerging', '[{"url": "https://honeycomb.io", "page_type": "homepage"}, {"url": "https://honeycomb.io/pricing", "page_type": "pricing"}]'),
  ('CircleCI', 'circleci.com', 'challenger', '[{"url": "https://circleci.com", "page_type": "homepage"}, {"url": "https://circleci.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'devops-observability';

-- Seed companies for E-commerce Platforms pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Shopify', 'shopify.com', 'leader', '[{"url": "https://shopify.com", "page_type": "homepage"}, {"url": "https://shopify.com/pricing", "page_type": "pricing"}]'),
  ('BigCommerce', 'bigcommerce.com', 'challenger', '[{"url": "https://bigcommerce.com", "page_type": "homepage"}, {"url": "https://bigcommerce.com/pricing", "page_type": "pricing"}]'),
  ('Webflow', 'webflow.com', 'leader', '[{"url": "https://webflow.com", "page_type": "homepage"}, {"url": "https://webflow.com/pricing", "page_type": "pricing"}]'),
  ('Square', 'squareup.com', 'leader', '[{"url": "https://squareup.com", "page_type": "homepage"}, {"url": "https://squareup.com/pricing", "page_type": "pricing"}]'),
  ('WooCommerce', 'woocommerce.com', 'leader', '[{"url": "https://woocommerce.com", "page_type": "homepage"}, {"url": "https://woocommerce.com/pricing", "page_type": "pricing"}]'),
  ('Commercetools', 'commercetools.com', 'challenger', '[{"url": "https://commercetools.com", "page_type": "homepage"}, {"url": "https://commercetools.com/pricing", "page_type": "pricing"}]'),
  ('Swell', 'swell.is', 'emerging', '[{"url": "https://swell.is", "page_type": "homepage"}, {"url": "https://swell.is/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'ecommerce-platforms';

-- Seed companies for No-Code/Low-Code pack
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT p.id, c.company_name, c.company_domain, c.tier, c.tracked_urls::jsonb
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Retool', 'retool.com', 'leader', '[{"url": "https://retool.com", "page_type": "homepage"}, {"url": "https://retool.com/pricing", "page_type": "pricing"}]'),
  ('Airtable', 'airtable.com', 'leader', '[{"url": "https://airtable.com", "page_type": "homepage"}, {"url": "https://airtable.com/pricing", "page_type": "pricing"}]'),
  ('Zapier', 'zapier.com', 'leader', '[{"url": "https://zapier.com", "page_type": "homepage"}, {"url": "https://zapier.com/pricing", "page_type": "pricing"}]'),
  ('Make', 'make.com', 'challenger', '[{"url": "https://make.com", "page_type": "homepage"}, {"url": "https://make.com/en/pricing", "page_type": "pricing"}]'),
  ('Bubble', 'bubble.io', 'challenger', '[{"url": "https://bubble.io", "page_type": "homepage"}, {"url": "https://bubble.io/pricing", "page_type": "pricing"}]'),
  ('Glide', 'glideapps.com', 'emerging', '[{"url": "https://glideapps.com", "page_type": "homepage"}, {"url": "https://glideapps.com/pricing", "page_type": "pricing"}]'),
  ('n8n', 'n8n.io', 'emerging', '[{"url": "https://n8n.io", "page_type": "homepage"}, {"url": "https://n8n.io/pricing", "page_type": "pricing"}]'),
  ('Appsmith', 'appsmith.com', 'emerging', '[{"url": "https://appsmith.com", "page_type": "homepage"}, {"url": "https://appsmith.com/pricing", "page_type": "pricing"}]')
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'nocode-lowcode';

-- Verify the results
SELECT p.pack_name, COUNT(pc.id) as company_count
FROM sector_packs.packs p
LEFT JOIN sector_packs.pack_companies pc ON pc.pack_id = p.id
GROUP BY p.pack_name
ORDER BY p.pack_name;
