const buildingItems = [
  {
    name: "Builders",
    description:
      "Self-updating battlecards, a living objection library, and a buyer swipe file. All evidence-linked, all versioned weekly.",
  },
  {
    name: "Judgment Loop",
    description:
      "The system tracks its own predictions each week and scores them against what actually happens. Judgment with a track record, not opinion.",
  },
  {
    name: "Action Mapping",
    description:
      "Every signal routes to a decision type, an owner team, a recommended asset, and a time sensitivity. Intelligence that tells you what to do, not just what changed.",
  },
];

export function BuildingNowSection() {
  return (
    <section className="py-12 px-6">
      <div className="max-w-content mx-auto">
        <h3 className="font-mono text-sm text-muted-foreground mb-3">
          Building now
        </h3>
        <p className="text-sm text-muted-foreground/70 mb-8">
          The next layer turns detection into operational output.
        </p>

        <div className="space-y-6">
          {buildingItems.map((item) => (
            <div key={item.name} className="flex gap-4">
              <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                {item.name}
              </span>
              <span className="text-sm text-muted-foreground/60 leading-relaxed">
                — {item.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
