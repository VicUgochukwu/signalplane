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
    accent: "var(--accent-signal)",
    pain: "Your competitive intelligence is opinion-grade. Positioning decisions are based on stale quarterly decks and Slack hearsay. Your competitor repositioned last week and your team found out from a prospect.",
    relief:
      "Control Plane makes it evidence-grade. A severity-ranked decision packet ships every Monday with the exact messaging changes, pricing shifts, and narrative pivots your competitors made — with source links your board can trust. The Judgment Loop tracks prediction accuracy so you can measure whether the intelligence is actually improving decisions.",
    metric: "Evidence your board can verify. Accuracy you can measure.",
  },
  {
    icon: IconPersonaPMM,
    role: "Product Marketing",
    question: "Will this replace the quarterly deck process?",
    accent: "var(--accent-severity)",
    pain: "Stop building quarterly decks that go stale the week they ship. You're manually checking competitor websites, G2, and changelogs between cycles. By the time you update battlecards, the intel is already obsolete.",
    relief:
      "10+ automated monitors replace what is currently manual weekly trawling. Fresh battlecards, a living objection library, and buyer language swipe files ship alongside every packet. The Action Board replaces your 'what do we do about this' triage with a structured decision pipeline and AI-generated execution kits.",
    metric: "Spend less time tracking. More time on positioning decisions.",
  },
  {
    icon: IconPersonaRevenue,
    role: "Revenue & Sales Leaders",
    question: "Will this help close more deals?",
    accent: "var(--accent-evidence)",
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
        {/* Left-aligned header */}
        <div className="max-w-xl mb-16">
          <div className="font-mono text-[11px] font-medium text-accent-signal mb-3 tracking-widest uppercase">
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
              className="card-intel p-6 flex flex-col"
              style={{ borderLeftColor: `hsl(${persona.accent})` }}
            >
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-badge mb-4"
                style={{ background: `hsl(${persona.accent} / 0.1)` }}
              >
                <persona.icon className="w-5 h-5" style={{ color: `hsl(${persona.accent})` }} />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-1">
                {persona.role}
              </h3>

              <p className="text-xs italic mb-4" style={{ color: `hsl(${persona.accent} / 0.8)` }}>
                "{persona.question}"
              </p>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {persona.pain}
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {persona.relief}
              </p>

              <div className="mt-5 pt-4 border-t border-border/30 dark:border-border/20">
                <p className="font-mono text-xs font-medium" style={{ color: `hsl(${persona.accent})` }}>
                  {persona.metric}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
