import { ArrowRight, Activity, LineChart, Users, Radar, AlertTriangle, TrendingDown, DollarSign, Shield, Share2, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { WeeklyPacketCarousel } from "./WeeklyPacketCarousel";

const coreSignalSources = [
  {
    icon: Activity,
    name: "Messaging Diff Tracker",
    description: "Monitors competitor messaging changes on a weekly cadence across home, pricing, and product pages. Classifies each change by severity and strategic intent. Every shift is evidence-linked.",
  },
  {
    icon: LineChart,
    name: "Narrative Drift Monitor",
    description: "Tracks which market narratives are gaining momentum and which are fading. Detects repeated claims, emerging language patterns, and theme adoption across public content surfaces.",
  },
  {
    icon: Users,
    name: "ICP Drift Monitor",
    description: "Identifies when a company is quietly changing who it sells to. Reads language, proof points, packaging cues, and compliance signals to surface targeting shifts before they become obvious.",
  },
  {
    icon: Radar,
    name: "Horizon Lane",
    description: "Curates early signals from platform shifts, distribution changes, buyer risk events, and category formation. Caps output at 3 promoted items per week to stay low-noise.",
  },
];

const extendedIntelligenceLayer = [
  {
    icon: AlertTriangle,
    name: "Objection Tracker",
    description: "Monitors objection language across public surfaces: reviews, docs, FAQs, comparison pages, support content. Flags when new objections emerge, frequency spikes, or a competitor reframes one.",
  },
  {
    icon: TrendingDown,
    name: "Launch Decay Analyzer",
    description: "Tracks what happens after a launch. Monitors follow-on edits to messaging, pricing, packaging, and positioning post-announcement. Flags when initial momentum fades or second-wave reframing begins.",
  },
  {
    icon: DollarSign,
    name: "Pricing Drift Monitor",
    description: "Goes beyond copy diffs on pricing pages. Tracks gating changes, new usage limits, seat mechanics, enterprise packaging hooks, and plan restructuring as high-intent strategy signals.",
  },
  {
    icon: Shield,
    name: "Proof & Trust Monitor",
    description: "Tracks case studies, logo walls, compliance claims, and security posture messaging. Surfaces when proof shifts to new industries, buyer personas, or procurement readiness signals.",
  },
  {
    icon: Share2,
    name: "Distribution Move Monitor",
    description: "Monitors integrations, partnerships, marketplace listings, and co-selling motion cues. Flags when distribution leverage increases or category adjacency expands.",
  },
  {
    icon: Briefcase,
    name: "Hiring Signal Monitor",
    description: "Pattern-based monitoring of job postings from tracked companies. Detects when repeated role clusters indicate strategic investment shifts, like a surge in solutions engineers or enterprise AEs.",
  },
];

export function SignalPlaneSection() {
  return (
    <section id="work" className="py-20 px-6">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <div className="mb-12">
          <h2 className="font-mono text-2xl font-bold text-foreground mb-3">
            Signal Plane
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            10 signal systems feeding one weekly decision packet. All built on public data. All running.
          </p>
        </div>

        {/* Weekly Packet Carousel */}
        <WeeklyPacketCarousel />

        {/* Control Plane description */}
        <p className="text-muted-foreground leading-relaxed mb-12 max-w-2xl">
          Control Plane v1 reads the last 7 days of signals across all sources, ranks them by severity and strategic weight, and synthesizes a structured weekly packet: executive summary, key shifts, open questions, and 90-day hypotheses. Every claim links back to its source.
        </p>

        {/* Tier 1: Core Signal Sources */}
        <div className="mb-12">
          <h3 className="font-mono text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Core Signal Sources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coreSignalSources.map((source) => (
              <div
                key={source.name}
                className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <source.icon className="w-5 h-5 text-primary mb-4" />
                <h4 className="font-mono font-semibold text-foreground mb-2">
                  {source.name}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {source.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tier 2: Extended Intelligence Layer */}
        <div className="mb-12">
          <h3 className="font-mono text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Extended Intelligence Layer
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extendedIntelligenceLayer.map((source) => (
              <div
                key={source.name}
                className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <source.icon className="w-5 h-5 text-primary mb-4" />
                <h4 className="font-mono font-semibold text-foreground mb-2">
                  {source.name}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {source.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          to="/control-plane"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
        >
          View all weekly packets
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
