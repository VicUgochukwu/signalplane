import { Mail, Linkedin, Calendar } from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@signalplane.dev",
    href: "mailto:hello@signalplane.dev",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    value: "Connect on LinkedIn",
    href: "https://linkedin.com/in/victor-ugochukwu",
  },
  {
    icon: Calendar,
    label: "Book a call",
    value: "Schedule on Calendly",
    href: "https://calendly.com/victorugochukwu",
  },
];

export function ContactSection() {
  return (
    <section id="contact" className="py-12 px-6 border-t border-border">
      <div className="max-w-content mx-auto">
        {/* Consultation callout */}
        <div className="bg-card border border-primary/30 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Bring Control Plane to Your Team
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Signal Plane can stand up Control Plane for your GTM team in 60 days. Week 1, your first competitive messaging snapshot. By week 8, a self-running intelligence product producing weekly packets, auto-updating battlecards, and a prediction accuracy record.
          </p>
        </div>

        {/* Contact methods */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Get in Touch
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Ready to bring evidence-grade competitive intelligence to your team? Reach out to discuss how Control Plane can support your GTM strategy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {contactMethods.map((method) => (
              <a
                key={method.label}
                href={method.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <method.icon className="w-5 h-5 text-primary" />
                <span className="text-foreground">{method.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
