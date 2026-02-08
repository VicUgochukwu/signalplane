import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactSection() {
  return (
    <section id="contact" className="py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
          Start getting weekly intel packets
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Stand up Control Plane for your GTM team in 60 days. Week 1, your
          first competitive snapshot. By week 8, a self-running intelligence
          product.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link to="/login">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 h-11 text-sm font-medium"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a
            href="https://calendly.com/victorugochukwu"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 h-11 text-sm font-medium border-border hover:bg-muted/50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book a Call
            </Button>
          </a>
        </div>

        <p className="text-sm text-muted-foreground">
          Or reach out at{" "}
          <a
            href="mailto:hello@signalplane.dev"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            hello@signalplane.dev
          </a>
        </p>
      </div>
    </section>
  );
}
