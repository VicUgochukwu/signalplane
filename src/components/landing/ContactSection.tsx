import { Mail, Linkedin, Calendar } from "lucide-react";
import { InlineWidget } from "react-calendly";

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
];

export function ContactSection() {
  return (
    <section id="contact" className="py-20 px-6 border-t border-border">
      <div className="max-w-content mx-auto text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Let's talk
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          If this is the kind of thinking your team needs, I'd like to hear what you're building.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
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

        {/* Calendly embed using official React component */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Book a call
          </h3>
          <div className="rounded-lg overflow-hidden">
            <InlineWidget
              url="https://calendly.com/victorugochukwu"
              styles={{ height: '700px', minWidth: '320px' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
