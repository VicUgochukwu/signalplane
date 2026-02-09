import { Target, Crosshair, TrendingUp } from "lucide-react";

const personas = [
  {
    icon: Target,
    role: "Marketing Leaders",
    problem: "Positioning decisions based on stale quarterly decks and Slack hearsay",
    outcome:
      "Weekly evidence-linked packets with severity-ranked signals and prediction accuracy you can show the board.",
  },
  {
    icon: Crosshair,
    role: "Product Marketing",
    problem: "Manual competitor tracking — checking websites, G2, changelogs between cycles",
    outcome:
      "Automated monitoring across 10+ signal types with structured battlecards, objection libraries, and buyer language delivered every Monday.",
  },
  {
    icon: TrendingUp,
    role: "Revenue & Sales",
    problem: "Reps using six-month-old battlecards while competitors ship changes weekly",
    outcome:
      "Weekly battlecards with what changed this week, fresh talk tracks, landmines, and win/lose themes from live signal data.",
  },
];

export function WhoItsForSection() {
  return (
    <section aria-label="Who Control Plane is built for" className="py-20 md:py-28 px-6 border-t border-border/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Built for GTM leaders
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            For the people who own go-to-market decisions and need evidence to make them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <article
              key={persona.role}
              className="p-6 rounded-xl border border-border/60 bg-card/30 hover:border-primary/20 transition-all duration-200"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-5">
                <persona.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {persona.role}
              </h3>
              <p className="text-sm text-muted-foreground/70 mb-4 italic">
                {persona.problem}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {persona.outcome}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
