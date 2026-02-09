import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How is this different from Klue or Crayon?",
    answer:
      "Klue and Crayon are content aggregation platforms — they collect competitive content and let your team curate it manually. Control Plane is decision infrastructure. It scores every signal automatically, enforces per-category caps, maps each signal to a decision type and owner, and tracks its own predictions against outcomes. The output is a structured weekly decision packet delivered to Slack, Notion, or email — not a dashboard to interpret.",
  },
  {
    question: "Where does the data come from?",
    answer:
      "Public sources only. Competitor websites, pricing pages, changelogs, review platforms, job boards, partnership announcements, marketplace listings, and published case studies. No scraping behind paywalls. Every signal links to its source.",
  },
  {
    question: "How often are signals updated?",
    answer:
      "Weekly. Every Monday, Control Plane delivers a new decision packet to your connected channels — Slack, Notion, or email. Monitoring runs continuously, but intelligence is packaged weekly — frequent enough to catch shifts early, structured enough to be actionable.",
  },
  {
    question: "What does 'evidence-grade' mean?",
    answer:
      "Every claim links to a source. Every prediction includes a confidence level and gets scored against actual outcomes. Evidence-grade means verifiable and accountable — not analyst opinion.",
  },
  {
    question: "Is AI involved?",
    answer:
      "Yes. LLM agents handle signal analysis and narrative synthesis. Scoring, category caps, and decision routing are deterministic — fixed rules, not AI guesswork. The system is automated infrastructure with human-designed editorial judgment built in.",
  },
  {
    question: "How do I bring Control Plane to my team?",
    answer:
      "Sign up and add your competitors — your first packet ships next Monday. Connect Slack or Notion so the whole team gets it automatically. No setup calls, no integration work. The system runs itself from day one.",
  },
  {
    question: "Can I see a sample decision packet?",
    answer:
      "Yes — click 'Live Demo' in the nav to browse real packets with full structure: executive summary, key shifts, open questions, 90-day hypotheses, and signal detail. You can also email any packet to yourself or download it as Markdown.",
  },
  {
    question: "How does internal company data plug in?",
    answer:
      "Today, Control Plane monitors public competitor signals and accepts internal data through manual submission and CSV upload — paste a Gong snippet, support ticket, or win/loss note directly into the platform. The system processes internal signals through the same scoring engine as external ones, making your weekly packets increasingly customized to your competitive landscape.",
  },
  {
    question: "I already use Clay. Do I need this?",
    answer:
      "Yes — they solve different problems. Clay enriches accounts and contacts: who to sell to, what tech they use, whether they just raised funding. Control Plane monitors what competitors are doing: messaging changes, pricing edits, positioning shifts, narrative pivots. Clay tells your reps who to call. Control Plane tells them what to say when the prospect asks 'why not Competitor X?' Teams that use both have enrichment and intelligence covered.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-28 px-6 border-t border-border/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Direct answers. No hedging.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                <AccordionTrigger className="text-left text-[15px] font-medium text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
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
