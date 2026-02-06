import { TrendingUp, Database } from "lucide-react";

const compoundingFeatures = [
  {
    icon: TrendingUp,
    title: "Judgment Loop",
    description: "Each weekly packet includes 2–5 testable predictions with confidence levels. The following week, predictions are scored against actual outcomes. Over time, this creates a verifiable record of decision quality. No other competitive intelligence product tracks its own accuracy.",
  },
  {
    icon: Database,
    title: "GTM Memory",
    description: "Durable knowledge objects — objections, buyer phrases, proof points, competitive positions — persist across weeks and link to the signals that created or updated them. The system never re-learns the same pattern. Intelligence compounds.",
  },
];

export function CompoundingSection() {
  return (
    <section className="py-12 px-6 border-t border-border">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="font-mono text-2xl font-bold text-foreground mb-3">
            Intelligence That Compounds
          </h2>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Most competitive intel resets every quarter. Control Plane remembers everything and tracks whether its predictions were right.
          </p>
        </div>

        {/* Compounding feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {compoundingFeatures.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-lg border border-border bg-card border-l-4 border-l-primary/20"
            >
              <feature.icon className="w-5 h-5 text-primary mb-3" />
              <h4 className="font-mono font-bold text-foreground mb-3">
                {feature.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
