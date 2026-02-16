import { Link } from "react-router-dom";
import { ArrowRight, Play } from "@phosphor-icons/react";

export function ContactSection() {
  return (
    <section id="contact" aria-label="Get started with Control Plane" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto text-center">
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
            <ArrowRight size={16} weight="bold" className="ml-2" />
          </Link>
          <a href="#demo-sectors" className="btn-secondary text-sm px-7 py-3">
            <Play size={16} weight="duotone" className="mr-2" />
            See Live Demo
          </a>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Questions?{" "}
          <a
            href="mailto:hello@signalplane.dev"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            hello@signalplane.dev
          </a>
        </p>

        <p className="text-xs text-muted-foreground mb-6">
          Works alongside Clay, HubSpot, Salesforce, Gong, and your existing GTM stack.
        </p>

        <div className="pt-6 border-t border-border dark:border-border/30">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Enterprise teams:</span>{" "}
            Custom signal sources, dedicated integrations, or white-label?{" "}
            <a
              href="mailto:hello@signalplane.dev?subject=Enterprise%20inquiry"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Let's talk
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
