import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

export function ContactSection() {
  return (
    <section id="contact" aria-label="Get started with Control Plane" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="font-mono text-[11px] font-medium text-accent-signal mb-3 tracking-widest uppercase">
          Get Started
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
          Stop finding out about competitor moves from your prospects
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Sign up, add your competitors, and connect Slack or Notion. Your first
          decision packet ships next Monday. No credit card required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link to="/login" className="btn-primary text-sm px-7 py-3">
            Start Free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <a href="#demo-sectors" className="btn-secondary text-sm px-7 py-3">
            <Play className="w-4 h-4 mr-2 fill-current" />
            See Live Demo
          </a>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Questions?{" "}
          <a
            href="mailto:hello@signalplane.dev"
            className="text-accent-signal hover:text-accent-signal/80 transition-colors"
          >
            hello@signalplane.dev
          </a>
        </p>

        <p className="font-mono text-[10px] text-muted-foreground mb-6 uppercase tracking-wider">
          Works alongside Clay, HubSpot, Salesforce, Gong, and your existing GTM stack.
        </p>

        <div className="pt-6 border-t border-border/40 dark:border-border/20">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Enterprise teams:</span>{" "}
            Custom signal sources, dedicated integrations, or white-label?{" "}
            <a
              href="mailto:hello@signalplane.dev?subject=Enterprise%20inquiry"
              className="text-accent-signal hover:text-accent-signal/80 transition-colors"
            >
              Let's talk
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
