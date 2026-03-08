<p align="center">
  <img src="public/signal-plane-icon.png" alt="Control Plane" width="80" />
</p>

<h1 align="center">Control Plane by Signal Plane</h1>

<p align="center">
  <strong>Competitive intelligence that ships every Monday.</strong><br/>
  10 automated monitors. 3 artifact builders. Weekly decision packets.<br/>
  Built for the people who own go-to-market decisions.
</p>

<p align="center">
  <a href="https://signalplane.dev">Website</a> &nbsp;·&nbsp;
  <a href="https://signalplane.dev/demo/fintech">Live Demo</a> &nbsp;·&nbsp;
  <a href="#features">Features</a> &nbsp;·&nbsp;
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-18.3-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/typescript-5.8-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/supabase-realtime-green?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/tailwindcss-3.4-blue?logo=tailwindcss" alt="Tailwind" />
</p>

---

## The Problem

Every week, your GTM team makes positioning, pricing, and messaging decisions based on what they heard last. Competitive intel lives in stale decks, Slack threads, and someone's memory. By the time it reaches a decision-maker, it's opinion — not evidence.

## The Solution

**Control Plane** replaces hearsay with evidence. It monitors competitors across 10+ signal types, scores signals by severity and confidence, and delivers structured weekly decision packets every Monday — complete with battlecards, objection libraries, and buyer swipe files.

> Infrastructure over decks. Evidence over opinion. Execution over insight. Ship over plan.

---

## Features

### Weekly Intelligence Packets
The core deliverable. Every Monday, your team gets a structured decision packet containing:
- **Executive Summary** — 3–7 key competitive shifts from the past week
- **Key Shifts** — Messaging, pricing, and ICP changes ranked by impact
- **90-Day Hypotheses** — Testable predictions with confidence levels
- **Action Map** — Owner-assigned decisions with execution playbooks

### 10+ Automated Monitors
| Monitor | What It Tracks |
|---------|---------------|
| Messaging | Homepage copy, positioning changes, tagline shifts |
| Pricing | Tier changes, feature gating, metric shifts |
| Product | Launch signals, feature releases, deprecations |
| Social | LinkedIn, Twitter/X activity, engagement patterns |
| Talent | Job postings that reveal strategic direction |
| Funding | Raises, acquisitions, partnership announcements |
| Reviews | G2, Trustpilot, app store sentiment shifts |
| Content | Blog posts, case studies, whitepapers |
| Community | Forum activity, developer relations signals |
| Patents | IP filings that reveal R&D direction |

### 3 Living Artifact Builders

**Battlecards** — Auto-updated competitive comparison cards with strengths, weaknesses, counter-positioning, and "how to win" tactics for each competitor.

**Objection Library** — Evidence-backed responses to common sales objections, mapped to competitors and deal stages.

**Buyer Swipe File** — Real language from prospects and customers — pain phrases, desire language, objection patterns, and trigger events.

### Win/Loss Intelligence
- Indicator Explorer — buyer decision signals across won and lost deals
- Pattern Analysis — recurring win/loss reasons with trend tracking
- Decision Map — visual flow of how buyers evaluate and choose
- Churn Tracker — early warning signals from existing customers

### Voice of Customer Research
- Pain and desire trend tracking over time
- Language shift detection (how buyers describe problems)
- Persona reports with evolving criteria
- Market pulse — real-time sentiment monitoring

### Positioning Health
- Health score with historical tracking
- Drift timeline — detect when your messaging diverges from market reality
- Own messaging tracker — monitor your narrative consistency
- Positioning audits with evidence-based recommendations

### Packaging Intelligence
- Competitor pricing change event log
- Category landscape map
- Intelligence briefs for pricing decisions
- Packaging audits with tier-by-tier analysis

### Launch Operations
- Launch registry with phase tracking (pre/during/post)
- Readiness gauge assessment
- Cross-functional timeline management
- Launch brief generation

### Sales Enablement
- Enablement scorecard — coverage gap monitoring
- Artifact feedback collection from reps
- Deal-to-artifact linking
- Content performance tracking

### Action Board
Kanban-style execution tracker — every signal maps to a decision type, an owner, and a timeline.

---

## Architecture

```
┌──────────────────────────────────────────────────────────-┐
│                    Control Plane UI                       │
│              React 18 · TypeScript · Tailwind             │
│                                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │  Weekly     │ │  Artifact  │ │  Win/Loss  │  + 6 more  │
│  │  Packets    │ │  Builders  │ │  Intel     │  modules   │
│  └──────┬─────┘ └──────┬─────┘ └──────┬─────┘             │
│         │              │              │                   │
│         └──────────────┼──────────────┘                   │
│                        │                                  │
│              React Query (cache + sync)                   │
│                        │                                  │
└────────────────────────┼──────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │     Supabase        │
              │  PostgreSQL + Auth  │
              │  Real-time + Edge   │
              │     Functions       │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  n8n Workflows      │
              │  10+ monitors       │
              │  Signal scoring     │
              │  Packet assembly    │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  Anthropic API      │
              │  Signal analysis    │
              │  Artifact generation│
              │  Hypothesis scoring │
              └─────────────────────┘
```

---

## Signal Taxonomy

Signals are scored 0–100 across four dimensions: **severity**, **recency**, **confidence**, and **source quality**.

| Category | Signal Types |
|----------|-------------|
| **External** | social, review, video, code, launch, community, funding, talent, patent |
| **Product** | pricing, proof, distribution, experiment, messaging, positioning, packaging |
| **Sales** | enablement, crm_intel |
| **Win/Loss** | win_pattern, loss_pattern, switch_pattern, trend_shift |
| **VoC** | pain_trend, desire_trend, language_shift, criteria_shift |
| **Positioning** | alignment, differentiation, narrative_fit, drift |
| **Packaging** | tier_change, metric_shift, gate_change, landscape_shift |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5.8, Vite 5.4 |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI (40+ primitives) |
| **State** | TanStack React Query, React Hook Form, Zod |
| **Charts** | Recharts |
| **Drag & Drop** | dnd-kit (Kanban action board) |
| **Backend** | Supabase (PostgreSQL, Auth, Real-time, Edge Functions) |
| **Automation** | n8n (workflow orchestration) |
| **AI** | Anthropic Claude API |
| **Deployment** | Lovable (frontend), Supabase Cloud (backend) |

---

## Who It's For

- **PMMs** who need competitive intelligence that's current, not quarterly
- **Product leaders** making packaging and positioning decisions
- **Sales leaders** who want reps armed with evidence, not opinions
- **Founders** tracking competitive dynamics in fast-moving markets

---

## Live Demo

Explore the full platform with sample data:

**[Launch Live Demo →](https://signalplane.dev/demo/fintech)**

The demo includes all modules — weekly packets, artifacts, win/loss intelligence, positioning health, packaging intel, and the action board — populated with realistic competitive data.

---

## Development

```bash
git clone https://github.com/VicUgochukwu/signalplane.git
cd signalplane
npm install
npm run dev
```

Requires a Supabase project with the schema applied. See `supabase/` for migration files.

---

## About

Built by **[Victor Ugochukwu](https://github.com/VicUgochukwu)** — a PMM who ships software. Control Plane is the system I wished existed: automated, evidence-linked, and designed for the people who own go-to-market decisions.

## License

MIT
