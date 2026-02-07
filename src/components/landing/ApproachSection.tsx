const principles = [
  "Competitive intelligence should be infrastructure, not a quarterly deck that goes stale the week it ships.",
  "Every claim is a hypothesis. If it cannot be traced to a source, it does not go in the packet.",
  "The best PMM work is invisible. If the sales team and the exec team are making better decisions and they are not sure why, positioning is doing its job.",
  "Shipping matters more than planning. A working system on Tuesday beats a strategy deck on Friday.",
];

export function ApproachSection() {
  return (
    <section id="approach" className="py-12 px-6 border-t border-border">
      <div className="max-w-content mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-8">
          Operating Principles
        </h2>

        <div className="space-y-6">
          {principles.map((principle, index) => (
            <div
              key={index}
              className="pl-6 border-l-2 border-primary/40"
            >
              <p className="text-muted-foreground leading-relaxed">
                {principle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
