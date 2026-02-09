/**
 * JSON-LD Structured Data for AI search optimization.
 * Renders Organization, SoftwareApplication, FAQPage, and WebSite schemas.
 */

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Signal Plane",
  url: "https://signalplane.dev",
  logo: "https://signalplane.dev/signal-plane-logo.png",
  description:
    "Signal Plane builds automated competitive intelligence infrastructure for B2B SaaS teams. Its flagship product, Control Plane, delivers weekly decision packets with evidence-linked competitor signals.",
  foundingDate: "2025",
  sameAs: [
    "https://www.linkedin.com/company/signal-plane",
    "https://twitter.com/signalplane",
  ],
};

const SOFTWARE_APPLICATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Control Plane",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web-based",
  url: "https://signalplane.dev",
  description:
    "Automated competitive intelligence for B2B SaaS teams. 10+ monitors track competitor messaging, pricing, hiring, and product changes weekly. Structured decision packets ship to Slack, Notion, or email every Monday — evidence-linked, severity-ranked, ready to act on.",
  featureList: [
    "Automated competitor website monitoring",
    "Weekly decision packets with executive summaries",
    "10+ intelligence monitors (messaging, pricing, hiring, partnerships)",
    "Evidence-linked signals with source citations",
    "Severity scoring (0-100) with per-category caps",
    "90-day hypothesis tracking with prediction accuracy",
    "Slack, Notion, and email delivery",
    "Auto-generated battlecards",
    "Objection library with buyer language",
    "Swipe file for competitive positioning",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to start — first packet ships next Monday",
  },
  provider: {
    "@type": "Organization",
    name: "Signal Plane",
    url: "https://signalplane.dev",
  },
  screenshot: "https://signalplane.dev/signal-plane-logo.png",
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is Control Plane different from Klue or Crayon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Klue and Crayon are content aggregation platforms — they collect competitive content and let your team curate it manually. Control Plane is decision infrastructure. It scores every signal automatically, enforces per-category caps, maps each signal to a decision type and owner, and tracks its own predictions against outcomes. The output is a structured weekly decision packet delivered to Slack, Notion, or email — not a dashboard to interpret.",
      },
    },
    {
      "@type": "Question",
      name: "Where does Control Plane's competitive intelligence data come from?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Public sources only. Competitor websites, pricing pages, changelogs, review platforms, job boards, partnership announcements, marketplace listings, and published case studies. No scraping behind paywalls. Every signal links to its source.",
      },
    },
    {
      "@type": "Question",
      name: "How often are competitor signals updated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Weekly. Every Monday, Control Plane delivers a new decision packet to your connected channels — Slack, Notion, or email. Monitoring runs continuously, but intelligence is packaged weekly — frequent enough to catch shifts early, structured enough to be actionable.",
      },
    },
    {
      "@type": "Question",
      name: "What does evidence-grade competitive intelligence mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every claim links to a source. Every prediction includes a confidence level and gets scored against actual outcomes. Evidence-grade means verifiable and accountable — not analyst opinion.",
      },
    },
    {
      "@type": "Question",
      name: "Does Control Plane use AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. LLM agents handle signal analysis and narrative synthesis. Scoring, category caps, and decision routing are deterministic — fixed rules, not AI guesswork. The system is automated infrastructure with human-designed editorial judgment built in.",
      },
    },
    {
      "@type": "Question",
      name: "How do I set up Control Plane for my team?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sign up and add your competitors — your first packet ships next Monday. Connect Slack or Notion so the whole team gets it automatically. No setup calls, no integration work. The system runs itself from day one.",
      },
    },
    {
      "@type": "Question",
      name: "What is competitive intelligence software?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Competitive intelligence software automatically monitors competitor changes including product updates, pricing shifts, messaging changes, and market positioning. For B2B SaaS companies, it replaces manual competitor tracking with automated systems that detect and report changes weekly, enabling faster go-to-market decisions.",
      },
    },
    {
      "@type": "Question",
      name: "What types of competitor changes should B2B SaaS companies monitor?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "B2B SaaS companies should monitor competitor pricing changes, feature launches, messaging shifts, positioning updates, marketing campaigns, job postings (indicating strategic direction), partnership announcements, and leadership changes. These signals help predict market moves and inform competitive strategy. Control Plane tracks all of these across 10+ automated monitors.",
      },
    },
    {
      "@type": "Question",
      name: "How is Control Plane different from Clay?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "They solve different problems. Clay enriches accounts and contacts: who to sell to, what tech they use, whether they just raised funding. Control Plane monitors what competitors are doing: messaging changes, pricing edits, positioning shifts, narrative pivots. Clay tells your reps who to call. Control Plane tells them what to say when the prospect asks 'why not Competitor X?' Teams that use both have enrichment and intelligence covered.",
      },
    },
  ],
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Signal Plane",
  alternateName: "Control Plane",
  url: "https://signalplane.dev",
  description:
    "Automated competitive intelligence for B2B SaaS teams. Track competitor changes weekly with structured decision packets.",
  publisher: {
    "@type": "Organization",
    name: "Signal Plane",
    url: "https://signalplane.dev",
  },
};

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
      }}
    />
  );
}

export function StructuredData() {
  return (
    <>
      <JsonLdScript data={ORGANIZATION_SCHEMA} />
      <JsonLdScript data={SOFTWARE_APPLICATION_SCHEMA} />
      <JsonLdScript data={FAQ_SCHEMA} />
      <JsonLdScript data={WEBSITE_SCHEMA} />
    </>
  );
}
