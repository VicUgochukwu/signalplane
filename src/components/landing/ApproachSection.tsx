const principles = [
  "Competitive intelligence should be infrastructure, not a quarterly deck that goes stale the week it ships.",
  "I treat every claim as a hypothesis. If it cannot be traced to a source, it does not go in the packet.",
  "Shipping matters more than planning. I would rather show you a working system on Tuesday than a strategy deck on Friday.",
];

export function ApproachSection() {
  return (
 <section id="approach" className="py-12 px-6 border-t border-border">
      <div className="max-w-content mx-auto">
         <h2 className="text-xl font-semibold text-foreground mb-8">
          How I think about GTM
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
