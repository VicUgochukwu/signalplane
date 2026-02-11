import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DemoProvider, useDemo } from '@/contexts/DemoContext';
import { DemoNavigation } from '@/components/demo/DemoNavigation';
import { Footer } from '@/components/Footer';
import { FilterBar } from '@/components/FilterBar';
import { WeekSection } from '@/components/WeekSection';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, ArrowRight } from 'lucide-react';
import { IconSignalCount, IconPersonaRevenue, IconCompany } from '@/components/icons';
import { Link } from 'react-router-dom';
import type { ChangelogEntry } from '@/types/changelog';

// ── Helper to build entries concisely ──
const s = (
  week: string, company: string, slug: string, url: string, urlType: string,
  tag: string, summary: string, imp: string, conf: number, mag: 'minor' | 'moderate' | 'major',
): ChangelogEntry => ({
  week_start_date: week, company_name: company, company_slug: slug, url, url_type: urlType,
  primary_tag: tag, diff_summary: summary, implication: imp, confidence: conf, change_magnitude: mag,
});

// ── Mock signals per sector ──
const SECTOR_SIGNALS: Record<string, ChangelogEntry[]> = {
  'developer-tools': [
    s('2025-02-03', 'GitLab', 'gitlab', 'https://about.gitlab.com', 'homepage', 'VALUE_PROP_CHANGE', 'Shifted primary homepage headline from "The DevSecOps Platform" to "The AI-Powered DevSecOps Platform" — repositioning around AI-assisted development workflows.', 'GitLab is leaning into the AI narrative to compete with GitHub Copilot. Expect feature announcements around AI code review and automated security scanning.', 87, 'major'),
    s('2025-02-03', 'CircleCI', 'circleci', 'https://circleci.com/pricing', 'pricing', 'PRICING_CHANGE', 'Introduced a new "Scale" tier at $1,200/mo positioned between Team ($299/mo) and Enterprise. Includes 50 concurrent jobs and priority support.', 'CircleCI is filling a mid-market gap — likely losing deals to GitHub Actions in the $300-$2000/mo range. This tier targets growing engineering teams.', 92, 'major'),
    s('2025-02-03', 'Snyk', 'snyk', 'https://snyk.io/product', 'product', 'ICP_SHIFT', 'Added "Platform Engineering Teams" as a primary audience on the product page, alongside existing Developer and Security team personas.', 'Snyk is expanding beyond developer-first security into the platform engineering buyer. This signals potential competition in the internal developer platform space.', 78, 'moderate'),
    s('2025-01-27', 'GitLab', 'gitlab', 'https://about.gitlab.com/blog', 'blog', 'NARRATIVE_SHIFT', 'Published "Why DevSecOps is Dead" blog post arguing for a unified platform approach over tool sprawl — a direct challenge to best-of-breed positioning.', 'GitLab is escalating the platform vs. point solution narrative. Sales teams should prepare counter-arguments about integration flexibility.', 85, 'moderate'),
    s('2025-01-27', 'Datadog', 'datadog', 'https://www.datadoghq.com/product', 'product', 'VALUE_PROP_CHANGE', 'Replaced "Cloud Monitoring" positioning with "Observability & Security Platform" — bundling security monitoring into core product messaging.', 'Datadog is converging monitoring and security, creating a new competitive front with Snyk and Wiz. Expect bundled pricing that undercuts standalone security tools.', 81, 'moderate'),
    s('2025-01-27', 'Snyk', 'snyk', 'https://snyk.io/partners', 'partners', 'PARTNERSHIP', 'Announced strategic partnership with ServiceNow for integrated vulnerability management workflows — ITSM meets AppSec.', 'This targets enterprise buyers who want vulnerability data in their existing ITSM workflows. Could accelerate Snyk enterprise deals.', 74, 'minor'),
  ],
  'product-analytics': [
    s('2025-02-03', 'Amplitude', 'amplitude', 'https://amplitude.com', 'homepage', 'VALUE_PROP_CHANGE', 'Changed homepage hero from "Digital Analytics Platform" to "Digital Analytics for Product & Marketing Teams" — explicitly targeting marketing as a co-buyer.', 'Amplitude is expanding beyond product teams into marketing analytics, directly competing with Mixpanel and Heap in the marketing use case.', 88, 'major'),
    s('2025-02-03', 'Mixpanel', 'mixpanel', 'https://mixpanel.com/pricing', 'pricing', 'PRICING_CHANGE', 'Reduced free tier from 20M to 10M events/month. Growth plan now starts at $28/mo (was $25/mo).', 'Mixpanel is tightening the free-to-paid conversion funnel. Smaller startups may look for alternatives, creating an acquisition opportunity.', 94, 'moderate'),
    s('2025-02-03', 'Heap', 'heap', 'https://heap.io', 'homepage', 'NARRATIVE_SHIFT', 'Added "Contentsquare + Heap" co-branding to homepage after acquisition. Enterprise messaging now leads with digital experience analytics.', 'Post-acquisition, Heap is repositioning as an enterprise digital experience tool. Mid-market customers may feel abandoned.', 86, 'major'),
    s('2025-01-27', 'PostHog', 'posthog', 'https://posthog.com/product', 'product', 'NARRATIVE_SHIFT', 'Repositioned from "Open-source product analytics" to "The all-in-one product and data platform" — adding warehouse-native analytics messaging.', 'PostHog is going after the data stack with warehouse-native positioning. They are trying to own both the analytics and data engineering buyer.', 82, 'major'),
    s('2025-01-27', 'Amplitude', 'amplitude', 'https://amplitude.com/blog', 'blog', 'ICP_SHIFT', 'New blog series targeting "Growth Operators" — a hybrid role combining product and growth marketing, signaling a shift in ICP definition.', 'Amplitude sees the growth operations role as an emerging buyer. Sales teams encountering this title should treat them as primary decision-makers.', 72, 'minor'),
    s('2025-01-20', 'Mixpanel', 'mixpanel', 'https://mixpanel.com/product', 'product', 'VALUE_PROP_CHANGE', 'Promoted "AI Insights" from a beta badge to a primary navigation item. Messaging now says "Get answers in seconds, not SQL."', 'Mixpanel is betting on AI-generated insights as a differentiator. Competitors without natural language query features will face comparison pressure.', 79, 'moderate'),
  ],
  'sales-engagement': [
    s('2025-02-03', 'Outreach', 'outreach', 'https://outreach.io', 'homepage', 'VALUE_PROP_CHANGE', 'Homepage now leads with "Revenue Execution Platform" instead of "Sales Engagement Platform" — expanding beyond SDR use case to full-cycle revenue.', 'Outreach is moving upmarket to compete with Clari and Gong on deal execution. Their TAM just expanded from SDR tooling to the entire revenue org.', 90, 'major'),
    s('2025-02-03', 'Salesloft', 'salesloft', 'https://salesloft.com/pricing', 'pricing', 'PRICING_CHANGE', 'Removed per-seat pricing from the website. All plans now require a "Talk to Sales" conversation, suggesting a shift to value-based pricing.', 'Salesloft is likely increasing prices post-Vista acquisition. This opacity makes competitive displacement harder to benchmark.', 85, 'major'),
    s('2025-02-03', 'Apollo.io', 'apollo', 'https://apollo.io/product', 'product', 'ICP_SHIFT', 'New "Startup Plan" page with emphasis on solopreneurs and 1-5 person sales teams. Added TikTok-style testimonial videos from indie founders.', 'Apollo is aggressively going after the micro-business segment that Outreach and Salesloft ignore. PLG motion could bring millions of users into their funnel.', 83, 'moderate'),
    s('2025-01-27', 'Gong', 'gong', 'https://gong.io', 'homepage', 'NARRATIVE_SHIFT', 'Replaced "Revenue Intelligence Platform" with "Revenue AI Platform" and added a prominent "Gong AI" product page with autonomous follow-up features.', 'Gong is betting on AI agents that automate post-call workflows. If successful, this reduces the need for SDRs and threatens sequence-based tools directly.', 88, 'major'),
    s('2025-01-27', 'Outreach', 'outreach', 'https://outreach.io/blog', 'blog', 'PARTNERSHIP', 'Published integration announcement with Salesforce Revenue Cloud, including native data sync and co-selling agreement.', 'This strengthens Outreach for Salesforce-centric orgs and weakens the argument for HubSpot-native alternatives. Deal influence will shift toward CRO-level buyers.', 76, 'moderate'),
    s('2025-01-27', 'Salesloft', 'salesloft', 'https://salesloft.com/blog', 'blog', 'VALUE_PROP_CHANGE', 'New content hub called "Revenue Orchestration" with thought leadership on pipeline management, forecasting, and deal rooms.', 'Salesloft is rebranding from sales engagement to revenue orchestration — directly overlapping with Clari and Aviso messaging.', 71, 'minor'),
  ],
  'customer-success': [
    s('2025-02-03', 'Gainsight', 'gainsight', 'https://gainsight.com', 'homepage', 'VALUE_PROP_CHANGE', 'New homepage headline: "The AI-First Customer Success Platform" — replacing "Customer Success & Product Experience Software." AI now leads the narrative.', 'Gainsight is repositioning around AI to justify premium pricing. Expect product launches around predictive churn and automated playbooks.', 89, 'major'),
    s('2025-02-03', 'ChurnZero', 'churnzero', 'https://churnzero.com/pricing', 'pricing', 'PRICING_CHANGE', 'Introduced a free "Starter" tier for up to 50 accounts with basic health scoring and email automation.', 'ChurnZero is adopting a PLG strategy to capture startups early. This directly challenges Vitally and Planhat in the SMB segment.', 87, 'major'),
    s('2025-01-27', 'Totango', 'totango', 'https://totango.com/product', 'product', 'ICP_SHIFT', 'Added "Digital-Led CS" as a primary product pillar alongside high-touch CS. Messaging now targets companies scaling from 100 to 10,000 customers.', 'Totango sees digital-first customer success as the growth vector. This reflects the industry trend of automating CSM workflows for long-tail accounts.', 80, 'moderate'),
    s('2025-01-27', 'Vitally', 'vitally', 'https://vitally.io', 'homepage', 'NARRATIVE_SHIFT', 'Repositioned from "Customer Success for B2B SaaS" to "The Proactive Customer Platform" — broadening appeal beyond pure CS teams.', 'Vitally is expanding its buyer to include CX, support, and account management. Expect integration-heavy messaging targeting multi-team workflows.', 77, 'moderate'),
    s('2025-01-20', 'Gainsight', 'gainsight', 'https://gainsight.com/blog', 'blog', 'NARRATIVE_SHIFT', 'Published "The Death of Reactive CS" manifesto calling for proactive, data-driven customer engagement over traditional QBR-based models.', 'Gainsight is trying to redefine the CS category on its terms. Sales teams should emphasize proactive capabilities in competitive deals.', 73, 'minor'),
  ],
  'marketing-automation': [
    s('2025-02-03', 'HubSpot', 'hubspot', 'https://hubspot.com', 'homepage', 'VALUE_PROP_CHANGE', 'Homepage hero changed from "Grow Better" to "The Customer Platform for Scaling Companies" — emphasizing platform over individual hubs.', 'HubSpot is consolidating messaging around a unified platform story. Expect aggressive bundling that makes point solutions harder to justify.', 91, 'major'),
    s('2025-02-03', 'Klaviyo', 'klaviyo', 'https://klaviyo.com/pricing', 'pricing', 'PRICING_CHANGE', 'New "Email + SMS" bundle pricing that is 15% cheaper than buying separately. B2B tier now available at $400/mo for 10K contacts.', 'Klaviyo is entering B2B marketing automation — previously e-commerce only. This is a direct challenge to Mailchimp and ActiveCampaign in the SMB B2B space.', 88, 'major'),
    s('2025-02-03', 'ActiveCampaign', 'activecampaign', 'https://activecampaign.com/product', 'product', 'ICP_SHIFT', 'New page dedicated to "Revenue Teams" showing CRM + marketing automation in a single view. Sales coaching features highlighted for the first time.', 'ActiveCampaign is expanding from marketing-only to revenue operations. This targets HubSpot customers who find HubSpot Sales Hub too expensive.', 79, 'moderate'),
    s('2025-01-27', 'Braze', 'braze', 'https://braze.com', 'homepage', 'NARRATIVE_SHIFT', 'Replaced "Customer Engagement Platform" with "Cross-Channel Customer Interaction Platform" and added real-time personalization as a hero feature.', 'Braze is differentiating on real-time capabilities. This puts pressure on batch-oriented tools like Iterable and Customer.io.', 82, 'moderate'),
    s('2025-01-27', 'HubSpot', 'hubspot', 'https://hubspot.com/blog', 'blog', 'PARTNERSHIP', 'Announced deeper Shopify integration with native commerce data sync, abandoned cart workflows, and revenue attribution.', 'HubSpot is aggressively targeting e-commerce — Klaviyo and Omnisend territory. Expect unified CRM + commerce pitches in competitive deals.', 75, 'minor'),
  ],
  'data-infrastructure': [
    s('2025-02-03', 'Snowflake', 'snowflake', 'https://snowflake.com', 'homepage', 'VALUE_PROP_CHANGE', 'Homepage headline shifted from "The Data Cloud" to "The AI Data Cloud" — leading every product page with AI/ML workload support.', 'Snowflake is centering its identity on AI workloads to compete with Databricks. Expect GPU-accelerated compute features and AI marketplace expansions.', 93, 'major'),
    s('2025-02-03', 'Databricks', 'databricks', 'https://databricks.com/pricing', 'pricing', 'PRICING_CHANGE', 'Serverless SQL warehouse pricing reduced by 30%. New "Foundation" tier at $0.22/DBU specifically targeting BI workloads.', 'Databricks is making a land grab for the BI/SQL analytics layer — the traditional Snowflake stronghold. Expect pricing wars in the analytics workload segment.', 90, 'major'),
    s('2025-01-27', 'Fivetran', 'fivetran', 'https://fivetran.com/product', 'product', 'ICP_SHIFT', 'New "Data Engineering" product section targeting teams building custom pipelines, not just no-code connectors. Added Spark and dbt integration highlights.', 'Fivetran is moving from pure ELT into data engineering workflows. This signals competition with Airbyte and dbt in the hands-on data team segment.', 81, 'moderate'),
    s('2025-01-27', 'dbt Labs', 'dbt-labs', 'https://getdbt.com', 'homepage', 'NARRATIVE_SHIFT', 'New messaging: "The analytics engineering platform" replaces "Transform data in your warehouse." Added semantic layer and metrics store as top-level nav items.', 'dbt is evolving from a transformation tool into a full analytics engineering platform. The semantic layer play competes with Looker and Cube.', 84, 'moderate'),
    s('2025-01-20', 'Snowflake', 'snowflake', 'https://snowflake.com/blog', 'blog', 'PARTNERSHIP', 'Announced native integration with Anthropic Claude for in-warehouse AI processing without data leaving Snowflake.', 'Data residency + AI is a powerful combo for regulated industries. Competing warehouses without native LLM partnerships will face disadvantages in enterprise deals.', 77, 'moderate'),
  ],
  'cybersecurity': [
    s('2025-02-03', 'CrowdStrike', 'crowdstrike', 'https://crowdstrike.com', 'homepage', 'VALUE_PROP_CHANGE', 'Changed core positioning from "Endpoint Security" to "AI-Native Cybersecurity Platform" — leading with Charlotte AI (their security AI copilot).', 'CrowdStrike is betting that AI-driven automation is the new competitive moat. Every security vendor without an AI assistant will be asked about it in evaluations.', 92, 'major'),
    s('2025-02-03', 'Wiz', 'wiz', 'https://wiz.io/pricing', 'pricing', 'PRICING_CHANGE', 'Launched "Wiz for Startups" — free tier for companies under 50 employees and $500K ARR. Includes CSPM, vulnerability scanning, and identity security.', 'Wiz is land-grabbing startups before they become enterprises. This PLG play locks in customers who will grow into six-figure contracts.', 89, 'major'),
    s('2025-02-03', 'Palo Alto Networks', 'paloalto', 'https://paloaltonetworks.com/product', 'product', 'ICP_SHIFT', 'New "Platformization" page urging CISOs to consolidate from 30+ point solutions to one integrated platform. Case studies show 60% cost savings.', 'Palo Alto is running a vendor consolidation playbook. Best-of-breed competitors need counter-narratives about lock-in risk and specialization value.', 85, 'moderate'),
    s('2025-01-27', 'SentinelOne', 'sentinelone', 'https://sentinelone.com', 'homepage', 'NARRATIVE_SHIFT', 'New tagline: "Autonomous Security for the AI Era." Added "Purple AI" threat hunting assistant as the hero feature above the fold.', 'SentinelOne is differentiating on autonomous response — security that acts without human intervention. Regulated industries may push back on autonomy.', 80, 'moderate'),
    s('2025-01-27', 'CrowdStrike', 'crowdstrike', 'https://crowdstrike.com/blog', 'blog', 'PARTNERSHIP', 'Announced a strategic alliance with AWS for native cloud detection and response, including pre-integrated Falcon in AWS Marketplace.', 'Marketplace-native deployment simplifies procurement for AWS-first organizations and makes CrowdStrike the path of least resistance.', 74, 'minor'),
  ],
  'fintech-infrastructure': [
    s('2025-02-03', 'Stripe', 'stripe', 'https://stripe.com', 'homepage', 'VALUE_PROP_CHANGE', 'Homepage messaging evolved from "Payments infrastructure for the internet" to "Financial infrastructure to grow revenue" — leading with revenue outcomes, not payment rails.', 'Stripe is repositioning from payments processor to revenue growth platform. This encroaches on billing tools (Chargebee) and revenue platforms (Paddle).', 93, 'major'),
    s('2025-02-03', 'Adyen', 'adyen', 'https://adyen.com/pricing', 'pricing', 'PRICING_CHANGE', 'Published transparent interchange-plus pricing publicly for the first time. Previously required a sales conversation for all pricing details.', 'Adyen going transparent signals confidence in their rates and a push downmarket. Stripe and Braintree customers will start comparing line by line.', 88, 'major'),
    s('2025-01-27', 'Plaid', 'plaid', 'https://plaid.com/product', 'product', 'ICP_SHIFT', 'New "Plaid for Lending" product vertical targeting banks and credit unions directly — moving beyond fintech startup customers.', 'Plaid is going after traditional financial institutions. Their TAM just expanded dramatically but sales cycles will be much longer.', 82, 'moderate'),
    s('2025-01-27', 'Checkout.com', 'checkout', 'https://checkout.com', 'homepage', 'NARRATIVE_SHIFT', 'New messaging around "Unified Payments Intelligence" — emphasizing data analytics alongside processing. Added an analytics dashboard as a hero screenshot.', 'Checkout.com is differentiating on payment analytics. Merchants choosing between processors may weigh data insights as a tiebreaker.', 79, 'moderate'),
    s('2025-01-20', 'Stripe', 'stripe', 'https://stripe.com/blog', 'blog', 'PARTNERSHIP', 'Announced deep integration with Salesforce Revenue Cloud for automated billing reconciliation and subscription management.', 'Stripe + Salesforce native integration makes it harder for Zuora and Chargebee to win in Salesforce-heavy organizations.', 76, 'minor'),
  ],
  'hr-tech': [
    s('2025-02-03', 'Rippling', 'rippling', 'https://rippling.com', 'homepage', 'VALUE_PROP_CHANGE', 'Rebranded from "HR Platform" to "Workforce Management Platform" — leading with IT, finance, and HR unified under one employee graph.', 'Rippling is expanding beyond HR to own the entire employee operations stack. This directly challenges BambooHR, Gusto, and Deel simultaneously.', 90, 'major'),
    s('2025-02-03', 'Deel', 'deel', 'https://deel.com/pricing', 'pricing', 'PRICING_CHANGE', 'EOR pricing dropped from $599/mo to $499/mo per employee. Added a free "Deel HR" tier for basic people management.', 'Deel is using aggressive pricing to lock in SMBs. The free HR tier creates a PLG funnel that competes with BambooHR and Gusto at the low end.', 87, 'major'),
    s('2025-02-03', 'BambooHR', 'bamboohr', 'https://bamboohr.com/product', 'product', 'ICP_SHIFT', 'New product page emphasizing "Companies with 25-500 employees" — narrowing their ICP messaging from the previous broad SMB definition.', 'BambooHR is doubling down on mid-market instead of competing with enterprise HCMs. This creates opportunity to position against them in 500+ employee deals.', 78, 'moderate'),
    s('2025-01-27', 'Gusto', 'gusto', 'https://gusto.com', 'homepage', 'NARRATIVE_SHIFT', 'New tagline: "The people platform for small business." Added embedded payroll API messaging for the first time, targeting developers alongside HR managers.', 'Gusto is opening an embedded payroll channel. If successful, this creates a Plaid-like distribution moat in the payroll space.', 81, 'moderate'),
    s('2025-01-27', 'Rippling', 'rippling', 'https://rippling.com/blog', 'blog', 'PARTNERSHIP', 'Published integration with Navan (formerly TripActions) for automated travel policy enforcement tied to employee data.', 'Rippling keeps expanding the "employee graph" to adjacent workflows. Each integration deepens the switching cost for existing customers.', 73, 'minor'),
  ],
  'collaboration': [
    s('2025-02-03', 'Notion', 'notion', 'https://notion.so', 'homepage', 'VALUE_PROP_CHANGE', 'Homepage hero now says "Your wiki, docs, and projects. Together." with AI prominently featured. Added "Notion AI" as a standalone product in the navigation.', 'Notion is unbundling AI as a separate product — likely to monetize AI features independently. Competing wikis without AI will face feature gap pressure.', 89, 'major'),
    s('2025-02-03', 'Coda', 'coda', 'https://coda.io/pricing', 'pricing', 'PRICING_CHANGE', 'Simplified from 4 tiers to 3. Removed the "Pro" tier and merged features into "Team" ($12/mo) and "Enterprise." All plans now include AI.', 'Coda is simplifying pricing to reduce decision friction. Including AI in all plans removes a key Notion upsell differentiator.', 84, 'moderate'),
    s('2025-01-27', 'Slack', 'slack', 'https://slack.com/product', 'product', 'ICP_SHIFT', 'New "Slack for Engineering" landing page with deep GitHub, PagerDuty, and Jira integrations front and center. Developer workflows as primary use case.', 'Slack is segmenting by function to defend against Teams. Engineering-specific positioning makes it harder to displace in developer-heavy organizations.', 80, 'moderate'),
    s('2025-01-27', 'Notion', 'notion', 'https://notion.so/blog', 'blog', 'NARRATIVE_SHIFT', 'Published "Why We Are Building the Everything App for Work" — explicitly taking the super-app positioning against Confluence, Asana, and Linear.', 'Notion is declaring war on the entire productivity stack. Teams evaluating point solutions will increasingly hear "Notion can do that too."', 83, 'moderate'),
    s('2025-01-20', 'Linear', 'linear', 'https://linear.app', 'homepage', 'VALUE_PROP_CHANGE', 'Dropped "Issue Tracking" language entirely. Now positioned as "The purpose-built tool for modern product development." Added roadmapping and project views.', 'Linear is expanding from issue tracking into full project management. This puts them in direct competition with Asana and Shortcut, not just Jira.', 77, 'moderate'),
  ],
  'cloud-infrastructure': [
    s('2025-02-03', 'Vercel', 'vercel', 'https://vercel.com', 'homepage', 'VALUE_PROP_CHANGE', 'Homepage redesigned around "Your AI-powered frontend cloud" — previously "Develop. Preview. Ship." AI is now the primary value proposition.', 'Vercel is pivoting messaging to AI app deployment. Frontend cloud is becoming AI deployment infrastructure, changing competitive dynamics.', 91, 'major'),
    s('2025-02-03', 'Cloudflare', 'cloudflare', 'https://cloudflare.com/pricing', 'pricing', 'PRICING_CHANGE', 'Workers AI pricing reduced by 40%. New bundled "Developer Platform" package includes Workers, R2, D1, and AI at a single monthly price.', 'Cloudflare is creating a vertically integrated developer cloud to compete with AWS Lambda and Vercel. The bundle pricing makes individual product comparisons difficult.', 88, 'major'),
    s('2025-01-27', 'Netlify', 'netlify', 'https://netlify.com/product', 'product', 'ICP_SHIFT', 'New "Enterprise Composable Architecture" page targeting large organizations with headless CMS orchestration and multi-framework support.', 'Netlify is going upmarket from indie developers to enterprise web teams. The composable architecture narrative competes with Contentful and Sanity.', 79, 'moderate'),
    s('2025-01-27', 'Railway', 'railway', 'https://railway.app', 'homepage', 'NARRATIVE_SHIFT', 'Repositioned from "Infrastructure as Code" to "Ship your apps in seconds, not sprints" — developer experience over infrastructure control.', 'Railway is betting that developer speed matters more than infrastructure customization. This targets the same DX-obsessed audience as Render and Fly.io.', 76, 'moderate'),
    s('2025-01-20', 'Vercel', 'vercel', 'https://vercel.com/blog', 'blog', 'PARTNERSHIP', 'Announced "Vercel Firewall" powered by Cloudflare partnership for enterprise-grade web application security.', 'Vercel partnering with Cloudflare on security fills a critical enterprise gap. This removes a top objection in enterprise frontend infrastructure deals.', 72, 'minor'),
  ],
  'ai-ml-platforms': [
    s('2025-02-03', 'OpenAI', 'openai', 'https://openai.com', 'homepage', 'VALUE_PROP_CHANGE', 'Homepage now leads with "ChatGPT Enterprise" and "API Platform" as equal-weight product lines — previously API was buried in docs.', 'OpenAI is elevating the API business to match ChatGPT. Enterprise customers get clearer messaging about building custom AI vs. using ChatGPT directly.', 92, 'major'),
    s('2025-02-03', 'Cohere', 'cohere', 'https://cohere.com/pricing', 'pricing', 'PRICING_CHANGE', 'New "Command" model pricing at $0.50/1M input tokens — 60% cheaper than GPT-4o equivalent. Enterprise fine-tuning included at no extra cost.', 'Cohere is competing aggressively on price and enterprise customization. Organizations with data sovereignty concerns now have a significantly cheaper private alternative.', 89, 'major'),
    s('2025-02-03', 'Hugging Face', 'huggingface', 'https://huggingface.co', 'homepage', 'ICP_SHIFT', 'New "Enterprise Hub" section targeting Fortune 500 with SOC 2, private model hosting, and dedicated inference. Previously pure open-source community focus.', 'Hugging Face is commercializing their community moat. Enterprise teams using HF models in production now have a direct vendor path instead of self-hosting.', 84, 'moderate'),
    s('2025-01-27', 'Anthropic', 'anthropic', 'https://anthropic.com', 'homepage', 'NARRATIVE_SHIFT', 'Added "AI Safety" as a top-level navigation item equal to "Products." Published Constitutional AI methodology and safety benchmarks publicly.', 'Anthropic is differentiating on safety and transparency. In regulated industries, this safety-first narrative is a competitive advantage over OpenAI.', 86, 'moderate'),
    s('2025-01-27', 'Mistral', 'mistral', 'https://mistral.ai/product', 'product', 'VALUE_PROP_CHANGE', 'Launched "La Plateforme" with EU data residency guarantees. All models available for on-premise deployment with GDPR compliance built in.', 'Mistral owns the European AI narrative. Any US-based AI vendor competing in EU enterprise deals will face data sovereignty objections.', 81, 'moderate'),
    s('2025-01-20', 'OpenAI', 'openai', 'https://openai.com/blog', 'blog', 'PARTNERSHIP', 'Announced deep integration with Microsoft Fabric for enterprise data + AI workflows. Copilot Studio now connects to custom GPTs natively.', 'The Microsoft+OpenAI lock-in deepens. Organizations already in the Microsoft ecosystem face decreasing incentive to evaluate alternatives.', 78, 'minor'),
  ],
  'devops-observability': [
    s('2025-02-03', 'Datadog', 'datadog', 'https://datadoghq.com', 'homepage', 'VALUE_PROP_CHANGE', 'Repositioned from "Cloud Monitoring" to "The Observability & Security Platform" — security products now get equal billing with monitoring.', 'Datadog is converging observability and security into one platform. This challenges standalone SIEM vendors and cloud security tools simultaneously.', 90, 'major'),
    s('2025-02-03', 'Grafana Labs', 'grafana', 'https://grafana.com/pricing', 'pricing', 'PRICING_CHANGE', 'Grafana Cloud free tier expanded from 10K to 50K metrics series. Pro plan reduced from $29 to $19/user. Added 30-day log retention to free tier.', 'Grafana is using aggressive free tiers to undercut Datadog and New Relic on cost. Teams with budget constraints now have a compelling open-source-backed option.', 87, 'major'),
    s('2025-01-27', 'New Relic', 'newrelic', 'https://newrelic.com/product', 'product', 'ICP_SHIFT', 'Added "AI Monitoring" as a primary product category — tracking LLM performance, token usage, and hallucination rates alongside traditional APM.', 'New Relic is first to market with LLM observability. Teams building AI applications need specialized monitoring that traditional APM tools lack.', 83, 'moderate'),
    s('2025-01-27', 'Datadog', 'datadog', 'https://datadoghq.com/blog', 'blog', 'NARRATIVE_SHIFT', 'Published "The Total Cost of Observability" calculator showing TCO comparisons with Splunk, Elastic, and open-source alternatives.', 'Datadog is going on the offensive against cost objections. The TCO calculator is designed to kill the "Datadog is expensive" narrative in evaluations.', 79, 'moderate'),
    s('2025-01-20', 'Elastic', 'elastic', 'https://elastic.co', 'homepage', 'VALUE_PROP_CHANGE', 'Dropped "The Search Company" tagline. New messaging: "Search AI platform for enterprise data." Added vector search and RAG capabilities to hero.', 'Elastic is pivoting from search infrastructure to AI-powered enterprise search. This competes with Pinecone and Weaviate in the vector database space.', 76, 'minor'),
  ],
  'ecommerce-platforms': [
    s('2025-02-03', 'Shopify', 'shopify', 'https://shopify.com', 'homepage', 'VALUE_PROP_CHANGE', 'Homepage shifted from "Start your business" to "The commerce platform that does it all — online, in-person, and everywhere in between."', 'Shopify is emphasizing omnichannel to counter Amazon and compete with BigCommerce in B2B. The "everywhere" positioning signals POS and wholesale expansion.', 91, 'major'),
    s('2025-02-03', 'BigCommerce', 'bigcommerce', 'https://bigcommerce.com/pricing', 'pricing', 'PRICING_CHANGE', 'New "Enterprise Essentials" tier at $199/mo bridging the gap between Pro ($299/mo) and custom Enterprise. Includes B2B features previously gated.', 'BigCommerce is making B2B features more accessible to mid-market merchants. Shopify Plus customers paying $2K+/mo for B2B may reconsider.', 85, 'major'),
    s('2025-01-27', 'WooCommerce', 'woocommerce', 'https://woocommerce.com/product', 'product', 'ICP_SHIFT', 'New "WooCommerce for Agencies" program with partner dashboard, white-label hosting, and bulk licensing.', 'WooCommerce is building an agency channel to compete with Shopify Partners. Agency-driven deals are a massive distribution channel for e-commerce platforms.', 78, 'moderate'),
    s('2025-01-27', 'Shopify', 'shopify', 'https://shopify.com/blog', 'blog', 'NARRATIVE_SHIFT', 'Published "Why DTC is Dead" editorial arguing that modern commerce requires marketplace, wholesale, and retail channels in addition to direct.', 'Shopify is expanding the definition of their TAM beyond DTC brands. Expect new features targeting B2B wholesale and marketplace sellers.', 80, 'moderate'),
    s('2025-01-20', 'BigCommerce', 'bigcommerce', 'https://bigcommerce.com/blog', 'blog', 'PARTNERSHIP', 'Announced headless commerce partnership with Vercel for composable storefronts with sub-second page loads.', 'Headless + BigCommerce positions them as the enterprise-grade alternative to Shopify Hydrogen. Performance-obsessed brands may switch.', 74, 'minor'),
  ],
  'nocode-lowcode': [
    s('2025-02-03', 'Retool', 'retool', 'https://retool.com', 'homepage', 'VALUE_PROP_CHANGE', 'Homepage message changed from "Build internal tools, remarkably fast" to "The universal AI app builder for enterprise." AI is now the headline differentiator.', 'Retool is betting that AI-generated internal tools will replace manual drag-and-drop. Competitors without AI code generation will face feature gap objections.', 88, 'major'),
    s('2025-02-03', 'Bubble', 'bubble', 'https://bubble.io/pricing', 'pricing', 'PRICING_CHANGE', 'New "Agency" tier at $349/mo with unlimited apps, client transfer, and white-label options. Free tier now limited to 1 app (was 2).', 'Bubble is building an agency distribution channel while tightening the free tier. Agency partners will drive volume that individual builders cannot.', 83, 'moderate'),
    s('2025-02-03', 'Appsmith', 'appsmith', 'https://appsmith.com/product', 'product', 'ICP_SHIFT', 'New "AI Agents" product section showing autonomous data processing workflows. Positioning shifted from internal tools to "AI-powered workflow automation."', 'Appsmith is expanding from internal tool building into AI agent orchestration. This competes with n8n and Zapier in the automation space.', 80, 'moderate'),
    s('2025-01-27', 'Webflow', 'webflow', 'https://webflow.com', 'homepage', 'NARRATIVE_SHIFT', 'Dropped "Visual web development" for "The site you want. Without the dev time." Added AI-assisted design as a primary feature, not a beta.', 'Webflow is democratizing further by leading with AI. Professional designers may feel threatened while marketers celebrate faster time-to-launch.', 82, 'moderate'),
    s('2025-01-27', 'Retool', 'retool', 'https://retool.com/blog', 'blog', 'PARTNERSHIP', 'Announced native integration with Snowflake for direct warehouse queries and AI-powered SQL generation in internal tools.', 'Retool + Snowflake creates a powerful stack for data teams building internal analytics tools. Metabase and Superset face new competition.', 75, 'minor'),
    s('2025-01-20', 'Bubble', 'bubble', 'https://bubble.io/blog', 'blog', 'VALUE_PROP_CHANGE', 'Published performance benchmarks showing Bubble apps loading in under 2 seconds, directly addressing the historical "Bubble is slow" objection.', 'Performance has been the top objection against Bubble. If these benchmarks hold, it removes the strongest argument for custom development.', 71, 'minor'),
  ],
};

function DemoSignalFeed() {
  const demo = useDemo();
  const sectorSlug = demo?.sectorSlug || '';
  const signals = SECTOR_SIGNALS[sectorSlug] || SECTOR_SIGNALS['developer-tools'];

  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedMagnitude, setSelectedMagnitude] = useState('all');

  const companies = useMemo(() => {
    return [...new Set(signals.map((e) => e.company_name))].sort();
  }, [signals]);

  const tags = useMemo(() => {
    return [...new Set(signals.map((e) => e.primary_tag))].sort();
  }, [signals]);

  const filteredEntries = useMemo(() => {
    return signals.filter((entry) => {
      if (selectedCompany !== 'all' && entry.company_name !== selectedCompany) return false;
      if (selectedTag !== 'all' && entry.primary_tag !== selectedTag) return false;
      if (selectedMagnitude !== 'all' && entry.change_magnitude !== selectedMagnitude) return false;
      return true;
    });
  }, [signals, selectedCompany, selectedTag, selectedMagnitude]);

  const groupedByWeek = useMemo(() => {
    const groups: Record<string, typeof filteredEntries> = {};
    filteredEntries.forEach((entry) => {
      if (!groups[entry.week_start_date]) {
        groups[entry.week_start_date] = [];
      }
      groups[entry.week_start_date].push(entry);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredEntries]);

  const totalSignals = signals.length;
  const highPriorityCount = signals.filter(e => e.change_magnitude === 'major').length;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          Competitor Messaging
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time competitor changes feeding into weekly intelligence packets
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-border/50 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <IconSignalCount className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{totalSignals}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Signals</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/50 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-rose-500/10">
                <IconPersonaRevenue className="h-3.5 w-3.5 text-rose-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-400 tabular-nums">{highPriorityCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">High Priority</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/50 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-sky-500/10">
                <IconCompany className="h-3.5 w-3.5 text-sky-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-sky-400 tabular-nums">{companies.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Companies</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/50 bg-card group hover:border-primary/20 transition-colors">
          <CardContent className="p-4">
            <Link to={`/demo/${sectorSlug}`} className="block">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10">
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </div>
              <div className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">View Packets →</div>
              <div className="text-xs text-muted-foreground mt-0.5">Weekly Intel</div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4 border-t border-border/50 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            Showing sample signals for this sector
          </div>

          <FilterBar
            companies={companies}
            tags={tags}
            selectedCompany={selectedCompany}
            selectedTag={selectedTag}
            selectedMagnitude={selectedMagnitude}
            onCompanyChange={setSelectedCompany}
            onTagChange={setSelectedTag}
            onMagnitudeChange={setSelectedMagnitude}
          />
        </div>
      </div>

      {/* Empty state */}
      {groupedByWeek.length === 0 && (
        <Card className="rounded-xl border border-border/50">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No signals found matching your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Signal Feed */}
      <div className="space-y-10">
        {groupedByWeek.map(([weekStart, weekEntries]) => (
          <WeekSection key={weekStart} weekStart={weekStart} entries={weekEntries} />
        ))}
      </div>
    </div>
  );
}

export default function DemoCompetitorMessaging() {
  const { sectorSlug = 'developer-tools' } = useParams();

  return (
    <DemoProvider sectorSlug={sectorSlug}>
      <div className="min-h-screen bg-background flex flex-col">
        <DemoNavigation />
        <DemoSignalFeed />
        <div className="container max-w-6xl mx-auto px-4">
          <Footer />
        </div>
      </div>
    </DemoProvider>
  );
}
