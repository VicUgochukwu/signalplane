import { Swords, MessageSquareQuote, FileText } from "lucide-react";

const artifacts = [
  {
    icon: Swords,
    title: "Battlecards",
    description: "Per-competitor battlecards with what changed this week, talk tracks, landmines, and win/lose themes. One card per competitor, updated weekly.",
  },
  {
    icon: MessageSquareQuote,
    title: "Objection Library",
    description: "Buyer objections ranked by frequency with full rebuttal frameworks: acknowledge, reframe, proof, and talk track. Tagged by persona and category.",
  },
  {
    icon: FileText,
    title: "Buyer Language Swipe File",
    description: "Exact phrases buyers use, tagged by persona and funnel stage. Trend-labeled: rising, stable, or fading.",
  },
];

export function ArtifactsSection() {
  return (
    <section className="py-12 px-6 border-t border-border">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="font-mono text-2xl font-bold text-foreground mb-3">
            Operational Artifacts
          </h2>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Three self-updating artifacts generated from each week's signals. All versioned. All ready to use Monday morning.
          </p>
        </div>

        {/* Artifact cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {artifacts.map((artifact) => (
            <div
              key={artifact.title}
              className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <artifact.icon className="w-5 h-5 text-primary mb-3" />
              <h4 className="font-mono font-bold text-foreground mb-2">
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
