import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductHero() {
  return (
    <section aria-label="Product overview" className="pt-28 pb-16 md:pt-36 md:pb-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Category badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
          <span className="text-xs font-medium text-primary tracking-wide">
            GTM Intelligence Infrastructure
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-[3.5rem] font-bold text-foreground leading-[1.1] tracking-tight mb-6">
          Competitive intelligence that{" "}
          <span className="text-primary">ships every Monday</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Automated monitors track competitor signals weekly. A structured
          decision packet ships to Slack, Notion, or email every Monday —
          evidence-linked, severity-ranked, ready to act on.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#demo-sectors">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-7 h-12 text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Live Demo
            </Button>
          </a>
          <Link to="/login">
            <Button
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-7 h-12 text-sm font-semibold shadow-lg transition-all"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
