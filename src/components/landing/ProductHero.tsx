import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductHero() {
  return (
    <section aria-label="Product overview" className="pt-28 pb-8 md:pt-36 md:pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — headline + CTAs */}
          <div className="max-w-xl">
            {/* Category badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
              <span className="text-xs font-medium text-primary tracking-wide">
                GTM Decision Infrastructure
              </span>
            </div>

            {/* Headline — canonical from all positioning docs */}
            <h1 className="text-4xl md:text-[3.25rem] font-bold text-foreground leading-[1.1] tracking-tight mb-5">
              Every week, your GTM team makes decisions based on what they heard last.
            </h1>

            {/* Value prop — product voice, second line */}
            <p className="text-xl md:text-2xl font-semibold text-primary mb-6">
              Control Plane replaces hearsay with evidence.
            </p>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              10+ automated monitors track every competitor move. A structured decision packet
              ships every Monday — evidence-linked, severity-ranked, mapped to owners.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-7 h-12 text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#demo-sectors">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7 h-12 text-sm font-semibold border-border dark:border-border/60 hover:bg-muted dark:hover:bg-muted/50 transition-all"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  See Live Demo
                </Button>
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              No credit card required. First packet ships next Monday.
            </p>
          </div>

          {/* Right — visual: mini packet preview card */}
          <div className="hidden lg:block">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)] dark:bg-card/40 dark:border-border/60 dark:shadow-xl dark:shadow-black/5">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">
                  Weekly Decision Packet
                </span>
                <span className="ml-auto text-xs text-muted-foreground bg-muted dark:bg-muted/50 px-2 py-0.5 rounded-full">
                  Ships Monday
                </span>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: "EXECUTIVE SUMMARY", desc: "3-7 key competitive shifts from this week", severity: "high" },
                  { label: "KEY SHIFTS", desc: "Messaging, pricing, and ICP changes ranked by impact", severity: "high" },
                  { label: "90-DAY HYPOTHESES", desc: "Testable predictions with confidence levels", severity: "medium" },
                  { label: "ACTION MAP", desc: "Owner-assigned decisions with execution playbooks", severity: "medium" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-background/50 border border-border/60 dark:border-border/30">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                      item.severity === "high" ? "bg-primary" : "bg-primary/50"
                    }`} />
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-primary tracking-wider uppercase">
                        {item.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 dark:border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span><strong className="text-foreground">25+</strong> signals scored</span>
                  <span><strong className="text-foreground">100%</strong> sourced</span>
                </div>
                <span className="text-[10px] text-primary font-medium">Evidence-grade</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
