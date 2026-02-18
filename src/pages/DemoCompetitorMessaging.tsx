import { useMemo, useState } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { FilterBar } from '@/components/FilterBar';
import { WeekSection } from '@/components/WeekSection';
import { NarrativeArcCard } from '@/components/NarrativeArcCard';
import { ConvergenceAlert } from '@/components/ConvergenceAlert';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, ArrowRight, ChevronDown, ChevronUp, GitBranch } from 'lucide-react';
import { IconSignalCount, IconPersonaRevenue, IconCompany } from '@/components/icons';
import { Link } from 'react-router-dom';
import type { ChangelogEntry } from '@/types/changelog';
import type { NarrativeArc, Convergence } from '@/types/narrativeGraph';

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

// ── Demo narrative arcs per sector ──
const SECTOR_ARCS: Record<string, NarrativeArc[]> = {
  'developer-tools': [
    {
      arc_id: 'demo-arc-1', company_id: 'demo-gitlab', company_name: 'GitLab',
      arc_title: 'AI-Native Platform Repositioning',
      arc_theme: 'Shifting from DevSecOps to AI-powered development platform narrative',
      arc_status: 'escalating', first_seen_week: '2025-01-13', last_seen_week: '2025-02-03',
      weeks_active: 4, escalation_count: 4, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'strong', page_type_diversity: 3, confidence_level: 'high',
      strategic_summary: 'We assess GitLab is executing a deliberate, multi-week AI repositioning campaign. Indicators across 3 page types (homepage, blog, product) over 4 consecutive weeks are consistent with a board-level narrative shift, not a routine web update.',
      alternative_explanation: 'These changes could reflect independent web team updates rather than a coordinated strategy. Evidence against: 4-week persistence across homepage, blog, and product pages is inconsistent with routine refreshes.',
      edges: [
        { edge_id: 'e1', signal_source: 'narrative_drift', source_id: 'd1', week_start_date: '2025-01-13', edge_label: 'origin', llm_reasoning: 'First mention of AI-powered in product page subtitle', evidence_weight: 'medium', page_type: 'product' },
        { edge_id: 'e2', signal_source: 'classified_change', source_id: 'd2', week_start_date: '2025-01-20', edge_label: 'escalation', llm_reasoning: 'Blog post "Why DevSecOps is Dead" signals narrative escalation', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'e3', signal_source: 'narrative_drift', source_id: 'd3', week_start_date: '2025-01-27', edge_label: 'reinforcement', llm_reasoning: 'Category page updated with AI-first language', evidence_weight: 'medium', page_type: 'product' },
        { edge_id: 'e4', signal_source: 'narrative_drift', source_id: 'd4', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage headline changed to "AI-Powered DevSecOps Platform"', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-2', company_id: 'demo-snyk', company_name: 'Snyk',
      arc_title: 'Platform Engineering Expansion',
      arc_theme: 'Broadening ICP from developer security to platform engineering teams',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-02-03',
      weeks_active: 2, escalation_count: 2, trajectory: 'steady', current_severity: 3,
      corroboration_score: 'moderate', page_type_diversity: 2, confidence_level: 'moderate',
      strategic_summary: 'Indicators suggest Snyk is broadening its ICP toward platform engineering teams. Two corroborating signals across partners and product pages over 2 weeks are consistent with a deliberate expansion, though the pattern is still early.',
      alternative_explanation: 'The ServiceNow partnership may be a one-off integration deal rather than a strategic ICP shift. The product page change could be A/B testing. Monitor for 2 more weeks to confirm sustained intent.',
      edges: [
        { edge_id: 'e5', signal_source: 'narrative_drift', source_id: 'd5', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'ServiceNow partnership targets ITSM-integrated vulnerability workflows', evidence_weight: 'low', page_type: 'partners' },
        { edge_id: 'e6', signal_source: 'classified_change', source_id: 'd6', week_start_date: '2025-02-03', edge_label: 'reinforcement', llm_reasoning: 'Platform Engineering Teams added as primary audience on product page', evidence_weight: 'medium', page_type: 'product' },
      ],
    },
  ],
  'product-analytics': [
    {
      arc_id: 'demo-arc-3', company_id: 'demo-amplitude', company_name: 'Amplitude',
      arc_title: 'Marketing Analytics Land Grab',
      arc_theme: 'Expanding from product analytics into marketing team use cases',
      arc_status: 'escalating', first_seen_week: '2025-01-20', last_seen_week: '2025-02-03',
      weeks_active: 3, escalation_count: 3, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'strong', page_type_diversity: 3, confidence_level: 'moderate-high',
      strategic_summary: 'We assess Amplitude is executing a coordinated ICP expansion into marketing teams. Three signals across product docs, blog, and homepage over 3 weeks indicate deliberate audience broadening, not incidental copy changes.',
      alternative_explanation: 'The "Growth Operators" blog series could be a content experiment rather than a strategic ICP shift. Homepage changes may reflect seasonal campaign testing. However, the 3-week cross-page consistency argues against this.',
      edges: [
        { edge_id: 'e7', signal_source: 'narrative_drift', source_id: 'd7', week_start_date: '2025-01-20', edge_label: 'origin', llm_reasoning: 'Initial signals targeting marketing use cases in product docs', evidence_weight: 'medium', page_type: 'product' },
        { edge_id: 'e8', signal_source: 'classified_change', source_id: 'd8', week_start_date: '2025-01-27', edge_label: 'escalation', llm_reasoning: 'Blog series targeting "Growth Operators" as a new buyer persona', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'e9', signal_source: 'narrative_drift', source_id: 'd9', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage hero changed to explicitly include marketing teams', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-4', company_id: 'demo-posthog', company_name: 'PostHog',
      arc_title: 'Data Platform Convergence',
      arc_theme: 'Moving from analytics tool to unified product and data platform',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-01-27',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 3,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: PostHog repositioned from analytics tool to data platform on their product page. Single signal on one page type — this could be a routine copy refresh. Monitor for corroborating changes on homepage or pricing.',
      alternative_explanation: 'A single product page rewording is insufficient to confirm a strategic platform pivot. This may be a content refresh or SEO optimization. Requires homepage or pricing page corroboration within 2 weeks.',
      edges: [
        { edge_id: 'e10', signal_source: 'narrative_drift', source_id: 'd10', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'Repositioned from "open-source product analytics" to "all-in-one product and data platform"', evidence_weight: 'medium', page_type: 'product' },
      ],
    },
  ],
  'sales-engagement': [
    {
      arc_id: 'demo-arc-5', company_id: 'demo-outreach', company_name: 'Outreach',
      arc_title: 'Revenue Execution Repositioning',
      arc_theme: 'Evolving from sales engagement to full-cycle revenue execution platform',
      arc_status: 'escalating', first_seen_week: '2025-01-20', last_seen_week: '2025-02-03',
      weeks_active: 3, escalation_count: 3, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'strong', page_type_diversity: 3, confidence_level: 'high',
      strategic_summary: 'We assess with high confidence that Outreach is executing a deliberate rebrand from sales engagement to revenue execution. Three corroborating signals across product, blog, and homepage — combined with the Salesforce Revenue Cloud partnership — indicate a coordinated enterprise repositioning.',
      alternative_explanation: 'The "Revenue Execution" language could be a marketing experiment rather than a permanent rebrand. However, the Salesforce partnership investment and 3-week homepage persistence argue strongly against a temporary change.',
      edges: [
        { edge_id: 'e11', signal_source: 'narrative_drift', source_id: 'd11', week_start_date: '2025-01-20', edge_label: 'origin', llm_reasoning: 'Initial shift in product marketing to revenue execution language', evidence_weight: 'medium', page_type: 'product' },
        { edge_id: 'e12', signal_source: 'classified_change', source_id: 'd12', week_start_date: '2025-01-27', edge_label: 'reinforcement', llm_reasoning: 'Salesforce Revenue Cloud integration announcement deepens enterprise positioning', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'e13', signal_source: 'narrative_drift', source_id: 'd13', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage headline changed from Sales Engagement to Revenue Execution Platform', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-6', company_id: 'demo-gong', company_name: 'Gong',
      arc_title: 'AI Agent Automation Push',
      arc_theme: 'Shifting from revenue intelligence to autonomous AI-driven sales workflows',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-01-27',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 3,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: Gong replaced "Revenue Intelligence" with "Revenue AI Platform" on their homepage. Single high-weight signal, but insufficient evidence to confirm a sustained strategic pivot. Monitor for product page and pricing changes.',
      alternative_explanation: 'Homepage messaging changes at Gong may reflect a marketing campaign rather than a product direction shift. AI branding is widespread — this could be following a trend rather than signaling autonomous capabilities.',
      edges: [
        { edge_id: 'e14', signal_source: 'narrative_drift', source_id: 'd14', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'Replaced "Revenue Intelligence" with "Revenue AI Platform" with autonomous follow-up features', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
  'cybersecurity': [
    {
      arc_id: 'demo-arc-7', company_id: 'demo-crowdstrike', company_name: 'CrowdStrike',
      arc_title: 'AI-Native Security Identity',
      arc_theme: 'Full identity shift from endpoint security to AI-native cybersecurity platform',
      arc_status: 'escalating', first_seen_week: '2025-01-13', last_seen_week: '2025-02-03',
      weeks_active: 4, escalation_count: 4, trajectory: 'accelerating', current_severity: 5,
      corroboration_score: 'strong', page_type_diversity: 3, confidence_level: 'high',
      strategic_summary: 'We assess with high confidence that CrowdStrike is executing a deliberate identity shift to AI-native security. Four signals across product, homepage, and blog over 4 weeks — including a homepage headline change and an AWS partnership — are consistent with a board-level repositioning.',
      alternative_explanation: 'AI branding is an industry-wide trend. CrowdStrike may be following competitive pressure rather than leading a strategic pivot. Evidence against: The homepage headline change (high-weight signal) combined with 4-week cross-page persistence exceeds what trend-following would produce.',
      edges: [
        { edge_id: 'e15', signal_source: 'narrative_drift', source_id: 'd15', week_start_date: '2025-01-13', edge_label: 'origin', llm_reasoning: 'Charlotte AI introduced as co-pilot feature in product pages', evidence_weight: 'medium', page_type: 'product' },
        { edge_id: 'e16', signal_source: 'classified_change', source_id: 'd16', week_start_date: '2025-01-20', edge_label: 'escalation', llm_reasoning: 'AI capabilities elevated to primary navigation', evidence_weight: 'medium', page_type: 'product' },
        { edge_id: 'e17', signal_source: 'narrative_drift', source_id: 'd17', week_start_date: '2025-01-27', edge_label: 'reinforcement', llm_reasoning: 'AWS partnership announcement leads with AI-powered cloud detection', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'e18', signal_source: 'narrative_drift', source_id: 'd18', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Core positioning changed from Endpoint Security to AI-Native Cybersecurity Platform', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
  'ai-ml-platforms': [
    {
      arc_id: 'demo-arc-8', company_id: 'demo-openai', company_name: 'OpenAI',
      arc_title: 'Enterprise API Elevation',
      arc_theme: 'Systematically elevating the API platform to match ChatGPT consumer product',
      arc_status: 'escalating', first_seen_week: '2025-01-20', last_seen_week: '2025-02-03',
      weeks_active: 3, escalation_count: 3, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'strong', page_type_diversity: 3, confidence_level: 'moderate-high',
      strategic_summary: 'We assess OpenAI is deliberately building a two-track business: consumer ChatGPT and enterprise API. Three signals across blog, product docs, and homepage over 3 weeks — including the Microsoft Fabric partnership — are consistent with a coordinated enterprise GTM push.',
      alternative_explanation: 'The API elevation could be a response to developer community feedback rather than a strategic enterprise pivot. The Fabric integration may have been Microsoft-driven. However, the homepage parity change is a high-weight signal that suggests internal prioritization.',
      edges: [
        { edge_id: 'e19', signal_source: 'narrative_drift', source_id: 'd19', week_start_date: '2025-01-20', edge_label: 'origin', llm_reasoning: 'Microsoft Fabric integration signals enterprise-first data strategy', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'e20', signal_source: 'classified_change', source_id: 'd20', week_start_date: '2025-01-27', edge_label: 'reinforcement', llm_reasoning: 'API documentation and developer portal redesigned for enterprise workflows', evidence_weight: 'medium', page_type: 'product' },
        { edge_id: 'e21', signal_source: 'narrative_drift', source_id: 'd21', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage now gives ChatGPT Enterprise and API Platform equal billing', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-9', company_id: 'demo-anthropic', company_name: 'Anthropic',
      arc_title: 'Safety-First Differentiation',
      arc_theme: 'Positioning AI safety as the primary competitive differentiator over capability',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-01-27',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 2,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: Anthropic elevated AI Safety to top-level navigation. Single signal on one page type. Insufficient evidence for a confident assessment — this could reflect existing values being made more visible rather than a new strategic direction.',
      alternative_explanation: 'Navigation changes may be a UX improvement rather than a strategic repositioning. Anthropic has always emphasized safety — this could be surfacing existing positioning rather than creating new narrative.',
      edges: [
        { edge_id: 'e22', signal_source: 'narrative_drift', source_id: 'd22', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'AI Safety elevated to top-level navigation alongside Products', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
  'cloud-infrastructure': [
    {
      arc_id: 'demo-arc-10', company_id: 'demo-vercel', company_name: 'Vercel',
      arc_title: 'AI Deployment Cloud Pivot',
      arc_theme: 'Transforming from frontend cloud to AI application deployment infrastructure',
      arc_status: 'escalating', first_seen_week: '2025-01-20', last_seen_week: '2025-02-03',
      weeks_active: 3, escalation_count: 3, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'strong', page_type_diversity: 3, confidence_level: 'moderate-high',
      strategic_summary: 'We assess Vercel is deliberately pivoting from frontend cloud to AI deployment infrastructure. Three signals across blog, product docs, and homepage over 3 weeks — including the Cloudflare security partnership — indicate a coordinated repositioning, not opportunistic AI branding.',
      alternative_explanation: 'Vercel may be adding AI messaging to ride the trend without fundamentally changing their product focus. The Cloudflare partnership could be a security play unrelated to AI strategy. However, the homepage redesign (high-weight signal) suggests genuine strategic commitment.',
      edges: [
        { edge_id: 'e23', signal_source: 'narrative_drift', source_id: 'd23', week_start_date: '2025-01-20', edge_label: 'origin', llm_reasoning: 'Cloudflare partnership for enterprise security fills AI deployment gap', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'e24', signal_source: 'classified_change', source_id: 'd24', week_start_date: '2025-01-27', edge_label: 'reinforcement', llm_reasoning: 'AI SDK documentation promoted to primary developer resource', evidence_weight: 'medium', page_type: 'product' },
        { edge_id: 'e25', signal_source: 'narrative_drift', source_id: 'd25', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage redesigned around "AI-powered frontend cloud"', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
  'customer-success': [
    {
      arc_id: 'demo-arc-cs-1', company_id: 'demo-gainsight', company_name: 'Gainsight',
      arc_title: 'AI-First CS Platform Repositioning',
      arc_theme: 'Shifting from traditional CS software to AI-powered predictive customer success',
      arc_status: 'escalating', first_seen_week: '2025-01-20', last_seen_week: '2025-02-03',
      weeks_active: 3, escalation_count: 3, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'strong', page_type_diversity: 2, confidence_level: 'moderate-high',
      strategic_summary: 'We assess Gainsight is executing a deliberate AI repositioning. The "Death of Reactive CS" blog post followed by an AI-first homepage rebrand within 2 weeks — across blog and homepage — indicates a board-level narrative shift toward predictive, proactive customer success.',
      alternative_explanation: 'AI branding may be a marketing experiment to justify premium pricing. The blog post could be a content marketing play without product backing. However, the homepage headline change (high-weight signal) combined with the provocative manifesto argues for genuine strategic commitment.',
      edges: [
        { edge_id: 'ecs1', signal_source: 'narrative_drift', source_id: 'dcs1', week_start_date: '2025-01-20', edge_label: 'origin', llm_reasoning: '"The Death of Reactive CS" manifesto challenges industry orthodoxy', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'ecs2', signal_source: 'narrative_drift', source_id: 'dcs2', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage headline changed to "The AI-First Customer Success Platform"', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-cs-2', company_id: 'demo-vitally', company_name: 'Vitally',
      arc_title: 'Beyond CS: Proactive Customer Platform',
      arc_theme: 'Expanding from CS-only tool to cross-functional proactive customer platform',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-01-27',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 2,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: Vitally repositioned from "Customer Success for B2B SaaS" to "The Proactive Customer Platform." Single homepage signal — could be a routine tagline refresh or a genuine ICP broadening toward CX and account management teams.',
      alternative_explanation: 'Homepage tagline changes are often A/B tested and may not represent a permanent strategic direction. Vitally may be testing broader positioning without committing to a multi-team product roadmap.',
      edges: [
        { edge_id: 'ecs3', signal_source: 'narrative_drift', source_id: 'dcs3', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'Repositioned from B2B SaaS CS to "The Proactive Customer Platform"', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
  'marketing-automation': [
    {
      arc_id: 'demo-arc-ma-1', company_id: 'demo-hubspot', company_name: 'HubSpot',
      arc_title: 'Unified Customer Platform Consolidation',
      arc_theme: 'Moving from hub-based messaging to a single unified platform narrative',
      arc_status: 'escalating', first_seen_week: '2025-01-27', last_seen_week: '2025-02-03',
      weeks_active: 2, escalation_count: 2, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'moderate', page_type_diversity: 2, confidence_level: 'moderate',
      strategic_summary: 'We assess HubSpot is consolidating its multi-hub messaging into a unified "Customer Platform" narrative. The homepage rebrand from "Grow Better" to "The Customer Platform for Scaling Companies" — combined with aggressive commerce integration — signals a platform consolidation play to make point solutions harder to justify.',
      alternative_explanation: 'HubSpot frequently rotates homepage heroes for campaigns. The Shopify integration may be a partnership team initiative rather than a strategic commerce play. However, the "Customer Platform" language replacing the iconic "Grow Better" tagline suggests a permanent directional shift.',
      edges: [
        { edge_id: 'ema1', signal_source: 'classified_change', source_id: 'dma1', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'Shopify integration deepens commerce positioning', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'ema2', signal_source: 'narrative_drift', source_id: 'dma2', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage headline shifted from "Grow Better" to "The Customer Platform for Scaling Companies"', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-ma-2', company_id: 'demo-klaviyo', company_name: 'Klaviyo',
      arc_title: 'B2B Market Entry',
      arc_theme: 'Expanding from e-commerce-only to B2B marketing automation',
      arc_status: 'building', first_seen_week: '2025-02-03', last_seen_week: '2025-02-03',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 3,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: Klaviyo launched a B2B tier at $400/mo — previously e-commerce only. Single signal on the pricing page. Insufficient data to confirm sustained B2B commitment vs. opportunistic market testing.',
      alternative_explanation: 'The B2B tier could be a limited experiment or a response to customer requests rather than a full market entry. Pricing page additions are relatively low-commitment and easily reversible.',
      edges: [
        { edge_id: 'ema3', signal_source: 'classified_change', source_id: 'dma3', week_start_date: '2025-02-03', edge_label: 'origin', llm_reasoning: 'B2B tier at $400/mo signals market expansion beyond e-commerce', evidence_weight: 'medium', page_type: 'pricing' },
      ],
    },
  ],
  'data-infrastructure': [
    {
      arc_id: 'demo-arc-di-1', company_id: 'demo-snowflake', company_name: 'Snowflake',
      arc_title: 'AI Data Cloud Identity Shift',
      arc_theme: 'Repositioning from data warehousing to AI/ML workload platform',
      arc_status: 'escalating', first_seen_week: '2025-01-20', last_seen_week: '2025-02-03',
      weeks_active: 3, escalation_count: 3, trajectory: 'accelerating', current_severity: 5,
      corroboration_score: 'strong', page_type_diversity: 2, confidence_level: 'high',
      strategic_summary: 'We assess with high confidence that Snowflake is executing a deliberate identity shift to center AI workloads. The Anthropic Claude integration followed by a homepage rebrand from "The Data Cloud" to "The AI Data Cloud" over 3 weeks indicates a board-level strategic pivot to compete with Databricks on AI/ML.',
      alternative_explanation: 'The AI rebrand could be defensive positioning in response to Databricks rather than a genuine product pivot. The Anthropic partnership may have been opportunistic. Evidence against: homepage headline changes (highest-weight signal) plus a multi-week pattern argue for deliberate strategic commitment.',
      edges: [
        { edge_id: 'edi1', signal_source: 'classified_change', source_id: 'ddi1', week_start_date: '2025-01-20', edge_label: 'origin', llm_reasoning: 'Anthropic Claude integration for in-warehouse AI processing', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'edi2', signal_source: 'narrative_drift', source_id: 'ddi2', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage headline shifted from "The Data Cloud" to "The AI Data Cloud"', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-di-2', company_id: 'demo-dbt-labs', company_name: 'dbt Labs',
      arc_title: 'Analytics Engineering Platform Play',
      arc_theme: 'Evolving from transformation tool to full analytics engineering platform',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-01-27',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 3,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: dbt Labs repositioned from "Transform data in your warehouse" to "The analytics engineering platform" with semantic layer and metrics store in top-level navigation. Single homepage signal — needs corroboration on pricing or product pages.',
      alternative_explanation: 'Homepage messaging updates at dbt could reflect a marketing refresh to align with the growing "analytics engineering" category term. The semantic layer may be a feature addition, not a platform strategy shift.',
      edges: [
        { edge_id: 'edi3', signal_source: 'narrative_drift', source_id: 'ddi3', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'Repositioned to "analytics engineering platform" with semantic layer as top-level feature', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
  'fintech-infrastructure': [
    {
      arc_id: 'demo-arc-fi-1', company_id: 'demo-stripe', company_name: 'Stripe',
      arc_title: 'Revenue Growth Platform Expansion',
      arc_theme: 'Expanding from payments infrastructure to full revenue growth platform',
      arc_status: 'escalating', first_seen_week: '2025-01-20', last_seen_week: '2025-02-03',
      weeks_active: 3, escalation_count: 3, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'strong', page_type_diversity: 2, confidence_level: 'moderate-high',
      strategic_summary: 'We assess Stripe is deliberately expanding its narrative from payments to revenue growth. The Salesforce Revenue Cloud integration followed by a homepage rebrand from "payments infrastructure" to "financial infrastructure to grow revenue" over 3 weeks signals a coordinated TAM expansion encroaching on billing and revenue platforms.',
      alternative_explanation: 'The "grow revenue" messaging could be a marketing optimization rather than a product pivot. The Salesforce integration may be a partnership team initiative. However, homepage headline changes combined with the strategic partnership pattern argue for genuine directional commitment.',
      edges: [
        { edge_id: 'efi1', signal_source: 'classified_change', source_id: 'dfi1', week_start_date: '2025-01-20', edge_label: 'origin', llm_reasoning: 'Salesforce Revenue Cloud integration for billing reconciliation', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'efi2', signal_source: 'narrative_drift', source_id: 'dfi2', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage evolved from "payments infrastructure" to "financial infrastructure to grow revenue"', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-fi-2', company_id: 'demo-plaid', company_name: 'Plaid',
      arc_title: 'Traditional Finance Expansion',
      arc_theme: 'Moving from fintech startup customers to banks and credit unions',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-01-27',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 3,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: Plaid launched "Plaid for Lending" targeting banks and credit unions directly. Single product page signal — could represent a vertical product experiment rather than a fundamental ICP shift away from fintech startups.',
      alternative_explanation: 'The lending vertical could be a targeted product expansion without fundamentally changing Plaid\'s core fintech startup focus. Many API companies add vertical pages without shifting overall strategy.',
      edges: [
        { edge_id: 'efi3', signal_source: 'classified_change', source_id: 'dfi3', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: '"Plaid for Lending" vertical targeting banks and credit unions directly', evidence_weight: 'medium', page_type: 'product' },
      ],
    },
  ],
  'hr-tech': [
    {
      arc_id: 'demo-arc-hr-1', company_id: 'demo-rippling', company_name: 'Rippling',
      arc_title: 'Workforce Operations Platform Play',
      arc_theme: 'Expanding from HR platform to unified workforce management across IT, finance, and HR',
      arc_status: 'escalating', first_seen_week: '2025-01-27', last_seen_week: '2025-02-03',
      weeks_active: 2, escalation_count: 2, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'moderate', page_type_diversity: 2, confidence_level: 'moderate',
      strategic_summary: 'We assess Rippling is executing a deliberate expansion from HR into the full employee operations stack. The Navan integration for travel policy enforcement followed by a homepage rebrand from "HR Platform" to "Workforce Management Platform" signals a coordinated TAM expansion that threatens BambooHR, Gusto, and Deel simultaneously.',
      alternative_explanation: 'The Navan partnership could be an integration team initiative unrelated to positioning strategy. The "Workforce Management" rebrand may be testing broader language without product commitment. However, the homepage change (high-weight) combined with expanding integration partnerships argues for a genuine platform play.',
      edges: [
        { edge_id: 'ehr1', signal_source: 'classified_change', source_id: 'dhr1', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'Navan integration deepens the "employee graph" across travel and expense workflows', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'ehr2', signal_source: 'narrative_drift', source_id: 'dhr2', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Rebranded from "HR Platform" to "Workforce Management Platform" spanning IT, finance, HR', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-hr-2', company_id: 'demo-gusto', company_name: 'Gusto',
      arc_title: 'Embedded Payroll API Channel',
      arc_theme: 'Opening developer/embedded channel alongside direct SMB business',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-01-27',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 3,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: Gusto added embedded payroll API messaging to their homepage alongside their traditional SMB positioning. Single signal — could reflect a new product line or a developer marketing experiment.',
      alternative_explanation: 'The API messaging may target a small embedded payroll audience without changing Gusto\'s core SMB focus. Many SaaS companies add developer documentation without fundamentally shifting their go-to-market.',
      edges: [
        { edge_id: 'ehr3', signal_source: 'narrative_drift', source_id: 'dhr3', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'Added embedded payroll API messaging targeting developers alongside HR managers', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
  'collaboration': [
    {
      arc_id: 'demo-arc-co-1', company_id: 'demo-notion', company_name: 'Notion',
      arc_title: 'Everything App for Work',
      arc_theme: 'Declaring super-app positioning against the entire productivity stack',
      arc_status: 'escalating', first_seen_week: '2025-01-27', last_seen_week: '2025-02-03',
      weeks_active: 2, escalation_count: 2, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'moderate', page_type_diversity: 2, confidence_level: 'moderate',
      strategic_summary: 'We assess Notion is deliberately positioning as the "everything app for work" — a super-app strategy that challenges Confluence, Asana, and Linear simultaneously. The blog manifesto followed by unbundled AI product messaging over 2 weeks indicates a coordinated narrative escalation.',
      alternative_explanation: 'The "everything app" blog post could be aspirational content marketing rather than a realistic product roadmap. AI unbundling may be a monetization experiment. However, the combination of a provocative manifesto plus product changes argues for genuine strategic intent.',
      edges: [
        { edge_id: 'eco1', signal_source: 'narrative_drift', source_id: 'dco1', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: '"Why We Are Building the Everything App for Work" declares super-app positioning', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'eco2', signal_source: 'classified_change', source_id: 'dco2', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Notion AI unbundled as standalone product — separate monetization of AI features', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-co-2', company_id: 'demo-linear', company_name: 'Linear',
      arc_title: 'Product Development Platform Expansion',
      arc_theme: 'Expanding from issue tracking into full product development management',
      arc_status: 'building', first_seen_week: '2025-01-20', last_seen_week: '2025-01-20',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 2,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: Linear dropped "Issue Tracking" language and repositioned as "the purpose-built tool for modern product development" with roadmapping features. Single homepage signal — needs product page or pricing corroboration.',
      alternative_explanation: 'Linear may be evolving its marketing language to match what users already do (project management) without fundamentally expanding the product. Roadmapping features could be incremental additions, not a pivot.',
      edges: [
        { edge_id: 'eco3', signal_source: 'narrative_drift', source_id: 'dco3', week_start_date: '2025-01-20', edge_label: 'origin', llm_reasoning: 'Dropped "Issue Tracking" for "modern product development" with roadmapping and project views', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
  'devops-observability': [
    {
      arc_id: 'demo-arc-do-1', company_id: 'demo-datadog', company_name: 'Datadog',
      arc_title: 'Observability + Security Convergence',
      arc_theme: 'Merging security products into core observability platform narrative',
      arc_status: 'escalating', first_seen_week: '2025-01-27', last_seen_week: '2025-02-03',
      weeks_active: 2, escalation_count: 2, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'moderate', page_type_diversity: 2, confidence_level: 'moderate',
      strategic_summary: 'We assess Datadog is deliberately converging observability and security under one platform. The TCO calculator blog post attacking cost objections followed by a homepage rebrand from "Cloud Monitoring" to "Observability & Security Platform" signals a coordinated repositioning that challenges standalone SIEM vendors.',
      alternative_explanation: 'The security messaging could be a marketing expansion to justify higher ACV without substantial product investment. The TCO calculator may be a content marketing play. However, the homepage headline change (high-weight) argues for genuine product-backed positioning.',
      edges: [
        { edge_id: 'edo1', signal_source: 'narrative_drift', source_id: 'ddo1', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'TCO calculator attacks cost objections while positioning security as core value', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'edo2', signal_source: 'narrative_drift', source_id: 'ddo2', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Repositioned from "Cloud Monitoring" to "The Observability & Security Platform"', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-do-2', company_id: 'demo-newrelic', company_name: 'New Relic',
      arc_title: 'AI Monitoring First-Mover Play',
      arc_theme: 'First to market with LLM observability as a dedicated product category',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-01-27',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 3,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: New Relic added "AI Monitoring" as a primary product category — tracking LLM performance, token usage, and hallucination rates. Single product page signal — could be a feature launch or a category-defining move.',
      alternative_explanation: 'AI monitoring could be a minor feature addition marketed as a product category for visibility. Many APM vendors add AI monitoring without it becoming a core positioning element. Monitor for homepage and pricing page corroboration.',
      edges: [
        { edge_id: 'edo3', signal_source: 'classified_change', source_id: 'ddo3', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'AI Monitoring added as primary product category alongside traditional APM', evidence_weight: 'medium', page_type: 'product' },
      ],
    },
  ],
  'ecommerce-platforms': [
    {
      arc_id: 'demo-arc-ec-1', company_id: 'demo-shopify', company_name: 'Shopify',
      arc_title: 'Omnichannel Commerce Repositioning',
      arc_theme: 'Moving from online-first to omnichannel "everywhere commerce" narrative',
      arc_status: 'escalating', first_seen_week: '2025-01-27', last_seen_week: '2025-02-03',
      weeks_active: 2, escalation_count: 2, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'moderate', page_type_diversity: 2, confidence_level: 'moderate',
      strategic_summary: 'We assess Shopify is deliberately expanding its narrative from online stores to omnichannel commerce. The "Why DTC is Dead" blog post followed by a homepage rebrand emphasizing "online, in-person, and everywhere in between" signals a coordinated push to own the full commerce stack, including POS and wholesale.',
      alternative_explanation: 'The DTC critique may be thought leadership without product implications. The "everywhere" positioning could be aspirational rather than reflective of actual product capabilities. However, the blog + homepage combination over 2 weeks argues for deliberate narrative coordination.',
      edges: [
        { edge_id: 'eec1', signal_source: 'narrative_drift', source_id: 'dec1', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: '"Why DTC is Dead" editorial argues for multi-channel commerce', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'eec2', signal_source: 'narrative_drift', source_id: 'dec2', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage shifted to "online, in-person, and everywhere in between" omnichannel messaging', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
  'nocode-lowcode': [
    {
      arc_id: 'demo-arc-nc-1', company_id: 'demo-retool', company_name: 'Retool',
      arc_title: 'AI App Builder Transformation',
      arc_theme: 'Pivoting from drag-and-drop internal tools to AI-generated enterprise apps',
      arc_status: 'escalating', first_seen_week: '2025-01-27', last_seen_week: '2025-02-03',
      weeks_active: 2, escalation_count: 2, trajectory: 'accelerating', current_severity: 4,
      corroboration_score: 'moderate', page_type_diversity: 2, confidence_level: 'moderate',
      strategic_summary: 'We assess Retool is deliberately pivoting from manual internal tool building to AI-generated enterprise apps. The Snowflake integration followed by a homepage rebrand from "Build internal tools, remarkably fast" to "The universal AI app builder for enterprise" signals a coordinated AI-first repositioning.',
      alternative_explanation: 'The AI messaging could be trend-following without substantial product changes behind it. The Snowflake integration may be a feature addition rather than a strategic pivot. However, the homepage headline change (high-weight signal) replacing their iconic tagline suggests genuine commitment.',
      edges: [
        { edge_id: 'enc1', signal_source: 'classified_change', source_id: 'dnc1', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'Snowflake integration with AI-powered SQL generation in internal tools', evidence_weight: 'low', page_type: 'blog' },
        { edge_id: 'enc2', signal_source: 'narrative_drift', source_id: 'dnc2', week_start_date: '2025-02-03', edge_label: 'escalation', llm_reasoning: 'Homepage changed from "Build internal tools" to "The universal AI app builder for enterprise"', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
    {
      arc_id: 'demo-arc-nc-2', company_id: 'demo-webflow', company_name: 'Webflow',
      arc_title: 'AI-Assisted Design Democratization',
      arc_theme: 'Shifting from visual development to AI-assisted design for non-developers',
      arc_status: 'building', first_seen_week: '2025-01-27', last_seen_week: '2025-01-27',
      weeks_active: 1, escalation_count: 1, trajectory: 'steady', current_severity: 3,
      corroboration_score: 'weak', page_type_diversity: 1, confidence_level: 'low',
      strategic_summary: 'Early indicator: Webflow dropped "Visual web development" for "The site you want. Without the dev time." with AI-assisted design as a primary feature. Single homepage signal — could represent a messaging refresh or a genuine shift toward a non-developer audience.',
      alternative_explanation: 'Webflow may be simplifying their tagline for marketing purposes without fundamentally changing their product. AI-assisted design could be a feature badge rather than a core repositioning. Monitor for product page and pricing changes.',
      edges: [
        { edge_id: 'enc3', signal_source: 'narrative_drift', source_id: 'dnc3', week_start_date: '2025-01-27', edge_label: 'origin', llm_reasoning: 'Dropped "Visual web development" for "Without the dev time" — AI-assisted design leads', evidence_weight: 'high', page_type: 'homepage' },
      ],
    },
  ],
};

// ── Demo convergences per sector ──
const SECTOR_CONVERGENCES: Record<string, Convergence[]> = {
  'developer-tools': [
    {
      convergence_id: 'demo-conv-1', convergence_theme: 'AI-First Platform Repositioning',
      week_detected: '2025-02-03',
      company_ids: ['demo-gitlab', 'demo-datadog'],
      company_names: ['GitLab', 'Datadog'],
      arc_ids: ['demo-arc-1'],
      severity: 4,
      corroboration_score: 'moderate', confidence_level: 'moderate',
      summary: 'Indicators suggest GitLab and Datadog are independently converging on AI-first platform positioning within the same 4-week window. This pattern is consistent with a category-level shift toward AI as table stakes, though the companies may be responding to the same market pressure rather than coordinating.',
      alternative_explanation: 'Both companies may be independently responding to the same analyst narrative ("AI is the future of DevOps") rather than executing parallel strategies. The timing overlap could be coincidental — driven by the same industry conference cycle.',
    },
  ],
  'sales-engagement': [
    {
      convergence_id: 'demo-conv-2', convergence_theme: 'Revenue Platform Convergence',
      week_detected: '2025-02-03',
      company_ids: ['demo-outreach', 'demo-salesloft'],
      company_names: ['Outreach', 'Salesloft'],
      arc_ids: ['demo-arc-5'],
      severity: 3,
      corroboration_score: 'moderate', confidence_level: 'moderate',
      summary: 'We assess that Outreach and Salesloft are converging on "revenue orchestration" positioning. Both shifted messaging within the same 3-week window, suggesting the category definition is evolving from "sales engagement" to a broader revenue platform framing.',
      alternative_explanation: 'Post-acquisition language changes at Salesloft (Vista Equity) may be driving messaging shifts unrelated to organic strategy. Outreach may be responding to Salesloft rather than both responding to the same market signal.',
    },
  ],
  'cybersecurity': [
    {
      convergence_id: 'demo-conv-3', convergence_theme: 'AI-Native Security Arms Race',
      week_detected: '2025-02-03',
      company_ids: ['demo-crowdstrike', 'demo-sentinelone'],
      company_names: ['CrowdStrike', 'SentinelOne'],
      arc_ids: ['demo-arc-7'],
      severity: 5,
      corroboration_score: 'strong', confidence_level: 'high',
      summary: 'We assess with high confidence that CrowdStrike and SentinelOne are in a direct AI positioning race. Both introduced AI copilots (Charlotte AI, Purple AI) within 2 weeks of each other, across homepage and product pages. This convergence is strongly corroborated across multiple high-weight signals.',
      alternative_explanation: 'Both companies attend the same industry events (RSA, Black Hat) and may be responding to the same analyst briefing cycle. However, the simultaneous homepage headline changes — the highest-weight signal type — make coincidence unlikely.',
    },
  ],
  'ai-ml-platforms': [
    {
      convergence_id: 'demo-conv-4', convergence_theme: 'Enterprise AI Platform War',
      week_detected: '2025-02-03',
      company_ids: ['demo-openai', 'demo-cohere', 'demo-huggingface'],
      company_names: ['OpenAI', 'Cohere', 'Hugging Face'],
      arc_ids: ['demo-arc-8'],
      severity: 4,
      corroboration_score: 'moderate', confidence_level: 'moderate-high',
      summary: 'We assess three major AI providers are converging on enterprise-grade positioning. OpenAI elevated its API, Cohere cut enterprise pricing, and Hugging Face launched Enterprise Hub — all within the same 3-week window. This pattern suggests the enterprise AI market is crystallizing around security, customization, and data sovereignty.',
      alternative_explanation: 'These moves may be driven by different catalysts: OpenAI by Microsoft partnership pressure, Cohere by competitive pricing dynamics, and Hugging Face by Series D investor expectations. The convergence in timing may be coincidental rather than reflecting a shared market signal.',
    },
  ],
  'customer-success': [
    {
      convergence_id: 'demo-conv-cs', convergence_theme: 'AI-Powered Proactive CS',
      week_detected: '2025-02-03',
      company_ids: ['demo-gainsight', 'demo-vitally'],
      company_names: ['Gainsight', 'Vitally'],
      arc_ids: ['demo-arc-cs-1', 'demo-arc-cs-2'],
      severity: 3,
      corroboration_score: 'moderate', confidence_level: 'moderate',
      summary: 'We assess Gainsight and Vitally are converging on proactive, AI-first customer success positioning. Gainsight rebranded to "AI-First CS Platform" while Vitally shifted to "The Proactive Customer Platform" within the same 2-week window, suggesting the CS category is evolving from reactive health scoring to predictive AI-driven engagement.',
      alternative_explanation: 'Both companies may be independently following the broader SaaS trend of adding "AI" to their positioning. Vitally may be repositioning for differentiation from Gainsight rather than converging with them.',
    },
  ],
  'marketing-automation': [
    {
      convergence_id: 'demo-conv-ma', convergence_theme: 'Platform Consolidation War',
      week_detected: '2025-02-03',
      company_ids: ['demo-hubspot', 'demo-activecampaign'],
      company_names: ['HubSpot', 'ActiveCampaign'],
      arc_ids: ['demo-arc-ma-1'],
      severity: 3,
      corroboration_score: 'moderate', confidence_level: 'moderate',
      summary: 'We assess HubSpot and ActiveCampaign are converging on unified revenue platform positioning. HubSpot rebranded to "The Customer Platform" while ActiveCampaign added "Revenue Teams" targeting — both moving beyond marketing-only messaging within the same window.',
      alternative_explanation: 'ActiveCampaign may be responding to HubSpot rather than both responding to the same market signal. The "revenue teams" language is widespread in B2B SaaS and may not indicate strategic convergence.',
    },
  ],
  'data-infrastructure': [
    {
      convergence_id: 'demo-conv-di', convergence_theme: 'AI Workload Identity Race',
      week_detected: '2025-02-03',
      company_ids: ['demo-snowflake', 'demo-databricks'],
      company_names: ['Snowflake', 'Databricks'],
      arc_ids: ['demo-arc-di-1'],
      severity: 5,
      corroboration_score: 'strong', confidence_level: 'high',
      summary: 'We assess with high confidence that Snowflake and Databricks are in a direct AI workload positioning race. Snowflake rebranded to "The AI Data Cloud" while Databricks slashed serverless SQL pricing by 30% — each attacking the other\'s stronghold. This convergence is strongly corroborated by simultaneous product and pricing moves.',
      alternative_explanation: 'Both companies report similar quarterly timelines and may independently respond to the same board/investor pressure to show AI momentum. However, the simultaneous offensive moves against each other\'s core business make coincidence unlikely.',
    },
  ],
  'hr-tech': [
    {
      convergence_id: 'demo-conv-hr', convergence_theme: 'Platform vs. Point Solution War',
      week_detected: '2025-02-03',
      company_ids: ['demo-rippling', 'demo-deel'],
      company_names: ['Rippling', 'Deel'],
      arc_ids: ['demo-arc-hr-1'],
      severity: 4,
      corroboration_score: 'moderate', confidence_level: 'moderate',
      summary: 'We assess Rippling and Deel are converging on platform expansion strategies that threaten single-function HR tools. Rippling expanded to "Workforce Management Platform" spanning IT, finance, and HR, while Deel launched a free HR tier to create a PLG funnel — both moves compress the market for BambooHR, Gusto, and other point solutions.',
      alternative_explanation: 'Rippling and Deel may be executing independent strategies driven by different investor expectations (IPO readiness for Rippling, growth velocity for Deel). The simultaneous timing may reflect quarterly planning cycles rather than market convergence.',
    },
  ],
  'collaboration': [
    {
      convergence_id: 'demo-conv-co', convergence_theme: 'Super-App vs. Purpose-Built Tools',
      week_detected: '2025-02-03',
      company_ids: ['demo-notion', 'demo-coda'],
      company_names: ['Notion', 'Coda'],
      arc_ids: ['demo-arc-co-1'],
      severity: 3,
      corroboration_score: 'moderate', confidence_level: 'moderate',
      summary: 'We assess Notion and Coda are converging on "do everything" platform positioning. Notion declared super-app intent while Coda simplified pricing and included AI in all plans — both are removing reasons for teams to use separate project management, wiki, and docs tools.',
      alternative_explanation: 'Coda\'s pricing simplification may be a churn reduction tactic rather than a strategic convergence with Notion. The collaboration market has always had bundling tendencies — this may be incremental rather than a category-defining shift.',
    },
  ],
  'devops-observability': [
    {
      convergence_id: 'demo-conv-do', convergence_theme: 'Observability + Security Bundling',
      week_detected: '2025-02-03',
      company_ids: ['demo-datadog', 'demo-elastic'],
      company_names: ['Datadog', 'Elastic'],
      arc_ids: ['demo-arc-do-1'],
      severity: 4,
      corroboration_score: 'moderate', confidence_level: 'moderate',
      summary: 'We assess Datadog and Elastic are converging on platform strategies that merge observability with adjacent capabilities. Datadog bundled security into core positioning while Elastic pivoted to AI-powered enterprise search — both expanding beyond traditional monitoring into broader platform narratives.',
      alternative_explanation: 'These moves may target different buyers (Datadog: SecOps, Elastic: enterprise search) and the convergence may be superficial. Both companies face growth pressure that incentivizes TAM expansion regardless of market dynamics.',
    },
  ],
  'ecommerce-platforms': [
    {
      convergence_id: 'demo-conv-ec', convergence_theme: 'Omnichannel + B2B Commerce Push',
      week_detected: '2025-02-03',
      company_ids: ['demo-shopify', 'demo-bigcommerce'],
      company_names: ['Shopify', 'BigCommerce'],
      arc_ids: ['demo-arc-ec-1'],
      severity: 3,
      corroboration_score: 'moderate', confidence_level: 'moderate',
      summary: 'We assess Shopify and BigCommerce are converging on omnichannel and B2B commerce positioning. Shopify declared "DTC is Dead" while BigCommerce launched an enterprise B2B tier — both signaling that online-only commerce is no longer sufficient and that B2B features are becoming table stakes.',
      alternative_explanation: 'Shopify and BigCommerce may be responding to different competitive pressures (Shopify: Amazon, BigCommerce: Shopify Plus). The B2B push could be driven by different customer demand profiles rather than a shared market signal.',
    },
  ],
  'nocode-lowcode': [
    {
      convergence_id: 'demo-conv-nc', convergence_theme: 'AI as the New No-Code',
      week_detected: '2025-02-03',
      company_ids: ['demo-retool', 'demo-appsmith'],
      company_names: ['Retool', 'Appsmith'],
      arc_ids: ['demo-arc-nc-1'],
      severity: 4,
      corroboration_score: 'moderate', confidence_level: 'moderate-high',
      summary: 'We assess Retool and Appsmith are converging on AI-generated app narratives that may redefine the no-code/low-code category. Retool rebranded to "AI app builder" while Appsmith added "AI Agents" product section — both suggesting that manual drag-and-drop building is being replaced by AI-generated applications.',
      alternative_explanation: 'AI features in no-code tools may be incremental additions rather than category-redefining shifts. Both companies face pressure to show AI capabilities and may be adding surface-level features without fundamentally changing the product.',
    },
  ],
  'fintech-infrastructure': [
    {
      convergence_id: 'demo-conv-fi', convergence_theme: 'Revenue Platform Expansion',
      week_detected: '2025-02-03',
      company_ids: ['demo-stripe', 'demo-adyen'],
      company_names: ['Stripe', 'Adyen'],
      arc_ids: ['demo-arc-fi-1'],
      severity: 4,
      corroboration_score: 'moderate', confidence_level: 'moderate',
      summary: 'We assess Stripe and Adyen are converging on broader revenue platform positioning beyond pure payments. Stripe rebranded to "financial infrastructure to grow revenue" while Adyen published transparent interchange-plus pricing — both expanding the competitive frame from processing fees to revenue growth outcomes.',
      alternative_explanation: 'Stripe\'s revenue messaging may target billing/subscription tools rather than converging with Adyen. Adyen\'s pricing transparency could be a downmarket push unrelated to Stripe\'s platform play. However, the simultaneous repositioning suggests a shared market dynamic.',
    },
  ],
};

function DemoSignalFeed() {
  const demo = useDemo();
  const sectorSlug = demo?.sectorSlug || '';
  const signals = SECTOR_SIGNALS[sectorSlug] || SECTOR_SIGNALS['developer-tools'];
  const arcs = SECTOR_ARCS[sectorSlug] || [];
  const convergences = SECTOR_CONVERGENCES[sectorSlug] || [];

  const [arcsExpanded, setArcsExpanded] = useState(true);
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

      {/* Narrative Intelligence */}
      {(arcs.length > 0 || convergences.length > 0) && (
        <div className="space-y-4">
          <button
            onClick={() => setArcsExpanded(!arcsExpanded)}
            className="flex items-center gap-2 w-full group"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <GitBranch className="h-4 w-4 text-primary" />
              Narrative Intelligence
            </div>
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground font-medium">
              {arcs.length} arc{arcs.length !== 1 ? 's' : ''}
            </span>
            {arcsExpanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {arcsExpanded && (
            <div className="space-y-4">
              {convergences.map((c) => (
                <ConvergenceAlert key={c.convergence_id} convergence={c} />
              ))}
              <div className="grid gap-4 md:grid-cols-2">
                {arcs.map((arc) => (
                  <NarrativeArcCard key={arc.arc_id} arc={arc} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
  return <DemoSignalFeed />;
}
