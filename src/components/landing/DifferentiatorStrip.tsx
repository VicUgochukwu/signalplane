/**
 * The opinion-grade vs evidence-grade contrast.
 *
 * The ControlPlane_Messaging_Guide calls this "the single most important
 * framing device in all Control Plane communication."
 *
 * Now uses card-intel variants with semantic accent colors to visually
 * encode the contrast: severity (warning, opinion-grade) vs evidence (green, evidence-grade).
 */
export function DifferentiatorStrip() {
  return (
    <div className="py-12 md:py-16 px-6 bg-surface-elevated dark:bg-surface-base">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Opinion-grade — what they have now */}
          <div className="card-intel card-intel--severity p-5">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-badge flex items-center justify-center bg-[hsl(var(--accent-severity)/0.12)]">
                <span className="font-mono text-base font-bold text-[hsl(var(--accent-severity))]">?</span>
              </div>
              <div>
                <span className="font-mono text-[11px] font-medium text-[hsl(var(--accent-severity))] uppercase tracking-widest">
                  What most teams have
                </span>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  <span className="text-foreground font-semibold">Opinion-grade</span> intel
                  — analyst summaries, quarterly decks, hallway conversations.
                </p>
              </div>
            </div>
          </div>

          {/* Evidence-grade — what Control Plane delivers */}
          <div className="card-intel card-intel--evidence p-5">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-badge flex items-center justify-center bg-[hsl(var(--accent-evidence)/0.12)]">
                <span className="font-mono text-base font-bold text-[hsl(var(--accent-evidence))]">&#x2713;</span>
              </div>
              <div>
                <span className="font-mono text-[11px] font-medium text-[hsl(var(--accent-evidence))] uppercase tracking-widest">
                  What Control Plane delivers
                </span>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  <span className="text-foreground font-semibold">Evidence-grade</span> intel
                  — every insight sourced, every prediction tracked, every week sharper.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
