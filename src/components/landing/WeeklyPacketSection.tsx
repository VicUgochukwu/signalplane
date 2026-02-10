import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function WeeklyPacketSection() {
  return (
    <section aria-label="Weekly decision packet" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div className="text-xs font-medium text-primary mb-3 tracking-wider uppercase">
              Core Deliverable
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              The Weekly Decision Packet
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every Monday, your team gets a structured brief delivered
              to Slack, Notion, or email — not a dashboard to interpret, but a
              clear answer to "what changed, what it means, and what to do about it."
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Every claim links back to its public source",
                "Signals ranked by severity, not just recency",
                "Action items mapped to owners and timelines",
                "90-day hypotheses tracked against actual outcomes",
                "Ships to Slack, Notion, or email — wherever your team works",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/demo/developer-tools"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
              View a sample packet
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Right — packet preview */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] dark:bg-card/50 dark:shadow-none">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium text-foreground">
                Weekly Decision Packet
              </span>
              <span className="ml-auto text-xs text-muted-foreground">Sample</span>
            </div>
            <div className="space-y-4 text-sm">
              {[
                { label: "EXECUTIVE SUMMARY", desc: "3-7 key competitive observations from the week" },
                { label: "KEY SHIFTS", desc: "Messaging, pricing, and ICP changes ranked by severity" },
                { label: "OPEN QUESTIONS", desc: "What your team should verify next cycle" },
                { label: "90-DAY HYPOTHESES", desc: "Evidence-linked bets on where the market is heading" },
                { label: "ACTION MAP", desc: "Who should do what, by when — with decision type" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-primary tracking-wider">
                      {item.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
