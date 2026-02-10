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
  { icon: IconMonitorNarrative, title: "Market Narrative", description: "Detects which narratives are gaining traction and which are fading." },
  { icon: IconMonitorTargeting, title: "Targeting Shifts", description: "Surfaces when competitors quietly change who they sell to." },
  { icon: IconMonitorWarning, title: "Early Warning", description: "Flags platform shifts, distribution changes, and category formation." },
  { icon: IconMonitorPricing, title: "Pricing & Packaging", description: "Tracks gating changes, usage limits, and plan restructuring signals." },
  { icon: IconMonitorResistance, title: "Buyer Resistance", description: "Monitors objection language across reviews, docs, and comparison pages." },
  { icon: IconMonitorPostLaunch, title: "Post-Launch Intel", description: "Tracks what happens after launches — follow-on edits and momentum." },
  { icon: IconMonitorProof, title: "Social Proof", description: "Surfaces case study shifts, logo wall changes, and compliance claims." },
  { icon: IconMonitorChannel, title: "Channel & Partnerships", description: "Monitors integrations, marketplace listings, and co-selling cues." },
  { icon: IconMonitorHiring, title: "Strategic Hiring", description: "Detects when job posting clusters signal strategic investment shifts." },
];

export function IntelligenceEngineSection() {
  return (
    <section id="intelligence" aria-label="Intelligence monitoring capabilities" className="py-20 md:py-28 px-6 bg-[hsl(var(--section-alt))] dark:bg-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Left-aligned header */}
        <div className="max-w-xl mb-16">
          <div className="text-xs font-medium text-primary mb-3 tracking-wider uppercase">
            Always-On Monitoring
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            10+ monitors tracking every competitive signal
          </h2>
          <p className="text-lg text-muted-foreground">
            Every monitor runs weekly. Four core systems drive the
            primary intelligence loop. Six extended systems add depth across
            channels, hiring, partnerships, and buyer sentiment.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-24">
          {monitors.map((monitor) => (
            <div
              key={monitor.title}
              className="group p-5 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] hover:border-primary/30 hover:shadow-[var(--shadow-soft)] hover:bg-primary/5 dark:bg-card/30 dark:border-border/60 dark:shadow-none dark:hover:shadow-none dark:hover:border-primary/20 dark:hover:bg-card/60 transition-all duration-200 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]"
            >
              <monitor.icon className="w-5 h-5 text-primary mb-3 group-hover:text-primary transition-colors" />
              <h4 className="font-semibold text-foreground text-sm mb-1.5">
                {monitor.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {monitor.description}
              </p>
            </div>
          ))}
        </div>

        {/* Compounding intelligence — asymmetric: right-aligned header with left cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left — cards */}
          <div className="space-y-6 order-2 md:order-1">
            <div className="p-6 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] dark:bg-card/30 dark:border-border/60 dark:shadow-none">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-5">
                <IconJudgmentLoop className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Judgment Loop</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every packet includes testable predictions with confidence levels,
                scored against actual outcomes. Over time, this creates a verifiable
                track record of your team's competitive judgment — something you can
                show the board.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] dark:bg-card/30 dark:border-border/60 dark:shadow-none">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-5">
                <IconCompounding className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">GTM Memory</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Objections, buyer phrases, proof points, and competitive positions
                persist across weeks. The system never re-learns the same pattern.
                Week 12 is dramatically smarter than week 1 — and you can
                measure the difference.
              </p>
            </div>
          </div>

          {/* Right — header text */}
          <div className="order-1 md:order-2 md:sticky md:top-32">
            <div className="text-xs font-medium text-primary mb-3 tracking-wider uppercase">
              Compounding
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">
              Intelligence that compounds — not resets
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Most competitive intel starts from scratch every quarter.
              Control Plane remembers everything, tracks its own predictions, and
              gets measurably smarter over time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
