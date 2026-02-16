import { IconCollect, IconScoreFilter, IconWeeklyPacket } from "@/components/icons";

const steps = [
  {
    number: "01",
    icon: IconCollect,
    title: "Collect",
    accent: "var(--accent-signal)",
    description:
      "10+ automated monitors scan public competitor signals weekly — messaging changes, pricing edits, narrative shifts, hiring patterns, and more. Integrate your own data from Gong, win/loss notes, and tools like Clay.",
  },
  {
    number: "02",
    icon: IconScoreFilter,
    title: "Score & Prioritize",
    accent: "var(--accent-severity)",
    description:
      "Every signal is scored on severity, recency, confidence, and source quality. Category caps prevent noise. Only the highest-impact signals make the cut — so your team acts on what matters, not everything.",
  },
  {
    number: "03",
    icon: IconWeeklyPacket,
    title: "Deliver & Act",
    accent: "var(--accent-evidence)",
    description:
      "Every Monday, a structured decision packet ships to Slack, Notion, or email. Key shifts are mapped to owners. Decisions flow to the Action Board where your team triages, assigns, and executes.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-label="How Control Plane works" className="py-20 md:py-28 px-6 bg-surface-elevated dark:bg-surface-base">
      <div className="max-w-6xl mx-auto">
        {/* Left-aligned header */}
        <div className="max-w-xl mb-16">
          <div className="font-mono text-[11px] font-medium text-accent-signal mb-3 tracking-widest uppercase">
            How It Works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            From raw signals to team decisions in three steps
          </h2>
          <p className="text-lg text-muted-foreground">
            Public signals in. Prioritized, owner-mapped intelligence out. Every Monday.
          </p>
        </div>

        {/* Steps as card-intel cards with semantic accent borders */}
        <div className="stagger-children grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="animate-on-scroll card-intel relative p-6 hover:translate-y-[-2px] transition-transform duration-200"
              style={{ borderLeftColor: `hsl(${step.accent})` }}
            >
              {/* Step number watermark */}
              <span className="absolute top-4 right-5 font-mono text-5xl font-bold text-muted-foreground/[0.06] tabular-nums select-none">
                {step.number}
              </span>

              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-badge mb-4"
                style={{ background: `hsl(${step.accent} / 0.1)` }}
              >
                <step.icon className="w-5 h-5" style={{ color: `hsl(${step.accent})` }} />
              </div>

              <div className="font-mono text-[11px] font-medium uppercase tracking-widest mb-2"
                   style={{ color: `hsl(${step.accent})` }}>
                Step {step.number}
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-3">
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
