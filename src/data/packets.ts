import { TrendingUp, AlertTriangle, MessageSquare, Target, LucideIcon } from "lucide-react";

export type PacketStatus = "live" | "published" | "archived";

export interface KeyShift {
  icon: LucideIcon;
  text: string;
}

export interface WeeklyPacket {
  id: number;
  week: string;
  title: string;
  date: string;
  dateRange: string;
  status: PacketStatus;
  summary: string;
  signalsDetected: number;
  avgConfidence?: number;
  keyInsights: number;
  keyShifts: KeyShift[];
  openQuestions: string[];
  highlights: string[];
}

export const packets: WeeklyPacket[] = [
  {
    id: 1,
    week: "Week 5",
    title: "Week of Jan 27: AI Positioning Wars Heat Up",
    date: "Feb 2, 2026",
    dateRange: "Jan 27 \u2013 Feb 2, 2026",
    status: "live",
    summary: "Competitor A pivoted messaging toward enterprise security. Two new players entered the mid-market segment with aggressive pricing.",
    signalsDetected: 436,
    avgConfidence: 89,
    keyInsights: 5,
    keyShifts: [
      { icon: TrendingUp, text: "Enterprise security narrative gaining traction (+3 mentions)" },
      { icon: AlertTriangle, text: "Pricing pressure in mid-market segment" },
      { icon: MessageSquare, text: "New objection surfacing: 'integration complexity'" },
    ],
    openQuestions: [
      "Is the security pivot a response to lost deals or proactive positioning?",
      "Should we accelerate our enterprise roadmap?",
    ],
    highlights: [
      "Acme Corp announced 20% price reduction targeting mid-market",
      "Competitor X launched AI-powered analytics module \u2014 3 months ahead of schedule",
      "New CTO at Fortune 500 target \u2014 warm intro available via board connection",
    ],
  },
  {
    id: 2,
    week: "Week 4",
    title: "Week of Jan 20: Enterprise Momentum",
    date: "Jan 26, 2026",
    dateRange: "Jan 20 \u2013 Jan 26, 2026",
    status: "published",
    summary: "Major product launch from Competitor B. Messaging shifted from 'easy' to 'powerful'. Three job postings for solutions engineers detected.",
    signalsDetected: 156,
    keyInsights: 5,
    keyShifts: [
      { icon: Target, text: "ICP drift detected: targeting larger accounts" },
      { icon: TrendingUp, text: "Launch messaging emphasizes power over simplicity" },
      { icon: AlertTriangle, text: "Hiring surge indicates enterprise push" },
    ],
    openQuestions: [
      "Are they abandoning SMB or building a separate motion?",
      "How does this affect our positioning as the 'simple' alternative?",
    ],
    highlights: [
      "$4.2M moved to Commit stage with strong enterprise traction",
      "Two new logos in financial services vertical",
    ],
  },
  {
    id: 3,
    week: "Week 3",
    title: "Week of Jan 13: Q1 Planning Insights",
    date: "Jan 19, 2026",
    dateRange: "Jan 13 \u2013 Jan 19, 2026",
    status: "published",
    summary: "Quiet week. Minor copy updates across two competitors. One new case study published targeting healthcare vertical.",
    signalsDetected: 124,
    keyInsights: 5,
    keyShifts: [
      { icon: MessageSquare, text: "Healthcare vertical proof point added by Competitor C" },
      { icon: TrendingUp, text: "Compliance language appearing more frequently" },
    ],
    openQuestions: [
      "Is healthcare becoming a battleground vertical?",
      "Do we need HIPAA messaging sooner than planned?",
    ],
    highlights: [
      "MQL to SQL conversion improved to 32% after ICP refinement",
      "Three strategic accounts entering budget planning cycles",
    ],
  },
  {
    id: 4,
    week: "Week 2",
    title: "Week of Jan 6: Year-End Wrap & 2026 Outlook",
    date: "Jan 12, 2026",
    dateRange: "Jan 6 \u2013 Jan 12, 2026",
    status: "archived",
    summary: "Strategic planning signals from competitors. Multiple pricing page updates detected. One competitor quietly removed free tier.",
    signalsDetected: 67,
    keyInsights: 4,
    keyShifts: [
      { icon: AlertTriangle, text: "Free tier removal signals monetization pressure" },
      { icon: TrendingUp, text: "Annual planning content surge across category" },
    ],
    openQuestions: [
      "Should we emphasize our free tier in competitive positioning?",
      "What does the monetization shift mean for category dynamics?",
    ],
    highlights: [
      "Q4 closed at 94% of target \u2014 strong finish despite headwinds",
      "Annual competitive win rate improved 12 points YoY",
    ],
  },
];
