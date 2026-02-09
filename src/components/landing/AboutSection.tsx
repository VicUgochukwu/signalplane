const principles = [
  {
    title: "Infrastructure over decks",
    description:
      "Competitive intelligence should be infrastructure, not a quarterly deck that goes stale the week it ships.",
  },
  {
    title: "Evidence over opinion",
    description:
      "Every claim is a hypothesis. If it cannot be traced to a source, it does not go in the packet.",
  },
  {
    title: "Invisible PMM work",
    description:
      "The best PMM work is invisible. If the team is making better decisions and they're not sure why, positioning is doing its job.",
  },
  {
    title: "Ship over plan",
    description:
      "A working system on Tuesday beats a strategy deck on Friday.",
  },
];

export function AboutSection() {
  return (
    <section id="about" aria-label="About Signal Plane" className="py-20 md:py-28 px-6 border-t border-border/50">
      <div className="max-w-5xl mx-auto">
        {/* Origin story */}
        <div className="text-center mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">
            Built by a PMM who got tired of stale intel
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4 max-w-2xl mx-auto">
            Signal Plane brings a decade of B2B SaaS go-to-market experience
            across product marketing, competitive intelligence, and revenue
            enablement. Control Plane is the system we wished existed when we were
            running competitive programs manually — now anyone can use it.
          </p>
        </div>

        {/* Operating principles (merged from ApproachSection) */}
        <div id="approach">
          <h3 className="text-xl font-bold text-foreground mb-8 text-center tracking-tight">
            Operating principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {principles.map((p) => (
              <div key={p.title}>
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
