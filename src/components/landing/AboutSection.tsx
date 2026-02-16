const principles = [
  {
    title: "Infrastructure over decks",
    accent: "var(--accent-signal)",
    description:
      "Competitive intelligence should be infrastructure that ships every week, not a quarterly deck that goes stale the day it lands.",
  },
  {
    title: "Evidence over opinion",
    accent: "var(--accent-evidence)",
    description:
      "Every claim is a hypothesis. If it cannot be traced to a source, it does not go in the packet. Your board deserves better than gut feel.",
  },
  {
    title: "Execution over insight",
    accent: "var(--accent-severity)",
    description:
      "Intelligence without a next step is just trivia. Every signal maps to a decision type, an owner, and a timeline.",
  },
  {
    title: "Ship over plan",
    accent: "var(--accent-predict)",
    description:
      "A working system on Tuesday beats a strategy deck on Friday. Speed of response is a competitive advantage.",
  },
];

export function AboutSection() {
  return (
    <section id="about" aria-label="About Signal Plane Studio" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Origin story — asymmetric two-column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start mb-20">
          <div>
            <div className="font-mono text-[11px] font-medium text-accent-signal mb-3 tracking-widest uppercase">
              Origin
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">
              Built by a PMM who got tired of stale intel
            </h2>
          </div>
          <div>
            <p className="text-muted-foreground leading-relaxed">
              Control Plane was born from a decade of running competitive programs manually —
              checking websites, building decks that went stale, and watching reps lose deals
              they should have won. Built by Signal Plane, a studio focused on GTM infrastructure,
              it's the system we wished existed: automated, evidence-linked,
              and designed for the people who own go-to-market decisions.
            </p>
          </div>
        </div>

        {/* Operating principles — left-aligned header + 2x2 grid of card-intel cards */}
        <div>
          <div className="max-w-md mb-10">
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              How we think about intelligence
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principles.map((p) => (
              <div
                key={p.title}
                className="card-intel p-5"
                style={{ borderLeftColor: `hsl(${p.accent})` }}
              >
                <h4 className="font-semibold text-foreground mb-2">{p.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
