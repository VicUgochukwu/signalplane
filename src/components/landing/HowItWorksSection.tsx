import { IconCollect, IconScoreFilter, IconWeeklyPacket } from "@/components/icons";

const steps = [
  {
    number: "01",
    icon: IconCollect,
    title: "Collect",
    description:
      "10+ automated monitors scan public competitor signals weekly — messaging changes, pricing edits, narrative shifts, hiring patterns, and more. Integrate your own data from Gong, win/loss notes, and tools like Clay.",
  },
  {
    number: "02",
    icon: IconScoreFilter,
    title: "Score & Prioritize",
    description:
      "Every signal is scored on severity, recency, confidence, and source quality. Category caps prevent noise. Only the highest-impact signals make the cut — so your team acts on what matters, not everything.",
  },
  {
    number: "03",
    icon: IconWeeklyPacket,
    title: "Deliver & Act",
    description:
      "Every Monday, a structured decision packet ships to Slack, Notion, or email. Key shifts are mapped to owners. Decisions flow to the Action Board where your team triages, assigns, and executes.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-label="How Control Plane works" className="py-20 md:py-28 px-6 bg-[hsl(var(--section-alt))] dark:bg-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Left-aligned header */}
        <div className="max-w-xl mb-16">
          <div className="text-xs font-medium text-primary mb-3 tracking-wider uppercase">
            How It Works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            From raw signals to team decisions in three steps
          </h2>
          <p className="text-lg text-muted-foreground">
            Public signals in. Prioritized, owner-mapped intelligence out. Every Monday.
          </p>
        </div>

        {/* Steps as cards with numbering */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step) => (
            <div key={step.number} className="relative p-6 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] hover:border-primary/30 dark:bg-card/30 dark:border-border/60 dark:shadow-none dark:hover:shadow-none dark:hover:border-primary/20 transition-all duration-200">
              {/* Step number watermark */}
              <span className="absolute top-4 right-5 text-5xl font-bold text-muted-foreground/[0.08] tabular-nums select-none">
                {step.number}
              </span>
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
