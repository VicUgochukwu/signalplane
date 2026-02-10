import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * FAQ — objection handling + "What Control Plane Is Not" framing
 * from ControlPlane_Messaging_Guide Sections 2.3 and 9.
 *
 * Updated with Action Board, Execution Kits, and the full
 * opinion-grade vs evidence-grade contrast frame.
 */

const faqs = [
  {
    question: "How is this different from Klue, Crayon, or Kompyte?",
    answer:
      "Klue, Crayon, and Kompyte are competitive intelligence tools — they aggregate content and require manual curation. Control Plane is decision infrastructure. It scores every signal automatically, enforces per-category caps, maps each signal to a decision type and owner, and tracks its own predictions against outcomes. The output is a structured weekly decision packet — not a dashboard to interpret. The Action Board then turns insights into assigned, time-bound decisions with AI-generated execution kits. No other CI product closes the loop from signal to team action.",
  },
  {
    question: "Is this a dashboard? A reporting tool? An alert system?",
    answer:
      "None of the above. Dashboards display data and require a human to synthesize — Control Plane delivers the synthesis with evidence attached. Reports summarize the past — Control Plane predicts the future and tracks whether those predictions were right. Alerts fire on raw signals — Control Plane scores, caps, and contextualizes signals before they reach anyone. It applies editorial judgment, not just detection.",
  },
  {
    question: "Where does the data come from?",
    answer:
      "Public sources only. Competitor websites, pricing pages, changelogs, review platforms, job boards, partnership announcements, marketplace listings, and published case studies. No scraping behind paywalls. Every signal links to its source — so your team can verify any claim before acting on it.",
  },
  {
    question: "How quickly can we get started?",
    answer:
      "Minutes. Sign up, add your competitors, connect Slack or Notion. Your first decision packet ships next Monday. No setup calls, no integration work, no onboarding required. The system runs itself from day one.",
  },
  {
    question: "What does 'evidence-grade' mean?",
    answer:
      "Most competitive intelligence is opinion-grade: analyst summaries, quarterly decks, hallway conversations. Evidence-grade means every claim links to a source, every prediction includes a confidence level and gets scored against actual outcomes, and every recommendation maps to a decision type and owner. It is verifiable and accountable — something you can present to the board, not analyst opinion.",
  },
  {
    question: "What is the Action Board?",
    answer:
      "The Action Board is a Kanban-style decision pipeline that turns weekly intelligence into team actions. Cards are auto-populated from each packet. Your team triages decisions from Inbox → Triaged → This Week → Done. Each card can generate an execution kit — a step-by-step playbook tailored to the specific decision type (reposition, defend, equip, respond, etc.). Intelligence without execution is just trivia. The Action Board closes the gap.",
  },
  {
    question: "Is AI involved?",
    answer:
      "Yes. LLM agents handle signal analysis, narrative synthesis, and execution kit generation. Scoring, category caps, and decision routing are deterministic — fixed rules, not AI guesswork. The system is automated infrastructure with human-designed editorial judgment built in. Every claim is a hypothesis. If it cannot be traced to a source, it does not go in the packet.",
  },
  {
    question: "Can I see it working before signing up?",
    answer:
      "Yes — click 'Live Demo' to browse real intelligence packets across 15 industry sectors with full structure: executive summary, key shifts, artifacts, and the Action Board. No signup required.",
  },
  {
    question: "How does internal company data plug in?",
    answer:
      "Control Plane monitors public competitor signals and accepts internal data through manual submission and CSV upload — Gong snippets, support tickets, win/loss notes. Internal signals are processed through the same scoring engine, making your weekly packets increasingly customized to your competitive reality.",
  },
  {
    question: "We already use Clay / HubSpot / Salesforce. Do we need this?",
    answer:
      "Yes — they solve different problems. Clay enriches accounts (who to sell to). HubSpot and Salesforce manage pipeline (where to sell). Control Plane monitors what competitors are doing (what to say when a prospect asks 'why not Competitor X?'). Teams that use Control Plane alongside their existing stack close the last gap: real-time competitive intelligence turned into weekly team decisions.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" aria-label="Frequently asked questions" className="py-20 md:py-28 px-6 bg-[hsl(var(--section-alt))] dark:bg-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Centered header — visual rhythm break from left-aligned sections */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Direct answers. No hedging.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border dark:border-border/50">
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
