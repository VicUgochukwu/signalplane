import { 
  Activity, 
  LineChart, 
  Users, 
  Radar, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  Shield, 
  Share2, 
  Briefcase 
} from "lucide-react";

const coreMonitors = [
  {
    icon: Activity,
    title: "Competitive Messaging Monitor",
    description: "Monitors competitor messaging changes weekly across home, pricing, and product pages. Classifies each change by severity and strategic intent. Every shift is evidence-linked.",
  },
  {
    icon: LineChart,
    title: "Market Narrative Tracker",
    description: "Tracks which market narratives are gaining momentum and which are fading. Detects repeated claims, emerging language patterns, and theme adoption across public content.",
  },
  {
    icon: Users,
    title: "Targeting Shift Detector",
    description: "Identifies when a company is quietly changing who it sells to. Reads language, proof points, packaging cues, and compliance signals to surface targeting shifts.",
  },
  {
    icon: Radar,
    title: "Early Warning System",
    description: "Curates early signals from platform shifts, distribution changes, buyer risk events, and category formation. Caps output at 3 promoted items per week to stay low-noise.",
  },
];

const extendedMonitors = [
  {
    icon: AlertTriangle,
    title: "Buyer Resistance Monitor",
    description: "Monitors objection language across reviews, docs, FAQs, comparison pages, and support content. Flags frequency spikes and competitor reframing.",
  },
  {
    icon: TrendingDown,
    title: "Post-Launch Intelligence",
    description: "Tracks what happens after a launch. Monitors follow-on messaging, pricing, and positioning edits. Flags when momentum fades or reframing begins.",
  },
  {
    icon: DollarSign,
    title: "Packaging & Pricing Watch",
    description: "Tracks gating changes, usage limits, seat mechanics, enterprise hooks, and plan restructuring as high-intent strategy signals.",
  },
  {
    icon: Shield,
    title: "Social Proof Tracker",
    description: "Tracks case studies, logo walls, compliance claims, and security posture. Surfaces when proof shifts to new industries or personas.",
  },
  {
    icon: Share2,
    title: "Channel & Partnership Watch",
    description: "Monitors integrations, partnerships, marketplace listings, and co-selling cues. Flags when distribution leverage increases.",
  },
  {
    icon: Briefcase,
    title: "Strategic Hiring Radar",
    description: "Pattern-based monitoring of job postings. Detects when role clusters indicate strategic investment shifts.",
  },
];

export function IntelligenceEngineSection() {
  return (
    <section className="py-12 px-6 border-t border-border">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <div className="mb-10">
          <h2 className="font-mono text-2xl font-bold text-foreground mb-3">
            Control Plane's Intelligence Engine
          </h2>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            10 automated systems feeding the weekly packet. Four core monitors run the primary intelligence loop. Six extended systems add depth and compounding value.
          </p>
        </div>

        {/* Tier 1: Core Intelligence */}
        <div className="mb-10">
          <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-6">
            Core Intelligence (Always On)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreMonitors.map((monitor) => (
              <div
                key={monitor.title}
                className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <monitor.icon className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-mono font-bold text-foreground mb-2">
                  {monitor.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {monitor.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tier 2: Extended Intelligence */}
        <div>
          <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-6">
            Extended Intelligence (Depth Layer)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {extendedMonitors.map((monitor) => (
              <div
                key={monitor.title}
                className="p-5 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <monitor.icon className="w-4 h-4 text-primary mb-2" />
                <h4 className="font-mono font-semibold text-foreground text-sm mb-2">
                  {monitor.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {monitor.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
