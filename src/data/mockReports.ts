import { IntelPacket } from '@/types/report';

export const mockReports: IntelPacket[] = [
  {
    id: 'pkt-001',
    week_start: '2025-02-03',
    week_end: '2025-02-09',
    packet_title: 'Week of Feb 3: AI Repositioning Accelerates Across DevOps',
    exec_summary: [
      'GitLab completes full AI-native rebrand: homepage now leads with "AI-Powered DevSecOps Platform"',
      'CircleCI introduces new Scale tier at $1,200/mo targeting mid-market gap between Team and Enterprise',
      'Snyk expands ICP to Platform Engineering Teams, opening new competitive front',
      'Datadog merges security into core product messaging as "Observability & Security Platform"',
      '3 of 5 tracked competitors now lead with AI in primary positioning'
    ],
    sections: {
      messaging: {
        summary: 'Major repositioning week. GitLab completed its AI-native messaging overhaul, shifting from "DevSecOps Platform" to "AI-Powered DevSecOps Platform." CircleCI introduced a new pricing tier targeting a mid-market gap, and Datadog bundled security into its core value prop.',
        highlights: [
          'GitLab homepage headline changed to "The AI-Powered DevSecOps Platform" - 4th consecutive week of AI-focused changes',
          'CircleCI launched Scale tier at $1,200/mo with 50 concurrent jobs - filling the $300-$2,000/mo mid-market gap',
          'Snyk added "Platform Engineering Teams" as primary audience alongside Developer and Security personas',
          'Datadog replaced "Cloud Monitoring" with "Observability & Security Platform" on product pages'
        ],
        action_items: [
          'Audit our positioning against GitLab AI-first narrative - prepare counter-positioning',
          'Analyze CircleCI Scale tier against our mid-market pricing to identify competitive exposure',
          'Update battlecards to reflect Datadog security convergence play'
        ]
      },
      narrative: {
        summary: 'Two multi-week narrative arcs are now active. We assess with high confidence that GitLab is executing a deliberate AI repositioning (4 weeks, 3 page types, corroboration: strong). We assess with moderate confidence that Snyk is broadening toward platform engineering (2 weeks, 2 page types, corroboration: moderate). A market convergence between GitLab and Datadog is forming — both independently shifted to AI-first positioning within the same window.',
        highlights: [
          'ACTIVE ARC: GitLab "AI-Native Platform Repositioning" — 4 weeks, accelerating. Corroboration: Strong (4 signals across homepage, blog, product). We assess this is a board-level identity shift, not a feature launch. Counter-hypothesis: routine web refreshes — unlikely given 4-week cross-page persistence.',
          'BUILDING ARC: Snyk "Platform Engineering Expansion" — 2 weeks, steady. Corroboration: Moderate (2 signals across partners, product). Indicators suggest deliberate ICP broadening, though the pattern is early. Counter-hypothesis: ServiceNow partnership may be a one-off deal.',
          'CONVERGENCE ASSESSMENT: GitLab + Datadog converging on "AI-First Platform" narrative. Confidence: Moderate. Both shifted primary positioning to AI within the same 4-week window. Counter-hypothesis: both may be responding to the same analyst pressure rather than executing parallel strategies.',
          'Snyk ServiceNow partnership (Jan 27) + Platform Engineering ICP shift (Feb 3) are consistent with a coordinated enterprise expansion campaign. Evidence weight: partners page (low) + product page (medium).'
        ],
        action_items: [
          'Develop clear AI differentiation story before GitLab arc reaches peaked status',
          'Monitor Snyk platform engineering expansion for overlap with our ICP — revisit assessment in 2 weeks',
          'Prepare market convergence briefing for leadership: AI positioning is becoming table stakes in DevOps'
        ]
      },
      icp: {
        summary: 'Competitor ICP shifts point to expansion beyond traditional developer audiences. Snyk targeting platform engineering teams, Datadog adding security buyers, CircleCI chasing growing engineering teams in the mid-market.',
        highlights: [
          'Snyk explicitly targeting Platform Engineering Teams as new buyer persona',
          'CircleCI Scale tier signals pursuit of 50-200 developer organizations',
          'Datadog security bundling attracts CISO budget alongside engineering'
        ],
        action_items: [
          'Evaluate platform engineering persona in our pipeline data',
          'Test messaging for multi-buyer (DevOps + Security) deals'
        ]
      },
      horizon: {
        summary: 'AI capabilities are crystallizing as the new baseline expectation. The GitLab blog post "Why DevSecOps is Dead" signals a category redefinition push toward unified AI platforms.',
        highlights: [
          'GitLab "Why DevSecOps is Dead" blog post challenges the entire best-of-breed positioning model',
          'Snyk ServiceNow partnership indicates enterprise workflow integration is a growth vector',
          'Datadog security convergence may trigger a wave of monitoring+security bundling across the category'
        ],
        action_items: [
          'Prepare a counter-narrative to "DevSecOps is Dead" for sales enablement',
          'Investigate workflow integration partnerships for enterprise expansion'
        ]
      },
      objection: {
        summary: 'GitLab AI repositioning will create "Where is your AI story?" objections in competitive deals. CircleCI pricing creates new mid-market price comparison pressure.',
        highlights: [
          'Expect "GitLab has AI-powered workflows, what do you offer?" in evaluations',
          'CircleCI Scale tier at $1,200/mo creates a new price anchor for mid-market deals',
          'Datadog security bundling enables "one platform" objection against point solutions'
        ],
        action_items: [
          'Create objection handling guide for AI feature gap questions',
          'Build ROI comparison against CircleCI Scale tier'
        ]
      }
    },
    key_questions: [
      'Should we accelerate our AI roadmap given 3 of 5 competitors now lead with AI?',
      'Is CircleCI Scale tier creating real pipeline risk in our mid-market segment?',
      'How should we position against the GitLab platform consolidation narrative?',
      'Is the Snyk platform engineering expansion a threat or an opportunity for us?'
    ],
    bets: [
      {
        hypothesis: 'GitLab AI arc will reach peaked status within 3 weeks, followed by product announcements that validate the positioning',
        confidence: 82,
        signal_ids: ['sig-001', 'sig-004']
      },
      {
        hypothesis: 'Datadog will announce dedicated security pricing within 60 days to capitalize on their "Observability & Security" repositioning',
        confidence: 71,
        signal_ids: ['sig-005']
      },
      {
        hypothesis: 'At least 2 more DevOps vendors will add "AI" to their primary positioning within 90 days, confirming the convergence',
        confidence: 88,
        signal_ids: ['sig-001', 'sig-005']
      }
    ],
    predictions: [
      {
        prediction: 'GitLab will launch a dedicated AI feature suite (code review, security scanning) tied to their repositioning within Q1',
        timeframe: '60 days',
        confidence: 79,
        signals: ['sig-001', 'sig-004']
      },
      {
        prediction: 'The CircleCI Scale tier will trigger pricing responses from at least one competitor within 45 days',
        timeframe: '45 days',
        confidence: 72,
        signals: ['sig-002']
      }
    ],
    action_mapping: {
      this_week: [
        { action: 'Update AI feature comparison in battlecards', owner: 'PMM', priority: 'high' },
        { action: 'Brief sales on GitLab AI narrative and counter-positioning', owner: 'Enablement', priority: 'high' },
        { action: 'Analyze mid-market pipeline exposure to CircleCI Scale tier', owner: 'Rev Ops', priority: 'medium' }
      ],
      monitor: [
        { signal: 'GitLab AI product announcements', trigger: 'Feature launch', action: 'Trigger competitive war room' },
        { signal: 'Mid-market win rate vs CircleCI', trigger: 'Below 40%', action: 'Activate pricing response' }
      ]
    },
    status: 'live',
    created_at: '2025-02-09T18:00:00Z',
    metrics: {
      signals_detected: 6,
      confidence_score: 91,
      impact_score: 88
    }
  },
  {
    id: 'pkt-002',
    week_start: '2025-01-27',
    week_end: '2025-02-02',
    packet_title: 'Week of Jan 27: GitLab Escalates, Datadog Converges on Security',
    exec_summary: [
      'GitLab published "Why DevSecOps is Dead" manifesto challenging best-of-breed positioning across the category',
      'Datadog replaced "Cloud Monitoring" with "Observability & Security Platform" in product messaging',
      'Snyk announced ServiceNow partnership for enterprise vulnerability management workflows',
      'GitLab AI repositioning arc enters week 3 with accelerating trajectory'
    ],
    sections: {
      messaging: {
        summary: 'GitLab escalated its platform narrative with the provocative "Why DevSecOps is Dead" blog post. Datadog converged monitoring and security under a unified platform message. Snyk secured a strategic ServiceNow partnership.',
        highlights: [
          'GitLab "Why DevSecOps is Dead" blog is a direct challenge to every best-of-breed vendor in the DevOps space',
          'Datadog product page now leads with "Observability & Security Platform" instead of "Cloud Monitoring"',
          'Snyk announced strategic ServiceNow partnership for integrated vulnerability management in ITSM workflows'
        ],
        action_items: [
          'Draft response narrative to "DevSecOps is Dead" for sales and marketing',
          'Monitor Datadog security positioning for pricing bundle indicators'
        ]
      },
      narrative: {
        summary: 'GitLab AI arc enters Week 3 with an escalation signal. We assess the "Why DevSecOps is Dead" blog post represents a narrative escalation from product positioning to category redefinition (evidence weight: low — blog source, but thematically significant). Two new origin signals detected: Datadog security convergence and Snyk ServiceNow partnership. Both require additional weeks of data before confident arc classification.',
        highlights: [
          'ACTIVE ARC: GitLab "AI-Native Platform Repositioning" — Week 3, escalation signal detected. Blog post "Why DevSecOps is Dead" is category-level narrative warfare. Evidence weight: Low (blog), but escalation is consistent with prior product-page changes. Corroboration building toward strong.',
          'ORIGIN SIGNAL: Datadog replaced "Cloud Monitoring" with "Observability & Security Platform" (product page, evidence weight: medium). Insufficient data to classify as an arc. This could be the start of a "Platform Consolidation" arc — or a one-time product page update. Revisit next week.',
          'ORIGIN SIGNAL: Snyk ServiceNow partnership announced (partners page, evidence weight: low). Single signal on a low-weight page type. We cannot yet assess whether this represents a strategic direction or a routine partnership deal.',
          'GitLab trajectory remains accelerating: 3 consecutive weeks of messaging changes with increasing boldness. Cross-page consistency strengthens our assessment.'
        ],
        action_items: [
          'Track whether Datadog security messaging persists to homepage — would upgrade from origin signal to confirmed arc',
          'Map Snyk ServiceNow partnership to predicted platform engineering ICP shift — monitor for product page corroboration'
        ]
      },
      icp: {
        summary: 'Enterprise-focused moves dominate this week. Snyk targeting ITSM-integrated workflows. Datadog adding security buyer to their funnel.',
        highlights: [
          'Snyk ServiceNow integration targets enterprise buyers embedded in ITSM workflows',
          'Datadog security positioning attracts CISOs as co-buyers alongside engineering leads'
        ],
        action_items: [
          'Assess ITSM-integrated positioning for our enterprise motion'
        ]
      },
      horizon: {
        summary: 'The "DevSecOps is Dead" narrative from GitLab is an attempt to redefine the category. If it gains traction, best-of-breed vendors will face existential messaging challenges.',
        highlights: [
          'GitLab attempting category redefinition away from best-of-breed toward unified platforms',
          'Snyk ITSM play signals enterprise workflow integration as a growth driver'
        ],
        action_items: [
          'Prepare counter-narrative emphasizing specialization and flexibility advantages'
        ]
      },
      objection: {
        summary: 'GitLab "one platform" narrative will fuel vendor consolidation objections. Snyk ITSM play may create workflow integration gap objections.',
        highlights: [
          '"Why not consolidate on one platform?" objection will intensify in GitLab competitive deals',
          'Snyk ITSM integration may surface "Can you integrate with our ServiceNow?" requests'
        ],
        action_items: [
          'Build objection handler for platform consolidation pressure',
          'Evaluate ServiceNow integration feasibility'
        ]
      }
    },
    key_questions: [
      'How seriously should we take the "DevSecOps is Dead" narrative? Is it gaining analyst traction?',
      'Should we pursue a ServiceNow partnership to match Snyk in enterprise ITSM workflows?',
      'Is Datadog security convergence a real product direction or just messaging?'
    ],
    bets: [
      {
        hypothesis: 'GitLab "DevSecOps is Dead" will be referenced in at least 3 analyst reports within 60 days',
        confidence: 68,
        signal_ids: ['sig-004']
      },
      {
        hypothesis: 'Snyk will expand platform engineering positioning to homepage by next month',
        confidence: 76,
        signal_ids: ['sig-006']
      }
    ],
    predictions: [
      {
        prediction: 'Datadog will announce a dedicated security product line within Q1',
        timeframe: '90 days',
        confidence: 70,
        signals: ['sig-005']
      }
    ],
    action_mapping: {
      this_week: [
        { action: 'Prepare "best-of-breed vs. platform" counter-narrative', owner: 'PMM', priority: 'high' },
        { action: 'Brief field on GitLab category redefinition play', owner: 'Enablement', priority: 'high' }
      ],
      monitor: [
        { signal: 'GitLab "DevSecOps is Dead" social traction', trigger: 'Major analyst pickup', action: 'Escalate counter-narrative to exec team' }
      ]
    },
    status: 'published',
    created_at: '2025-02-02T16:00:00Z',
    metrics: {
      signals_detected: 3,
      confidence_score: 87,
      impact_score: 82
    }
  },
  {
    id: 'pkt-003',
    week_start: '2025-01-20',
    week_end: '2025-01-26',
    packet_title: 'Week of Jan 20: GitLab AI Arc Begins, Category Drift Detected',
    exec_summary: [
      'GitLab AI-powered messaging appeared in product page subtitles for the first time - origin signal detected',
      'Quiet week on pricing and ICP fronts across tracked competitors',
      'Early indicators suggest AI is becoming a category-level narrative theme',
      'Monitoring 5 competitors across 12 tracked pages'
    ],
    sections: {
      messaging: {
        summary: 'Relatively quiet week on competitive messaging. However, early indicators of an AI narrative shift were detected in GitLab product pages. This may be the beginning of a broader trend.',
        highlights: [
          'GitLab product page subtitles now include "AI-powered" language for the first time',
          'No major pricing changes or ICP shifts detected across other tracked competitors',
          'Category-level messaging remains stable outside the emerging AI theme'
        ],
        action_items: [
          'Set up monitoring for AI-related messaging changes across all tracked competitors',
          'Begin cataloging our own AI capabilities for potential positioning response'
        ]
      },
      narrative: {
        summary: 'Origin signal detected: GitLab product pages now contain "AI-powered" language in subtitles. Single signal on a medium-weight page type (product). We cannot yet assess whether this represents a strategic repositioning or a routine copy update. No active arcs. No cross-company convergence detected.',
        highlights: [
          'ORIGIN SIGNAL: GitLab product pages now contain "AI-powered" language in subtitles — first occurrence detected. Evidence weight: Medium (product page). Corroboration: Weak (1 signal, 1 page type). Confidence: Low — insufficient data for arc classification.',
          'No active narrative arcs from previous weeks — this is the first origin signal in the current tracking window. Requires 2+ additional weeks of corroborating changes to confirm a sustained arc.',
          'No cross-company convergence detected this week. Convergence detection requires active arcs in 2+ companies.',
          'Baseline messaging snapshots captured for all 5 tracked competitors across 12 pages. Hash-based change detection is operational.'
        ],
        action_items: [
          'Flag GitLab AI language for tracking — if homepage or pricing page changes appear next week, upgrade to confirmed arc',
          'Establish narrative baselines for convergence detection across all tracked companies'
        ]
      },
      icp: {
        summary: 'No significant ICP shifts detected this week. All tracked competitors maintaining stable audience targeting.',
        highlights: [
          'Stable ICP positioning across all tracked competitors',
          'No new audience segments or persona changes detected'
        ],
        action_items: [
          'Continue weekly ICP monitoring'
        ]
      },
      horizon: {
        summary: 'Early AI signals from GitLab could foreshadow a broader category shift. Worth monitoring closely.',
        highlights: [
          'GitLab AI language insertion may signal upcoming product announcements',
          'AI-powered development tools gaining traction in adjacent markets'
        ],
        action_items: [
          'Research AI development tool adoption trends for planning'
        ]
      },
      objection: {
        summary: 'No new objection patterns this week. Existing competitive dynamics stable.',
        highlights: [
          'Current objection patterns unchanged from previous week',
          'No new competitive features creating pressure'
        ],
        action_items: [
          'Continue objection tracking'
        ]
      }
    },
    key_questions: [
      'Is the GitLab AI language a one-time update or the start of a broader repositioning?',
      'Should we proactively develop AI positioning before competitors force the conversation?',
      'What AI capabilities can we credibly claim in our current product?'
    ],
    bets: [
      {
        hypothesis: 'GitLab AI language will expand to homepage within 2 weeks, confirming a sustained repositioning campaign',
        confidence: 72,
        signal_ids: ['sig-010']
      }
    ],
    predictions: [
      {
        prediction: 'At least 2 DevOps competitors will add AI messaging within 60 days of GitLab',
        timeframe: '60 days',
        confidence: 65,
        signals: ['sig-010']
      }
    ],
    action_mapping: {
      this_week: [
        { action: 'Catalog current AI capabilities for positioning prep', owner: 'Product', priority: 'medium' },
        { action: 'Set up weekly AI messaging tracker across all competitors', owner: 'PMM', priority: 'medium' }
      ],
      monitor: [
        { signal: 'GitLab AI messaging expansion', trigger: 'Homepage or pricing page change', action: 'Upgrade to high-priority competitive response' }
      ]
    },
    status: 'published',
    created_at: '2025-01-26T14:00:00Z',
    metrics: {
      signals_detected: 1,
      confidence_score: 74,
      impact_score: 65
    }
  },
  {
    id: 'pkt-004',
    week_start: '2025-01-13',
    week_end: '2025-01-19',
    packet_title: 'Week of Jan 13: Baseline Established, All Quiet',
    exec_summary: [
      'Initial competitor messaging baselines captured across 5 companies and 12 pages',
      'No significant messaging changes detected in the first full monitoring week',
      'System calibrated for weekly drift detection starting this week',
      'Hash-based change detection operational across all tracked URLs'
    ],
    sections: {
      messaging: {
        summary: 'First full monitoring week. Baseline messaging snapshots established for GitLab, CircleCI, Snyk, Datadog, and other tracked competitors. No messaging changes detected.',
        highlights: [
          'Baseline established: GitLab positioned as "The DevSecOps Platform"',
          'Baseline established: CircleCI Team ($299/mo) and Enterprise pricing structure',
          'Baseline established: Snyk targeting Developers and Security Teams as primary audiences',
          'Baseline established: Datadog positioned as "Cloud Monitoring" platform'
        ],
        action_items: [
          'Validate baseline captures are accurate before drift detection begins',
          'Confirm all tracked pages are loading correctly'
        ]
      },
      narrative: {
        summary: 'Baseline week — no narrative arcs active. The system has captured initial positioning snapshots for all tracked competitors. No drift detected (expected for Week 1). Evidence-weighted arc detection, corroboration scoring, and convergence analysis are calibrated and operational.',
        highlights: [
          'Narrative tracking system initialized with Week 1 baselines. Evidence weighting: homepage and pricing changes scored as high, product pages as medium, blogs and partner pages as low.',
          'No drift detected (expected for baseline week). First meaningful signals anticipated within 2-4 weeks.',
          'All 5 companies and 12 pages successfully captured and hashed. Page types catalogued for evidence-weight computation.',
          'Corroboration framework operational: arcs require 2+ signals across 2+ page types for "moderate" classification, 3+ signals across 2+ page types for "strong." Counter-hypotheses generated for every arc.'
        ],
        action_items: [
          'Review baseline positioning snapshots for accuracy before drift detection begins',
          'Set expectations: first confident arc assessments require 3+ weeks of corroborating data'
        ]
      },
      icp: {
        summary: 'Baseline ICP positioning captured. All competitors targeting their established personas.',
        highlights: [
          'GitLab: DevSecOps teams and platform engineers',
          'Snyk: Developers and Security teams',
          'Datadog: Engineering and DevOps teams'
        ],
        action_items: [
          'Document ICP baselines for future shift detection'
        ]
      },
      horizon: {
        summary: 'Monitoring begins. Industry trends point toward AI-augmented development workflows gaining adoption.',
        highlights: [
          'AI-augmented development workflows gaining traction across the industry',
          'Platform consolidation narrative emerging in analyst reports'
        ],
        action_items: [
          'Track AI development tool adoption in target accounts'
        ]
      },
      objection: {
        summary: 'Baseline objection landscape captured. No new competitive dynamics to report.',
        highlights: [
          'Standard competitive objections remain unchanged',
          'Integration complexity remains top objection in pipeline'
        ],
        action_items: [
          'Continue tracking objection patterns weekly'
        ]
      }
    },
    key_questions: [
      'Are we monitoring the right competitor pages for maximum signal detection?',
      'Should we add more competitors or pages to the tracking list?',
      'What competitive messaging changes should we be most alert to?'
    ],
    bets: [],
    predictions: [],
    action_mapping: {
      this_week: [
        { action: 'Validate baseline positioning captures', owner: 'PMM', priority: 'medium' },
        { action: 'Expand tracked page list if gaps identified', owner: 'Intel Ops', priority: 'low' }
      ],
      monitor: [
        { signal: 'Any competitor homepage change', trigger: 'Drift detected', action: 'Review and assess impact' }
      ]
    },
    status: 'archived',
    created_at: '2025-01-19T12:00:00Z',
    metrics: {
      signals_detected: 0,
      confidence_score: 92,
      impact_score: 45
    }
  }
];
