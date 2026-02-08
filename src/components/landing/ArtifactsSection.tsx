import { Swords, MessageSquareQuote, FileText } from "lucide-react";

const artifacts = [
  {
    icon: Swords,
    title: "Battlecards",
    description:
      "Per-competitor cards with what changed this week, talk tracks, landmines, and win/lose themes. Updated weekly.",
  },
  {
    icon: MessageSquareQuote,
    title: "Objection Library",
    description:
      "Buyer objections ranked by frequency with rebuttal frameworks. Tagged by persona and category.",
  },
  {
    icon: FileText,
    title: "Buyer Language Swipe File",
    description:
      "Exact phrases buyers use, tagged by persona and funnel stage. Trend-labeled: rising, stable, or fading.",
  },
];

export function ArtifactsSection() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Ready-to-use artifacts every Monday
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Three self-updating deliverables generated from each week's signals. All versioned.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {artifacts.map((artifact) => (
            <div
              key={artifact.title}
              className="p-6 rounded-xl border border-border/60 bg-card/30 hover:border-primary/20 transition-all duration-200"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-5">
                <artifact.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                {artifact.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {artifact.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
