import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactSection() {
  return (
    <section id="contact" className="py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
          Start getting weekly intel — where your team works
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Sign up, add your competitors, and connect Slack or Notion. Your first
          decision packet ships next Monday.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
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

        <p className="text-sm text-muted-foreground mb-6">
          Or reach out at{" "}
          <a
            href="mailto:hello@signalplane.dev"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            hello@signalplane.dev
          </a>
        </p>

        <p className="text-xs text-muted-foreground/60 mb-6">
          Works alongside Clay, HubSpot, Salesforce, Gong, and your existing GTM stack.
        </p>

        <div className="pt-6 border-t border-border/30">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Enterprise teams:</span>{" "}
            Need custom signal sources, dedicated integrations, or a white-label instance?{" "}
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
