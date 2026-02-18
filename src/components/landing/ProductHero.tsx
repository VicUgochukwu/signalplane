import { Link } from "react-router-dom";
import { ArrowRight, Play, Zap, Target, TrendingUp, Users } from "lucide-react";

export function ProductHero() {
  return (
    <section aria-label="Product overview" className="pt-24 pb-8 md:pt-32 md:pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 lg:gap-12 items-center">
          {/* Left — headline + CTAs (55% column) */}
          <div className="hero-animate max-w-xl">
            {/* Category badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-badge bg-accent-signal/10 border border-accent-signal/20 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-signal animate-glow-pulse" />
              <span className="text-[11px] font-mono font-medium text-accent-signal tracking-widest uppercase">
                GTM Decision Infrastructure
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-bold text-foreground leading-[1.08] tracking-tight mb-5"
              style={{ fontSize: 'var(--text-display)' }}
            >
              Every week, your GTM team makes decisions based on what they heard last.
            </h1>

            {/* Value prop — second line */}
            <p className="text-xl md:text-2xl font-semibold text-accent-signal mb-6">
              Control Plane replaces hearsay with evidence.
            </p>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              10+ automated monitors track every competitor move. A structured decision packet
              ships every Monday — evidence-linked, severity-ranked, mapped to owners.
            </p>

            {/* CTAs — btn-primary (custom) + btn-secondary */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
              <Link to="/login" className="btn-primary text-sm px-7 py-3">
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <a href="#demo-sectors" className="btn-secondary text-sm px-7 py-3">
                <Play className="w-4 h-4 mr-2 fill-current" />
                See Live Demo
              </a>
            </div>

            <p className="text-[12px] font-mono text-muted-foreground tracking-wide">
              No credit card required. First packet ships next Monday.
            </p>
          </div>

          {/* Right — packet preview card (45% column) with perspective tilt */}
          <div className="hidden lg:block" style={{ perspective: '1200px', opacity: 0, animation: 'heroEntrance 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.5s forwards' }}>
            <div
              className="card-intel p-6 border border-border/60 dark:border-border/40"
              style={{
                transform: 'rotateY(-3deg) rotateX(1deg)',
                borderLeft: '3px solid hsl(var(--accent-signal))',
                borderRadius: '6px',
              }}
            >
              {/* Packet header */}
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-accent-signal animate-pulse" />
                <span className="text-sm font-semibold text-foreground">
                  Weekly Decision Packet
                </span>
                <span className="ml-auto badge-severity badge-severity--medium text-[10px] px-2 py-0.5">
                  Ships Monday
                </span>
              </div>

              {/* Packet sections */}
              <div className="space-y-2.5 text-sm">
                {[
                  {
                    icon: Zap,
                    label: "EXECUTIVE SUMMARY",
                    desc: "3-7 key competitive shifts from this week",
                    severity: "high",
                  },
                  {
                    icon: Target,
                    label: "KEY SHIFTS",
                    desc: "Messaging, pricing, and ICP changes ranked by impact",
                    severity: "high",
                  },
                  {
                    icon: TrendingUp,
                    label: "90-DAY HYPOTHESES",
                    desc: "Testable predictions with confidence levels",
                    severity: "medium",
                  },
                  {
                    icon: Users,
                    label: "ACTION MAP",
                    desc: "Owner-assigned decisions with execution playbooks",
                    severity: "medium",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-3 rounded-card bg-surface/50 dark:bg-background/50 border border-border/40 dark:border-border/20"
                  >
                    <item.icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        item.severity === "high"
                          ? "text-accent-severity"
                          : "text-accent-signal"
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-accent-signal">
                        {item.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Packet footer */}
              <div className="mt-4 pt-4 border-t border-border/40 dark:border-border/20 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                  <span>
                    <strong className="text-foreground">25+</strong> signals
                  </span>
                  <span>
                    <strong className="text-foreground">100%</strong> sourced
                  </span>
                </div>
                <span className="evidence-link text-[10px]">
                  Evidence-grade
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
