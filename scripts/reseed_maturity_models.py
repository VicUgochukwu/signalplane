#!/usr/bin/env python3
"""
Reseed demo maturity model data with authentic-feeling content.
Social proof, real-sounding metrics, analyst references, named customers.
No em dashes. No generic AI patterns.
"""

import json
import datetime

now = datetime.datetime.now(datetime.timezone.utc).isoformat()
week_start = "2026-02-02"
week_end = "2026-02-08"

sectors = {}

# ============================================================
# CYBERSECURITY
# ============================================================
sectors["cybersecurity"] = {
    "title": "The Threat Detection & Response Maturity Model",
    "dimensions": [
        {
            "id": "detection-coverage",
            "label": "Detection Coverage",
            "stages": [
                {
                    "stage_number": 1,
                    "name": "Alert-Driven",
                    "description": "Detection relies on individual tool alerts reviewed manually. Analysts context-switch between 4-7 consoles per investigation.",
                    "what_works": "You catch known threats that fire high-confidence alerts. Your team has built muscle memory around your primary SIEM.",
                    "what_breaks": "Novel attack chains that span multiple tools go unnoticed for 12-48 hours. Alert fatigue drives 38% of critical alerts to be closed without investigation (per Ponemon 2025).",
                    "trigger_to_next": "A post-incident review reveals the signals were present across three tools, but nobody connected them in time.",
                    "discovery_questions": [
                        "When you had your last critical incident, how many consoles did the analyst touch before they understood the full scope?",
                        "What percentage of your alerts get closed without investigation in a typical week?",
                        "If a credential was compromised at 2am, how long before your team connects the endpoint alert to the identity event?"
                    ],
                    "talk_track": "We hear this a lot from security teams running 5-8 tools. Acme Financial told us their analysts were spending 43 minutes per investigation just copy-pasting IOCs between Splunk and CrowdStrike. After they moved to Stage 2, that dropped to 6 minutes because the correlation was automatic. The Ponemon Institute found that 38% of critical alerts get closed uninvestigated. Not because teams are lazy, but because the context needed to prioritize sits in a different console than the alert.",
                    "objection_reframes": [
                        {
                            "original_objection": "We already have a SIEM for this",
                            "readiness_reframe": "Absolutely, and that is a solid foundation. The gap we keep seeing is cross-signal correlation. Meridian Health had Splunk and still missed a lateral movement chain because the endpoint data lived in a separate tool. Their MTTD was 14 hours. After automating the correlation layer, it dropped to 90 minutes."
                        },
                        {
                            "original_objection": "We cannot rip and replace our current stack",
                            "readiness_reframe": "Nobody should. The 2025 Gartner SOC survey found that organizations average 6.8 security tools and the ones reducing MTTD fastest are layering correlation on top, not replacing anything. Acme Financial kept Splunk and CrowdStrike and just connected them."
                        }
                    ],
                    "swipe_phrases": ["we are drowning in alerts", "too many consoles", "we miss things between the cracks", "alert fatigue is real"]
                },
                {
                    "stage_number": 2,
                    "name": "Correlated",
                    "description": "Alerts from multiple sources are automatically correlated into unified incidents. Analysts see the full attack chain in one view.",
                    "what_works": "Cross-tool correlation catches multi-stage attacks that Stage 1 misses. MTTD drops 40-60% based on Forrester TEI studies. Analyst productivity jumps because context is pre-assembled.",
                    "what_breaks": "Correlation rules are static and maintained manually. New attack techniques or new tools require rule updates that lag weeks behind. False positive rates on correlated incidents hover around 25-30%.",
                    "trigger_to_next": "The team realizes that maintaining correlation rules manually cannot keep pace with the 47% year-over-year increase in novel attack techniques (CrowdStrike 2025 Threat Report).",
                    "discovery_questions": [
                        "How many correlation rules does your team maintain, and how often do you review them?",
                        "When you onboard a new security tool, how long before it is fully integrated into your correlation logic?",
                        "What is your false positive rate on correlated incidents right now?"
                    ],
                    "talk_track": "You have done the hard part, getting your tools talking to each other. That puts you ahead of about 65% of the market based on what we see. The challenge at Stage 2 is rule maintenance. Northwind Insurance had 340 correlation rules and a two-person team updating them. When Log4Shell hit, it took them 11 days to write and test the new correlation patterns. The organizations moving to Stage 3 are using behavioral baselines instead of static rules, so novel techniques get flagged without anyone writing a new rule.",
                    "objection_reframes": [
                        {
                            "original_objection": "Our correlation rules work fine for our environment",
                            "readiness_reframe": "They probably do for known patterns. Northwind Insurance said the same thing until Log4Shell exposed the 11-day gap between a new technique appearing and their rules catching it. The question is not whether your rules work today, but how fast they adapt when something new appears."
                        },
                        {
                            "original_objection": "We do not have budget for another platform",
                            "readiness_reframe": "Forrester found that organizations at Stage 3 actually reduce total security spend by 18% because they retire redundant detection tools. BrightPath Energy saved $420K in year one by consolidating three point solutions after their behavioral detection layer made them redundant."
                        }
                    ],
                    "swipe_phrases": ["our rules keep growing", "we can not keep up with new techniques", "correlation helps but rule maintenance is a full-time job"]
                },
                {
                    "stage_number": 3,
                    "name": "Behavioral",
                    "description": "Detection uses behavioral baselines and ML-driven anomaly detection alongside rules. Novel threats trigger investigation based on deviation from normal patterns.",
                    "what_works": "Unknown attack techniques get flagged without pre-written rules. False positive rates drop to 8-12% because behavioral models learn what is normal for each environment. MTTD for novel threats drops from days to hours.",
                    "what_breaks": "Behavioral models require tuning per environment and generate noise during the first 30-60 days. Response is still largely manual, so even fast detection does not translate to fast containment if the playbook requires human approval at every step.",
                    "trigger_to_next": "Detection is fast but containment still takes hours because analysts follow manual runbooks. A ransomware incident is detected in 12 minutes but takes 4 hours to contain because every isolation step requires a human.",
                    "discovery_questions": [
                        "When your detection fires on something novel, what does the response workflow look like? How many manual steps before containment?",
                        "What is your average time from detection to full containment right now?",
                        "Have you quantified the gap between when you detect and when you actually stop the threat from spreading?"
                    ],
                    "talk_track": "This is where it gets interesting because you have solved the detection problem but exposed the response bottleneck. ClearBank had Stage 3 detection, they were catching credential abuse in 8 minutes. But containment still took 3.5 hours because their playbook had 14 manual approval steps. Their CISO told us the board did not care that they detected fast if the attacker had 3.5 hours to move laterally. The jump to Stage 4 is about closing that gap with automated response for high-confidence scenarios.",
                    "objection_reframes": [
                        {
                            "original_objection": "We are not comfortable with automated response",
                            "readiness_reframe": "That is the right instinct for low-confidence detections. But for high-confidence scenarios like known ransomware signatures or impossible-travel logins, the 2025 IBM Cost of a Breach report shows that automated containment reduces breach cost by $1.8M on average. ClearBank started with just two automated playbooks and expanded from there."
                        },
                        {
                            "original_objection": "Our team can respond fast enough manually",
                            "readiness_reframe": "For business hours, probably yes. The Mandiant M-Trends 2025 report found that 67% of ransomware deployments happen between 8pm and 6am. ClearBank's 3.5-hour containment was a daytime incident with the full team online. Their after-hours number was closer to 9 hours."
                        }
                    ],
                    "swipe_phrases": ["we detect fast but respond slow", "our playbooks are too manual", "containment is the bottleneck now"]
                },
                {
                    "stage_number": 4,
                    "name": "Autonomous",
                    "description": "High-confidence threats are contained automatically within seconds. Human analysts focus on novel threats, threat hunting, and continuous improvement of the detection fabric.",
                    "what_works": "Median time to containment under 4 minutes for known threat patterns. Analyst time shifts from reactive firefighting to proactive threat hunting. SOC handles 3-5x more events with the same headcount.",
                    "what_breaks": "Requires strong governance and audit trails for automated actions. Regulatory environments may need explainability for every automated containment decision. Edge cases where automated response causes business disruption (e.g., isolating a production server).",
                    "trigger_to_next": "This is the target state for most organizations. Continuous improvement focuses on expanding the scope of automated response and reducing the shrinking set of scenarios that require human judgment.",
                    "discovery_questions": [
                        "What percentage of your incident response actions could theoretically be automated today if you had the confidence in the detection?",
                        "How do you currently handle incidents that occur outside business hours?",
                        "Have you calculated the cost of a 4-hour containment gap versus a 4-minute one for your most critical assets?"
                    ],
                    "talk_track": "The organizations here are a small group, maybe 8-12% of the market based on the 2025 SANS SOC Survey. They are running SOCs that handle 5x the event volume with the same team size as Stage 2 organizations. Apex Manufacturing automated containment for their top 15 threat scenarios and their median containment dropped from 2.1 hours to 3 minutes. Their SOC team went from spending 80% of their time on reactive response to spending 60% on proactive threat hunting. Gartner predicts that by 2027, 40% of enterprises will have some form of autonomous response. The ones starting now are building the governance frameworks and audit trails that will be table stakes.",
                    "objection_reframes": [
                        {
                            "original_objection": "Full automation is too risky for our environment",
                            "readiness_reframe": "It is not all-or-nothing. Apex Manufacturing started with 3 automated playbooks for their highest-confidence, lowest-risk scenarios and expanded over 18 months. The key is starting with scenarios where the cost of inaction is clearly higher than the cost of automated action."
                        },
                        {
                            "original_objection": "Our board wants human oversight on every security decision",
                            "readiness_reframe": "Smart boards do want oversight, but oversight does not mean manual approval on every action. Apex Manufacturing gives their board a weekly automated response audit showing every action taken, why it was taken, and the outcome. The board gets better visibility than they had with manual response because everything is logged and explainable."
                        }
                    ],
                    "swipe_phrases": ["we want our analysts hunting, not firefighting", "we need to do more with the same team", "automation is the only way we scale"]
                }
            ]
        },
        {
            "id": "threat-intelligence",
            "label": "Threat Intelligence Integration",
            "stages": [
                {
                    "stage_number": 1,
                    "name": "Feed-Based",
                    "description": "Threat intelligence comes from vendor feeds consumed passively. IOCs are checked against but rarely contextualized to the organization's specific threat profile.",
                    "what_works": "Known IOCs from major feeds (CISA, vendor feeds) are blocked or alerted on. Provides baseline protection against commodity threats.",
                    "what_breaks": "No prioritization based on relevance to your industry or infrastructure. IOC feeds are 24-48 hours stale on average (Recorded Future 2025 study). No mapping between intelligence and actual defensive gaps.",
                    "trigger_to_next": "A threat advisory mentions an APT group targeting your industry, but nobody on the team can determine whether you are exposed because there is no mapping between intelligence and your specific environment.",
                    "discovery_questions": [
                        "When a new threat advisory comes out for your industry, how does your team determine if you are specifically vulnerable?",
                        "How many threat intel feeds do you consume, and how do you decide which IOCs are relevant to your environment?",
                        "Can you tell me right now which APT groups are most likely to target your organization and what TTPs they use?"
                    ],
                    "talk_track": "Most organizations start here, consuming feeds and checking IOCs. Redstone Logistics was running 4 threat feeds and blocking about 12,000 IOCs monthly. When we looked at it together, only about 8% of those IOCs were even relevant to their tech stack and industry. Meanwhile, the specific APT group that eventually hit them (TA505) had been discussed in their feeds for months but nobody mapped those TTPs to their defensive gaps. The intelligence was there. The contextualization was not.",
                    "objection_reframes": [
                        {
                            "original_objection": "Our threat feeds cover everything we need",
                            "readiness_reframe": "Feeds are necessary but not sufficient. Redstone Logistics had 4 premium feeds and still got hit because the feeds told them what threats existed but not which ones specifically targeted their infrastructure. The 2025 SANS CTI Survey found that 72% of organizations consume threat feeds but only 23% contextualize them to their environment."
                        }
                    ],
                    "swipe_phrases": ["we get the feeds but do not know what to do with them", "too much intelligence, not enough action", "we cannot tell what is relevant to us"]
                },
                {
                    "stage_number": 2,
                    "name": "Contextualized",
                    "description": "Threat intelligence is mapped to the organization's specific attack surface, industry, and technology stack. Relevant threats are prioritized and linked to defensive gaps.",
                    "what_works": "Teams know which threat actors target their industry and can map those actors' TTPs to their current defensive posture. Vulnerability prioritization improves because it accounts for active exploitation, not just CVSS scores.",
                    "what_breaks": "Intelligence consumption is still analyst-driven and periodic. Real-time integration between intelligence and detection/response does not exist. The team knows what to worry about but still reacts to intelligence manually.",
                    "trigger_to_next": "An analyst identifies a new campaign targeting your industry on Monday, but the detection rules to catch it are not deployed until Thursday because the intelligence-to-detection pipeline is manual.",
                    "discovery_questions": [
                        "When your intel team identifies a relevant threat, how long before your detection team has rules or signatures deployed?",
                        "Do you have a formal mapping between known adversary TTPs and your current detection coverage?",
                        "How do you prioritize which intelligence to act on first?"
                    ],
                    "talk_track": "You are in a strong position because you understand your threat landscape. The friction point we typically see at Stage 2 is the handoff between intelligence and operations. Pacific Health System had great threat briefs. Their intel team was producing weekly reports that accurately described the threats targeting healthcare. But the time from intelligence to deployed detection averaged 4.2 days. In those 4.2 days, they were aware of the threat but not protected against it. Moving to Stage 3 closes that loop automatically.",
                    "objection_reframes": [
                        {
                            "original_objection": "We have a good intel team that produces actionable briefs",
                            "readiness_reframe": "Good intel teams are rare and valuable. The question is how fast their insights become operational. Pacific Health System had one of the best CTI teams we have seen, and they still had a 4-day gap between identifying a relevant TTP and deploying detection for it. That is not an intel problem. It is a pipeline problem."
                        }
                    ],
                    "swipe_phrases": ["we know the threats but act on them too slowly", "our intelligence-to-action loop takes days", "the intel is there but the detection lags behind"]
                },
                {
                    "stage_number": 3,
                    "name": "Operationalized",
                    "description": "Intelligence automatically informs detection rules, hunting hypotheses, and defensive priorities. The loop from intelligence to protection is measured in hours, not days.",
                    "what_works": "New threat intelligence triggers automatic detection rule creation and deployment. Hunting hypotheses are generated from intelligence, not just gut feel. Mean time from intelligence to protection drops to 2-6 hours.",
                    "what_breaks": "Intelligence sharing with peers and ISACs is still manual and infrequent. The organization consumes intelligence well but contributes little back, limiting the ecosystem benefit.",
                    "trigger_to_next": "The organization realizes that their intelligence would be more valuable if combined with peer observations, but sharing mechanisms are ad hoc.",
                    "discovery_questions": [
                        "How much of your detection engineering is driven by threat intelligence versus ad hoc requests?",
                        "Do you contribute intelligence back to ISACs or peer organizations, or is it mostly one-directional?",
                        "How do you measure the effectiveness of your threat intelligence program?"
                    ],
                    "talk_track": "At this stage, your intelligence program is a force multiplier for detection and response. The next step is about ecosystem participation. Crestview Financial is a good example. They had a fully operationalized intel program, intelligence to detection in under 3 hours. But when they joined the FS-ISAC active sharing program, they got early warning on a credential stuffing campaign targeting regional banks 6 hours before it hit them. That early warning came from a peer, not a vendor feed. The organizations at Stage 4 treat intelligence as a two-way street.",
                    "objection_reframes": [
                        {
                            "original_objection": "Sharing intelligence exposes our vulnerabilities",
                            "readiness_reframe": "That concern comes up a lot. The FS-ISAC model anonymizes and sanitizes shared intelligence so you contribute TTPs and indicators without revealing your specific vulnerabilities. Crestview Financial's CISO said sharing actually improved their security posture because they got 6-hour early warning on targeted campaigns."
                        }
                    ],
                    "swipe_phrases": ["we should be getting more from our intelligence investment", "we want intel driving our detection, not the other way around"]
                },
                {
                    "stage_number": 4,
                    "name": "Collaborative",
                    "description": "Intelligence is bidirectional. The organization contributes to and benefits from community intelligence sharing. Defensive posture is informed by the collective observations of trusted peers.",
                    "what_works": "Early warning on targeted campaigns hours before they reach your environment. Collective defense with industry peers creates a multiplier effect. Intelligence ROI is measurable and demonstrable to leadership.",
                    "what_breaks": "Requires sustained investment in sharing relationships and trust-building. Regulatory and legal considerations around intelligence sharing vary by jurisdiction.",
                    "trigger_to_next": "This is the target state. Continuous improvement focuses on expanding trusted sharing circles and measuring the protective value of community intelligence.",
                    "discovery_questions": [
                        "How many trusted intelligence sharing relationships does your organization actively maintain?",
                        "Can you quantify the value your intelligence program delivers in terms of prevented incidents or reduced response time?",
                        "How does your leadership view the intelligence function: as a cost center or as a measurable risk reduction capability?"
                    ],
                    "talk_track": "The organizations operating here are getting 3-6 hours of early warning on targeted campaigns through peer sharing. The ROI is concrete. Crestview Financial calculated that community intelligence prevented an estimated $2.3M in potential losses in 2025 across four campaigns they got early warning on. Their board went from viewing CTI as a cost center to funding headcount expansion. Gartner's 2025 Security Operations report estimates that fewer than 15% of organizations operate at this level, but those that do have 40% lower breach costs.",
                    "objection_reframes": [
                        {
                            "original_objection": "We do not have the resources for an intelligence sharing program",
                            "readiness_reframe": "It does not require a large team. Crestview Financial has two analysts contributing to FS-ISAC and it takes about 4 hours per week. The return is disproportionate because you benefit from the observations of hundreds of peer organizations. It is the highest-leverage investment in their security program by their CISO's own measure."
                        }
                    ],
                    "swipe_phrases": ["we want to be part of the early warning network", "intelligence should be a two-way street", "our board wants measurable ROI from security"]
                }
            ]
        }
    ],
    "competitor_mapping": [
        {"competitor_name": "CrowdStrike", "dimension_id": "detection-coverage", "stage_number": 3, "evidence_summary": "Strong behavioral detection on endpoints but limited cross-domain correlation without Falcon LogScale", "confidence": "high"},
        {"competitor_name": "Palo Alto XSIAM", "dimension_id": "detection-coverage", "stage_number": 4, "evidence_summary": "Full autonomous SOC vision with XSIAM, though maturity varies by deployment", "confidence": "medium"},
        {"competitor_name": "Splunk", "dimension_id": "detection-coverage", "stage_number": 2, "evidence_summary": "Strong correlation engine but heavily rule-dependent, limited native behavioral detection", "confidence": "high"},
        {"competitor_name": "Microsoft Sentinel", "dimension_id": "detection-coverage", "stage_number": 3, "evidence_summary": "Behavioral detection improving rapidly via Copilot for Security, ecosystem advantage in Microsoft-heavy environments", "confidence": "medium"},
        {"competitor_name": "Recorded Future", "dimension_id": "threat-intelligence", "stage_number": 3, "evidence_summary": "Strong operationalized intelligence with automated detection rule generation", "confidence": "high"},
        {"competitor_name": "Mandiant", "dimension_id": "threat-intelligence", "stage_number": 4, "evidence_summary": "Industry-leading intelligence depth with active incident response data feeding intelligence", "confidence": "high"}
    ],
    "generation_metadata": {"signal_count": 47, "objection_count": 12, "swipe_phrase_count": 18}
}

# ============================================================
# DEVELOPER TOOLS
# ============================================================
sectors["developer-tools"] = {
    "title": "The Developer Workflow Maturity Model",
    "dimensions": [
        {
            "id": "dev-workflow",
            "label": "Development Workflow",
            "stages": [
                {
                    "stage_number": 1,
                    "name": "Manual",
                    "description": "Developers set up environments locally, deployment steps are documented in wikis (that may or may not be current), and onboarding takes 1-3 weeks.",
                    "what_works": "Experienced developers are highly productive in their own setups. Small teams move fast because they all know the tribal knowledge.",
                    "what_breaks": "Onboarding new developers takes 5-15 days (GitLab 2025 DevSecOps Survey). 'Works on my machine' issues consume 3.5 hours per developer per week on average (Spotify Platform Engineering report 2025). Critical deployment knowledge lives in 1-2 people's heads.",
                    "trigger_to_next": "A senior developer goes on vacation and deployment stalls because nobody else knows the manual steps. Or a new hire takes 3 weeks to make their first commit.",
                    "discovery_questions": [
                        "How long does it take a new developer to go from 'laptop in hand' to 'first PR merged' today?",
                        "If your most senior backend engineer left tomorrow, what deployment knowledge walks out the door?",
                        "How many hours per week does your team spend on environment configuration issues?"
                    ],
                    "talk_track": "Bolt Commerce told us their new hires were taking 12 days to make their first commit. Not because the developers were slow, but because the setup required 23 manual steps across 4 different wikis, two of which were outdated. After standardizing their dev environment with containerized workspaces, that dropped to 1.5 days. The 2025 Spotify Platform Engineering report found that developers at Stage 1 spend 3.5 hours per week on environment issues. That is 9% of their productive time just fighting their own tools.",
                    "objection_reframes": [
                        {
                            "original_objection": "We like giving developers freedom to choose their tools",
                            "readiness_reframe": "Developer freedom matters. Bolt Commerce kept tool choice but standardized the underlying environment. Their developers still use whatever editor or shell they prefer. The difference is that 'git clone, make dev' gets anyone productive in 20 minutes instead of following a 23-step wiki."
                        },
                        {
                            "original_objection": "Our onboarding is fine, it is just a complex codebase",
                            "readiness_reframe": "Complex codebases are real. But Bolt Commerce had a complex codebase too, 2.3M lines across 40 services. The 12-day onboarding was not about code complexity, it was about environment complexity. After fixing the environment, onboarding dropped to 1.5 days and code complexity became something developers learned on the job, not before they could run the app."
                        }
                    ],
                    "swipe_phrases": ["onboarding takes forever", "works on my machine", "our wikis are outdated", "only two people know how to deploy"]
                },
                {
                    "stage_number": 2,
                    "name": "Standardized",
                    "description": "Development environments are reproducible. CI/CD pipelines handle builds and deployments. Onboarding is measured in days, not weeks.",
                    "what_works": "Any developer can onboard in 1-3 days. Deployments are consistent and repeatable. CI catches issues before they reach production. The team can grow without proportionally increasing coordination overhead.",
                    "what_breaks": "Pipeline times grow as the codebase scales. Flaky tests erode trust in CI (Google's 2025 Engineering Productivity report found flaky tests are the #1 developer productivity complaint). Developers wait 15-30 minutes for feedback on their changes.",
                    "trigger_to_next": "CI pipeline time crosses 20 minutes and developers start batching changes to avoid waiting, which increases merge conflict rates and deployment risk.",
                    "discovery_questions": [
                        "What is your current CI pipeline time from push to green/red?",
                        "What percentage of your test failures are flaky (not related to the actual code change)?",
                        "How often do developers push changes and then context-switch while waiting for CI?"
                    ],
                    "talk_track": "Pipeline speed is where Stage 2 starts to hurt. NovaPay had a 28-minute CI pipeline and their developers were batching 3-4 changes per push to avoid the wait. That meant bigger PRs, more merge conflicts, and 2.4x higher revert rates. When they invested in test parallelization and smart caching, pipeline time dropped to 7 minutes. Their deploy frequency went from 3 times per week to 4 times per day. Google's engineering productivity research consistently shows that CI feedback time is the single biggest lever on developer velocity.",
                    "objection_reframes": [
                        {
                            "original_objection": "Our pipeline time is acceptable for our team size",
                            "readiness_reframe": "It might feel acceptable because developers have adapted. NovaPay's team said the same thing. When we measured it, developers were losing 47 minutes per day to CI-induced context switches. They had normalized it. The DORA 2025 report found that elite performers have CI feedback under 10 minutes. Not because they are lucky, but because they invested in it."
                        }
                    ],
                    "swipe_phrases": ["our pipelines are slow", "flaky tests are killing us", "developers batch changes to avoid CI waits", "we deploy less often than we should"]
                },
                {
                    "stage_number": 3,
                    "name": "Optimized",
                    "description": "Fast CI feedback (under 10 minutes), automated quality gates, and self-service infrastructure. Developers spend 85%+ of their time writing code, not fighting tooling.",
                    "what_works": "High deploy frequency (multiple times per day). Developer satisfaction scores are in the top quartile. The platform team enables rather than gates. Change failure rate is under 5%.",
                    "what_breaks": "Measuring developer productivity beyond DORA metrics is difficult. The platform team becomes a bottleneck for new capability requests. Self-service covers 80% of cases but the remaining 20% still requires tickets.",
                    "trigger_to_next": "The organization wants to measure the business impact of developer productivity, not just engineering metrics. Leadership asks 'how much faster are we shipping features?' and DORA metrics alone cannot answer that.",
                    "discovery_questions": [
                        "How do you measure whether your developer platform is actually making developers more productive?",
                        "What percentage of infrastructure requests can developers handle themselves versus filing a ticket?",
                        "When leadership asks about engineering productivity, what do you show them?"
                    ],
                    "talk_track": "You are in the top 20% of engineering organizations based on DORA metrics alone. The challenge now is connecting developer productivity to business outcomes. Meridian SaaS had elite DORA numbers but their CPO could not answer whether platform investments were actually shipping features faster. They started tracking 'idea to production' cycle time alongside DORA and found that while CI/CD was fast, planning and review stages added 6 days to every feature. That insight redirected their investment from pipeline optimization (which was already good) to review workflow automation (which was the actual bottleneck).",
                    "objection_reframes": [
                        {
                            "original_objection": "DORA metrics are enough for us",
                            "readiness_reframe": "DORA is the gold standard for delivery metrics. But Meridian SaaS had elite DORA scores and still could not answer their CPO's question about feature velocity. DORA measures the pipe, not the flow through it. The 2025 McKinsey Developer Productivity report found that organizations combining DORA with business-outcome metrics made 2.3x better investment decisions about their platform."
                        }
                    ],
                    "swipe_phrases": ["DORA metrics are great but leadership wants business impact", "we need to connect engineering metrics to revenue", "our platform is good but how do we prove it"]
                },
                {
                    "stage_number": 4,
                    "name": "Predictive",
                    "description": "Engineering productivity is measured end-to-end from idea to business impact. The platform team uses data to proactively identify and resolve bottlenecks before developers notice them.",
                    "what_works": "Proactive capacity planning based on leading indicators. Engineering investment decisions are data-driven and tied to business outcomes. Developer experience scores consistently above 80th percentile in industry benchmarks.",
                    "what_breaks": "Maintaining the data infrastructure for productivity measurement is itself an investment. Cultural resistance from developers who feel measured. Requires executive buy-in that engineering productivity is a strategic capability, not just a cost center.",
                    "trigger_to_next": "This is the target state. Continuous improvement focuses on expanding measurement coverage and tightening the feedback loop between business outcomes and engineering investment.",
                    "discovery_questions": [
                        "If you could know one thing about your engineering organization's productivity that you cannot measure today, what would it be?",
                        "How do you decide where to invest your next platform engineering dollar?",
                        "Does your CFO understand the ROI of your developer platform investment?"
                    ],
                    "talk_track": "The organizations here are a small group. Stripe, Spotify, and a handful of others that have made developer productivity a strategic function. What they share is the ability to answer the question 'if we invest $1M in developer tooling, what is the expected business impact?' with data, not guesses. ClearPath Fintech built this capability and used it to justify a $2M platform investment by showing it would reduce time-to-market for new payment features by 35%. Their CFO approved it in one meeting because the ROI model was credible. That is the difference between Stage 3 and Stage 4: your platform investment has a business case, not just an engineering one.",
                    "objection_reframes": [
                        {
                            "original_objection": "Measuring developer productivity is too hard and too political",
                            "readiness_reframe": "It can be political if done wrong. The key is measuring systems and workflows, not individuals. ClearPath Fintech measures pipeline efficiency, review cycle time, and environment provisioning speed. No individual productivity scores. Their developers actually appreciate it because the data proves that platform investment makes their lives better."
                        }
                    ],
                    "swipe_phrases": ["we need to justify platform investment to the CFO", "data-driven engineering decisions", "developer productivity as a strategic capability"]
                }
            ]
        }
    ],
    "competitor_mapping": [
        {"competitor_name": "GitHub", "dimension_id": "dev-workflow", "stage_number": 3, "evidence_summary": "Copilot and Actions provide strong Stage 3 capabilities, Codespaces addresses environment standardization", "confidence": "high"},
        {"competitor_name": "GitLab", "dimension_id": "dev-workflow", "stage_number": 3, "evidence_summary": "Full DevSecOps platform with strong CI/CD, weaker on developer experience measurement", "confidence": "high"},
        {"competitor_name": "Vercel", "dimension_id": "dev-workflow", "stage_number": 2, "evidence_summary": "Excellent deploy experience for frontend, limited scope beyond web applications", "confidence": "medium"},
        {"competitor_name": "Backstage (Spotify)", "dimension_id": "dev-workflow", "stage_number": 3, "evidence_summary": "Strong internal developer portal but requires significant customization investment", "confidence": "medium"}
    ],
    "generation_metadata": {"signal_count": 38, "objection_count": 8, "swipe_phrase_count": 14}
}

# ============================================================
# PRODUCT ANALYTICS
# ============================================================
sectors["product-analytics"] = {
    "title": "The Product Intelligence Maturity Model",
    "dimensions": [
        {
            "id": "data-foundation",
            "label": "Data Collection & Governance",
            "stages": [
                {
                    "stage_number": 1,
                    "name": "Reactive",
                    "description": "Analytics events are added when someone asks a question. No tracking plan, no governance. Data quality is unknown until someone finds a problem.",
                    "what_works": "You have some data and can answer basic questions about page views and feature adoption. Engineers add tracking quickly when product managers ask.",
                    "what_breaks": "30-40% of analytics queries return results that contradict other data sources (Amplitude 2025 Product Analytics Benchmark). Teams spend 2-3 hours per analysis just validating data before trusting it. Historical comparisons are unreliable because event definitions change without documentation.",
                    "trigger_to_next": "A product launch decision is delayed by two weeks because the team cannot agree on whether the A/B test data is trustworthy.",
                    "discovery_questions": [
                        "When a product manager asks a data question, how often does the answer require caveats about data quality?",
                        "How long does your team spend validating data before they trust an analysis?",
                        "Have you ever shipped a feature based on analytics data that later turned out to be wrong?"
                    ],
                    "talk_track": "PixelDrop told us their product team had a 'data trust problem.' Every analysis started with 2 hours of validation because event definitions had changed three times without anyone updating the tracking docs. They eventually shipped a pricing change based on analytics that undercounted enterprise usage by 40% because someone had renamed an event six months prior. That cost them an estimated $180K in the first quarter. The Amplitude 2025 benchmark found that organizations without a tracking plan have 30-40% data quality issues. Not because the tools are bad, but because nobody governs the data going in.",
                    "objection_reframes": [
                        {
                            "original_objection": "We track everything that matters already",
                            "readiness_reframe": "Tracking is one half. Trusting is the other. PixelDrop tracked everything too. The problem was that 'button_click' meant three different things depending on which engineer implemented it. The 2025 Amplitude benchmark found that organizations that say 'we track everything' have the highest rate of contradictory data. It is not a volume problem, it is a consistency problem."
                        }
                    ],
                    "swipe_phrases": ["we do not trust our data", "every analysis starts with data validation", "our tracking is a mess", "we can not compare data across quarters"]
                },
                {
                    "stage_number": 2,
                    "name": "Governed",
                    "description": "A tracking plan exists and is maintained. Event naming conventions are enforced. Data quality is monitored and issues are caught within hours, not months.",
                    "what_works": "Analysts trust the data and skip the 2-hour validation step. Historical comparisons work because event definitions are stable. New team members can understand the data model without tribal knowledge.",
                    "what_breaks": "Analysis is still analyst-dependent. Product managers cannot self-serve most questions. The analytics team becomes a bottleneck with a 3-5 day queue for ad hoc requests. Experimentation is limited to simple A/B tests with manual analysis.",
                    "trigger_to_next": "The analytics team's backlog exceeds 3 weeks and product managers start making decisions without data rather than waiting.",
                    "discovery_questions": [
                        "How long is the queue for an ad hoc analytics request right now?",
                        "What percentage of product managers can answer their own data questions without filing a request?",
                        "How many experiments did your team run last quarter, and how many of those were analyzed within a week?"
                    ],
                    "talk_track": "Clean data is the foundation, and you have built it. The bottleneck now is access. Crestline Health's analytics team had a 19-day backlog. Product managers told us they made about 60% of their decisions 'on instinct' because waiting for data was slower than just shipping and seeing what happened. When they invested in self-service dashboards and guided exploration tools, analyst-assisted requests dropped 55% and the PMs who previously avoided data became the heaviest users. Mixpanel's 2025 Product Benchmarks report found that organizations where PMs self-serve ship 40% more experiments per quarter.",
                    "objection_reframes": [
                        {
                            "original_objection": "Our analysts should be the ones doing analysis, not PMs",
                            "readiness_reframe": "Your analysts should be doing the hard analysis. Crestline Health's analysts went from spending 70% of their time on ad hoc 'how many users did X' queries to spending 70% on strategic analysis like retention modeling and pricing optimization. Self-service did not replace analysts. It freed them to do work that actually requires their skills."
                        }
                    ],
                    "swipe_phrases": ["our analytics team is a bottleneck", "PMs make decisions without data because the queue is too long", "we need self-service analytics"]
                },
                {
                    "stage_number": 3,
                    "name": "Self-Service",
                    "description": "Product managers and designers can answer 80%+ of their questions without analyst help. Experimentation is frequent and results are interpreted consistently across teams.",
                    "what_works": "Decisions are data-informed by default. Experiment velocity is 3-5x higher than Stage 2. The analytics team focuses on strategic projects (retention modeling, pricing optimization, cohort analysis) instead of ad hoc queries.",
                    "what_breaks": "Different teams draw different conclusions from the same data because there is no standardized framework for interpreting results. The organization has lots of data but struggles to synthesize it into a coherent product strategy. Metric definitions drift across teams.",
                    "trigger_to_next": "Two product teams run conflicting experiments because there is no system-level view of how features interact. Or leadership cannot reconcile different teams' metrics into a unified product health scorecard.",
                    "discovery_questions": [
                        "When two teams report conflicting results, how do you reconcile them?",
                        "Do you have a single source of truth for your core product metrics, or does each team define their own?",
                        "How do you ensure that individual feature experiments do not conflict with each other?"
                    ],
                    "talk_track": "You are in a strong spot. Most organizations never get here. The next challenge is synthesis. NovaTech had 12 product teams all running experiments independently. Q3 last year, two teams ran conflicting experiments on the same user segment without knowing it and the results were meaningless. Their VP of Product told us 'we have more data than ever and less clarity than ever.' The jump to Stage 4 is about connecting the dots across teams with a unified metrics framework and experiment coordination. The organizations doing this well report 25-30% better resource allocation because they stop investing in features that look good in isolation but conflict at the system level.",
                    "objection_reframes": [
                        {
                            "original_objection": "Each team should own their own metrics",
                            "readiness_reframe": "Team ownership is important. The issue is not who owns the metric, it is whether the metrics add up. NovaTech's teams each had great metrics. But their CEO could not get a straight answer on whether the product was getting healthier overall because there was no framework for how team-level metrics rolled up. Team ownership with shared definitions is the goal."
                        }
                    ],
                    "swipe_phrases": ["lots of data but no clarity", "teams run conflicting experiments", "we need a unified view of product health", "metrics do not add up across teams"]
                },
                {
                    "stage_number": 4,
                    "name": "Unified",
                    "description": "Product intelligence is system-level. A unified metrics framework connects team-level metrics to company outcomes. Experiment coordination prevents conflicts. Leadership has a real-time product health scorecard.",
                    "what_works": "Resource allocation is data-driven at the portfolio level. Conflicting experiments are caught before they run. Leadership trusts the product scorecard because it is built from governed, auditable data. The analytics function is a strategic partner, not a service desk.",
                    "what_breaks": "Maintaining the unified framework requires ongoing investment and cross-team alignment. Metric definitions need regular review as the product evolves. Political resistance when unified metrics reveal underperforming investments.",
                    "trigger_to_next": "This is the target state. Continuous improvement focuses on tightening the connection between product metrics and business outcomes.",
                    "discovery_questions": [
                        "If your CEO asked 'is our product getting healthier?' right now, could you answer with a single dashboard?",
                        "How do you ensure that metric definitions stay consistent as the product evolves?",
                        "Does your product team use data to decide where to invest next quarter, or is it primarily based on roadmap planning?"
                    ],
                    "talk_track": "The organizations here treat product intelligence as a strategic function, not a support function. Zenith SaaS built a unified product scorecard that their CEO reviews weekly. It connects feature adoption, retention, expansion revenue, and support burden into a single view. When they debated whether to invest in a new collaboration feature or improve onboarding, the scorecard showed that onboarding completion was the single biggest predictor of 12-month retention. The decision was obvious and it generated $4.2M in incremental ARR over 9 months. Before the scorecard, that decision would have been a political negotiation between two VPs.",
                    "objection_reframes": [
                        {
                            "original_objection": "We are not ready for that level of measurement maturity",
                            "readiness_reframe": "If you are at Stage 3, you have all the ingredients. Zenith SaaS built their unified scorecard in 6 weeks using data they already collected. It was not a new data infrastructure project. It was a framing exercise: which metrics matter at the company level, and how do team metrics roll up to them."
                        }
                    ],
                    "swipe_phrases": ["data-driven portfolio decisions", "product intelligence as a strategic function", "unified scorecard for leadership"]
                }
            ]
        }
    ],
    "competitor_mapping": [
        {"competitor_name": "Amplitude", "dimension_id": "data-foundation", "stage_number": 3, "evidence_summary": "Strong self-service analytics and governance tools, growing experiment coordination capabilities", "confidence": "high"},
        {"competitor_name": "Mixpanel", "dimension_id": "data-foundation", "stage_number": 2, "evidence_summary": "Good event analytics but weaker on governance and experiment coordination", "confidence": "high"},
        {"competitor_name": "LaunchDarkly", "dimension_id": "data-foundation", "stage_number": 2, "evidence_summary": "Strong feature flagging and experimentation, limited on analytics depth", "confidence": "medium"},
        {"competitor_name": "Heap", "dimension_id": "data-foundation", "stage_number": 2, "evidence_summary": "Auto-capture reduces governance burden but creates data volume challenges", "confidence": "medium"}
    ],
    "generation_metadata": {"signal_count": 32, "objection_count": 7, "swipe_phrase_count": 16}
}

# ============================================================
# SALES ENGAGEMENT
# ============================================================
sectors["sales-engagement"] = {
    "title": "The Outbound Sales Maturity Model",
    "dimensions": [
        {
            "id": "outreach-strategy",
            "label": "Outreach Strategy",
            "stages": [
                {
                    "stage_number": 1,
                    "name": "Volume-Based",
                    "description": "Outbound relies on high-volume, lightly personalized sequences. Success is measured by activity volume (emails sent, calls made) rather than quality of engagement.",
                    "what_works": "You generate meetings through sheer scale. With a large enough TAM and enough reps, the math works in the short term.",
                    "what_breaks": "Reply rates decline 15-20% year over year as buyers get more email (Outreach 2025 Benchmark Report). Domain reputation degrades from high-volume sends. Top-of-funnel looks healthy but conversion to qualified pipeline drops each quarter. You burn through your TAM faster than it replenishes.",
                    "trigger_to_next": "Reply rates drop below 2% and the team needs to double activity volume to maintain the same pipeline. Or a key domain gets flagged and deliverability drops 40% overnight.",
                    "discovery_questions": [
                        "What is your current reply rate on outbound sequences, and how has it trended over the last 6 months?",
                        "What percentage of your total addressable market have your reps already contacted at least once?",
                        "If you doubled your outbound volume tomorrow, do you believe it would double your qualified pipeline?"
                    ],
                    "talk_track": "Vantage Cloud was sending 45,000 outbound emails per month with a 1.3% reply rate. They kept adding SDRs to maintain pipeline, but each new SDR produced fewer meetings than the last because they were re-contacting the same accounts. Their CAC was climbing 22% quarter over quarter. When they shifted to Stage 2, segmenting by persona and pain point with real personalization, their volume dropped to 12,000 emails but their reply rate hit 8.4% and qualified pipeline actually increased 35%. The Outreach 2025 Benchmark found that personalized, segmented sequences outperform volume sequences by 4.2x on reply rate and 2.8x on meetings booked.",
                    "objection_reframes": [
                        {
                            "original_objection": "Volume works for us, we just need more leads",
                            "readiness_reframe": "It works until it does not. Vantage Cloud said the same thing when their reply rate was 2.5%. By the time it hit 1.3%, they had contacted 60% of their TAM and adding leads meant going further downmarket where conversion was even worse. The question is whether your reply rate trend is going up or down over the last 3 quarters."
                        },
                        {
                            "original_objection": "We do not have time to personalize at scale",
                            "readiness_reframe": "That is the Stage 1 trade-off: you trade quality for speed. Vantage Cloud's SDRs were spending 95% of their time on volume activities. When they restructured around segmented sequences with template personalization by persona, each SDR spent 30 minutes more per day on prep but booked 2.4x more meetings. Net productivity went up, not down."
                        }
                    ],
                    "swipe_phrases": ["reply rates are declining", "we are burning through our TAM", "more SDRs is not scaling linearly", "deliverability is becoming a problem"]
                },
                {
                    "stage_number": 2,
                    "name": "Segmented",
                    "description": "Outreach is segmented by persona, pain point, and buying stage. Sequences are tailored to each segment with relevant messaging and proof points.",
                    "what_works": "Reply rates 3-5x higher than volume-based approaches. Conversion to qualified pipeline improves because messaging resonates. SDR productivity increases because they are reaching interested buyers, not spraying into the void.",
                    "what_breaks": "Segmentation is manual and maintained by RevOps or marketing. When segments go stale (company changes, market shifts), performance degrades and nobody notices for 4-6 weeks. Multi-threading into accounts is still opportunistic, not systematic.",
                    "trigger_to_next": "A major deal is lost because the team was single-threaded into a champion who left the company. Or segment performance diverges significantly and the team cannot explain why.",
                    "discovery_questions": [
                        "How many buying personas do your outbound sequences target, and when were they last updated?",
                        "When you lose a deal, how often is it because you were single-threaded into one contact?",
                        "How do you detect when a previously high-performing segment starts underperforming?"
                    ],
                    "talk_track": "Segmentation is working for you, and that puts you ahead of most outbound teams. The pattern we see at Stage 2 is the single-thread problem. Relay Payments lost 3 enterprise deals worth a combined $680K in Q2 because their champion changed roles or left in each case. They had great segmentation but zero systematic multi-threading. When they moved to Stage 3, requiring 3+ contacts per target account with role-specific messaging, their win rate on $100K+ deals went from 18% to 31%. The Gartner 2025 B2B Buying report found that deals with 3+ engaged stakeholders are 2.4x more likely to close.",
                    "objection_reframes": [
                        {
                            "original_objection": "Multi-threading is hard because we only have one entry point per account",
                            "readiness_reframe": "That is common. Relay Payments had the same constraint. They started using warm referral sequences where the initial contact introduced them to other stakeholders. Their internal referral rate was 34% when they asked. Most organizations never ask because they treat multi-threading as cold outreach to additional contacts rather than warm navigation from existing ones."
                        }
                    ],
                    "swipe_phrases": ["we keep losing deals when champions leave", "single-threaded deals are our biggest risk", "segmentation is good but account penetration is shallow"]
                },
                {
                    "stage_number": 3,
                    "name": "Account-Based",
                    "description": "Outreach is orchestrated at the account level across multiple stakeholders. Sales and marketing coordinate touches to build consensus across the buying committee.",
                    "what_works": "Multi-threaded accounts close at 2-3x the rate of single-threaded ones. Deal velocity increases because you are building consensus in parallel, not sequentially. Pipeline is more resilient to champion departures.",
                    "what_breaks": "Account-based orchestration is resource-intensive and does not scale to hundreds of accounts per rep. The team struggles to identify which accounts deserve the investment. Signal data is limited, so account prioritization is based on firmographic fit rather than buying intent.",
                    "trigger_to_next": "The team is running strong ABM plays on 50 accounts but cannot figure out which of the 500 accounts in their territory deserve the same treatment. Firmographic scoring misses 40-60% of deals that close (Forrester 2025 B2B Intent Data Report).",
                    "discovery_questions": [
                        "How do you decide which accounts get the full ABM treatment versus a standard sequence?",
                        "What percentage of your closed-won deals came from accounts that were in your original target list?",
                        "Do you use intent data to prioritize accounts, and if so, how well does it predict actual opportunities?"
                    ],
                    "talk_track": "Account-based outreach is powerful and your win rates prove it. The constraint is always 'which accounts?' BlueStar Consulting was running ABM on 40 accounts per rep and closing at 3x their standard rate. But 35% of their closed-won revenue came from accounts that were not in their ABM list at all. They were missing in-market buyers because their account selection was based on firmographics, not intent. When they added intent signal scoring, their pipeline-to-close rate improved 28% because reps spent ABM resources on accounts that were actually in a buying cycle, not just accounts that looked good on paper.",
                    "objection_reframes": [
                        {
                            "original_objection": "We already do ABM, we do not need more tools",
                            "readiness_reframe": "Your ABM execution sounds strong. The question is account selection. BlueStar Consulting had great ABM plays and still missed 35% of their revenue because those accounts were not in their target list. Better execution on the wrong accounts is still a miss. Intent data does not replace ABM. It tells ABM where to aim."
                        }
                    ],
                    "swipe_phrases": ["ABM works but we can not do it for every account", "we need better signal on which accounts to prioritize", "firmographic scoring misses too many deals"]
                },
                {
                    "stage_number": 4,
                    "name": "Signal-Driven",
                    "description": "Account prioritization is driven by real-time intent signals, engagement data, and buying behavior. Outreach timing and messaging adapt based on where each account is in their buying journey.",
                    "what_works": "Reps engage accounts at the right time with the right message because signals indicate buying stage. Win rates on signal-prioritized accounts are 2-3x higher than firmographic-only targeting. Pipeline efficiency peaks because resources focus on accounts showing active buying behavior.",
                    "what_breaks": "Signal data quality varies significantly across providers. Requires ongoing calibration between signal scores and actual outcomes. Over-reliance on signals can create blind spots for accounts that buy without leaving digital signals.",
                    "trigger_to_next": "This is the target state. Continuous improvement focuses on signal quality, calibration against outcomes, and expanding the signal surface area.",
                    "discovery_questions": [
                        "If an account in your territory started researching your category today, how long before your reps would know about it?",
                        "How do you balance signal-driven prioritization with strategic account coverage?",
                        "Can you measure the correlation between your intent scores and actual closed-won revenue?"
                    ],
                    "talk_track": "The organizations here have solved the 'when' problem. Apex Industrial's reps get a signal score for every account in their territory, updated daily, that combines website engagement, content consumption, review site activity, and technographic changes. Their reps told us the hardest part of their job used to be figuring out who to call. Now the signal score tells them, and their connect-to-meeting rate is 3.2x higher than cold outreach because they are catching accounts in an active buying cycle. Forrester's 2025 B2B Intent Data Report found that signal-driven outbound produces 2.8x higher pipeline conversion than firmographic-only targeting. The ROI is not even close.",
                    "objection_reframes": [
                        {
                            "original_objection": "Intent data is noisy and unreliable",
                            "readiness_reframe": "Some providers, yes. Apex Industrial tested three intent data sources before finding one that correlated with closed-won at 0.72 (strong). The key is calibration against your actual outcomes, not trusting a vendor score at face value. They ran a 90-day pilot comparing signal-prioritized accounts against firmographic-only and the signal group converted at 2.8x. That was the data that justified the investment."
                        }
                    ],
                    "swipe_phrases": ["we need to know when accounts are in-market", "timing is everything in outbound", "signal-driven prioritization", "we want reps calling accounts that are actually buying"]
                }
            ]
        }
    ],
    "competitor_mapping": [
        {"competitor_name": "Outreach", "dimension_id": "outreach-strategy", "stage_number": 3, "evidence_summary": "Strong sequence and account-based orchestration, growing signal capabilities with Kaia integration", "confidence": "high"},
        {"competitor_name": "Salesloft", "dimension_id": "outreach-strategy", "stage_number": 2, "evidence_summary": "Solid segmented sequencing, weaker on account-level orchestration post-Vista acquisition", "confidence": "medium"},
        {"competitor_name": "Apollo", "dimension_id": "outreach-strategy", "stage_number": 2, "evidence_summary": "Best-in-class for volume-to-segmented transition, limited enterprise ABM capabilities", "confidence": "high"},
        {"competitor_name": "6sense", "dimension_id": "outreach-strategy", "stage_number": 4, "evidence_summary": "Category leader in intent data and signal-driven prioritization", "confidence": "high"}
    ],
    "generation_metadata": {"signal_count": 29, "objection_count": 9, "swipe_phrase_count": 15}
}

# ============================================================
# AI/ML PLATFORMS
# ============================================================
sectors["ai-ml-platforms"] = {
    "title": "The ML Operations Maturity Model",
    "dimensions": [
        {
            "id": "model-lifecycle",
            "label": "Model Lifecycle Management",
            "stages": [
                {
                    "stage_number": 1,
                    "name": "Notebook-Driven",
                    "description": "Models are developed in notebooks and deployed through manual handoffs to engineering. No standardized path from experiment to production.",
                    "what_works": "Data scientists can experiment freely and iterate quickly. Notebooks are a great exploration tool for early-stage model development.",
                    "what_breaks": "Deploying a model requires an engineer to rewrite notebook code into production-quality services. This takes 2-8 weeks per model (Algorithmia 2025 MLOps Report). 87% of ML models never reach production (Gartner 2025). Model versioning is ad hoc, and reproducing a training run from 3 months ago is effectively impossible.",
                    "trigger_to_next": "A model that performed well in notebooks degrades in production because the feature engineering pipeline drifts from the training pipeline. Or a regulatory audit asks 'how was this model trained?' and nobody can reproduce the answer.",
                    "discovery_questions": [
                        "How long does it take to go from a validated notebook model to a production deployment today?",
                        "Can you reproduce any training run from the last 6 months if asked?",
                        "What percentage of your trained models actually make it to production?"
                    ],
                    "talk_track": "QuantaLend had 14 data scientists and 3 models in production. Their ML engineers told us the deployment process was 'translating notebooks into Python services, line by line, praying nothing breaks.' Each deployment took 4-6 weeks and introduced subtle bugs where feature engineering in production diverged from training. The model that approved their largest loan portfolio had a silent data skew that went undetected for 7 weeks because there was no monitoring. The Algorithmia 2025 MLOps Report found that the average model takes 31 days to deploy manually. That is not a data science problem. It is an infrastructure problem.",
                    "objection_reframes": [
                        {
                            "original_objection": "Our data scientists prefer notebooks for flexibility",
                            "readiness_reframe": "Notebooks should stay. QuantaLend's data scientists still use notebooks for all experimentation. The change was automating the path from a validated notebook to a production service so it takes hours, not weeks, and the feature engineering is guaranteed to be identical. Their data scientists are more productive because they spend time on modeling, not on production deployment firefighting."
                        },
                        {
                            "original_objection": "We only have a few models so the manual process is fine",
                            "readiness_reframe": "That is where QuantaLend started too. Three models deployed manually. But when the business asked for 8 more, the 4-6 week deployment cycle per model meant the ML team became a bottleneck. The manual process scales linearly with headcount. An automated pipeline scales with compute."
                        }
                    ],
                    "swipe_phrases": ["deploying a model takes weeks", "our ML engineers spend all their time on deployment", "we can not reproduce training runs", "most of our models never make it to production"]
                },
                {
                    "stage_number": 2,
                    "name": "Pipeline-Based",
                    "description": "Model training and deployment follow standardized pipelines. Experiment tracking is systematic. Models go from development to production in days, not weeks.",
                    "what_works": "Deployment time drops from weeks to days. Experiment tracking allows reproducing any training run. Feature engineering is shared between training and inference, eliminating skew. Data scientists deploy their own models without ML engineering bottlenecks.",
                    "what_breaks": "Models are deployed and forgotten. No systematic monitoring for data drift, concept drift, or performance degradation. The team finds out a model is underperforming when a customer complains, not when the data shifts. Retraining is manual and triggered by incidents, not by data.",
                    "trigger_to_next": "A production model's accuracy degrades 15% over 3 months before anyone notices. Or a data pipeline change upstream silently changes the distribution of a key feature.",
                    "discovery_questions": [
                        "How do you know when a production model's performance is degrading?",
                        "When was the last time you retrained each production model, and what triggered it?",
                        "If a key data source changed its schema or distribution tomorrow, how long before your models would be affected and you would know about it?"
                    ],
                    "talk_track": "Standardized pipelines are a major achievement. You have solved the deployment problem that blocks 87% of ML organizations (per Gartner). The next challenge is the silent failure problem. Prism Analytics had 22 models in production running on automated pipelines. Their fraud detection model degraded from 94% precision to 71% over 8 weeks because a data source changed its format. Nobody noticed until false positive rates hit customer-facing thresholds. The loss was $340K in chargebacks that should have been caught. The 2025 Google MLOps Whitepaper found that models without automated monitoring degrade by an average of 8-12% per quarter. Not because the model is bad, but because the world changes.",
                    "objection_reframes": [
                        {
                            "original_objection": "We check model performance regularly",
                            "readiness_reframe": "Regular checks are better than nothing. But Prism Analytics checked monthly and still missed an 8-week degradation. The issue is that monthly is too slow when data distributions can shift in days. Automated monitoring that catches drift within hours and triggers retraining automatically is the difference between a $340K loss and a $0 loss."
                        }
                    ],
                    "swipe_phrases": ["we deployed our models and moved on", "we do not know when models degrade", "retraining is manual and reactive", "model monitoring is on the backlog"]
                },
                {
                    "stage_number": 3,
                    "name": "Monitored",
                    "description": "Production models are continuously monitored for data drift, concept drift, and performance degradation. Retraining is triggered automatically when drift exceeds thresholds.",
                    "what_works": "Model degradation is caught within hours, not weeks. Automated retraining keeps models performing at peak. The team is proactive about model health instead of reactive. Trust in ML predictions increases across the organization.",
                    "what_breaks": "Models are optimized independently without understanding how they interact. In organizations with 20+ models, changes to one model's predictions can cascade through downstream systems. Cost optimization of training and inference is ad hoc.",
                    "trigger_to_next": "An improvement to one model causes unexpected behavior in a downstream model that uses its predictions as input. Or GPU costs grow 3x year over year without proportional business value increase.",
                    "discovery_questions": [
                        "How many of your models consume the outputs of other models?",
                        "Do you track the total cost of ownership for each model, including compute, storage, and maintenance?",
                        "If you improved one model's predictions, could you predict the downstream effects on other systems?"
                    ],
                    "talk_track": "Continuous monitoring is the bar for production-grade ML and you have cleared it. The next frontier is system-level thinking. Cascade Logistics had 28 models, 6 of which consumed the outputs of other models. When they improved their demand forecasting model (great in isolation), it changed the input distribution for their inventory optimization model, which started over-ordering by 12%. It took them 3 weeks to trace the issue because they monitored each model independently. The jump to Stage 4 is about understanding the ML system as a whole, dependencies, costs, and impact.",
                    "objection_reframes": [
                        {
                            "original_objection": "Each team should own their own models",
                            "readiness_reframe": "Team ownership is right for development and maintenance. But when Model A's output feeds Model B's input across teams, someone needs to own the interface. Cascade Logistics kept team ownership but added a lightweight ML platform team that tracked cross-model dependencies. Two engineers, saved them from three more cascade incidents in the first quarter."
                        }
                    ],
                    "swipe_phrases": ["our models interact in ways we do not fully understand", "GPU costs are growing faster than model value", "we need a system-level view of our ML portfolio"]
                },
                {
                    "stage_number": 4,
                    "name": "Optimized",
                    "description": "The ML portfolio is managed as a system. Model dependencies are tracked, costs are optimized, and business impact is measured per model. The organization can answer 'what is the ROI of our ML investment?'",
                    "what_works": "Each model has a measurable business impact. Total ML cost is optimized across the portfolio. Cross-model dependencies are understood and managed. Leadership can make informed investment decisions about which models deserve more resources.",
                    "what_breaks": "Requires significant investment in tooling and process. Cultural shift from 'build more models' to 'maximize model ROI.' Not every organization needs this level of maturity for every model.",
                    "trigger_to_next": "This is the target state. Continuous improvement focuses on expanding the portfolio, improving cost efficiency, and tightening the connection between model performance and business outcomes.",
                    "discovery_questions": [
                        "Can you tell me the business impact of each model in your portfolio in dollar terms?",
                        "How do you decide whether to build a new model versus improve an existing one?",
                        "What is your total cost of ML operations, and how does it compare to the business value generated?"
                    ],
                    "talk_track": "The organizations here can answer 'what is the ROI of our ML investment?' with data. Horizon Insurance manages 45 models and tracks each one's contribution to business outcomes. When their CEO asked for a 15% reduction in ML spending, instead of cutting headcount, they identified 8 models where the maintenance cost exceeded the business value and retired them. The remaining 37 models were reoptimized, total costs dropped 22% and business impact actually increased because resources concentrated on high-value models. The 2025 McKinsey AI Report found that organizations managing ML as a portfolio generate 2.5x more value per dollar of ML investment than those managing models individually.",
                    "objection_reframes": [
                        {
                            "original_objection": "We do not have enough models to need portfolio management",
                            "readiness_reframe": "The threshold is lower than you think. Horizon Insurance started portfolio management at 12 models and found 3 that cost more than they generated. If you have 10+ models, the odds of at least one being a net negative investment are high. Better to know early."
                        }
                    ],
                    "swipe_phrases": ["ML ROI is unmeasurable right now", "we build models but do not track their value", "GPU costs are out of control", "we need to treat ML as a portfolio, not a collection of projects"]
                }
            ]
        }
    ],
    "competitor_mapping": [
        {"competitor_name": "Databricks", "dimension_id": "model-lifecycle", "stage_number": 3, "evidence_summary": "MLflow and Unity Catalog provide strong pipeline and monitoring, weaker on portfolio-level optimization", "confidence": "high"},
        {"competitor_name": "AWS SageMaker", "dimension_id": "model-lifecycle", "stage_number": 3, "evidence_summary": "End-to-end MLOps with Model Monitor, but lock-in concerns and complexity at scale", "confidence": "high"},
        {"competitor_name": "Weights & Biases", "dimension_id": "model-lifecycle", "stage_number": 2, "evidence_summary": "Best-in-class experiment tracking but limited production monitoring and deployment", "confidence": "high"},
        {"competitor_name": "MLflow (OSS)", "dimension_id": "model-lifecycle", "stage_number": 2, "evidence_summary": "Strong experiment tracking and model registry, requires significant engineering to operationalize", "confidence": "medium"}
    ],
    "generation_metadata": {"signal_count": 25, "objection_count": 8, "swipe_phrase_count": 13}
}

# ============================================================
# DEVOPS OBSERVABILITY
# ============================================================
sectors["devops-observability"] = {
    "title": "The Observability Maturity Model",
    "dimensions": [
        {
            "id": "signal-coverage",
            "label": "Signal Coverage & Correlation",
            "stages": [
                {
                    "stage_number": 1,
                    "name": "Infrastructure-Focused",
                    "description": "Monitoring covers infrastructure metrics (CPU, memory, disk) and basic uptime. Application-level observability is limited to logs. Troubleshooting requires SSH-ing into boxes and manually correlating timestamps.",
                    "what_works": "You know when servers are down or resources are exhausted. Infrastructure alerts catch the obvious failures. Your team has deep knowledge of the physical and virtual infrastructure.",
                    "what_breaks": "Application-level issues that do not manifest as infrastructure problems go undetected. Mean time to resolution (MTTR) for distributed system issues is 2-8 hours because tracing a request across services is manual. The 2025 Chronosphere Observability Report found that 68% of incidents in microservices architectures have no infrastructure-level signal.",
                    "trigger_to_next": "A customer-reported issue takes 6 hours to resolve because the team has to manually correlate logs from 8 different services. Infrastructure metrics showed everything green the entire time.",
                    "discovery_questions": [
                        "When a user reports that a feature is slow, how long does it take to identify which service is the bottleneck?",
                        "Can you trace a single user request across every service it touches?",
                        "What percentage of your incidents are detected by monitoring versus reported by customers?"
                    ],
                    "talk_track": "CloudForge had comprehensive infrastructure monitoring across their 120 Kubernetes pods. Every dashboard was green when a customer reported that checkout was taking 15 seconds. It took their team 5.5 hours to find the issue: a database connection pool exhaustion in a service three hops downstream. They had logs for each service but no way to trace the request path. After implementing distributed tracing, their MTTR for similar issues dropped from hours to 18 minutes. Chronosphere's 2025 report found that 68% of incidents in microservices have zero infrastructure-level signals. If you are only watching infrastructure, you are blind to the majority of your issues.",
                    "objection_reframes": [
                        {
                            "original_objection": "We monitor all our infrastructure metrics already",
                            "readiness_reframe": "Infrastructure monitoring is necessary and you should keep it. The gap is application-level observability. CloudForge had 400+ infrastructure dashboards and still needed 5.5 hours to find a downstream connection pool issue because they could not trace a request across services. 68% of microservices incidents have no infrastructure signal at all."
                        },
                        {
                            "original_objection": "We cannot afford another observability platform on top of what we have",
                            "readiness_reframe": "CloudForge thought the same thing. They calculated that their top 10 incidents in Q3 cost $430K in engineering time and customer impact. After implementing distributed tracing for $8K/month, their Q4 incident cost dropped to $95K. The tool paid for itself 3.5x over in one quarter."
                        }
                    ],
                    "swipe_phrases": ["we can not trace requests across services", "troubleshooting takes hours", "dashboards are green but users say it is slow", "we find issues when customers complain"]
                },
                {
                    "stage_number": 2,
                    "name": "Three-Pillar",
                    "description": "Logs, metrics, and traces are collected and accessible. Distributed tracing enables request-level visibility across services. Troubleshooting starts with the trace, not with guesswork.",
                    "what_works": "MTTR drops 60-80% for distributed system issues because traces show the request path. Teams can identify the exact service and span where latency or errors originate. On-call engineers can resolve most issues without waking up the service owner.",
                    "what_breaks": "The three pillars exist but are not connected. Jumping from a trace to the relevant logs to the infrastructure metrics requires switching between tools and manually correlating. Data volume grows faster than budgets. Organizations at Stage 2 typically spend 15-25% of their cloud bill on observability (Datadog 2025 Container Report).",
                    "trigger_to_next": "Observability costs are growing 40%+ year over year. The team spends 20 minutes per incident just navigating between tools to correlate signals. Or a cost optimization initiative cuts observability data retention and the next incident requires data that was already deleted.",
                    "discovery_questions": [
                        "When an alert fires, how many tools does the on-call engineer open before they understand the issue?",
                        "What percentage of your cloud bill goes to observability tooling and data storage?",
                        "Can you go from an alert to the relevant trace to the relevant log line in under 2 minutes?"
                    ],
                    "talk_track": "Having all three pillars is where most teams plateau, and it is a huge improvement over Stage 1. The friction is the gaps between them. NexGen Payments had Datadog for metrics, Jaeger for traces, and ELK for logs. When an alert fired, their on-call engineer opened 3 tabs, searched for the trace ID, then searched for the log line. That context-switching added 15-20 minutes to every incident. Their observability bill was also 22% of their cloud spend and growing at 45% year over year because they were storing everything at full resolution. After correlating their signals into a unified experience and implementing smart sampling, incident context-switch time dropped to under 2 minutes and their observability bill dropped 35%.",
                    "objection_reframes": [
                        {
                            "original_objection": "We already have logs, metrics, and traces, we are fine",
                            "readiness_reframe": "Having the data is the prerequisite. Using it efficiently is the next step. NexGen Payments had all three and still lost 15-20 minutes per incident switching between them. Their on-call satisfaction scores were in the bottom quartile because every incident felt like detective work across disconnected tools. Correlation is not a nice-to-have. It is the difference between 20-minute and 2-minute time-to-context."
                        }
                    ],
                    "swipe_phrases": ["too many observability tools", "switching between dashboards wastes time during incidents", "our observability costs are out of control", "we have all the data but it takes too long to find what we need"]
                },
                {
                    "stage_number": 3,
                    "name": "Correlated",
                    "description": "Signals are connected: clicking from a metric anomaly leads directly to the relevant traces and logs. Smart sampling reduces data volume without losing fidelity. Alert fatigue is managed through intelligent grouping and deduplication.",
                    "what_works": "Time-to-context during incidents drops to under 2 minutes. Observability costs stabilize or decrease because smart sampling reduces data volume by 60-80% for routine traffic. On-call engineer satisfaction improves. Alert fatigue decreases because related alerts are grouped into incidents.",
                    "what_breaks": "Observability is still reactive: you see problems after they happen. Proactive identification of emerging issues before they impact users requires predictive capabilities that static dashboards and thresholds do not provide. SLO-based alerting is immature or nonexistent.",
                    "trigger_to_next": "The team is tired of reacting to incidents that could have been predicted from early signals. Or leadership asks for SLOs and the team realizes their alerting is based on arbitrary thresholds, not user-facing reliability targets.",
                    "discovery_questions": [
                        "Do you have SLOs defined for your critical services, and do your alerts fire based on error budget consumption?",
                        "What percentage of your incidents could have been predicted from early signals that were visible but not alerted on?",
                        "How do you distinguish between a problem that will self-resolve and one that is going to escalate?"
                    ],
                    "talk_track": "Correlated observability is a competitive advantage. Most teams never get here. The next evolution is proactive. StackPath had correlated signals and a 90-second time-to-context. But they reviewed their last 50 incidents and found that 62% had precursor signals visible 15-45 minutes before impact. A gradual latency increase, a growing queue depth, an error rate ticking up from 0.1% to 0.3%. Those signals were in the data but nobody was looking because alerts only fired at hard thresholds. When they moved to SLO-based alerting with error budget burn-rate detection, they caught 40% of issues before user impact. Google's SRE practices call this 'burning through error budget' and it is the foundation of Stage 4.",
                    "objection_reframes": [
                        {
                            "original_objection": "SLOs feel like overhead for our team size",
                            "readiness_reframe": "StackPath had 6 engineers and 12 services. They defined SLOs for their 4 most critical services in 2 days. It is not overhead. It is answering the question 'are our users happy?' with a number instead of a feeling. Their on-call alerts dropped 45% because SLO-based alerting ignores noise that does not affect user experience."
                        }
                    ],
                    "swipe_phrases": ["we react to incidents instead of preventing them", "our alerting is threshold-based guesswork", "we need SLOs but do not know where to start", "early warning signals exist but we do not catch them"]
                },
                {
                    "stage_number": 4,
                    "name": "Predictive",
                    "description": "Observability is proactive. SLO-based alerting catches issues before user impact. ML-driven anomaly detection identifies emerging problems from early signals. The team spends more time preventing incidents than resolving them.",
                    "what_works": "40-60% of potential incidents are caught before user impact. Error budget management provides a shared language between engineering and product for reliability trade-offs. Incident frequency decreases quarter over quarter. On-call burden is sustainable and engineer retention improves.",
                    "what_breaks": "Predictive models require tuning and generate false positives during the first 30-60 days. Requires cultural adoption of SLOs as the primary reliability metric. Leadership must accept that error budgets sometimes mean slowing down feature development.",
                    "trigger_to_next": "This is the target state. Continuous improvement focuses on expanding SLO coverage, improving anomaly detection accuracy, and tightening the feedback loop between reliability and feature velocity.",
                    "discovery_questions": [
                        "What would it mean for your business if you caught 40% of incidents before users noticed?",
                        "How does your team currently balance feature velocity with reliability?",
                        "What does your on-call rotation look like, and how does it affect engineer retention?"
                    ],
                    "talk_track": "The organizations here have flipped the equation from reactive to proactive. VaultEdge reduced their user-facing incidents by 52% in 6 months after implementing SLO-based alerting with error budget burn-rate detection. Their on-call pages dropped from an average of 14 per week to 5, and their engineer retention improved because on-call stopped being a dreaded rotation. The New Relic 2025 Observability Forecast found that organizations with mature SLO practices have 43% fewer customer-reported incidents. The ROI is not just operational. VaultEdge's CTO told us that reduced incident burden freed up 30% more engineering time for feature development. They shipped faster by investing in reliability, not despite it.",
                    "objection_reframes": [
                        {
                            "original_objection": "We do not have the ML expertise for predictive observability",
                            "readiness_reframe": "You do not need it in-house. VaultEdge does not have ML engineers on their platform team. They use built-in anomaly detection from their observability platform and configure sensitivity per service. The ML is a commodity at this point. The hard part is defining good SLOs and establishing the culture of error budget management. That is a process investment, not a technology one."
                        }
                    ],
                    "swipe_phrases": ["prevent incidents before users notice", "SLOs as the shared reliability language", "on-call is unsustainable", "invest in reliability to ship faster"]
                }
            ]
        }
    ],
    "competitor_mapping": [
        {"competitor_name": "Datadog", "dimension_id": "signal-coverage", "stage_number": 3, "evidence_summary": "Strong three-pillar correlation with Watchdog anomaly detection, aggressive pricing drives observability cost concerns", "confidence": "high"},
        {"competitor_name": "Grafana Labs", "dimension_id": "signal-coverage", "stage_number": 2, "evidence_summary": "Open-source ecosystem (Loki, Tempo, Mimir) provides excellent three-pillar coverage, correlation requires more manual setup", "confidence": "high"},
        {"competitor_name": "New Relic", "dimension_id": "signal-coverage", "stage_number": 3, "evidence_summary": "Unified platform with strong correlation, competitive consumption pricing model", "confidence": "high"},
        {"competitor_name": "Honeycomb", "dimension_id": "signal-coverage", "stage_number": 3, "evidence_summary": "Event-driven approach excels at debugging novel issues, smaller ecosystem than competitors", "confidence": "medium"}
    ],
    "generation_metadata": {"signal_count": 34, "objection_count": 9, "swipe_phrase_count": 16}
}


# ============================================================
# BUILD SQL
# ============================================================

def escape(s):
    """Escape single quotes for PostgreSQL"""
    return s.replace("'", "''")

def build_sql(sector_slug, data):
    content_json = json.dumps(data, ensure_ascii=False)
    content_md = build_markdown(data)

    dim_count = len(data["dimensions"])

    return f"""
INSERT INTO demo.maturity_model_versions
  (sector_slug, week_start, week_end, content_json, content_md, included_signal_ids, dimension_count)
VALUES (
  '{escape(sector_slug)}',
  '{week_start}',
  '{week_end}',
  '{escape(content_json)}'::jsonb,
  '{escape(content_md)}',
  '[]'::jsonb,
  {dim_count}
)
ON CONFLICT (sector_slug, week_start, week_end)
DO UPDATE SET
  content_json = EXCLUDED.content_json,
  content_md = EXCLUDED.content_md,
  dimension_count = EXCLUDED.dimension_count;
"""

def build_markdown(data):
    lines = [f"# {data['title']}", ""]
    for dim in data["dimensions"]:
        lines.append(f"## {dim['label']}")
        lines.append("")
        for stage in dim["stages"]:
            lines.append(f"### Stage {stage['stage_number']}: {stage['name']}")
            lines.append(f"{stage['description']}")
            lines.append("")
            lines.append(f"**What Works:** {stage['what_works']}")
            lines.append(f"**What Breaks:** {stage['what_breaks']}")
            lines.append("")
            if stage.get("trigger_to_next"):
                lines.append(f"**Trigger to Next Stage:** {stage['trigger_to_next']}")
                lines.append("")
            if stage.get("discovery_questions"):
                lines.append("**Discovery Questions:**")
                for q in stage["discovery_questions"]:
                    lines.append(f"- {q}")
                lines.append("")
            if stage.get("talk_track"):
                lines.append(f"**Talk Track:** {stage['talk_track']}")
                lines.append("")
            if stage.get("objection_reframes"):
                lines.append("**Objection Reframes:**")
                for r in stage["objection_reframes"]:
                    lines.append(f'- "{r["original_objection"]}" -> {r["readiness_reframe"]}')
                lines.append("")
            if stage.get("swipe_phrases"):
                lines.append("**Buyer Language:** " + ", ".join(f'"{p}"' for p in stage["swipe_phrases"]))
                lines.append("")
    return "\n".join(lines)


# Generate full SQL
sql_parts = ["-- Reseed maturity model demo data with authentic content\n"]
sql_parts.append("BEGIN;\n")

for slug, data in sectors.items():
    sql_parts.append(f"-- {slug}")
    sql_parts.append(build_sql(slug, data))

sql_parts.append("COMMIT;\n")

full_sql = "\n".join(sql_parts)

with open("/Users/victor/60_Day_Shipping/messaging-tracker/scripts/reseed_maturity.sql", "w") as f:
    f.write(full_sql)

print(f"SQL generated: {len(full_sql)} chars")
print(f"Sectors: {list(sectors.keys())}")
