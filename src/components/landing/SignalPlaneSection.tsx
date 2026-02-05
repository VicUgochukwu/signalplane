 import { ArrowRight, FileText, Package, Brain, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
 
 const outputColumns = [
   {
     icon: FileText,
     title: "Weekly Decision Packet",
     description: "Executive summary, key shifts, open questions, and 90-day hypotheses. Severity-ranked. Evidence-linked. Every signal maps to a decision type, an owner, and a recommended action. Produced every week.",
   },
   {
     icon: Package,
     title: "Operational Artifacts",
     description: "Self-updating battlecards, a living objection library ranked by frequency and severity, and a buyer language swipe file tagged by persona and funnel stage. All versioned weekly. All ready to use.",
   },
   {
     icon: Brain,
     title: "Compounding Intelligence",
     description: "GTM Memory stores durable knowledge across weeks so the system never relearns the same patterns. Judgment Loop tracks predictions and scores them against what actually happens. A verifiable record of PMM judgment.",
   },
 ];
 
 const signalSources = [
   "Messaging Diff Tracker",
   "Narrative Drift Monitor",
   "ICP Drift Monitor",
   "Horizon Lane",
   "Objection Tracker",
   "Launch Decay Analyzer",
   "Pricing Drift Monitor",
   "Proof & Trust Monitor",
   "Distribution Move Monitor",
   "Hiring Signal Monitor",
 ];

export function SignalPlaneSection() {
  return (
     <section id="work" className="py-12 px-6">
      <div className="max-w-content mx-auto">
        {/* Section header */}
         <div className="mb-8">
          <h2 className="font-mono text-2xl font-bold text-foreground mb-3">
            Signal Plane
          </h2>
          <p className="text-muted-foreground max-w-2xl">
             12+ live systems feeding one weekly decision packet. Signals detected, ranked, synthesized, and turned into artifacts your team can use Monday morning.
          </p>
        </div>

         {/* Packet Preview Card */}
         <div className="mb-6 p-6 rounded-lg border border-border bg-card shadow-lg">
           <p className="font-mono text-sm text-muted-foreground mb-4">Weekly Decision Packet — Sample</p>
           <div className="font-mono text-xs text-muted-foreground/80 space-y-3">
             <div>
               <span className="text-primary">EXECUTIVE SUMMARY</span>
               <p className="mt-1">3-7 key observations from the week's signals</p>
             </div>
             <div>
               <span className="text-primary">KEY SHIFTS</span>
               <p className="mt-1">Messaging, narrative, ICP, and pricing changes ranked by severity</p>
             </div>
             <div>
               <span className="text-primary">OPEN QUESTIONS</span>
               <p className="mt-1">What to verify next cycle</p>
             </div>
             <div>
               <span className="text-primary">90-DAY HYPOTHESES</span>
               <p className="mt-1">2-3 evidence-linked bets on where the market is heading</p>
             </div>
           </div>
         </div>

         <p className="text-sm text-muted-foreground mb-4">
           Live packets produced weekly from 12+ signal sources. Each claim evidence-linked.
        </p>

         {/* Demo Links */}
         <div className="flex gap-6 mb-10">
           <Link
             to="/messaging-diff"
             className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
           >
             Explore Messaging Diff
             <ExternalLink className="w-3 h-3" />
           </Link>
           <Link
             to="/control-plane"
             className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
           >
             Explore Control Plane
             <ExternalLink className="w-3 h-3" />
           </Link>
        </div>

         {/* Three Output Columns */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
           {outputColumns.map((col) => (
             <div key={col.title} className="space-y-3">
               <col.icon className="w-5 h-5 text-primary" />
               <h4 className="font-mono font-bold text-foreground">
                 {col.title}
               </h4>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 {col.description}
               </p>
             </div>
           ))}
        </div>

         {/* Signal Sources */}
         <div className="mb-6">
           <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">
             What feeds the system
           </p>
           <div className="flex flex-wrap gap-2">
             {signalSources.map((source) => (
               <span
                 key={source}
                 className="px-2.5 py-1 text-xs text-muted-foreground/80 bg-secondary/50 rounded-md border border-border/50"
               >
                 {source}
               </span>
             ))}
             <span className="px-2.5 py-1 text-xs text-muted-foreground/60 italic bg-secondary/30 rounded-md border border-border/30">
               + more running
             </span>
           </div>
         </div>
 
         {/* View all CTA */}
        <Link
          to="/control-plane"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
        >
          View all weekly packets
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
