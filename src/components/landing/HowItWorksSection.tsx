import { Antenna, SlidersHorizontal, Package } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Antenna,
    title: "Collect",
    description:
      "10+ automated monitors scan public competitor signals weekly — messaging changes, narrative shifts, pricing edits, hiring patterns, and more.",
  },
  {
    number: "02",
    icon: SlidersHorizontal,
    title: "Score & Filter",
    description:
      "Every signal is scored 0-100 on severity, recency, confidence, and source quality. Per-category caps prevent noise. Only the top 25 signals make the cut.",
  },
  {
    number: "03",
    icon: Package,
    title: "Deliver",
    description:
      "Each Monday, a structured decision packet lands with executive summary, key shifts, open questions, and 90-day hypotheses — mapped to owners and actions.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Public signals in. Action-mapped intelligence out. Every week.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step) => (
            <div key={step.number} className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-5">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xs font-medium text-primary mb-2 tracking-wider uppercase">
                Step {step.number}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
