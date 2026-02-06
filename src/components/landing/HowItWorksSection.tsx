import { Antenna, SlidersHorizontal, Package, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "Step 01",
    icon: Antenna,
    title: "Collect",
    description:
      "10 automated monitors scan public competitor signals: messaging changes, narrative shifts, targeting moves, pricing edits, hiring patterns, launch activity, and more. No manual curation. No analyst hours.",
  },
  {
    number: "Step 02",
    icon: SlidersHorizontal,
    title: "Score & Filter",
    description:
      "Every signal is scored on a 0–100 scale across four factors: severity, recency, confidence, and source quality. Per-category caps prevent topic flooding. Only the 25 highest-value signals make the cut.",
  },
  {
    number: "Step 03",
    icon: Package,
    title: "Deliver",
    description:
      "Each Monday, a structured decision packet lands: executive summary, key shifts, open questions, 90-day hypotheses. Every signal maps to a decision type, owner team, recommended asset, and time sensitivity. Ready to act on.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-content mx-auto">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            How Control Plane Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Public signals go in. Scored, capped, and action-mapped intelligence comes out. Every week.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex">
              <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors flex-1">
                <span className="font-mono text-sm text-primary/60 uppercase tracking-wider">
                  {step.number}
                </span>
                <div className="flex justify-center my-4">
                  <step.icon className="w-10 h-10 text-primary/80" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mt-4 text-center">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {step.description}
                </p>
              </div>
              
              {/* Arrow connector - desktop only */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
