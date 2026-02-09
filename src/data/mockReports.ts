import { IntelPacket } from '@/types/report';

const emptySection = { summary: '', highlights: [], action_items: [] };

export const mockReports: IntelPacket[] = [
  {
    id: 'pkt-001',
    week_start: '2026-01-20',
    week_end: '2026-01-26',
    packet_title: 'Week of Jan 20: AI Positioning Wars Heat Up',
    exec_summary: [
      'Acme Corp announced 20% price reduction targeting mid-market segment',
      'Competitor X launched AI-powered analytics module — 3 months ahead of roadmap',
      'Two key competitors cited in 4 enterprise deals we lost this quarter',
      'Pipeline coverage at 3.2x for Q4 target — down from 3.8x last week',
      'Market sentiment shows 12% increase in brand mentions vs competitors'
    ],
    sections: {
      messaging: {
        summary: 'Competitor messaging shifting toward AI-first positioning. Acme emphasizing automation over customization.',
        highlights: [
          'Acme Corp rebranded landing pages with "AI-Powered" messaging',
          'Competitor X launched campaign around "Intelligent Analytics"',
          'Three competitors now emphasizing "no-code" deployment'
        ],
        action_items: [
          'Audit our AI messaging across all touchpoints',
          'Test new AI-first value propositions in outbound'
        ]
      },
      narrative: {
        summary: 'Market narrative consolidating around productivity gains. Integration depth emerging as key differentiator.',
        highlights: [
          'Analyst reports favor integration depth over feature breadth',
          'Customer success stories driving organic mentions',
          'Industry shift toward composable architecture narrative'
        ],
        action_items: [
          'Update analyst briefing materials',
          'Create integration-focused case studies'
        ]
      },
      icp: {
        summary: 'Mid-market segment showing price sensitivity. Enterprise accounts prioritizing security and compliance.',
        highlights: [
          'Mid-market response rates declining with current pricing',
          'Enterprise showing 28% higher engagement with security messaging',
          'Healthcare vertical over-indexing on compliance requirements'
        ],
        action_items: [
          'Test mid-market pricing adjustments',
          'Prioritize SOC 2 Type II content in enterprise sequences'
        ]
      },
      horizon: {
        summary: 'AI/ML budgets surging. FedRAMP certification increasingly requested in government opportunities.',
        highlights: [
          'AI/ML budget allocation up 34% YoY among target accounts',
          'FedRAMP mentioned in 15 government RFPs this quarter',
          'Edge computing interest growing in manufacturing vertical'
        ],
        action_items: [
          'Evaluate FedRAMP certification timeline and investment',
          'Scope AI feature acceleration for Q2'
        ]
      },
      objection: {
        summary: 'Integration complexity and pricing emerging as top objections. Security concerns manageable with documentation.',
        highlights: [
          'Integration setup time cited in 40% of lost deals',
          'Pricing objections up 25% in mid-market',
          'Security fast-track documentation reducing objection close time'
        ],
        action_items: [
          'Create integration quickstart packages',
          'Develop ROI calculator for pricing discussions'
        ]
      }
    },
    key_questions: [
      'Should we accelerate AI analytics roadmap to close competitive gap?',
      'Is mid-market pricing adjustment warranted given Acme\'s move?',
      'Do we prioritize healthcare vertical GTM in Q1?',
      'How do we address rep pipeline concentration risk?'
    ],
    bets: [
      {
        hypothesis: 'Launching an integration marketplace with 25+ connectors by Q1 end will close 60% of competitive losses attributed to integration gaps',
        confidence: 85,
        signal_ids: ['sig-001', 'sig-015', 'sig-023']
      },
      {
        hypothesis: 'Pulling forward predictive analytics from Q2 to late Q1 will prevent 3+ enterprise losses to Competitor X',
        confidence: 72,
        signal_ids: ['sig-002', 'sig-008']
      },
      {
        hypothesis: 'Dedicated healthcare GTM motion will generate $2M pipeline within 90 days',
        confidence: 78,
        signal_ids: ['sig-041', 'sig-042', 'sig-043', 'sig-044']
      }
    ],
    predictions: [
      {
        prediction: 'Competitor X will announce enterprise tier with AI features by Q1 end',
        timeframe: '90 days',
        confidence: 75,
        signals: ['sig-002', 'sig-008', 'sig-010']
      },
      {
        prediction: 'Healthcare vertical will become top-3 revenue segment by Q4',
        timeframe: '9 months',
        confidence: 68,
        signals: ['sig-041', 'sig-042']
      }
    ],
    action_mapping: {
      this_week: [
        { action: 'Update AI messaging across landing pages', owner: 'Marketing', priority: 'high' },
        { action: 'Complete integration quickstart for top 5 connectors', owner: 'Product', priority: 'high' },
        { action: 'Brief sales on Acme pricing response strategy', owner: 'Sales Ops', priority: 'medium' }
      ],
      monitor: [
        { signal: 'Competitor X AI feature adoption', trigger: '10% market penetration', action: 'Escalate AI roadmap acceleration' },
        { signal: 'Mid-market win rate', trigger: 'Below 25%', action: 'Trigger pricing review' }
      ]
    },
    status: 'live',
    created_at: '2026-01-26T18:00:00Z',
    metrics: {
      signals_detected: 156,
      confidence_score: 91,
      impact_score: 88
    }
  },
  {
    id: 'pkt-002',
    week_start: '2026-01-13',
    week_end: '2026-01-19',
    packet_title: 'Week of Jan 13: Enterprise Momentum Builds',
    exec_summary: [
      '$4.2M moved to Commit stage with strong enterprise traction',
      'New CTO at Fortune 500 target — warm intro available via board connection',
      'CAC payback reduced to 14 months from 18 months in Q2',
      'Outbound response rate at 4.2% — below 5% target',
      'NRR holding steady at 118% despite macro headwinds'
    ],
    sections: {
      messaging: {
        summary: 'Relatively quiet week on competitive front. Focus on strengthening positioning ahead of expected Q1 announcements.',
        highlights: [
          'No major competitor announcements this week',
          'Industry analyst reports favor our integration depth',
          'Battle card refresh driving 45% more content engagement'
        ],
        action_items: ['Continue analyst briefing preparations']
      },
      narrative: {
        summary: 'Enterprise narrative resonating well. Executive sponsorship stories gaining traction.',
        highlights: [
          'Fortune 500 case study driving strong engagement',
          'Executive sponsorship program testimonials ready'
        ],
        action_items: ['Publish executive sponsorship case study']
      },
      icp: {
        summary: 'Enterprise showing strong conversion. Mid-market requires attention on value messaging.',
        highlights: [
          'Enterprise showing 28% higher win rate than mid-market',
          'Security review phase adding 8+ days to deal cycles'
        ],
        action_items: ['Create security fast-track documentation']
      },
      horizon: {
        summary: 'Continued momentum in AI adoption signals. Economic headwinds causing procurement delays.',
        highlights: [
          '78% of target accounts have active AI initiatives',
          'Economic headwinds causing 15% longer procurement cycles',
          'SOC 2 Type II mentioned in 85% of enterprise RFPs'
        ],
        action_items: ['Accelerate SOC 2 Type II messaging']
      },
      objection: {
        summary: 'Security concerns manageable with documentation. Multi-year incentives gaining traction.',
        highlights: [
          'Security fast-track documentation reducing objection close time',
          'Multi-year deals accelerating close cycles'
        ],
        action_items: ['Package multi-year incentive options']
      }
    },
    key_questions: [
      'Should we offer multi-year incentives to accelerate Q4 closes?',
      'How do we prioritize outreach to new CTO at Target A?',
      'Is FedRAMP certification worth the 12-month timeline?',
      'What\'s our playbook for accounts undergoing M&A?'
    ],
    bets: [
      {
        hypothesis: 'Executive sponsorship program will accelerate top 10 deals by 15+ days on average',
        confidence: 82,
        signal_ids: ['sig-051', 'sig-052']
      },
      {
        hypothesis: 'Security fast-track documentation package will reduce evaluation time by 40%',
        confidence: 75,
        signal_ids: ['sig-055', 'sig-056', 'sig-057']
      }
    ],
    predictions: [
      {
        prediction: 'Executive sponsorship program will become top sales accelerator by Q2',
        timeframe: '90 days',
        confidence: 80,
        signals: ['sig-051', 'sig-052']
      }
    ],
    action_mapping: {
      this_week: [
        { action: 'Finalize multi-year incentive structure', owner: 'Finance', priority: 'high' },
        { action: 'Reach out to new CTO via board connection', owner: 'AE Team', priority: 'high' }
      ],
      monitor: [
        { signal: 'Outbound response rate', trigger: 'Below 4%', action: 'Trigger messaging refresh' }
      ]
    },
    status: 'published',
    created_at: '2026-01-19T16:00:00Z',
    metrics: {
      signals_detected: 89,
      confidence_score: 87,
      impact_score: 82
    }
  },
  {
    id: 'pkt-003',
    week_start: '2026-01-06',
    week_end: '2026-01-12',
    packet_title: 'Week of Jan 6: Q1 Planning Insights',
    exec_summary: [
      'MQL to SQL conversion improved to 32% after ICP refinement',
      'Three strategic accounts entering budget planning cycles',
      'Champion departure at key account requires multithreading',
      '8 accounts showing increased usage — expansion signals strong',
      'Vertical expansion opportunity validated in healthcare'
    ],
    sections: {
      messaging: {
        summary: 'Competitive landscape stable as industry enters planning mode.',
        highlights: [
          'Industry entering planning mode — quieter news cycle',
          'Rumors of Competitor X Series D raise for GTM expansion'
        ],
        action_items: ['Prepare for expected Q1 competitor announcements']
      },
      narrative: {
        summary: 'AI productivity narrative resonating strongly across segments.',
        highlights: [
          'AI productivity messaging testing well in campaigns',
          'Content-led growth driving 28% organic traffic increase'
        ],
        action_items: ['Double down on AI productivity content']
      },
      icp: {
        summary: 'Healthcare vertical validated as high-potential. Adjacent segments showing promise.',
        highlights: [
          'Healthcare showing 2x demo requests vs baseline',
          'Adjacent ICP segment showing similar buying patterns'
        ],
        action_items: ['Staff healthcare vertical pilot']
      },
      horizon: {
        summary: 'Q1 budget cycles creating opportunity window.',
        highlights: [
          'Three strategic accounts entering Q1 budget planning',
          'AI investment outlook strong for 2026'
        ],
        action_items: ['Accelerate outreach to accounts in budget cycles']
      },
      objection: {
        summary: 'Champion churn requiring multithread strategy.',
        highlights: [
          'Champion departure at Target C needs attention',
          'Expansion signals strong despite champion changes'
        ],
        action_items: ['Develop champion succession playbook']
      }
    },
    key_questions: [
      'How do we staff the healthcare vertical pilot?',
      'Should we expand ICP to adjacent high-performing segments?',
      'Is outbound underperformance a targeting or messaging issue?',
      'How do we accelerate product-led expansion motion?'
    ],
    bets: [
      {
        hypothesis: 'Healthcare vertical pilot will achieve 2x higher demo-to-opportunity rate than baseline',
        confidence: 76,
        signal_ids: ['sig-071', 'sig-072', 'sig-073']
      },
      {
        hypothesis: 'ICP expansion test will identify $3M+ in adjacent segment pipeline',
        confidence: 65,
        signal_ids: ['sig-075']
      }
    ],
    predictions: [],
    action_mapping: {
      this_week: [
        { action: 'Launch healthcare pilot with 2 dedicated reps', owner: 'Sales', priority: 'high' },
        { action: 'Multithread key account after champion departure', owner: 'CSM', priority: 'high' }
      ],
      monitor: [
        { signal: 'Healthcare demo conversion rate', trigger: 'Below 30%', action: 'Adjust targeting criteria' }
      ]
    },
    status: 'published',
    created_at: '2026-01-12T14:00:00Z',
    metrics: {
      signals_detected: 67,
      confidence_score: 84,
      impact_score: 79
    }
  },
  {
    id: 'pkt-004',
    week_start: '2025-12-30',
    week_end: '2026-01-05',
    packet_title: 'Week of Dec 30: Year-End Wrap & 2026 Outlook',
    exec_summary: [
      'Q4 closed at 94% of target — strong finish despite headwinds',
      'Annual competitive win rate improved 12 points YoY',
      'Customer NPS reached all-time high of 72',
      '2026 pipeline starting position: 2.8x coverage',
      'Three product launches planned for H1 2026'
    ],
    sections: {
      messaging: {
        summary: 'Year-end review shows improved competitive positioning.',
        highlights: [
          'Annual win rate vs top 3 competitors: 58% (up from 46%)',
          'Integration depth cited as primary differentiator'
        ],
        action_items: ['Document top competitive wins for training']
      },
      narrative: {
        summary: 'AI feature gap identified as 2026 priority. Brand awareness growing.',
        highlights: [
          'AI feature gap identified as 2026 priority',
          'Brand awareness up 23% in target segments'
        ],
        action_items: ['Finalize 2026 messaging roadmap']
      },
      icp: {
        summary: 'Healthcare and financial services top vertical opportunities for 2026.',
        highlights: [
          'Healthcare and financial services top vertical opportunities',
          'Remote work driving continued demand'
        ],
        action_items: ['Finalize vertical GTM plans for H1']
      },
      horizon: {
        summary: 'Market conditions stabilizing. AI investment strong.',
        highlights: [
          'AI investment outlook strong for 2026',
          'Regulatory compliance increasingly important'
        ],
        action_items: ['Plan compliance certification roadmap']
      },
      objection: {
        summary: 'Strong year-end performance reducing objection frequency.',
        highlights: [
          'Customer NPS reached all-time high of 72',
          'Renewal rate maintained at 92%'
        ],
        action_items: ['Document NPS success stories']
      }
    },
    key_questions: [
      'What\'s the right investment level for AI acceleration?',
      'How do we sequence vertical launches?',
      'Should we pursue strategic partnerships for faster growth?',
      'What talent gaps need addressing for 2026 goals?'
    ],
    bets: [
      {
        hypothesis: 'AI feature parity by Q2 will prevent projected $5M in competitive losses',
        confidence: 88,
        signal_ids: ['sig-081', 'sig-082', 'sig-083', 'sig-084']
      },
      {
        hypothesis: 'Launching healthcare and finserv verticals will drive 40% of new ARR by Q4',
        confidence: 71,
        signal_ids: ['sig-085', 'sig-086']
      }
    ],
    predictions: [
      {
        prediction: 'Strategic partnerships will accelerate 2026 growth by 20%',
        timeframe: '12 months',
        confidence: 65,
        signals: ['sig-090']
      }
    ],
    action_mapping: {
      this_week: [
        { action: 'Finalize 2026 GTM plan', owner: 'Leadership', priority: 'high' },
        { action: 'Kickoff AI acceleration workstream', owner: 'Product', priority: 'high' }
      ],
      monitor: [
        { signal: 'AI feature competitive gap', trigger: 'Gap widening', action: 'Escalate to exec team' }
      ]
    },
    status: 'archived',
    created_at: '2026-01-05T12:00:00Z',
    metrics: {
      signals_detected: 124,
      confidence_score: 92,
      impact_score: 85
    }
  }
];
