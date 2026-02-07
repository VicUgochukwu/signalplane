// LinkedIn Import Examples for Objection Tracker
// LinkedIn has no API access for content - use these manual import methods

// ==================================================================
// OPTION 1: Single objection via webhook (recommended for real-time)
// ==================================================================

// POST to: https://your-n8n-url/webhook/objection-import
const singleObjection = {
  source_name: "LinkedIn Sales Navigator",
  source_type: "linkedin",
  text: "I love the product vision but honestly the pricing is a bit steep for what we're getting compared to Competitor X. We need to see a clearer ROI before we can justify the cost to leadership.",
  author: "Sarah Chen",
  date: "2026-02-03",
  url: "https://linkedin.com/in/sarah-chen-12345",
  company: "TechCorp Inc",
  title: "VP of Engineering",
  deal_stage: "negotiation",
  deal_value: 150000,
  tags: ["pricing", "competitor-mention"]
};

// ==================================================================
// OPTION 2: Batch import from LinkedIn Sales Navigator export
// ==================================================================

// POST to: https://your-n8n-url/webhook/objection-import
const batchImport = {
  source_name: "LinkedIn Sales Navigator Export",
  source_type: "linkedin",
  items: [
    {
      text: "We've been evaluating solutions for 6 months now. The timing just isn't right - we have too many other initiatives in flight.",
      author: "Michael Torres",
      date: "2026-02-01",
      company: "DataFlow Systems",
      title: "CTO",
      deal_stage: "discovery"
    },
    {
      text: "Your platform looks great but our team is already trained on CompetitorY. The switching costs would be significant.",
      author: "Jennifer Walsh",
      date: "2026-02-02",
      company: "Enterprise Solutions Ltd",
      title: "Director of Operations",
      deal_stage: "evaluation"
    },
    {
      text: "I need to run this by our security team first. We have strict compliance requirements and need to verify SOC2 and GDPR compliance.",
      author: "David Kim",
      date: "2026-02-03",
      company: "FinanceFirst Corp",
      title: "IT Director",
      deal_stage: "technical-review"
    }
  ]
};

// ==================================================================
// OPTION 3: Import from Gong/Chorus call transcripts
// ==================================================================

const callTranscriptImport = {
  source_name: "Gong Call Recording",
  source_type: "call_recording",
  items: [
    {
      text: "Look, I'll be honest with you. We had a bad experience with a similar vendor last year. They promised the world and underdelivered. How do I know you're different?",
      author: "Unknown Prospect",
      date: "2026-02-02",
      meta: {
        call_id: "GONG-123456",
        call_duration_minutes: 45,
        deal_name: "Enterprise Deal - TechCorp",
        sales_rep: "John Smith"
      }
    },
    {
      text: "Our biggest concern is implementation. We tried to implement CompetitorZ last year and it took 9 months instead of the promised 3. What's your typical timeline?",
      author: "VP of Engineering",
      date: "2026-02-02",
      company: "TechCorp Inc",
      meta: {
        call_id: "GONG-123456",
        timestamp_in_call: "00:23:45"
      }
    }
  ]
};

// ==================================================================
// OPTION 4: CRM export (Salesforce, HubSpot notes)
// ==================================================================

const crmNotesImport = {
  source_name: "Salesforce Deal Notes",
  source_type: "crm",
  items: [
    {
      text: "Prospect mentioned they're concerned about integration with their existing Snowflake setup. They've had bad experiences with data connectors in the past.",
      date: "2026-02-01",
      meta: {
        deal_id: "SF-OPP-789",
        deal_name: "DataCorp - Enterprise",
        deal_amount: 250000,
        deal_stage: "Proposal",
        account_name: "DataCorp International"
      }
    }
  ]
};

// ==================================================================
// OPTION 5: Support ticket analysis
// ==================================================================

const supportTicketImport = {
  source_name: "Zendesk Support Tickets",
  source_type: "support_ticket",
  items: [
    {
      text: "We've been waiting 3 days for a response on our critical integration issue. At this point I'm questioning whether we should have gone with CompetitorX who has 24/7 support.",
      author: "angry.customer@bigcorp.com",
      date: "2026-02-03",
      meta: {
        ticket_id: "ZD-45678",
        priority: "high",
        tags: ["support-sla", "competitor-mention", "churn-risk"]
      }
    }
  ]
};

// ==================================================================
// USAGE: cURL examples
// ==================================================================

/*
# Single item import
curl -X POST https://your-n8n-url/webhook/objection-import \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "LinkedIn DM",
    "source_type": "linkedin",
    "text": "Thanks for reaching out but the pricing is way out of our budget.",
    "author": "Jane Doe",
    "company": "StartupXYZ"
  }'

# Batch import
curl -X POST https://your-n8n-url/webhook/objection-import \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "LinkedIn Sales Navigator",
    "source_type": "linkedin",
    "items": [
      {"text": "Objection 1...", "author": "Person 1"},
      {"text": "Objection 2...", "author": "Person 2"}
    ]
  }'
*/

// Export for use
module.exports = {
  singleObjection,
  batchImport,
  callTranscriptImport,
  crmNotesImport,
  supportTicketImport
};
