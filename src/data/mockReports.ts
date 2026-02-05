import { IntelPacket } from '@/types/report';

export const mockReports: IntelPacket[] = [
  {
    id: 'pkt-001',
    date: '2026-01-26',
    headline: 'Week of Jan 20: AI Positioning Wars Heat Up',
    exec_summary: [
      'Acme Corp announced 20% price reduction targeting mid-market segment',
      'Competitor X launched AI-powered analytics module — 3 months ahead of roadmap',
      'Two key competitors cited in 4 enterprise deals we lost this quarter',
      'Pipeline coverage at 3.2x for Q4 target — down from 3.8x last week',
      'Market sentiment shows 12% increase in brand mentions vs competitors'
    ],
    competitive_intel: {
      summary: 'Intensifying pressure from Acme Corp and Competitor X with aggressive pricing and accelerated AI feature releases. Patent activity suggests automated workflow engines are the next battleground.',
      highlights: [
        'Acme Corp 20% price cut targeting mid-market — threatens our SMB tier',
        'Competitor X AI analytics launched 3 months ahead of schedule',
        'Patent filing detected: Competitor Y automated workflow engine',
        'We were cited as runner-up in 4 enterprise losses this quarter'
      ]
    },
    pipeline_intel: {
      summary: 'Pipeline coverage declining with extended deal cycles. Enterprise segment outperforming but concentration risk emerging with top performers.',
      highlights: [
        'Coverage at 3.2x (down from 3.8x) — $2.1M in pushed deals',
        'Average deal cycle extended to 67 days from 52 days in Q3',
        'Enterprise win rate 28% higher than mid-market',
        'Top 3 reps account for 62% of pipeline — concentration risk'
      ]
    },
    market_intel: {
      summary: 'AI/ML budgets surging while security becomes table stakes. Healthcare vertical showing exceptional engagement and expansion potential.',
      highlights: [
        'AI/ML budget allocation up 34% YoY among target accounts',
        'Security & compliance now #1 buying criteria (was #3 in H1)',
        '127 new high-intent accounts detected in our ICP',
        'Healthcare vertical showing 2x engagement rate'
      ]
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
    date: '2026-01-19',
    headline: 'Week of Jan 13: Enterprise Momentum Builds',
    exec_summary: [
      '$4.2M moved to Commit stage with strong enterprise traction',
      'New CTO at Fortune 500 target — warm intro available via board connection',
      'CAC payback reduced to 14 months from 18 months in Q2',
      'Outbound response rate at 4.2% — below 5% target',
      'NRR holding steady at 118% despite macro headwinds'
    ],
    competitive_intel: {
      summary: 'Relatively quiet week on competitive front. Focus on strengthening positioning ahead of expected Q1 announcements.',
      highlights: [
        'No major competitor announcements this week',
        'Industry analyst reports favor our integration depth',
        'Competitor Z executive departure — potential talent opportunity',
        'Battle card refresh driving 45% more content engagement'
      ]
    },
    pipeline_intel: {
      summary: 'Strong week for enterprise with significant commit stage movement. Mid-market requires attention on conversion rates.',
      highlights: [
        '$4.2M moved to Commit; $1.8M flagged at risk (budget freeze)',
        'Enterprise showing 28% higher win rate than mid-market',
        'Security review phase adding 8+ days to deal cycles',
        'Executive sponsorship accelerating top 10 deals'
      ]
    },
    market_intel: {
      summary: 'Continued momentum in AI adoption signals. Economic headwinds causing procurement delays but not cancellations.',
      highlights: [
        '78% of target accounts have active AI initiatives',
        'Economic headwinds causing 15% longer procurement cycles',
        'SOC 2 Type II mentioned in 85% of enterprise RFPs',
        'FedRAMP demand increasing for government vertical'
      ]
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
      },
      {
        hypothesis: 'December SPIF will pull forward $1.5M in deals before year-end',
        confidence: 68,
        signal_ids: ['sig-060']
      }
    ],
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
    date: '2026-01-12',
    headline: 'Week of Jan 6: Q1 Planning Insights',
    exec_summary: [
      'MQL to SQL conversion improved to 32% after ICP refinement',
      'Three strategic accounts entering budget planning cycles',
      'Champion departure at key account requires multithreading',
      '8 accounts showing increased usage — expansion signals strong',
      'Vertical expansion opportunity validated in healthcare'
    ],
    competitive_intel: {
      summary: 'Competitive landscape stable as industry enters planning mode. Early signals suggest aggressive Q1 launches from key competitors.',
      highlights: [
        'Industry entering planning mode — quieter news cycle',
        'Rumors of Competitor X Series D raise for GTM expansion',
        'Analyst briefings scheduled with two major firms',
        'Win rate improving in head-to-head evaluations'
      ]
    },
    pipeline_intel: {
      summary: 'Q1 pipeline building with focus on enterprise accounts entering budget cycles. Expansion opportunities strong in existing base.',
      highlights: [
        'Three strategic accounts entering Q1 budget planning',
        '8 accounts with increased usage — expansion ready',
        'Champion departure at Target C needs attention',
        'Multi-year deal push gaining traction'
      ]
    },
    market_intel: {
      summary: 'Healthcare vertical validated as high-potential expansion opportunity. AI productivity narrative resonating across segments.',
      highlights: [
        'Healthcare showing 2x demo requests vs baseline',
        'AI productivity messaging testing well in campaigns',
        'Adjacent ICP segment showing similar buying patterns',
        'Content-led growth driving 28% organic traffic increase'
      ]
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
    date: '2026-01-05',
    headline: 'Week of Dec 30: Year-End Wrap & 2026 Outlook',
    exec_summary: [
      'Q4 closed at 94% of target — strong finish despite headwinds',
      'Annual competitive win rate improved 12 points YoY',
      'Customer NPS reached all-time high of 72',
      '2026 pipeline starting position: 2.8x coverage',
      'Three product launches planned for H1 2026'
    ],
    competitive_intel: {
      summary: 'Year-end review shows improved competitive positioning. 2026 outlook requires vigilance on AI feature parity.',
      highlights: [
        'Annual win rate vs top 3 competitors: 58% (up from 46%)',
        'Integration depth cited as primary differentiator',
        'AI feature gap identified as 2026 priority',
        'Brand awareness up 23% in target segments'
      ]
    },
    pipeline_intel: {
      summary: 'Solid year-end close with healthy pipeline entering 2026. Focus areas identified for Q1 acceleration.',
      highlights: [
        'Q4 closed at 94% — $18.2M in new ARR',
        '2026 pipeline starting at 2.8x coverage',
        'Average deal size increased 18% YoY',
        'Renewal rate maintained at 92%'
      ]
    },
    market_intel: {
      summary: 'Market conditions stabilizing with clear opportunities in AI-driven productivity and vertical expansion.',
      highlights: [
        'AI investment outlook strong for 2026',
        'Healthcare and financial services top vertical opportunities',
        'Remote work driving continued demand',
        'Regulatory compliance increasingly important'
      ]
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
      },
      {
        hypothesis: 'Strategic partnership with top integration platform will accelerate marketplace launch by 60 days',
        confidence: 62,
        signal_ids: ['sig-090']
      }
    ],
    status: 'archived',
    created_at: '2026-01-05T12:00:00Z',
    metrics: {
      signals_detected: 124,
      confidence_score: 92,
      impact_score: 85
    }
  }
];
