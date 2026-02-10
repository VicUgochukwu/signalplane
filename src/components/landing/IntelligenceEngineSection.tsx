import {
  IconMonitorMessaging,
  IconMonitorNarrative,
  IconMonitorTargeting,
  IconMonitorWarning,
  IconMonitorPricing,
  IconMonitorResistance,
  IconMonitorPostLaunch,
  IconMonitorProof,
  IconMonitorChannel,
  IconMonitorHiring,
  IconJudgmentLoop,
  IconCompounding,
} from "@/components/icons";

const monitors = [
  { icon: IconMonitorMessaging, title: "Competitive Messaging", description: "Tracks weekly messaging changes across home, pricing, and product pages." },
  { icon: IconMonitorNarrative, title: "Market Narrative", description: "Detects which narratives are gaining momentum and which are fading." },
  { icon: IconMonitorTargeting, title: "Targeting Shifts", description: "Surfaces when competitors quietly change who they sell to." },
  { icon: IconMonitorWarning, title: "Early Warning", description: "Flags platform shifts, distribution changes, and category formation." },
  { icon: IconMonitorPricing, title: "Pricing & Packaging", description: "Tracks gating changes, usage limits, and plan restructuring signals." },
  { icon: IconMonitorResistance, title: "Buyer Resistance", description: "Monitors objection language across reviews, docs, and comparison pages." },
  { icon: IconMonitorPostLaunch, title: "Post-Launch Intel", description: "Tracks what happens after launches — follow-on edits and momentum shifts." },
  { icon: IconMonitorProof, title: "Social Proof", description: "Surfaces case study shifts, logo wall changes, and compliance claims." },
  { icon: IconMonitorChannel, title: "Channel & Partnerships", description: "Monitors integrations, marketplace listings, and co-selling cues." },
  { icon: IconMonitorHiring, title: "Strategic Hiring", description: "Detects when job posting clusters indicate strategic investment shifts." },
];

export function IntelligenceEngineSection() {
  return (
    <section id="intelligence" aria-label="Intelligence monitoring capabilities" className="py-20 md:py-28 px-6 border-t border-border/50">
      <div className="max-w-5xl mx-auto">
        {/* Monitors */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            10+ automated intelligence monitors
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every monitor runs continuously. Four core systems drive the
            primary intelligence loop. Six extended systems add depth.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-24">
          {monitors.map((monitor) => (
            <div
              key={monitor.title}
              className="group p-5 rounded-xl border border-border/60 bg-card/30 hover:border-primary/20 hover:bg-card/60 transition-all duration-200 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]"
            >
              <monitor.icon className="w-5 h-5 text-primary/80 mb-3 group-hover:text-primary transition-colors" />
              <h4 className="font-semibold text-foreground text-sm mb-1.5">
                {monitor.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {monitor.description}
              </p>
            </div>
          ))}
        </div>

        {/* Compounding intelligence (merged section) */}
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">
            Intelligence that compounds
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Most competitive intel resets every quarter. Control Plane remembers
            everything and tracks whether its predictions were right.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="p-6 rounded-xl border border-border/60 bg-card/30">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-5">
              <IconJudgmentLoop className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Judgment Loop</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each packet includes testable predictions with confidence levels,
              scored against outcomes the following week. Over time, this creates
              a verifiable record of decision quality.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border/60 bg-card/30">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-5">
              <IconCompounding className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">GTM Memory</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Objections, buyer phrases, proof points, and competitive positions
              persist across weeks. The system never re-learns the same pattern.
              Intelligence compounds.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
