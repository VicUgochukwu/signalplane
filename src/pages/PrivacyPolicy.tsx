import { Link } from "react-router-dom";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <main className="max-w-content mx-auto px-6 py-24">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: February 7, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Introduction
            </h2>
            <p>
              Signal Plane ("we", "us", or "our") respects your privacy and is
              committed to protecting your personal data. This Privacy Policy
              explains how we collect, use, and safeguard your information when
              you visit our website at signalplane.dev (the "Site").
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Information We Collect
            </h2>
            <p className="mb-3">We may collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-foreground font-medium">
                  Information you provide:
                </span>{" "}
                When you contact us via email or schedule a call through
                Calendly, you may provide your name, email address, and any
                details you include in your message.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Automatically collected data:
                </span>{" "}
                We may collect technical data such as your IP address, browser
                type, operating system, referring URLs, pages visited, and time
                spent on the Site. This data is collected through cookies and
                similar technologies as described in our{" "}
                <Link
                  to="/cookie-policy"
                  className="text-primary hover:underline"
                >
                  Cookie Policy
                </Link>
                .
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Usage data:
                </span>{" "}
                We may collect anonymized analytics data about how visitors
                interact with the Site to improve our content and user
                experience.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              How We Use Your Information
            </h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide and maintain the Site</li>
              <li>Respond to your inquiries and communications</li>
              <li>Analyze usage patterns to improve the Site</li>
              <li>
                Send you information relevant to your inquiry, with your consent
              </li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Legal Basis for Processing
            </h2>
            <p className="mb-3">
              We process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-foreground font-medium">Consent:</span>{" "}
                When you provide your data voluntarily (e.g., contacting us or
                accepting cookies).
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Legitimate interest:
                </span>{" "}
                To operate and improve the Site, and to understand how visitors
                use it.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Legal obligation:
                </span>{" "}
                When required to comply with applicable law.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Data Sharing and Disclosure
            </h2>
            <p className="mb-3">
              We do not sell your personal data. We may share your data with:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-foreground font-medium">
                  Service providers:
                </span>{" "}
                Third-party services that help us operate the Site (e.g.,
                hosting, analytics, scheduling). These providers only process
                data on our behalf and under our instructions.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Legal requirements:
                </span>{" "}
                When required by law, regulation, or legal process.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Third-Party Services
            </h2>
            <p>
              The Site integrates with third-party services including Calendly
              (for scheduling) and LinkedIn (for professional networking). These
              services have their own privacy policies, and we encourage you to
              review them. We are not responsible for the privacy practices of
              third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Data Retention
            </h2>
            <p>
              We retain personal data only for as long as necessary to fulfill
              the purposes described in this policy, unless a longer retention
              period is required by law. Cookie consent preferences are stored
              locally on your device for up to one year.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Your Rights
            </h2>
            <p className="mb-3">
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-foreground font-medium">Access:</span> The
                right to request a copy of the personal data we hold about you.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Correction:
                </span>{" "}
                The right to request correction of inaccurate data.
              </li>
              <li>
                <span className="text-foreground font-medium">Deletion:</span>{" "}
                The right to request deletion of your personal data.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Restriction:
                </span>{" "}
                The right to request that we restrict processing of your data.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Portability:
                </span>{" "}
                The right to receive your data in a structured, commonly used
                format.
              </li>
              <li>
                <span className="text-foreground font-medium">Objection:</span>{" "}
                The right to object to processing based on legitimate interest.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:hello@signalplane.dev"
                className="text-primary hover:underline"
              >
                hello@signalplane.dev
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access, alteration,
              disclosure, or destruction. However, no method of transmission over
              the Internet is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Children's Privacy
            </h2>
            <p>
              The Site is not directed at individuals under the age of 16. We do
              not knowingly collect personal data from children. If you believe
              we have inadvertently collected data from a child, please contact
              us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page with the updated date. We encourage you
              to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Contact Us
            </h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our
              data practices, please contact us at{" "}
              <a
                href="mailto:hello@signalplane.dev"
                className="text-primary hover:underline"
              >
                hello@signalplane.dev
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
