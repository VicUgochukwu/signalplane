import type { ActionBoardCard, ExecutionKit, KitDecisionType, BoardColumn } from '@/types/actionBoard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DECISION_TYPES: KitDecisionType[] = [
  'positioning', 'packaging', 'enablement', 'risk', 'proof', 'distribution', 'hiring', 'launch',
];
const OWNER_TEAMS = ['PMM', 'Sales', 'CS', 'Product', 'Exec'];
const PRIORITIES: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];

/** Deterministic-ish pseudo-hash so we get stable but varied picks. */
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function iso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

const THREE_WEEKS_AGO = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 21);
  return d.toISOString();
})();

let _cardSeq = 0;

function makeCard(partial: Partial<ActionBoardCard> & {
  id: string;
  action_text: string;
  column_status: BoardColumn;
  column_order: number;
  competitor_name: string;
  sector?: string;
}): ActionBoardCard {
  _cardSeq += 1;
  const s = _cardSeq;
  return {
    packet_id: `pkt-${partial.id.slice(0, 18)}-${s.toString(16).padStart(4, '0')}`,
    signal_headline: partial.signal_headline ?? null,
    decision_type: partial.decision_type ?? pick(DECISION_TYPES, s),
    owner_team: partial.owner_team ?? pick(OWNER_TEAMS, s + 3),
    priority: partial.priority ?? pick(PRIORITIES, s + 7),
    severity: partial.severity ?? ((s % 5) + 1),
    signal_ids: partial.signal_ids ?? [],
    evidence_urls: partial.evidence_urls ?? [],
    assigned_to: partial.assigned_to ?? null,
    assigned_at: partial.assigned_at ?? null,
    notes: partial.notes ?? null,
    moved_to_inbox_at: partial.moved_to_inbox_at ?? iso(s % 10),
    moved_to_this_week_at: partial.moved_to_this_week_at ?? null,
    moved_to_in_progress_at: partial.moved_to_in_progress_at ?? null,
    moved_to_done_at: partial.moved_to_done_at ?? null,
    execution_kit: partial.execution_kit ?? null,
    kit_generated_at: partial.kit_generated_at ?? null,
    outcome: partial.outcome ?? null,
    outcome_notes: partial.outcome_notes ?? null,
    packet_title: partial.packet_title ?? `${partial.competitor_name} Competitive Update`,
    packet_week_start: partial.packet_week_start ?? iso(7),
    created_at: partial.created_at ?? iso(s % 14),
    updated_at: partial.updated_at ?? iso(0),
    // Spread partial last so explicit values always win
    ...partial,
  } as ActionBoardCard;
}

// ---------------------------------------------------------------------------
// Execution Kit Factories
// ---------------------------------------------------------------------------

function positioningKit(competitor: string): ExecutionKit {
  return {
    type: 'positioning',
    generated_at: iso(2),
    components: [
      {
        title: 'Copy Diff',
        content: `**Current:** "The modern platform for high-growth teams"\n\n**Recommended:** "The modern platform for high-growth teams \u2014 with enterprise-grade security and real-time collaboration built in"\n\n**Why:** ${competitor}\u2019s latest messaging emphasises enterprise readiness. We should match and extend with our collaboration angle.`,
        copyable: true,
      },
      {
        title: 'Internal Brief',
        content: `${competitor} shifted from a developer-first narrative to an enterprise productivity story this week. Their updated homepage copy, CEO tweet thread, and Series D press release all lean into "platform" language.\n\n**Key take-away:** They are going up-market. Our positioning should proactively address enterprise concerns while reinforcing our developer-experience moat.`,
        copyable: true,
      },
      {
        title: 'Leadership Summary',
        content: `### TL;DR for leadership\n- ${competitor} repositioned toward enterprise buyers\n- Risk to our mid-market pipeline if unanswered\n- Recommended: update hero copy and create a 1-pager comparing enterprise capabilities`,
        copyable: true,
      },
      {
        title: 'Slide-Ready Block',
        content: `| Dimension | Us | ${competitor} |\n|---|---|---|\n| Core message | Developer-loved, enterprise-ready | Enterprise platform for modern teams |\n| Proof points | 4,000+ companies, SOC 2 Type II | Series D, Fortune 500 logos |\n| Gap | Collaboration narrative | Developer experience depth |`,
        copyable: true,
      },
    ],
  };
}

function enablementKit(competitor: string): ExecutionKit {
  return {
    type: 'enablement',
    generated_at: iso(1),
    components: [
      {
        title: 'Battlecard Section Update',
        content: `### ${competitor} \u2014 Updated Battlecard\n\n**Their pitch:** "${competitor} is the only platform that combines X + Y."\n\n**Our counter:** "We integrate X natively \u2014 no bolt-on required \u2014 and customers see 30% faster time-to-value."\n\n**Proof:** Acme Corp case study (Q4), internal benchmark data.`,
        copyable: true,
      },
      {
        title: 'Objection Rebuttal',
        content: `**Objection:** "We\u2019re evaluating ${competitor} because they announced [feature]."\n\n**Rebuttal framework:**\n1. Acknowledge: "That\u2019s a smart evaluation."\n2. Reframe: "The feature is in beta \u2014 here\u2019s what production-readiness looks like\u2026"\n3. Prove: Share the benchmark comparison and Acme case study.`,
        copyable: true,
      },
      {
        title: 'Discovery Question Set',
        content: `1. "How important is [capability] to your evaluation criteria?"\n2. "Have you stress-tested ${competitor}\u2019s [feature] at your scale?"\n3. "What does your rollout timeline look like \u2014 and how does onboarding factor in?"`,
        copyable: true,
      },
      {
        title: 'Win/Loss Talking Points',
        content: `**Recent wins vs ${competitor}:**\n- TechCorp (Mid-market, 200 seats) \u2014 won on integration depth\n- FinServ Inc (Enterprise, 1.2k seats) \u2014 won on compliance & support SLA\n\n**Recent loss:**\n- StartupXYZ (SMB) \u2014 lost on price; ${competitor} offered 60% discount`,
        copyable: true,
      },
    ],
  };
}

function packagingKit(competitor: string): ExecutionKit {
  return {
    type: 'packaging',
    generated_at: iso(3),
    components: [
      {
        title: 'Pricing Comparison Table',
        content: `| Tier | Us | ${competitor} |\n|---|---|---|\n| Free | 5 users, core features | 3 users, limited features |\n| Pro | $49/user/mo, unlimited | $59/user/mo, 50 seat cap |\n| Enterprise | Custom | Custom, add-on billing |\n\n**Key difference:** Our Pro tier is 17% cheaper with no seat cap.`,
        copyable: true,
      },
      {
        title: 'Value Reframe Script',
        content: `When ${competitor}\u2019s pricing comes up:\n\n"Their headline price looks similar, but the total cost diverges quickly. With us, SSO and audit logs are included in Pro \u2014 ${competitor} gates them behind Enterprise. For a 100-person team, that\u2019s ~$40k/year in hidden uplift."`,
        copyable: true,
      },
      {
        title: 'Internal Impact Brief',
        content: `${competitor} restructured pricing on Feb 1. Their new packaging bundles AI features into a separate "AI+" add-on ($20/user/mo). This creates an opening: we include AI features at every tier.\n\n**Recommended action:** Emphasise "AI included at every tier" in all outbound messaging.`,
        copyable: true,
      },
      {
        title: 'Packaging Counter-Move Options',
        content: `**Option A (low effort):** Update comparison page to highlight gated features.\n**Option B (medium effort):** Create a savings calculator landing page.\n**Option C (high effort):** Introduce a new "Team" tier that undercuts their Pro.`,
        copyable: true,
      },
    ],
  };
}

function riskKit(competitor: string): ExecutionKit {
  return {
    type: 'risk',
    generated_at: iso(1),
    components: [
      {
        title: 'Risk Severity Assessment',
        content: `**Threat level: HIGH**\n\n${competitor} announced an acquisition that adds [capability] to their platform. If integrated within 6 months, this closes a key differentiator for us.\n\n**Affected segments:** Mid-market SaaS, fintech vertical\n**At-risk ARR:** ~$2.4M across 18 accounts`,
        copyable: true,
      },
      {
        title: 'Customer Retention Playbook',
        content: `### Proactive outreach plan\n1. **Tier 1 (top 5 accounts):** CSM + AE co-call within 48 hrs. Offer early access to our upcoming [feature].\n2. **Tier 2 (next 13 accounts):** Personalised email from CSM acknowledging the news, reinforcing roadmap.\n3. **All accounts:** Publish a "What this means for you" blog post (draft attached).`,
        copyable: true,
      },
      {
        title: 'Internal Escalation Brief',
        content: `**For: VP Product, CRO**\n\n${competitor}\u2019s move signals intent to compete directly on [capability]. We recommend accelerating our Q2 roadmap item by 4 weeks and briefing the board at the next session.`,
        copyable: true,
      },
      {
        title: 'Defensive Positioning Moves',
        content: `1. Ship a lightweight version of [feature] as a beta within 30 days\n2. Publish a thought-leadership piece reframing the category around our unique strengths\n3. Arm CS with a 1-pager comparing our native approach vs ${competitor}\u2019s bolt-on acquisition`,
        copyable: true,
      },
    ],
  };
}

function launchKit(competitor: string): ExecutionKit {
  return {
    type: 'launch',
    generated_at: iso(1),
    components: [
      {
        title: 'Launch Impact Assessment',
        content: `${competitor} launched a new product line targeting our core segment. Initial reception is positive on HN and Twitter.\n\n**Impact:** Medium-High. Expected to appear in 30-40% of competitive deals within 60 days.\n**Our exposure:** Mid-market accounts evaluating alternatives in Q1.`,
        copyable: true,
      },
      {
        title: 'Rapid Response Draft',
        content: `**Blog post draft (internal review):**\n\n"Today, ${competitor} announced [product]. We welcome more innovation in the space. Here\u2019s why our approach \u2014 built from the ground up for [differentiator] \u2014 continues to be the right choice for teams who value [key benefit]."`,
        copyable: true,
      },
      {
        title: 'Sales Talking Points',
        content: `- "${competitor}\u2019s new product is brand new \u2014 we have 3 years of production hardening."\n- "They built it via acquisition; integration gaps are inevitable."\n- "Ask prospects: \u2018Which matters more \u2014 a shiny demo or battle-tested reliability?\u2019"`,
        copyable: true,
      },
      {
        title: 'Counter-Narrative Angles',
        content: `| Their narrative | Our counter |\n|---|---|\n| "All-in-one platform" | "Best-of-breed with native integrations" |\n| "AI-powered" | "AI-powered AND transparent \u2014 see our explainability docs" |\n| "Enterprise scale" | "Enterprise scale with startup agility" |`,
        copyable: true,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Full hand-crafted data for 3 key sectors
// ---------------------------------------------------------------------------

const developerToolsCards: ActionBoardCard[] = [
  // ---- INBOX (5 cards, one stale) ----
  makeCard({
    id: 'ab-devtools-001',
    action_text: 'Update positioning to counter Cursor\'s AI-native IDE narrative',
    signal_headline: 'Cursor launches "AI-native IDE" campaign targeting VS Code users',
    decision_type: 'positioning',
    owner_team: 'PMM',
    priority: 'high',
    severity: 4,
    competitor_name: 'Cursor',
    column_status: 'inbox',
    column_order: 0,
    moved_to_inbox_at: iso(2),
    created_at: iso(2),
  }),
  makeCard({
    id: 'ab-devtools-002',
    action_text: 'Arm sales team with Windsurf objection handling',
    signal_headline: 'Windsurf undercuts pricing by 40% in enterprise deals',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'high',
    severity: 4,
    competitor_name: 'Windsurf',
    column_status: 'inbox',
    column_order: 1,
    moved_to_inbox_at: iso(3),
    created_at: iso(3),
  }),
  makeCard({
    id: 'ab-devtools-003',
    action_text: 'Assess risk from Tabnine open-source strategy pivot',
    signal_headline: 'Tabnine open-sources core engine, targets enterprise add-ons',
    decision_type: 'risk',
    owner_team: 'Product',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Tabnine',
    column_status: 'inbox',
    column_order: 2,
    moved_to_inbox_at: iso(5),
    created_at: iso(5),
  }),
  makeCard({
    id: 'ab-devtools-004',
    action_text: 'Evaluate Replit\'s new "Deploy in 1-click" packaging angle',
    signal_headline: 'Replit bundles hosting into free tier to drive adoption',
    decision_type: 'packaging',
    owner_team: 'Product',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Replit',
    column_status: 'inbox',
    column_order: 3,
    moved_to_inbox_at: iso(4),
    created_at: iso(5),
  }),
  makeCard({
    id: 'ab-devtools-005',
    action_text: 'Review Codeium enterprise expansion signals (STALE)',
    signal_headline: 'Codeium signs 3 Fortune 500 deals in Q4',
    decision_type: 'proof',
    owner_team: 'CS',
    priority: 'low',
    severity: 2,
    competitor_name: 'Codeium',
    column_status: 'inbox',
    column_order: 4,
    moved_to_inbox_at: THREE_WEEKS_AGO,
    created_at: THREE_WEEKS_AGO,
  }),

  // ---- THIS WEEK (3 cards with execution kits) ----
  makeCard({
    id: 'ab-devtools-006',
    action_text: 'Ship updated positioning against Cursor\'s enterprise push',
    signal_headline: 'Cursor raises $400M Series C, signals enterprise pivot',
    decision_type: 'positioning',
    owner_team: 'PMM',
    priority: 'high',
    severity: 5,
    competitor_name: 'Cursor',
    column_status: 'this_week',
    column_order: 0,
    moved_to_inbox_at: iso(10),
    moved_to_this_week_at: iso(3),
    execution_kit: positioningKit('Cursor'),
    kit_generated_at: iso(2),
    created_at: iso(10),
  }),
  makeCard({
    id: 'ab-devtools-007',
    action_text: 'Create Windsurf battlecard update for Q1 enablement',
    signal_headline: 'Windsurf announces multi-model support and plugin marketplace',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'high',
    severity: 4,
    competitor_name: 'Windsurf',
    column_status: 'this_week',
    column_order: 1,
    moved_to_inbox_at: iso(8),
    moved_to_this_week_at: iso(2),
    execution_kit: enablementKit('Windsurf'),
    kit_generated_at: iso(1),
    created_at: iso(8),
  }),
  makeCard({
    id: 'ab-devtools-008',
    action_text: 'Counter Replit pricing narrative with value calculator',
    signal_headline: 'Replit drops Pro price to $10/mo, gains SMB traction',
    decision_type: 'packaging',
    owner_team: 'PMM',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Replit',
    column_status: 'this_week',
    column_order: 2,
    moved_to_inbox_at: iso(9),
    moved_to_this_week_at: iso(2),
    execution_kit: packagingKit('Replit'),
    kit_generated_at: iso(2),
    created_at: iso(9),
  }),

  // ---- IN PROGRESS (2 cards) ----
  makeCard({
    id: 'ab-devtools-009',
    action_text: 'Publish case study countering Cursor\'s enterprise proof points',
    signal_headline: 'Cursor publishes Fortune 500 case study on homepage',
    decision_type: 'proof',
    owner_team: 'PMM',
    priority: 'high',
    severity: 4,
    competitor_name: 'Cursor',
    column_status: 'in_progress',
    column_order: 0,
    moved_to_inbox_at: iso(14),
    moved_to_this_week_at: iso(7),
    moved_to_in_progress_at: iso(3),
    assigned_to: 'Sarah K.',
    assigned_at: iso(3),
    notes: 'Draft with design team, ETA Friday',
    created_at: iso(14),
  }),
  makeCard({
    id: 'ab-devtools-010',
    action_text: 'Brief exec team on Tabnine acquisition rumours',
    signal_headline: 'Reports surface of Tabnine in acquisition talks with major cloud provider',
    decision_type: 'risk',
    owner_team: 'Exec',
    priority: 'high',
    severity: 5,
    competitor_name: 'Tabnine',
    column_status: 'in_progress',
    column_order: 1,
    moved_to_inbox_at: iso(6),
    moved_to_this_week_at: iso(4),
    moved_to_in_progress_at: iso(2),
    assigned_to: 'Mike D.',
    assigned_at: iso(2),
    notes: 'Exec brief scheduled for Thursday',
    created_at: iso(6),
  }),

  // ---- DONE (2 cards) ----
  makeCard({
    id: 'ab-devtools-011',
    action_text: 'Update sales battlecard with Codeium competitive intel',
    signal_headline: 'Codeium launches enterprise SSO and audit logging',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Codeium',
    column_status: 'done',
    column_order: 0,
    moved_to_inbox_at: iso(21),
    moved_to_this_week_at: iso(14),
    moved_to_in_progress_at: iso(10),
    moved_to_done_at: iso(5),
    outcome: 'positive',
    outcome_notes: 'Battlecard shipped to 45 AEs. Positive feedback from field.',
    assigned_to: 'Lisa R.',
    assigned_at: iso(14),
    created_at: iso(21),
  }),
  makeCard({
    id: 'ab-devtools-012',
    action_text: 'Launch counter-narrative for Windsurf free-tier announcement',
    signal_headline: 'Windsurf launches unlimited free tier for individual developers',
    decision_type: 'launch',
    owner_team: 'PMM',
    priority: 'high',
    severity: 4,
    competitor_name: 'Windsurf',
    column_status: 'done',
    column_order: 1,
    moved_to_inbox_at: iso(18),
    moved_to_this_week_at: iso(14),
    moved_to_in_progress_at: iso(11),
    moved_to_done_at: iso(7),
    outcome: 'positive',
    outcome_notes: 'Blog post published, 8k views in first 48 hrs. Sales pipeline impact contained.',
    assigned_to: 'Sarah K.',
    assigned_at: iso(14),
    created_at: iso(18),
  }),
];

// ---------------------------------------------------------------------------
// Cybersecurity (hand-crafted)
// ---------------------------------------------------------------------------

const cybersecurityCards: ActionBoardCard[] = [
  // INBOX (5)
  makeCard({
    id: 'ab-cybersec-001',
    action_text: 'Respond to CrowdStrike\'s "platform consolidation" narrative',
    signal_headline: 'CrowdStrike launches Falcon Complete Next-Gen, claims single-pane security',
    decision_type: 'positioning',
    owner_team: 'PMM',
    priority: 'high',
    severity: 5,
    competitor_name: 'CrowdStrike',
    column_status: 'inbox',
    column_order: 0,
    moved_to_inbox_at: iso(1),
    created_at: iso(1),
  }),
  makeCard({
    id: 'ab-cybersec-002',
    action_text: 'Prepare enablement for SentinelOne AI positioning claims',
    signal_headline: 'SentinelOne rebrands around "Purple AI" autonomous SOC narrative',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'high',
    severity: 4,
    competitor_name: 'SentinelOne',
    column_status: 'inbox',
    column_order: 1,
    moved_to_inbox_at: iso(2),
    created_at: iso(2),
  }),
  makeCard({
    id: 'ab-cybersec-003',
    action_text: 'Evaluate Wiz cloud-native security pricing disruption',
    signal_headline: 'Wiz launches $99/asset/yr pricing, targets mid-market CSPM',
    decision_type: 'packaging',
    owner_team: 'Product',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Wiz',
    column_status: 'inbox',
    column_order: 2,
    moved_to_inbox_at: iso(4),
    created_at: iso(4),
  }),
  makeCard({
    id: 'ab-cybersec-004',
    action_text: 'Track Palo Alto XSIAM adoption among shared accounts',
    signal_headline: 'Palo Alto reports 50% QoQ growth in XSIAM bookings',
    decision_type: 'risk',
    owner_team: 'CS',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Palo Alto',
    column_status: 'inbox',
    column_order: 3,
    moved_to_inbox_at: iso(6),
    created_at: iso(6),
  }),
  makeCard({
    id: 'ab-cybersec-005',
    action_text: 'Review Zscaler zero-trust marketing blitz (STALE)',
    signal_headline: 'Zscaler launches "Zero Trust Everywhere" campaign with Gartner endorsement',
    decision_type: 'distribution',
    owner_team: 'PMM',
    priority: 'low',
    severity: 2,
    competitor_name: 'Zscaler',
    column_status: 'inbox',
    column_order: 4,
    moved_to_inbox_at: THREE_WEEKS_AGO,
    created_at: THREE_WEEKS_AGO,
  }),

  // THIS WEEK (3)
  makeCard({
    id: 'ab-cybersec-006',
    action_text: 'Ship counter-positioning for CrowdStrike platform story',
    signal_headline: 'CrowdStrike CEO keynote doubles down on consolidation play',
    decision_type: 'positioning',
    owner_team: 'PMM',
    priority: 'high',
    severity: 5,
    competitor_name: 'CrowdStrike',
    column_status: 'this_week',
    column_order: 0,
    moved_to_inbox_at: iso(10),
    moved_to_this_week_at: iso(3),
    execution_kit: positioningKit('CrowdStrike'),
    kit_generated_at: iso(2),
    created_at: iso(10),
  }),
  makeCard({
    id: 'ab-cybersec-007',
    action_text: 'Arm field team with SentinelOne Purple AI objection deck',
    signal_headline: 'SentinelOne Purple AI wins industry award, gaining mindshare',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'high',
    severity: 4,
    competitor_name: 'SentinelOne',
    column_status: 'this_week',
    column_order: 1,
    moved_to_inbox_at: iso(8),
    moved_to_this_week_at: iso(2),
    execution_kit: enablementKit('SentinelOne'),
    kit_generated_at: iso(1),
    created_at: iso(8),
  }),
  makeCard({
    id: 'ab-cybersec-008',
    action_text: 'Develop risk mitigation plan for Wiz account overlap',
    signal_headline: 'Wiz identified in 6 active enterprise evaluations against us',
    decision_type: 'risk',
    owner_team: 'CS',
    priority: 'high',
    severity: 4,
    competitor_name: 'Wiz',
    column_status: 'this_week',
    column_order: 2,
    moved_to_inbox_at: iso(7),
    moved_to_this_week_at: iso(2),
    execution_kit: riskKit('Wiz'),
    kit_generated_at: iso(1),
    created_at: iso(7),
  }),

  // IN PROGRESS (1)
  makeCard({
    id: 'ab-cybersec-009',
    action_text: 'Publish rapid response to Palo Alto XSIAM launch event',
    signal_headline: 'Palo Alto hosts 2,000-person XSIAM launch event',
    decision_type: 'launch',
    owner_team: 'PMM',
    priority: 'high',
    severity: 4,
    competitor_name: 'Palo Alto',
    column_status: 'in_progress',
    column_order: 0,
    moved_to_inbox_at: iso(12),
    moved_to_this_week_at: iso(6),
    moved_to_in_progress_at: iso(2),
    assigned_to: 'Jordan P.',
    assigned_at: iso(2),
    notes: 'Blog draft in review, publishing Monday',
    created_at: iso(12),
  }),

  // DONE (3)
  makeCard({
    id: 'ab-cybersec-010',
    action_text: 'Update CrowdStrike battlecard after Fal.Con announcements',
    signal_headline: 'CrowdStrike announces 12 new modules at Fal.Con 2025',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'high',
    severity: 4,
    competitor_name: 'CrowdStrike',
    column_status: 'done',
    column_order: 0,
    moved_to_inbox_at: iso(25),
    moved_to_this_week_at: iso(18),
    moved_to_in_progress_at: iso(14),
    moved_to_done_at: iso(8),
    outcome: 'positive',
    outcome_notes: 'Battlecard v7 shipped. Win rate in CrowdStrike deals up 12% MoM.',
    assigned_to: 'Alex M.',
    assigned_at: iso(18),
    created_at: iso(25),
  }),
  makeCard({
    id: 'ab-cybersec-011',
    action_text: 'Repackage mid-market tier to counter Wiz pricing',
    signal_headline: 'Wiz aggressive discounting observed in 4 competitive deals',
    decision_type: 'packaging',
    owner_team: 'Product',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Wiz',
    column_status: 'done',
    column_order: 1,
    moved_to_inbox_at: iso(20),
    moved_to_this_week_at: iso(15),
    moved_to_in_progress_at: iso(12),
    moved_to_done_at: iso(6),
    outcome: 'positive',
    outcome_notes: 'New mid-market bundle launched. Early pipeline feedback positive.',
    assigned_to: 'Chris T.',
    assigned_at: iso(15),
    created_at: iso(20),
  }),
  makeCard({
    id: 'ab-cybersec-012',
    action_text: 'Run proof-point campaign against SentinelOne AI claims',
    signal_headline: 'SentinelOne publishes misleading benchmark comparison',
    decision_type: 'proof',
    owner_team: 'PMM',
    priority: 'medium',
    severity: 3,
    competitor_name: 'SentinelOne',
    column_status: 'done',
    column_order: 2,
    moved_to_inbox_at: iso(22),
    moved_to_this_week_at: iso(16),
    moved_to_in_progress_at: iso(13),
    moved_to_done_at: iso(7),
    outcome: 'neutral',
    outcome_notes: 'Counter-benchmarks published but limited traction. Revisit distribution.',
    assigned_to: 'Jordan P.',
    assigned_at: iso(16),
    created_at: iso(22),
  }),
];

// ---------------------------------------------------------------------------
// Product Analytics (hand-crafted)
// ---------------------------------------------------------------------------

const productAnalyticsCards: ActionBoardCard[] = [
  // INBOX (5)
  makeCard({
    id: 'ab-prodanalytics-001',
    action_text: 'Counter Amplitude\'s "digital analytics platform" repositioning',
    signal_headline: 'Amplitude rebrands from product analytics to digital analytics platform',
    decision_type: 'positioning',
    owner_team: 'PMM',
    priority: 'high',
    severity: 4,
    competitor_name: 'Amplitude',
    column_status: 'inbox',
    column_order: 0,
    moved_to_inbox_at: iso(1),
    created_at: iso(1),
  }),
  makeCard({
    id: 'ab-prodanalytics-002',
    action_text: 'Prepare sales team for PostHog open-source objections',
    signal_headline: 'PostHog crosses 50k GitHub stars, dominates OSS analytics narrative',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'high',
    severity: 4,
    competitor_name: 'PostHog',
    column_status: 'inbox',
    column_order: 1,
    moved_to_inbox_at: iso(3),
    created_at: iso(3),
  }),
  makeCard({
    id: 'ab-prodanalytics-003',
    action_text: 'Analyze Mixpanel pricing restructure impact on mid-market',
    signal_headline: 'Mixpanel moves to event-based pricing with generous free tier',
    decision_type: 'packaging',
    owner_team: 'Product',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Mixpanel',
    column_status: 'inbox',
    column_order: 2,
    moved_to_inbox_at: iso(4),
    created_at: iso(4),
  }),
  makeCard({
    id: 'ab-prodanalytics-004',
    action_text: 'Assess Pendo\'s product-led growth suite expansion',
    signal_headline: 'Pendo acquires in-app messaging startup, bundles into platform',
    decision_type: 'risk',
    owner_team: 'Product',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Pendo',
    column_status: 'inbox',
    column_order: 3,
    moved_to_inbox_at: iso(5),
    created_at: iso(5),
  }),
  makeCard({
    id: 'ab-prodanalytics-005',
    action_text: 'Track Heap autocapture messaging evolution (STALE)',
    signal_headline: 'Heap doubles down on "no-code analytics" tagline in Q4 campaigns',
    decision_type: 'distribution',
    owner_team: 'PMM',
    priority: 'low',
    severity: 2,
    competitor_name: 'Heap',
    column_status: 'inbox',
    column_order: 4,
    moved_to_inbox_at: THREE_WEEKS_AGO,
    created_at: THREE_WEEKS_AGO,
  }),

  // THIS WEEK (2)
  makeCard({
    id: 'ab-prodanalytics-006',
    action_text: 'Publish counter-positioning to Amplitude\'s platform expansion',
    signal_headline: 'Amplitude announces session replay, moving into FullStory territory',
    decision_type: 'positioning',
    owner_team: 'PMM',
    priority: 'high',
    severity: 5,
    competitor_name: 'Amplitude',
    column_status: 'this_week',
    column_order: 0,
    moved_to_inbox_at: iso(10),
    moved_to_this_week_at: iso(3),
    execution_kit: positioningKit('Amplitude'),
    kit_generated_at: iso(2),
    created_at: iso(10),
  }),
  makeCard({
    id: 'ab-prodanalytics-007',
    action_text: 'Create PostHog vs. Us comparison page for inbound SEO',
    signal_headline: 'PostHog comparison pages outranking us on "best product analytics"',
    decision_type: 'distribution',
    owner_team: 'PMM',
    priority: 'medium',
    severity: 3,
    competitor_name: 'PostHog',
    column_status: 'this_week',
    column_order: 1,
    moved_to_inbox_at: iso(9),
    moved_to_this_week_at: iso(2),
    execution_kit: {
      type: 'distribution',
      generated_at: iso(1),
      components: [
        {
          title: 'Channel Gap Analysis',
          content: 'PostHog dominates organic search for "open-source analytics" and "PostHog vs [competitor]" queries. We rank on page 2+ for most comparison terms.\n\n**Gap:** No dedicated comparison landing pages. PostHog has 12; we have 0.\n**Opportunity:** Creating 5 high-quality comparison pages could capture ~3,200 monthly visits.',
          copyable: true,
        },
        {
          title: 'Integration Priority Brief',
          content: 'PostHog\'s integration directory lists 45+ integrations. Our gap: no native Segment, RudderStack, or Vercel integrations documented.\n\n**Recommendation:** Prioritise Segment and Vercel integration docs within 2 weeks.',
          copyable: true,
        },
        {
          title: 'Partnership Outreach Draft',
          content: 'Draft email to Segment partnership team:\n\n"Hi [Name], we\'d love to explore a co-marketing opportunity around our new native integration. We see strong overlap in our customer base and think a joint webinar could drive mutual pipeline..."',
          copyable: true,
        },
        {
          title: 'GTM Co-Marketing Angle',
          content: '**Proposed angle:** "Product Analytics + CDP: The Modern Stack"\n\nJoint content with Segment/RudderStack positioning both tools as the new standard for data-driven product teams.',
          copyable: true,
        },
      ],
    },
    kit_generated_at: iso(1),
    created_at: iso(9),
  }),

  // IN PROGRESS (2)
  makeCard({
    id: 'ab-prodanalytics-008',
    action_text: 'Build Mixpanel pricing comparison calculator',
    signal_headline: 'Mixpanel\'s new pricing undercuts us at 10M events/mo tier',
    decision_type: 'packaging',
    owner_team: 'Product',
    priority: 'high',
    severity: 4,
    competitor_name: 'Mixpanel',
    column_status: 'in_progress',
    column_order: 0,
    moved_to_inbox_at: iso(12),
    moved_to_this_week_at: iso(7),
    moved_to_in_progress_at: iso(3),
    assigned_to: 'Priya S.',
    assigned_at: iso(3),
    notes: 'Calculator MVP in staging, need design review',
    created_at: iso(12),
  }),
  makeCard({
    id: 'ab-prodanalytics-009',
    action_text: 'Gather customer proof points to counter Pendo case studies',
    signal_headline: 'Pendo publishes 3 new enterprise case studies with ROI data',
    decision_type: 'proof',
    owner_team: 'CS',
    priority: 'medium',
    severity: 3,
    competitor_name: 'Pendo',
    column_status: 'in_progress',
    column_order: 1,
    moved_to_inbox_at: iso(10),
    moved_to_this_week_at: iso(6),
    moved_to_in_progress_at: iso(2),
    assigned_to: 'Ravi K.',
    assigned_at: iso(2),
    notes: '2 of 3 customer interviews scheduled',
    created_at: iso(10),
  }),

  // DONE (3)
  makeCard({
    id: 'ab-prodanalytics-010',
    action_text: 'Ship enablement deck for Amplitude enterprise deals',
    signal_headline: 'Amplitude wins 3 deals in our target segment',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'high',
    severity: 4,
    competitor_name: 'Amplitude',
    column_status: 'done',
    column_order: 0,
    moved_to_inbox_at: iso(24),
    moved_to_this_week_at: iso(18),
    moved_to_in_progress_at: iso(14),
    moved_to_done_at: iso(8),
    outcome: 'positive',
    outcome_notes: 'Enablement deck adopted by 38 AEs. Win rate vs Amplitude up 8%.',
    assigned_to: 'Priya S.',
    assigned_at: iso(18),
    created_at: iso(24),
  }),
  makeCard({
    id: 'ab-prodanalytics-011',
    action_text: 'Launch "Why not PostHog" blog series',
    signal_headline: 'PostHog CEO tweets thread disparaging commercial analytics tools',
    decision_type: 'launch',
    owner_team: 'PMM',
    priority: 'medium',
    severity: 3,
    competitor_name: 'PostHog',
    column_status: 'done',
    column_order: 1,
    moved_to_inbox_at: iso(20),
    moved_to_this_week_at: iso(14),
    moved_to_in_progress_at: iso(10),
    moved_to_done_at: iso(5),
    outcome: 'positive',
    outcome_notes: 'Blog series generated 15k views and 200+ MQLs in first week.',
    assigned_to: 'Ana B.',
    assigned_at: iso(14),
    created_at: iso(20),
  }),
  makeCard({
    id: 'ab-prodanalytics-012',
    action_text: 'Hire senior PMM to own analytics competitive program',
    signal_headline: 'Amplitude and Mixpanel both scaling competitive teams aggressively',
    decision_type: 'hiring',
    owner_team: 'Exec',
    priority: 'medium',
    severity: 2,
    competitor_name: 'Amplitude',
    column_status: 'done',
    column_order: 2,
    moved_to_inbox_at: iso(30),
    moved_to_this_week_at: iso(24),
    moved_to_in_progress_at: iso(20),
    moved_to_done_at: iso(10),
    outcome: 'positive',
    outcome_notes: 'Offer accepted. New hire starts March 1.',
    assigned_to: 'VP PMM',
    assigned_at: iso(24),
    created_at: iso(30),
  }),
];

// ---------------------------------------------------------------------------
// Generic sector card generator (for the remaining 12 sectors)
// ---------------------------------------------------------------------------

const GENERIC_ACTION_TEMPLATES: {
  column: BoardColumn;
  decision_type: KitDecisionType;
  owner_team: string;
  priority: 'high' | 'medium' | 'low';
  severity: number;
  action: (c: string) => string;
  headline: (c: string) => string;
}[] = [
  // INBOX (5)
  {
    column: 'inbox',
    decision_type: 'positioning',
    owner_team: 'PMM',
    priority: 'high',
    severity: 4,
    action: (c) => `Counter ${c}'s updated market positioning`,
    headline: (c) => `${c} launches new brand campaign targeting our core segment`,
  },
  {
    column: 'inbox',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'high',
    severity: 4,
    action: (c) => `Arm sales team with ${c} objection handling`,
    headline: (c) => `${c} undercuts pricing in recent competitive deals`,
  },
  {
    column: 'inbox',
    decision_type: 'risk',
    owner_team: 'Product',
    priority: 'medium',
    severity: 3,
    action: (c) => `Assess risk from ${c}'s latest product expansion`,
    headline: (c) => `${c} announces new product capabilities in our core area`,
  },
  {
    column: 'inbox',
    decision_type: 'packaging',
    owner_team: 'Product',
    priority: 'medium',
    severity: 3,
    action: (c) => `Evaluate ${c}'s new pricing and packaging changes`,
    headline: (c) => `${c} restructures pricing tiers, targets mid-market`,
  },
  {
    column: 'inbox',
    decision_type: 'proof',
    owner_team: 'CS',
    priority: 'low',
    severity: 2,
    action: (c) => `Review ${c} enterprise traction signals (STALE)`,
    headline: (c) => `${c} publishes new enterprise case studies`,
  },
  // THIS WEEK (3)
  {
    column: 'this_week',
    decision_type: 'positioning',
    owner_team: 'PMM',
    priority: 'high',
    severity: 5,
    action: (c) => `Ship updated positioning against ${c}'s narrative shift`,
    headline: (c) => `${c} CEO keynote reveals major strategic pivot`,
  },
  {
    column: 'this_week',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'high',
    severity: 4,
    action: (c) => `Create ${c} battlecard update for field team`,
    headline: (c) => `${c} launches new features that overlap with our roadmap`,
  },
  {
    column: 'this_week',
    decision_type: 'packaging',
    owner_team: 'PMM',
    priority: 'medium',
    severity: 3,
    action: (c) => `Counter ${c}'s pricing narrative with value analysis`,
    headline: (c) => `${c} drops prices aggressively in target segment`,
  },
  // IN PROGRESS (2)
  {
    column: 'in_progress',
    decision_type: 'launch',
    owner_team: 'PMM',
    priority: 'high',
    severity: 4,
    action: (c) => `Publish rapid response to ${c}'s product launch`,
    headline: (c) => `${c} launches major product update with significant press coverage`,
  },
  {
    column: 'in_progress',
    decision_type: 'risk',
    owner_team: 'Exec',
    priority: 'high',
    severity: 5,
    action: (c) => `Brief leadership on ${c}'s strategic moves`,
    headline: (c) => `${c} raises large funding round, signals aggressive expansion`,
  },
  // DONE (2)
  {
    column: 'done',
    decision_type: 'enablement',
    owner_team: 'Sales',
    priority: 'medium',
    severity: 3,
    action: (c) => `Ship ${c} competitive battlecard to sales team`,
    headline: (c) => `${c} identified in increasing number of competitive deals`,
  },
  {
    column: 'done',
    decision_type: 'proof',
    owner_team: 'PMM',
    priority: 'medium',
    severity: 3,
    action: (c) => `Publish counter proof-points to ${c}'s case studies`,
    headline: (c) => `${c} publishes misleading customer success metrics`,
  },
];

const ASSIGNEES = ['Sarah K.', 'Mike D.', 'Lisa R.', 'Jordan P.', 'Alex M.', 'Chris T.', 'Priya S.', 'Ravi K.', 'Ana B.'];

function kitForTemplate(
  dt: KitDecisionType,
  competitor: string,
): ExecutionKit {
  switch (dt) {
    case 'positioning':
      return positioningKit(competitor);
    case 'enablement':
      return enablementKit(competitor);
    case 'packaging':
      return packagingKit(competitor);
    case 'risk':
      return riskKit(competitor);
    case 'launch':
      return launchKit(competitor);
    default:
      return positioningKit(competitor);
  }
}

function generateSectorCards(
  slug: string,
  competitors: string[],
): ActionBoardCard[] {
  const cards: ActionBoardCard[] = [];
  const inboxOrder = { inbox: 0, this_week: 0, in_progress: 0, done: 0 };

  GENERIC_ACTION_TEMPLATES.forEach((tpl, idx) => {
    const competitor = competitors[idx % competitors.length];
    const cardId = `ab-${slug}-${String(idx + 1).padStart(3, '0')}`;
    const order = inboxOrder[tpl.column]++;

    const isStale = tpl.column === 'inbox' && idx === 4;
    const isThisWeek = tpl.column === 'this_week';
    const isInProgress = tpl.column === 'in_progress';
    const isDone = tpl.column === 'done';

    const card = makeCard({
      id: cardId,
      action_text: tpl.action(competitor),
      signal_headline: tpl.headline(competitor),
      decision_type: tpl.decision_type,
      owner_team: tpl.owner_team,
      priority: tpl.priority,
      severity: tpl.severity,
      competitor_name: competitor,
      column_status: tpl.column,
      column_order: order,
      moved_to_inbox_at: isStale ? THREE_WEEKS_AGO : iso(12 - idx),
      created_at: isStale ? THREE_WEEKS_AGO : iso(14 - idx),
      moved_to_this_week_at: isThisWeek || isInProgress || isDone ? iso(7 - idx % 4) : null,
      moved_to_in_progress_at: isInProgress || isDone ? iso(4 - idx % 3) : null,
      moved_to_done_at: isDone ? iso(2 - idx % 2) : null,
      assigned_to: isInProgress || isDone ? ASSIGNEES[idx % ASSIGNEES.length] : null,
      assigned_at: isInProgress || isDone ? iso(5) : null,
      notes: isInProgress ? 'In progress \u2014 on track for this week' : null,
      execution_kit: isThisWeek ? kitForTemplate(tpl.decision_type, competitor) : null,
      kit_generated_at: isThisWeek ? iso(2) : null,
      outcome: isDone ? (idx % 3 === 0 ? 'neutral' : 'positive') : null,
      outcome_notes: isDone ? `Action completed. Positive impact observed in pipeline metrics.` : null,
    });

    cards.push(card);
  });

  return cards;
}

// ---------------------------------------------------------------------------
// Competitor map for generated sectors
// ---------------------------------------------------------------------------

const SECTOR_COMPETITORS: Record<string, string[]> = {
  'sales-engagement': ['Outreach', 'SalesLoft', 'Apollo', 'Gong', 'Clari'],
  'customer-success': ['Gainsight', 'ChurnZero', 'Totango', 'Vitally', 'Planhat'],
  'marketing-automation': ['HubSpot', 'Marketo', 'Pardot', 'ActiveCampaign', 'Brevo'],
  'data-infrastructure': ['Snowflake', 'Databricks', 'Fivetran', 'dbt', 'Airbyte'],
  'fintech-infrastructure': ['Stripe', 'Plaid', 'Adyen', 'Square', 'Marqeta'],
  'hr-tech': ['Workday', 'Rippling', 'BambooHR', 'Gusto', 'Deel'],
  'collaboration': ['Slack', 'Notion', 'Asana', 'Monday', 'ClickUp'],
  'cloud-infrastructure': ['AWS', 'Azure', 'GCP', 'DigitalOcean', 'Vercel'],
  'ai-ml-platforms': ['OpenAI', 'Anthropic', 'Cohere', 'Hugging Face', 'Replicate'],
  'devops-observability': ['Datadog', 'Grafana', 'New Relic', 'Splunk', 'Dynatrace'],
  'ecommerce-platforms': ['Shopify', 'BigCommerce', 'WooCommerce', 'Magento', 'Medusa'],
  'nocode-lowcode': ['Bubble', 'Webflow', 'Retool', 'Appsmith', 'Glide'],
};

// ---------------------------------------------------------------------------
// Assemble the full export
// ---------------------------------------------------------------------------

export const DEMO_BOARD_CARDS: Record<string, ActionBoardCard[]> = {
  'developer-tools': developerToolsCards,
  'cybersecurity': cybersecurityCards,
  'product-analytics': productAnalyticsCards,
  ...Object.fromEntries(
    Object.entries(SECTOR_COMPETITORS).map(([slug, competitors]) => [
      slug,
      generateSectorCards(slug, competitors),
    ]),
  ),
};
