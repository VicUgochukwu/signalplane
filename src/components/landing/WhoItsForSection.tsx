import { Target, Crosshair, TrendingUp } from "lucide-react";

const personas = [
  {
    icon: Target,
    title: "VP of Marketing",
    painPoint:
      "Your competitive intelligence is a quarterly deck that's stale before the ink dries. Your team makes positioning decisions based on the last thing someone heard in a Slack channel.",
    value:
      "Control Plane gives you a weekly evidence-linked decision packet with severity-ranked signals, action mapping, and a prediction accuracy record you can show the board.",
  },
  {
    icon: Crosshair,
    title: "Head of Product Marketing",
    painPoint:
      "You're tracking competitors manually — checking websites, reading changelogs, monitoring G2. It's time-intensive, inconsistent, and you miss things between cycles.",
    value:
      "Control Plane automates the monitoring across 10 signal types and delivers structured artifacts every Monday: updated battlecards, objection library, and buyer language swipe file. All evidence-linked.",
  },
  {
    icon: TrendingUp,
    title: "Revenue & Sales Leader",
    painPoint:
      "Your reps ask for competitive talk tracks and you send them a six-month-old battlecard. Win rates drop because the team doesn't know what changed last week.",
    value:
      "Control Plane produces weekly battlecards with what changed this week, fresh talk tracks, landmines to avoid, and win/lose themes — all generated from live signal data, not opinion.",
  },
];

export function WhoItsForSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-content mx-auto">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Built for GTM Leaders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Control Plane serves the people who own go-to-market decisions and need evidence, not opinions, to make them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <div
              key={persona.title}
              className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="flex justify-center">
                <persona.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mt-4 text-center">
                {persona.title}
              </h3>
              <div className="border-l-2 border-muted-foreground/30 pl-4 mt-4">
                <p className="text-sm text-muted-foreground italic">
                  {persona.painPoint}
                </p>
              </div>
              <p className="text-sm text-foreground mt-4">
                {persona.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
