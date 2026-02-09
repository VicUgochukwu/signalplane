-- Complete demo data: artifacts for all 3 sectors + older packets

-- ============================================================================
-- CYBERSECURITY: Objection Library
-- ============================================================================
INSERT INTO demo.objection_library_versions (sector_slug, week_start, week_end, content_json, content_md, objection_count, created_at) VALUES
('cybersecurity', '2026-02-02', '2026-02-08',
 $${
   "objections": [
     {
       "id": "obj_c01",
       "objection_text": "We are consolidating to a single security platform and cannot add another vendor",
       "category": "Competitive",
       "frequency": "high",
       "personas": ["CISO", "VP Security", "Security Architect"],
       "rebuttal": {
         "acknowledge": "Consolidation is smart — fewer vendors means less integration headaches and better security posture.",
         "reframe": "The question is: does your platform cover this capability at the depth you need? Most platform features are 60% solutions that leave gaps.",
         "proof": "Customers running our solution alongside CrowdStrike/Palo Alto see 3x faster threat detection because we go deeper in our specific domain.",
         "talk_track": "We actually help consolidation succeed. Most CISOs who deploy us report reducing 3-4 other point tools because we cover multiple use cases."
       },
       "is_new_this_week": true
     },
     {
       "id": "obj_c02",
       "objection_text": "We do not have budget for another security tool this year",
       "category": "Budget",
       "frequency": "high",
       "personas": ["CISO", "VP Security", "CFO"],
       "rebuttal": {
         "acknowledge": "Security budgets are under scrutiny everywhere. Every dollar needs to prove its ROI.",
         "reframe": "The cost of a breach averages $4.5M. Our customers see 80% reduction in mean time to detect — that is the real ROI calculation.",
         "proof": "Average customer saves $200K/year in reduced incident response costs. Plus we replace 2-3 existing tools, creating net savings.",
         "talk_track": "Let me show you the tool consolidation savings. Most customers are net neutral or positive within 6 months by replacing overlapping point solutions."
       },
       "is_new_this_week": false
     },
     {
       "id": "obj_c03",
       "objection_text": "Your AI features create compliance concerns for our regulated environment",
       "category": "Compliance",
       "frequency": "medium",
       "personas": ["CISO", "Compliance Officer", "Legal"],
       "rebuttal": {
         "acknowledge": "AI compliance in regulated industries is critical. We take this very seriously.",
         "reframe": "AI is actually becoming a compliance requirement, not just a feature. Regulators expect automated threat detection capabilities.",
         "proof": "We are FedRAMP authorized, SOC 2 Type II certified, and our AI models run entirely within your environment. Zero data leaves your boundary.",
         "talk_track": "We work with 40+ financial services and healthcare organizations. Our compliance team can walk through our architecture with yours this week."
       },
       "is_new_this_week": true
     }
   ],
   "total_count": 3,
   "new_this_week_count": 2,
   "categories": ["Competitive", "Budget", "Compliance"]
 }$$::jsonb,
 $$# Objection Library — Cybersecurity
## Week of Feb 2-8, 2026

### NEW: Vendor Consolidation
**Objection:** We are consolidating to a single platform.
**Talk Track:** We help consolidation succeed — most CISOs reduce 3-4 other tools after deploying us.

### Budget Constraints
**Objection:** No budget for another tool.
**Talk Track:** Net neutral within 6 months by replacing overlapping point solutions. Average $200K/yr savings.

### NEW: AI Compliance
**Objection:** AI creates compliance concerns.
**Talk Track:** FedRAMP authorized, SOC 2 Type II certified. AI runs entirely within your environment.$$,
 3, now() - interval '1 day'
);

-- ============================================================================
-- CYBERSECURITY: Swipe File
-- ============================================================================
INSERT INTO demo.swipe_file_versions (sector_slug, week_start, week_end, content_json, content_md, phrase_count, created_at) VALUES
('cybersecurity', '2026-02-02', '2026-02-08',
 $${
   "phrases": [
     {"id": "sw_c01", "phrase": "Autonomous Security Operations", "category": "Positioning", "persona": "CISO", "trend": "rising", "is_new_this_week": true},
     {"id": "sw_c02", "phrase": "Stop threats before they start with proactive AI", "category": "Value Prop", "persona": "Security Analyst", "trend": "rising", "is_new_this_week": true},
     {"id": "sw_c03", "phrase": "From cloud to endpoint, one platform protects everything", "category": "Product", "persona": "VP Security", "trend": "stable", "is_new_this_week": false},
     {"id": "sw_c04", "phrase": "Reduce your SOC workload by 80% with Charlotte AI", "category": "Value Prop", "persona": "SOC Manager", "trend": "rising", "is_new_this_week": true},
     {"id": "sw_c05", "phrase": "Identity is the new perimeter", "category": "Positioning", "persona": "CISO", "trend": "stable", "is_new_this_week": false}
   ],
   "total_count": 5,
   "by_persona": {"CISO": 2, "Security Analyst": 1, "VP Security": 1, "SOC Manager": 1},
   "by_category": {"Positioning": 2, "Value Prop": 2, "Product": 1}
 }$$::jsonb,
 $$# Swipe File — Cybersecurity
## Week of Feb 2-8, 2026

### Rising Phrases
- **Autonomous Security Operations** (CISO) — CrowdStrike
- **Stop threats before they start with proactive AI** (Analyst) — Palo Alto
- **Reduce your SOC workload by 80% with Charlotte AI** (SOC Manager) — CrowdStrike$$,
 5, now() - interval '1 day'
);

-- ============================================================================
-- CYBERSECURITY: Battlecards
-- ============================================================================
INSERT INTO demo.battlecard_versions (sector_slug, competitor_name, week_start, week_end, content_json, content_md, created_at) VALUES
('cybersecurity', 'CrowdStrike', '2026-02-02', '2026-02-08',
 $${
   "competitor_name": "CrowdStrike",
   "what_changed_this_week": ["Launched Charlotte AI for autonomous threat hunting", "New Falcon Go tier targeting SMB segment", "Repositioned to Autonomous Security Operations"],
   "talk_tracks": [
     {"title": "When they mention autonomous SOC", "content": "CrowdStrike Charlotte AI is impressive for automated Tier 1 triage, but complex threats still need human expertise. Our approach combines AI speed with analyst depth for threats that matter."},
     {"title": "When they cite market share", "content": "CrowdStrike leads in endpoint detection. But the security landscape is shifting to cloud-native threats where endpoint alone is not enough. Our cloud-native architecture was built for this reality."}
   ],
   "landmines": [
     {"warning": "Do not compete on endpoint detection", "context": "CrowdStrike Falcon sensor is best-in-class. Focus on cloud-native and identity security where their story is weaker."},
     {"warning": "Avoid price comparison at SMB tier", "context": "Falcon Go is aggressively priced for SMB. Only compare at Enterprise tier where we compete on value."}
   ],
   "win_themes": ["Cloud-native architecture", "Identity-first security", "Lower total cost at enterprise scale"],
   "lose_themes": ["Endpoint detection depth", "Brand recognition with CISOs", "Market analyst positioning"]
 }$$::jsonb,
 $$# Battlecard: CrowdStrike
## Week of Feb 2-8, 2026

### What Changed
- Charlotte AI for autonomous threat hunting
- New Falcon Go SMB tier
- Repositioned as Autonomous Security Operations

### Win Themes
- Cloud-native architecture
- Identity-first security
- Lower total cost at enterprise$$,
 now() - interval '1 day'
),
('cybersecurity', 'Wiz', '2026-02-02', '2026-02-08',
 $${
   "competitor_name": "Wiz",
   "what_changed_this_week": ["$500M ARR milestone announced", "New runtime protection features in beta", "Partnership with AWS Marketplace for simplified procurement"],
   "talk_tracks": [
     {"title": "When they cite growth velocity", "content": "Wiz growth is impressive and validates the cloud security market. But fast growth means their product is still maturing in areas like runtime protection where we have years of depth."},
     {"title": "When they mention agentless scanning", "content": "Agentless is great for initial visibility, but real-time protection requires agent-based telemetry. Our lightweight agent provides both — visibility AND protection."}
   ],
   "landmines": [
     {"warning": "Never disparage Wiz CSPM capabilities", "context": "Their cloud security posture management is genuinely strong. Focus on runtime and detection gaps instead."},
     {"warning": "Avoid valuation or funding discussions", "context": "Wiz $12B valuation creates FOMO. Redirect to capability depth and customer outcomes."}
   ],
   "win_themes": ["Runtime protection depth", "Agent-based real-time detection", "Mature enterprise features"],
   "lose_themes": ["Agentless ease of deployment", "Cloud-native brand perception", "Speed of initial value"]
 }$$::jsonb,
 $$# Battlecard: Wiz
## Week of Feb 2-8, 2026

### What Changed
- $500M ARR milestone
- Runtime protection features in beta
- AWS Marketplace partnership

### Win Themes
- Runtime protection depth
- Agent-based real-time detection
- Mature enterprise features$$,
 now() - interval '1 day'
);

-- ============================================================================
-- PRODUCT ANALYTICS: Objection Library
-- ============================================================================
INSERT INTO demo.objection_library_versions (sector_slug, week_start, week_end, content_json, content_md, objection_count, created_at) VALUES
('product-analytics', '2026-02-02', '2026-02-08',
 $${
   "objections": [
     {
       "id": "obj_p01",
       "objection_text": "We already have Google Analytics and do not need another analytics tool",
       "category": "Competitive",
       "frequency": "high",
       "personas": ["Product Manager", "VP Product", "Head of Growth"],
       "rebuttal": {
         "acknowledge": "Google Analytics is great for website traffic and marketing attribution.",
         "reframe": "But product analytics answers different questions: which features drive retention, where users drop off in your app, and what predicts conversion. GA was not built for product teams.",
         "proof": "Teams adding product analytics alongside GA see 45% improvement in feature adoption rates because they can finally measure what matters inside the product.",
         "talk_track": "GA tells you how users find your product. We tell you what they do once they are inside. Most of our customers use both — they serve different purposes."
       },
       "is_new_this_week": false
     },
     {
       "id": "obj_p02",
       "objection_text": "The data engineering overhead to maintain another analytics tool is too high",
       "category": "Implementation",
       "frequency": "high",
       "personas": ["VP Engineering", "Data Engineer", "CTO"],
       "rebuttal": {
         "acknowledge": "Nobody wants another data pipeline to maintain. Your engineering team has enough to do.",
         "reframe": "Our warehouse-native mode means zero new infrastructure. We query your existing Snowflake or BigQuery directly — no ETL, no data duplication.",
         "proof": "Warehouse-native customers are up and running in 2 hours vs 2 weeks for traditional setup. Zero maintenance overhead after initial setup.",
         "talk_track": "We connect directly to your existing data warehouse. No new pipelines, no data duplication, no ongoing maintenance. Your data stays where it is."
       },
       "is_new_this_week": true
     },
     {
       "id": "obj_p03",
       "objection_text": "We are evaluating PostHog as a free open-source alternative",
       "category": "Competitive",
       "frequency": "medium",
       "personas": ["VP Engineering", "Product Manager", "CTO"],
       "rebuttal": {
         "acknowledge": "PostHog is a solid choice for developer-led teams who want to self-host and manage their own infrastructure.",
         "reframe": "The total cost of self-hosting at scale is often higher than managed solutions — server costs, maintenance, upgrades, and the engineering time to manage it all.",
         "proof": "Teams that evaluated both chose us 70% of the time when they factored in total cost of ownership including engineering time for self-hosted management.",
         "talk_track": "PostHog is great for startups who want to own everything. But at your scale, the engineering time to manage a self-hosted analytics platform is significant. Let me show you the TCO comparison."
       },
       "is_new_this_week": true
     }
   ],
   "total_count": 3,
   "new_this_week_count": 2,
   "categories": ["Competitive", "Implementation"]
 }$$::jsonb,
 $$# Objection Library — Product Analytics
## Week of Feb 2-8, 2026

### Google Analytics Comparison
**Objection:** We already have GA.
**Talk Track:** GA is for marketing. We are for product teams. Most customers use both.

### NEW: Data Engineering Overhead
**Objection:** Too much overhead to maintain another tool.
**Talk Track:** Warehouse-native mode: zero new infrastructure, connects to existing Snowflake/BigQuery.

### NEW: PostHog Alternative
**Objection:** PostHog is free and open-source.
**Talk Track:** TCO comparison — self-hosted management at scale costs more than managed solution.$$,
 3, now() - interval '1 day'
);

-- ============================================================================
-- PRODUCT ANALYTICS: Swipe File
-- ============================================================================
INSERT INTO demo.swipe_file_versions (sector_slug, week_start, week_end, content_json, content_md, phrase_count, created_at) VALUES
('product-analytics', '2026-02-02', '2026-02-08',
 $${
   "phrases": [
     {"id": "sw_p01", "phrase": "AI-Powered Product Intelligence", "category": "Positioning", "persona": "VP Product", "trend": "rising", "is_new_this_week": true},
     {"id": "sw_p02", "phrase": "From data collection to product decisions in minutes, not months", "category": "Value Prop", "persona": "Product Manager", "trend": "rising", "is_new_this_week": true},
     {"id": "sw_p03", "phrase": "Warehouse-native analytics: your data, your warehouse, our insights", "category": "Product", "persona": "Data Engineer", "trend": "rising", "is_new_this_week": true},
     {"id": "sw_p04", "phrase": "Every feature decision backed by behavioral data", "category": "Value Prop", "persona": "VP Product", "trend": "stable", "is_new_this_week": false},
     {"id": "sw_p05", "phrase": "The all-in-one product stack: analytics, experiments, and feature flags", "category": "Positioning", "persona": "CTO", "trend": "rising", "is_new_this_week": true}
   ],
   "total_count": 5,
   "by_persona": {"VP Product": 2, "Product Manager": 1, "Data Engineer": 1, "CTO": 1},
   "by_category": {"Positioning": 2, "Value Prop": 2, "Product": 1}
 }$$::jsonb,
 $$# Swipe File — Product Analytics
## Week of Feb 2-8, 2026

### Rising Phrases
- **AI-Powered Product Intelligence** (VP Product) — Amplitude
- **Warehouse-native analytics** (Data Engineer) — Mixpanel
- **The all-in-one product stack** (CTO) — PostHog$$,
 5, now() - interval '1 day'
);

-- ============================================================================
-- PRODUCT ANALYTICS: Battlecards
-- ============================================================================
INSERT INTO demo.battlecard_versions (sector_slug, competitor_name, week_start, week_end, content_json, content_md, created_at) VALUES
('product-analytics', 'Amplitude', '2026-02-02', '2026-02-08',
 $${
   "competitor_name": "Amplitude",
   "what_changed_this_week": ["Launched AI-powered product insights feature", "New enterprise pricing with usage-based model", "Session replay integration announced"],
   "talk_tracks": [
     {"title": "When they mention AI insights", "content": "Amplitude AI insights are surface-level pattern detection. Our AI goes deeper — we identify causal relationships between features and business outcomes, not just correlations."},
     {"title": "When they cite market leadership", "content": "Amplitude was first to scale product analytics for enterprise. But the market is evolving — warehouse-native and privacy-first are the new requirements, and they are playing catch-up."}
   ],
   "landmines": [
     {"warning": "Do not compete on brand recognition", "context": "Amplitude is the most recognized name. Focus on technical depth and modern architecture instead."},
     {"warning": "Avoid data volume pricing comparison at low scale", "context": "Their usage-based pricing is competitive for smaller teams. Only compare at enterprise scale."}
   ],
   "win_themes": ["Warehouse-native architecture", "Privacy-first analytics", "Faster time to insight"],
   "lose_themes": ["Brand recognition", "Existing enterprise integrations", "Analyst community size"]
 }$$::jsonb,
 $$# Battlecard: Amplitude
## Week of Feb 2-8, 2026

### What Changed
- AI-powered product insights launch
- Usage-based enterprise pricing
- Session replay integration

### Win Themes
- Warehouse-native architecture
- Privacy-first analytics
- Faster time to insight$$,
 now() - interval '1 day'
);

-- ============================================================================
-- Older packets for historical depth (1 more per sector)
-- ============================================================================
INSERT INTO demo.packets (sector_slug, week_start, week_end, packet_title, exec_summary, sections, key_questions, bets, predictions, action_mapping, status, created_at) VALUES
('cybersecurity', '2026-01-26', '2026-02-01',
 'Cybersecurity Weekly Intelligence — Jan 26 – Feb 1, 2026',
 $$["SentinelOne launches Purple AI 2.0 with automated incident response", "Zscaler reports 35% revenue growth, validating SASE market expansion", "New zero-day in enterprise VPN appliances drives urgency for cloud-native security"]$$::jsonb,
 $${
   "messaging": {
     "summary": "SASE and cloud-native security narratives dominating vendor messaging this week. VPN vulnerability disclosures are accelerating the shift from appliance-based to cloud-delivered security.",
     "highlights": ["Zscaler revenue growth validates SASE market momentum", "SentinelOne Purple AI 2.0 expanding from detection to automated response", "VPN zero-day driving urgent customer conversations about cloud-native alternatives"],
     "action_items": ["Create VPN-to-cloud migration content", "Update SASE competitive positioning"]
   },
   "narrative": {
     "summary": "The appliance-to-cloud migration is accelerating. VPN vulnerabilities are creating urgency that budgets alone could not drive.",
     "highlights": ["VPN-related security incidents up 200% in past 6 months", "Cloud security spend now exceeds on-prem for the first time"],
     "action_items": ["Develop cloud migration urgency messaging", "Create appliance replacement ROI calculator"]
   },
   "icp": {
     "summary": "Mid-market companies (1000-5000 employees) are the fastest adopters of cloud-native security, driven by lack of legacy infrastructure constraints.",
     "highlights": ["Mid-market cloud security adoption 2x enterprise rate", "Average mid-market security evaluation cycle: 60 days (down from 90)"],
     "action_items": ["Optimize mid-market sales motion", "Create mid-market case studies"]
   },
   "horizon": {
     "summary": "Automated incident response is emerging as the next battleground. SentinelOne Purple AI 2.0 is leading, but all major vendors are investing heavily.",
     "highlights": ["Purple AI 2.0: automated response in 4 major categories", "CrowdStrike Charlotte AI in development for automated remediation"],
     "action_items": ["Evaluate automated response roadmap", "Monitor Purple AI adoption metrics"]
   },
   "objection": {
     "summary": "Compliance and regulatory concerns dominate. Organizations in regulated industries hesitant about AI-powered security automation.",
     "highlights": ["Regulatory compliance cited as top blocker for AI security adoption", "FedRAMP requirement in 80% of government RFPs"],
     "action_items": ["Accelerate compliance certifications", "Create regulated industry buyer guides"]
   },
   "metrics": {"signals_detected": 43, "confidence_score": 81, "impact_score": 8}
 }$$::jsonb,
 $$["Will VPN vulnerability crisis accelerate cloud-native security adoption permanently?", "How quickly will automated incident response become standard?"]$$::jsonb,
 $$[{"hypothesis": "VPN appliance market will decline 30% by end of 2026", "confidence": 65, "signal_ids": ["sig_110"]}]$$::jsonb,
 $$[{"prediction": "Cloud-native security will represent 60% of new enterprise security spend by Q4 2026", "timeframe": "9 months", "confidence": 72, "signals": ["Zscaler growth", "VPN vulnerability trend"]}]$$::jsonb,
 $${"this_week": [{"action": "Create VPN-to-cloud migration content package", "owner": "Content Marketing", "priority": "high"}, {"action": "Develop SentinelOne Purple AI competitive response", "owner": "PMM", "priority": "medium"}], "monitor": [{"signal": "New VPN zero-days", "trigger": "CISA advisory", "action": "Publish response guide within 48 hours"}]}$$::jsonb,
 'published', now() - interval '8 days'
),
('product-analytics', '2026-01-26', '2026-02-01',
 'Product Analytics Weekly Intelligence — Jan 26 – Feb 1, 2026',
 $$["Mixpanel launches free tier expansion: 100M events/month for startups", "FullStory acquires AI annotation startup, deepening qualitative analytics", "Privacy regulation updates in EU create compliance urgency for analytics vendors"]$$::jsonb,
 $${
   "messaging": {
     "summary": "Free tier wars heating up in product analytics. Mixpanel free tier expansion puts pressure on competitors to match, while FullStory acquisition signals convergence of qualitative and quantitative analytics.",
     "highlights": ["Mixpanel free tier now 100M events/month (up from 20M)", "FullStory acquisition strengthens AI annotation capabilities", "EU privacy regulation updates requiring explicit analytics consent"],
     "action_items": ["Review free tier competitiveness against Mixpanel expansion", "Develop EU privacy compliance messaging"]
   },
   "narrative": {
     "summary": "The product analytics market is bifurcating: one path toward free/open-source for developers, another toward enterprise AI-powered insights for product leaders.",
     "highlights": ["Free tier competition intensifying across all major vendors", "AI-powered insights becoming key differentiator for enterprise sales"],
     "action_items": ["Define clear path for free-to-paid conversion", "Invest in AI-powered enterprise features"]
   },
   "icp": {
     "summary": "Startup teams are driving free tier adoption while enterprise teams are evaluating AI capabilities for product decisions.",
     "highlights": ["Startups evaluating 3+ analytics tools before committing", "Enterprise buying decisions increasingly led by CPO/VP Product"],
     "action_items": ["Create startup evaluation guide", "Develop CPO-focused business case content"]
   },
   "horizon": {
     "summary": "AI-powered qualitative + quantitative convergence is the next frontier. Session replay with AI annotation will become standard within 12 months.",
     "highlights": ["FullStory AI annotation acquisition validates convergence thesis", "3 startups raised $50M+ for AI-powered user research tools"],
     "action_items": ["Evaluate qualitative analytics partnership opportunities", "Monitor AI user research tool category"]
   },
   "objection": {
     "summary": "Privacy compliance is the top concern. EU regulations creating complexity for analytics tracking implementation.",
     "highlights": ["40% of EU prospects cite GDPR complexity as evaluation blocker", "Server-side analytics adoption growing as privacy solution"],
     "action_items": ["Develop privacy-first analytics architecture guide", "Create GDPR compliance checklist for prospects"]
   },
   "metrics": {"signals_detected": 35, "confidence_score": 76, "impact_score": 6}
 }$$::jsonb,
 $$["Will free tier wars commoditize basic product analytics?", "How will EU privacy regulations reshape analytics architectures?"]$$::jsonb,
 $$[{"hypothesis": "Server-side analytics will become the default architecture for EU companies by Q3 2026", "confidence": 60, "signal_ids": ["sig_210"]}]$$::jsonb,
 $$[{"prediction": "All major product analytics vendors will offer AI-powered insights by end of 2026", "timeframe": "10 months", "confidence": 85, "signals": ["Amplitude AI launch", "FullStory acquisition", "Market demand signals"]}]$$::jsonb,
 $${"this_week": [{"action": "Review free tier against Mixpanel 100M events expansion", "owner": "Product", "priority": "high"}, {"action": "Create EU privacy compliance guide", "owner": "Legal + PMM", "priority": "medium"}], "monitor": [{"signal": "EU analytics regulation updates", "trigger": "New regulatory guidance", "action": "Update compliance documentation"}]}$$::jsonb,
 'published', now() - interval '8 days'
);

-- Final verification
SELECT sector_slug, count(*) as packets FROM demo.packets GROUP BY sector_slug ORDER BY sector_slug;
SELECT 'objections' as artifact, count(*) FROM demo.objection_library_versions
UNION ALL SELECT 'swipe_files', count(*) FROM demo.swipe_file_versions
UNION ALL SELECT 'battlecards', count(*) FROM demo.battlecard_versions;
