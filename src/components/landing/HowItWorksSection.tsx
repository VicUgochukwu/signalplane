import { IconCollect, IconScoreFilter, IconWeeklyPacket } from "@/components/icons";

const steps = [
  {
    number: "01",
    icon: IconCollect,
    title: "Collect",
    description:
      "10+ automated monitors scan public competitor signals weekly — messaging changes, narrative shifts, pricing edits, hiring patterns, and more. Bring your own internal data too: Gong snippets, win/loss notes, and enrichment signals from tools like Clay.",
  },
  {
    number: "02",
    icon: IconScoreFilter,
    title: "Score & Filter",
    description:
      "Every signal is scored 0-100 on severity, recency, confidence, and source quality. Per-category caps prevent noise. Only the top 25 signals make the cut.",
  },
  {
    number: "03",
    icon: IconWeeklyPacket,
    title: "Deliver",
    description:
      "Each Monday, a structured decision packet ships to Slack, Notion, or email — executive summary, key shifts, open questions, and 90-day hypotheses, all mapped to owners and actions.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-label="How Control Plane works" className="py-20 md:py-28 px-6">
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
