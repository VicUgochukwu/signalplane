import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function WeeklyPacketSection() {
  return (
    <section id="intelligence" className="py-12 px-6">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="font-mono text-2xl font-bold text-foreground mb-3">
            The Weekly Decision Packet
          </h2>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Every Monday, Control Plane synthesizes the week's signals into a structured decision packet: executive summary, key shifts, open questions, and 90-day hypotheses. Every claim links to its source. Every packet tells you who should do what and when.
          </p>
        </div>

        {/* Packet Preview Card */}
        <div className="mb-8 p-6 rounded-lg border border-border bg-card shadow-lg">
          <p className="font-mono text-sm text-muted-foreground mb-4">Weekly Decision Packet — Sample</p>
          <div className="font-mono text-xs text-muted-foreground/80 space-y-3">
            <div>
              <span className="text-primary">EXECUTIVE SUMMARY</span>
              <p className="mt-1">3-7 key observations from the week's signals</p>
            </div>
            <div>
              <span className="text-primary">KEY SHIFTS</span>
              <p className="mt-1">Messaging, narrative, ICP, and pricing changes ranked by severity</p>
            </div>
            <div>
              <span className="text-primary">OPEN QUESTIONS</span>
              <p className="mt-1">What to verify next cycle</p>
            </div>
            <div>
              <span className="text-primary">90-DAY HYPOTHESES</span>
              <p className="mt-1">2-3 evidence-linked bets on where the market is heading</p>
            </div>
          </div>
        </div>

        {/* Contrast statement */}
        <blockquote className="border-l-4 border-primary pl-6 mb-8">
          <p className="text-muted-foreground leading-relaxed">
            Most competitive intelligence is opinion-grade: analyst summaries, quarterly decks, hallway conversations. Control Plane is evidence-grade.
          </p>
        </blockquote>

        {/* View all CTA */}
        <Link
          to="/control-plane"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
        >
          View all weekly packets
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
