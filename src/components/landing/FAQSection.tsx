import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How is Control Plane different from competitive intelligence tools like Klue or Crayon?",
    answer:
      "Klue and Crayon are content aggregation platforms — they collect competitive content and let your team curate it manually. Control Plane is decision infrastructure. It scores every signal automatically on a 0–100 scale, enforces per-category caps to prevent topic flooding, maps each signal to a decision type and owner, and tracks its own predictions against actual outcomes. The output isn't a dashboard you have to interpret — it's a structured weekly decision packet that tells your team what changed, what it means, what to do, and who should do it.",
  },
  {
    question: "Where does the data come from?",
    answer:
      "Public sources only. Control Plane monitors competitor websites (home pages, pricing pages, product pages, changelogs), review platforms, job boards, partnership announcements, marketplace listings, documentation, and published case studies. No scraping behind paywalls. No proprietary data. Every signal links to its source so you can verify it yourself.",
  },
  {
    question: "How often are signals updated?",
    answer:
      "Weekly. Every Monday, Control Plane delivers a new decision packet covering the previous week's signals. The monitoring runs continuously, but the intelligence is packaged into a weekly cadence — frequent enough to catch competitive shifts early, structured enough to be actionable rather than overwhelming.",
  },
  {
    question: "What does 'evidence-grade' actually mean?",
    answer:
      "It means every claim in a Control Plane packet links to a source. If a battlecard says 'Competitor X dropped their enterprise pricing tier,' that claim links to the specific page change, dated and captured. It also means the system tracks its own predictions: each packet includes testable hypotheses with confidence levels, scored against outcomes the following week. Evidence-grade means verifiable and accountable.",
  },
  {
    question: "Is AI involved? How much is automated vs. human judgment?",
    answer:
      "Control Plane uses Claude (Anthropic's AI) for signal analysis and synthesis within each workflow. The scoring formula, category caps, and decision routing are deterministic — they follow fixed rules, not AI guesswork. The AI generates the narrative synthesis (the executive summary, the interpretation of what a signal means). The human judgment comes from Victor, who designed the scoring weights, the category structure, and the editorial standards. The system is automated infrastructure with human-designed editorial judgment built in.",
  },
  {
    question: "One person built and operates this. What happens if I need it for my team?",
    answer:
      "That's the fractional consulting offer. Victor can stand up a Control Plane instance for your GTM team in 60 days. Week 1, you get your first competitive messaging snapshot. By week 8, you have a self-running intelligence product producing weekly packets, auto-updating battlecards, and a prediction accuracy record. The system runs autonomously after setup — it doesn't require a full-time operator.",
  },
  {
    question: "Can I see a sample decision packet?",
    answer:
      "Yes. Scroll up to the Weekly Decision Packet section and browse through sample packets. You can also view all published packets on the Control Plane page. The packets show real structure: executive summary, key shifts, open questions, 90-day hypotheses, and signal detail. The format is what your team would receive every Monday.",
  },
  {
    question: "What's the tech stack?",
    answer:
      "React and TypeScript frontend, Supabase (PostgreSQL) for persistence and auth, n8n for workflow orchestration, Anthropic Claude for AI-powered analysis, and Tailwind CSS with shadcn/ui for the interface. The signal scoring engine, decision routing, and artifact builders are custom-built. The full system is approximately 33,000 lines of code across 289 files.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 px-6">
      <div className="max-w-content mx-auto">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Direct answers. No hedging.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
