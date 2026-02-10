import { IconPersonaMarketing, IconPersonaPMM, IconPersonaRevenue } from "@/components/icons";

/**
 * ICP leads sourced from ControlPlane_Messaging_Guide Section 8,
 * updated with new product capabilities (Action Board, Execution Kits,
 * Intelligence Overview / compounding score).
 *
 * The subtitle uses the "CEO angle" — addressing the person who
 * sets GTM strategy without naming the title explicitly.
 */

const personas = [
  {
    icon: IconPersonaMarketing,
    role: "Marketing Leaders",
    question: "Will this make my team's decisions better?",
    pain: "Your competitive intelligence is opinion-grade. Positioning decisions are based on stale quarterly decks and Slack hearsay. Your competitor repositioned last week and your team found out from a prospect.",
    relief:
      "Control Plane makes it evidence-grade. A severity-ranked decision packet ships every Monday with the exact messaging changes, pricing shifts, and narrative pivots your competitors made — with source links your board can trust. The Judgment Loop tracks prediction accuracy so you can measure whether the intelligence is actually improving decisions.",
    metric: "Evidence your board can verify. Accuracy you can measure.",
  },
  {
    icon: IconPersonaPMM,
    role: "Product Marketing",
    question: "Will this replace the quarterly deck process?",
    pain: "Stop building quarterly decks that go stale the week they ship. You're manually checking competitor websites, G2, and changelogs between cycles. By the time you update battlecards, the intel is already obsolete.",
    relief:
      "10+ automated monitors replace what is currently manual weekly trawling. Fresh battlecards, a living objection library, and buyer language swipe files ship alongside every packet. The Action Board replaces your 'what do we do about this' triage with a structured decision pipeline and AI-generated execution kits.",
    metric: "Spend less time tracking. More time on positioning decisions.",
  },
  {
    icon: IconPersonaRevenue,
    role: "Revenue & Sales Leaders",
    question: "Will this help close more deals?",
    pain: "Your reps are losing deals because their competitive intel is three months old. When a prospect says 'why not Competitor X?', they're guessing — and the buyer can tell.",
    relief:
      "Weekly battlecards with exactly what changed, fresh talk tracks, competitive landmines to avoid, and win/loss themes from live signal data. A frequency-ranked objection library with full rebuttal frameworks, refreshed weekly from live buyer language. Your reps show up prepared, every deal.",
    metric: "Every rep armed with this week's competitive reality.",
  },
];

export function WhoItsForSection() {
  return (
    <section id="who-its-for" aria-label="Who Control Plane is built for" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Left-aligned header for visual rhythm */}
        <div className="max-w-xl mb-16">
          <div className="text-xs font-medium text-primary mb-3 tracking-wider uppercase">
            Built For
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Built for the people who own go-to-market
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you lead marketing, own the number, or set go-to-market strategy —
            stale intel is costing you deals, cycles, and credibility with the board.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <article
              key={persona.role}
              className="group p-6 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] hover:border-primary/30 dark:bg-card/30 dark:border-border/60 dark:shadow-none dark:hover:shadow-none dark:hover:border-primary/20 transition-all duration-200 flex flex-col"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-4">
                <persona.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {persona.role}
              </h3>
              <p className="text-xs text-primary/80 italic mb-4">
                "{persona.question}"
              </p>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {persona.pain}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {persona.relief}
              </p>
              <div className="mt-5 pt-4 border-t border-border dark:border-border/30">
                <p className="text-xs font-medium text-primary">{persona.metric}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
