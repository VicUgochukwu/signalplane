/**
 * The opinion-grade vs evidence-grade contrast.
 *
 * The ControlPlane_Messaging_Guide calls this "the single most important
 * framing device in all Control Plane communication."
 *
 * Instead of a text-heavy paragraph strip, this is now a compact visual
 * comparison that communicates the same contrast at a glance.
 */
export function DifferentiatorStrip() {
  return (
    <div className="py-12 md:py-16 px-6 bg-[hsl(var(--section-alt))] dark:bg-card/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Opinion-grade — what they have now */}
          <div className="flex gap-4 items-start p-5 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] dark:bg-background/50 dark:border-border/40 dark:shadow-none">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-muted dark:bg-muted/50 flex items-center justify-center">
              <span className="text-lg text-muted-foreground dark:text-muted-foreground/60">?</span>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                What most teams have
              </span>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                <span className="text-foreground font-semibold">Opinion-grade</span> intel
                — analyst summaries, quarterly decks, hallway conversations.
              </p>
            </div>
          </div>

          {/* Evidence-grade — what Control Plane delivers */}
          <div className="flex gap-4 items-start p-5 rounded-xl border border-primary/20 bg-primary/[0.05] dark:bg-primary/[0.03]">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg text-primary font-semibold">!</span>
            </div>
            <div>
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                What Control Plane delivers
              </span>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                <span className="text-primary font-semibold">Evidence-grade</span> intel
                — every insight sourced, every prediction tracked, every week sharper.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
