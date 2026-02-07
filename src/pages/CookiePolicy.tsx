import { Link } from "react-router-dom";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/Footer";

const CookiePolicy = () => {
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
          Cookie Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: February 7, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              What Are Cookies
            </h2>
            <p>
              Cookies are small text files stored on your device when you visit a
              website. They help the site remember your preferences, understand
              how you use the site, and improve your experience. Signal Plane
              uses cookies and similar tracking technologies as described in this
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              How We Use Cookies
            </h2>
            <p className="mb-3">
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-foreground font-medium">
                  Essential cookies:
                </span>{" "}
                Required for the site to function properly. These enable core
                features like page navigation, access to secure areas, and cookie
                consent preferences. They cannot be disabled.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Analytics cookies:
                </span>{" "}
                Help us understand how visitors interact with the site by
                collecting and reporting information anonymously. This data helps
                us improve site performance and content.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Marketing cookies:
                </span>{" "}
                Used to track visitors across websites to allow the display of
                relevant advertisements. These cookies are set by third-party
                advertising partners.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Personalization cookies:
                </span>{" "}
                Allow the site to remember choices you make (such as your
                preferred language or region) and provide enhanced, more
                personalized features.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Cookies We Use
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 text-foreground font-medium">
                      Cookie
                    </th>
                    <th className="py-2 pr-4 text-foreground font-medium">
                      Type
                    </th>
                    <th className="py-2 pr-4 text-foreground font-medium">
                      Duration
                    </th>
                    <th className="py-2 text-foreground font-medium">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">
                      sp_cookie_consent
                    </td>
                    <td className="py-2 pr-4">Essential</td>
                    <td className="py-2 pr-4">1 year</td>
                    <td className="py-2">
                      Stores your cookie consent preferences
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs">
              This table will be updated as additional cookies are introduced.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Third-Party Cookies
            </h2>
            <p>
              Some cookies are placed by third-party services that appear on our
              pages. We use Calendly for scheduling, which may set its own
              cookies when the booking widget loads. We do not control third-party
              cookies. Please refer to the respective third-party privacy
              policies for more information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Managing Cookies
            </h2>
            <p className="mb-3">
              You can manage your cookie preferences at any time:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-foreground font-medium">
                  Through our cookie banner:
                </span>{" "}
                Click "Customize Cookie Settings" when the banner appears, or
                clear your browser's local storage to trigger it again.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Through your browser:
                </span>{" "}
                Most browsers allow you to block or delete cookies via their
                settings. Note that blocking essential cookies may impact site
                functionality.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Updates to This Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in technology, regulation, or our business practices. Any
              changes will be posted on this page with the updated date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Contact Us
            </h2>
            <p>
              If you have questions about our use of cookies, please contact us
              at{" "}
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

export default CookiePolicy;
