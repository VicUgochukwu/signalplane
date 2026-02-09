-- Fix: Insert cybersecurity and product-analytics packets + objection library
-- Using dollar-quoting to avoid single-quote escaping issues

-- Cybersecurity packet
INSERT INTO demo.packets (sector_slug, week_start, week_end, packet_title, exec_summary, sections, key_questions, bets, predictions, action_mapping, status, is_personalized, user_company_name, created_at) VALUES
('cybersecurity', '2026-02-02', '2026-02-08',
 'Cybersecurity Weekly Intelligence — Feb 2-8, 2026',
 $$["CrowdStrike launches AI-powered threat hunting, doubling down on autonomous SOC narrative", "Wiz reaches $500M ARR milestone, fastest cybersecurity company to hit the mark", "Okta deprecates legacy auth protocols — enterprises scrambling to migrate", "Palo Alto Networks announces cloud-native SASE platform, targeting Zscaler market"]$$::jsonb,
 $${
   "messaging": {
     "summary": "CrowdStrike is repositioning from endpoint security to autonomous security operations. Their Charlotte AI product is being positioned as the central nervous system for enterprise SOCs, threatening point solution vendors.",
     "highlights": ["CrowdStrike homepage now leads with AI-Powered Security Operations over endpoint protection", "Wiz pricing page adds Enterprise tier at undisclosed pricing targeting $100K+ deals", "Okta messaging shifts from Identity Provider to Identity Security Platform"],
     "action_items": ["Update battlecards to address CrowdStrike autonomous SOC positioning", "Prepare customer communication around Okta legacy auth deprecation impact"]
   },
   "narrative": {
     "summary": "Platform consolidation in cybersecurity is accelerating. CISOs are under pressure to reduce vendor sprawl while maintaining defense depth. The market is bifurcating between platform plays and specialized deep-tech solutions.",
     "highlights": ["Average enterprise security stack: 76 tools (down from 85 in 2025)", "Platform vendors winning 60% of new enterprise deals over $250K", "Specialized vendors winning on technical depth in regulated industries"],
     "action_items": ["Position clearly on the platform vs specialized spectrum", "Develop integration stories for the top 5 platform players"]
   },
   "icp": {
     "summary": "CISO buying behavior shifting toward platform-first evaluation. Security teams are prioritizing integration and consolidation over best-of-breed individual capabilities.",
     "highlights": ["72% of CISOs planning tool consolidation in 2026", "Cloud security budget growing 45% YoY vs 12% for on-prem", "Identity security now #1 CISO priority (up from #3 in 2025)"],
     "action_items": ["Create CISO-focused ROI calculator for platform consolidation", "Develop cloud-first messaging for new prospects"]
   },
   "horizon": {
     "summary": "AI-powered threat detection and response is becoming table stakes. The differentiator is shifting toward autonomous remediation and proactive threat hunting capabilities.",
     "highlights": ["CrowdStrike Charlotte AI processing 1T+ events daily", "New entrant: AI-native security startup raises $200M Series B", "Gartner predicts 60% of enterprise security will be AI-augmented by 2027"],
     "action_items": ["Accelerate AI roadmap for automated threat response", "Evaluate partnership with AI security startups"]
   },
   "objection": {
     "summary": "Top objection: We are consolidating vendors and your tool does not fit our platform strategy. Platform lock-in concern is a secondary but growing objection.",
     "highlights": ["Vendor consolidation objection in 45% of enterprise deals", "Platform lock-in concern mentioned in 30% of mid-market evaluations"],
     "action_items": ["Build platform-compatible narrative showing integration depth", "Create vendor-neutral deployment options for lock-in concerns"]
   },
   "metrics": {"signals_detected": 52, "confidence_score": 85, "impact_score": 9}
 }$$::jsonb,
 $$["Will CrowdStrike autonomous SOC strategy succeed in displacing point solutions?", "How fast will Wiz reach $1B ARR?", "Is identity security permanently the #1 CISO priority?"]$$::jsonb,
 $$[{"hypothesis": "CrowdStrike will acquire a cloud security company within 12 months to complete platform", "confidence": 60, "signal_ids": ["sig_100", "sig_101"]}, {"hypothesis": "Wiz IPO will happen in H2 2026 at $20B+ valuation", "confidence": 70, "signal_ids": ["sig_102"]}]$$::jsonb,
 $$[{"prediction": "3 major security platform acquisitions in 2026", "timeframe": "12 months", "confidence": 75, "signals": ["Consolidation trend", "CISO vendor reduction mandates"]}, {"prediction": "AI-powered SOC tools will handle 50% of Tier 1 alerts autonomously by Q4 2026", "timeframe": "9 months", "confidence": 65, "signals": ["CrowdStrike Charlotte AI adoption", "AI security startup funding"]}]$$::jsonb,
 $${"this_week": [{"action": "Update CrowdStrike battlecard with autonomous SOC positioning", "owner": "PMM", "priority": "high"}, {"action": "Create Okta migration impact assessment for affected customers", "owner": "Customer Success", "priority": "high"}, {"action": "Develop platform integration depth messaging", "owner": "Product Marketing", "priority": "medium"}], "monitor": [{"signal": "CrowdStrike acquisition announcement", "trigger": "SEC filing or press release", "action": "Publish competitive analysis within 24 hours"}, {"signal": "Wiz IPO filing", "trigger": "S-1 filing", "action": "Update competitive positioning and market analysis"}]}$$::jsonb,
 'published', false, null, now() - interval '1 day'
);

-- Product Analytics packet
INSERT INTO demo.packets (sector_slug, week_start, week_end, packet_title, exec_summary, sections, key_questions, bets, predictions, action_mapping, status, is_personalized, user_company_name, created_at) VALUES
('product-analytics', '2026-02-02', '2026-02-08',
 'Product Analytics Weekly Intelligence — Feb 2-8, 2026',
 $$["Amplitude launches AI-powered product insights, challenging traditional analytics workflows", "Mixpanel introduces warehouse-native mode with direct BigQuery/Snowflake integration", "PostHog reaches 50K self-hosted deployments, proving open-source analytics viability", "Heap announces real-time session replay with AI annotation"]$$::jsonb,
 $${
   "messaging": {
     "summary": "The product analytics market is pivoting from track everything to understand everything automatically. AI-powered insights are replacing manual analysis workflows, and warehouse-native architectures are becoming the expected standard.",
     "highlights": ["Amplitude homepage now leads with AI-Powered Product Intelligence over traditional analytics", "Mixpanel pricing restructured around data volume tiers with warehouse-native as default", "PostHog emphasizing all-in-one product platform vs analytics-only positioning"],
     "action_items": ["Evaluate AI insights capabilities vs Amplitude new offering", "Assess warehouse-native strategy against Mixpanel approach"]
   },
   "narrative": {
     "summary": "Product analytics is merging with product management tooling. The distinction between analytics, experimentation, and feature management is blurring as platforms expand their scope.",
     "highlights": ["4 of 7 tracked competitors now offer experimentation features", "Product intelligence replacing product analytics in vendor messaging", "Open-source analytics adoption growing 40% YoY in mid-market"],
     "action_items": ["Define position on analytics vs intelligence platform spectrum", "Create open-source comparison content for developer audience"]
   },
   "icp": {
     "summary": "Product teams are increasingly owning their analytics stack decisions, bypassing traditional IT/data team gatekeepers. Self-serve setup and developer-friendly APIs are table stakes.",
     "highlights": ["68% of product analytics purchases now led by product teams (up from 52% in 2025)", "Average evaluation period shortened from 45 to 28 days", "Privacy-first analytics requirements growing in EU market"],
     "action_items": ["Optimize self-serve onboarding for product team personas", "Develop GDPR/privacy compliance messaging for EU expansion"]
   },
   "horizon": {
     "summary": "Session replay and qualitative analytics are converging with quantitative product analytics. AI is the bridge automatically connecting user behavior patterns with session-level context.",
     "highlights": ["Heap AI-annotated session replay in beta with 500+ companies", "FullStory-Amplitude integration deepening with shared AI layer", "New category: Product Experience Analytics combining quant + qual"],
     "action_items": ["Evaluate session replay partnership or build opportunity", "Monitor product experience analytics category development"]
   },
   "objection": {
     "summary": "Data engineering overhead is the top objection. Teams want analytics without maintaining separate data pipelines. Warehouse-native and zero-ETL approaches are winning.",
     "highlights": ["Data pipeline complexity cited in 55% of churned accounts", "Warehouse-native features reduce time-to-value by 60%", "Self-hosted demand growing in regulated industries"],
     "action_items": ["Invest in zero-ETL / warehouse-native capabilities", "Create data engineering reduction ROI content"]
   },
   "metrics": {"signals_detected": 41, "confidence_score": 79, "impact_score": 7}
 }$$::jsonb,
 $$["Will warehouse-native become the default architecture for product analytics?", "How will AI insights change the role of product analysts?", "Is open-source analytics a viable enterprise play?"]$$::jsonb,
 $$[{"hypothesis": "Amplitude will acquire a session replay company within 6 months", "confidence": 50, "signal_ids": ["sig_200"]}, {"hypothesis": "Warehouse-native analytics will be offered by all major vendors by end of 2026", "confidence": 80, "signal_ids": ["sig_201", "sig_202"]}]$$::jsonb,
 $$[{"prediction": "AI-powered product insights will reduce manual analysis time by 50% in early adopter companies", "timeframe": "6 months", "confidence": 70, "signals": ["Amplitude AI adoption", "Heap AI annotation usage"]}, {"prediction": "Open-source product analytics will capture 25% of new mid-market deployments by Q4 2026", "timeframe": "9 months", "confidence": 65, "signals": ["PostHog growth", "Developer preference trends"]}]$$::jsonb,
 $${"this_week": [{"action": "Create Amplitude AI insights competitive comparison", "owner": "PMM", "priority": "high"}, {"action": "Evaluate Mixpanel warehouse-native approach for feature parity", "owner": "Product", "priority": "medium"}, {"action": "Develop PostHog competitive positioning for developer audience", "owner": "Developer Relations", "priority": "medium"}], "monitor": [{"signal": "Amplitude acquisition news", "trigger": "TechCrunch or SEC filing", "action": "Update competitive analysis"}, {"signal": "PostHog enterprise features launch", "trigger": "Blog post or changelog", "action": "Review and update battlecard"}]}$$::jsonb,
 'published', false, null, now() - interval '1 day'
);

-- Objection library for developer-tools (failed earlier due to quotes)
INSERT INTO demo.objection_library_versions (sector_slug, week_start, week_end, content_json, content_md, objection_count, created_at) VALUES
('developer-tools', '2026-02-02', '2026-02-08',
 $${
   "objections": [
     {
       "id": "obj_001",
       "objection_text": "Why not just use the built-in feature from our existing platform?",
       "category": "Competitive",
       "frequency": "high",
       "personas": ["VP Engineering", "CTO", "Engineering Manager"],
       "rebuttal": {
         "acknowledge": "I completely understand — platform consolidation makes a lot of sense for managing complexity.",
         "reframe": "The question is really about depth vs breadth. Platform built-in features cover 70% of use cases, but the 30% they miss is where competitive advantage lives.",
         "proof": "Our customers who switched from platform built-ins see 3x faster issue resolution and 40% better developer satisfaction scores.",
         "talk_track": "Most teams find that built-in tools handle basic cases well, but as you scale, the gaps become expensive. Our integration with the platform actually enhances what they offer natively."
       },
       "is_new_this_week": true
     },
     {
       "id": "obj_002",
       "objection_text": "The migration cost is too high for what we get",
       "category": "Value",
       "frequency": "high",
       "personas": ["VP Engineering", "Engineering Manager", "DevOps Lead"],
       "rebuttal": {
         "acknowledge": "Migration is a real investment and I respect that your team time is valuable.",
         "reframe": "Let us look at the total cost: migration is a one-time expense, but the productivity gains compound every week.",
         "proof": "Average migration takes 2-3 weeks. Our customers report ROI within the first quarter — typically 15-20 developer hours saved per week.",
         "talk_track": "We have white-glove migration support included for teams your size. Most customers have both systems running in parallel within a week."
       },
       "is_new_this_week": false
     },
     {
       "id": "obj_003",
       "objection_text": "We need AI features but are concerned about code security",
       "category": "Security",
       "frequency": "medium",
       "personas": ["CISO", "VP Engineering", "Security Lead"],
       "rebuttal": {
         "acknowledge": "Code security with AI tools is a legitimate concern that we take very seriously.",
         "reframe": "The real risk is not having AI assistance — your competitors are shipping 40% faster with AI tools while maintaining security compliance.",
         "proof": "We are SOC 2 Type II certified, and our AI features never send code to external models. Everything runs in your VPC.",
         "talk_track": "Our AI runs entirely within your security boundary. Zero code leaves your environment. We can do a security review with your team this week."
       },
       "is_new_this_week": true
     }
   ],
   "total_count": 3,
   "new_this_week_count": 2,
   "categories": ["Competitive", "Value", "Security"]
 }$$::jsonb,
 $$# Objection Library — Developer Tools
## Week of Feb 2-8, 2026

### NEW: Platform Consolidation
**Objection:** Why not use built-in features from our existing platform?
**Talk Track:** Most teams find built-in tools handle basic cases well, but gaps become expensive at scale.

### Migration Cost
**Objection:** The migration cost is too high.
**Talk Track:** Average migration 2-3 weeks with white-glove support. ROI within first quarter.

### NEW: AI Security
**Objection:** We need AI but are concerned about code security.
**Talk Track:** Our AI runs entirely within your security boundary. Zero code leaves your environment.$$,
 3, now() - interval '1 day'
);

-- Verification
SELECT 'demo.packets' as tbl, count(*) as rows FROM demo.packets
UNION ALL
SELECT 'demo.objection_library_versions', count(*) FROM demo.objection_library_versions
UNION ALL
SELECT 'demo.swipe_file_versions', count(*) FROM demo.swipe_file_versions
UNION ALL
SELECT 'demo.battlecard_versions', count(*) FROM demo.battlecard_versions;
