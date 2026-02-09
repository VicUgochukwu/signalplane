-- Add market_winners to cybersecurity latest packet
UPDATE demo.packets
SET market_winners = $${
  "proven": [
    {
      "pattern_label": "AI-Powered SOC Automation",
      "category": "positioning",
      "what_changed": "Leading with AI-driven autonomous threat detection in hero messaging instead of traditional endpoint protection",
      "where_seen": ["CrowdStrike", "SentinelOne"],
      "survival_weeks": 12,
      "propagation_count": 5,
      "why_it_matters": "CISOs are under pressure to reduce SOC headcount costs while maintaining 24/7 coverage. AI automation is the answer they are buying.",
      "implementation_guidance": "Lead with SOC automation ROI metrics. Show before/after analyst workload reduction. Quantify MTTR improvement."
    },
    {
      "pattern_label": "Platform Consolidation Savings",
      "category": "packaging",
      "what_changed": "Highlighting total tool count reduction and TCO savings as primary value prop instead of individual feature superiority",
      "where_seen": ["Palo Alto Networks", "CrowdStrike", "Fortinet"],
      "survival_weeks": 8,
      "propagation_count": 4,
      "why_it_matters": "Enterprise security teams average 76 tools. Budget pressure is forcing consolidation. Vendors who enable this win.",
      "implementation_guidance": "Create a tool consolidation calculator. Show which specific tools your platform replaces. Quantify savings."
    }
  ],
  "emerging": [
    {
      "pattern_label": "Identity-First Security Narrative",
      "category": "positioning",
      "what_changed": "Shifting from network perimeter to identity perimeter as the core security story",
      "where_seen": ["Okta", "CrowdStrike"],
      "survival_weeks": 4,
      "propagation_count": 3,
      "why_it_matters": "With cloud and remote work, network boundaries are gone. Identity is the new control point.",
      "implementation_guidance": "Develop identity security messaging. Create content connecting identity verification to threat prevention."
    },
    {
      "pattern_label": "Real-Time Compliance Dashboards",
      "category": "conversion",
      "what_changed": "Adding live compliance posture dashboards to trial experience and demo flows",
      "where_seen": ["Wiz", "Lacework"],
      "survival_weeks": 3,
      "propagation_count": 2,
      "why_it_matters": "Compliance visibility during evaluation accelerates procurement approval. CISOs can show immediate value to auditors.",
      "implementation_guidance": "Add compliance posture visualization to demo environment. Show real-time compliance status during sales presentations."
    }
  ]
}$$::jsonb
WHERE sector_slug = 'cybersecurity' AND week_start = '2026-02-02';

-- Add market_winners to product-analytics latest packet
UPDATE demo.packets
SET market_winners = $${
  "proven": [
    {
      "pattern_label": "Warehouse-Native as Default",
      "category": "packaging",
      "what_changed": "Making warehouse-native mode the default setup path instead of an add-on, reducing perceived setup complexity",
      "where_seen": ["Mixpanel", "Amplitude"],
      "survival_weeks": 10,
      "propagation_count": 4,
      "why_it_matters": "Data teams no longer accept data duplication. Warehouse-native is becoming table stakes for enterprise evaluation.",
      "implementation_guidance": "Make warehouse-native your primary setup flow. Remove ETL-based setup as the default. Show time-to-first-insight metrics."
    },
    {
      "pattern_label": "Product-Led Free Tier Expansion",
      "category": "conversion",
      "what_changed": "Dramatically expanding free tier limits to capture developer adoption before enterprise conversion",
      "where_seen": ["Mixpanel", "PostHog", "Amplitude"],
      "survival_weeks": 8,
      "propagation_count": 5,
      "why_it_matters": "Developer adoption drives enterprise deals. Free tier generosity creates switching costs before procurement even starts.",
      "implementation_guidance": "Evaluate free tier against Mixpanel 100M events. Consider matching or exceeding. Track free-to-paid conversion rate by company size."
    }
  ],
  "emerging": [
    {
      "pattern_label": "AI Insights in Onboarding",
      "category": "conversion",
      "what_changed": "Showing AI-generated product insights during initial setup to demonstrate value before full integration",
      "where_seen": ["Amplitude", "Heap"],
      "survival_weeks": 3,
      "propagation_count": 2,
      "why_it_matters": "First-session insights reduce time-to-value from days to minutes. Dramatically improves trial conversion.",
      "implementation_guidance": "Build an AI insights preview that works with sample data during onboarding. Show what their analytics could look like."
    },
    {
      "pattern_label": "Privacy-First Positioning",
      "category": "positioning",
      "what_changed": "Leading with GDPR/CCPA compliance as a feature rather than a checkbox, targeting EU market expansion",
      "where_seen": ["Plausible", "Fathom", "PostHog"],
      "survival_weeks": 6,
      "propagation_count": 3,
      "why_it_matters": "EU market growing 40% YoY. Privacy-first vendors winning deals that traditional analytics vendors lose to compliance concerns.",
      "implementation_guidance": "Create privacy-first landing page for EU market. Add compliance certifications to pricing page. Offer EU-hosted option."
    }
  ]
}$$::jsonb
WHERE sector_slug = 'product-analytics' AND week_start = '2026-02-02';

-- Verify
SELECT sector_slug, packet_title, market_winners IS NOT NULL as has_winners
FROM demo.packets
WHERE week_start = '2026-02-02'
ORDER BY sector_slug;
