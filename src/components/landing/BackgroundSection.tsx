const skills = [
  "Product Marketing",
  "Competitive Intelligence",
  "GTM Strategy",
  "Positioning",
  "Messaging",
  "Category Design",
  "B2B SaaS",
  "Revenue Marketing",
  "Sales Enablement",
  "GTM Engineering",
];

export function BackgroundSection() {
  return (
 <section id="background" className="py-12 px-6 border-t border-border">
      <div className="max-w-content mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-8">
          Background
        </h2>

        <p className="text-muted-foreground leading-relaxed mb-8 max-w-2xl">
          6+ years in B2B marketing and product marketing across SaaS, developer tools,
          and enterprise software. Experience spans early-stage startups through scaled
          GTM organizations. Based in Lagos, Nigeria, working remotely with global teams.
        </p>

        {/* Skills */}
         <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Focus areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 text-sm text-muted-foreground bg-secondary rounded-md border border-border"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Open to */}
        <div className="p-6 rounded-lg bg-card border-l-4 border-primary">
          <h3 className="font-medium text-foreground mb-3">Open to</h3>
          <p className="text-muted-foreground leading-relaxed">
            Senior PMM roles, GTM strategy, competitive intelligence, and positioning work
            at B2B SaaS companies. Full-time, contract, or advisory. Particularly interested
            in developer tools, security, infrastructure, and vertical SaaS.
          </p>
        </div>
      </div>
    </section>
  );
}
