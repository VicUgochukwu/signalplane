import { IconBattlecard, IconObjectionLibrary, IconSwipeFile } from "@/components/icons";

const artifacts = [
  {
    icon: IconBattlecard,
    title: "Battlecards",
    description:
      "Per-competitor cards updated every week with what changed, fresh talk tracks, competitive landmines, and win/loss themes. Your reps never walk in cold.",
  },
  {
    icon: IconObjectionLibrary,
    title: "Objection Library",
    description:
      "Live objections ranked by frequency with rebuttal frameworks. Tagged by persona and buyer stage. Updated weekly from real buyer language.",
  },
  {
    icon: IconSwipeFile,
    title: "Buyer Language Swipe File",
    description:
      "The exact phrases your buyers use, tagged by persona and funnel stage. Trend-labeled: rising, stable, or fading — so messaging stays current.",
  },
];

export function ArtifactsSection() {
  return (
    <section aria-label="Competitive intelligence artifacts and action board" className="py-20 md:py-28 px-6 bg-[hsl(var(--section-alt))] dark:bg-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Artifacts — left-aligned header */}
        <div className="max-w-xl mb-16">
          <div className="text-[11px] font-mono font-medium text-accent-signal mb-3 tracking-widest uppercase">
            Ready-to-Use Deliverables
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Artifacts that update themselves every Monday
          </h2>
          <p className="text-lg text-muted-foreground">
            Three self-updating deliverables generated from each week's signals —
            exported as email, Markdown, or used directly in the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {artifacts.map((artifact) => (
            <div
              key={artifact.title}
              className="card-intel p-6 border border-border/60 dark:border-border/40"
              style={{ borderRadius: '6px' }}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-card bg-accent-signal/10 mb-5">
                <artifact.icon className="w-5 h-5 text-accent-signal" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {artifact.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {artifact.description}
              </p>
            </div>
          ))}
        </div>

        {/* Action Board — NEW feature callout */}
        <div className="rounded-card border border-accent-signal/20 bg-accent-signal/[0.03] p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-badge bg-accent-signal/10 border border-accent-signal/20 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-signal" />
                <span className="text-[11px] font-mono font-medium text-accent-signal tracking-widest uppercase">New</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">
                Action Board
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Intelligence without execution is just trivia. The Action Board turns every
                insight from your weekly packet into an assigned, time-bound decision card.
                Triage what matters, move cards through your pipeline, and generate
                execution kits — step-by-step playbooks for each competitive response.
              </p>
              <div className="space-y-3">
                {[
                  "Cards auto-populated from each week's decision packet",
                  "Kanban board: Inbox → Triaged → This Week → Done",
                  "AI-generated execution kits for every decision type",
                  "Designed for the weekly GTM cadence, not another project tracker",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-signal mt-1.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="card-intel p-5 border border-border/60 dark:border-border/40" style={{ borderRadius: '6px' }}>
              {/* Visual representation of the board */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {["Inbox", "Triaged", "This Week", "Done"].map((col) => (
                  <div key={col} className="text-center">
                    <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                      {col}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {/* Inbox cards */}
                <div className="space-y-2">
                  <MiniCard label="Pricing shift" type="respond" />
                  <MiniCard label="New narrative" type="monitor" />
                </div>
                {/* Triaged */}
                <div className="space-y-2">
                  <MiniCard label="ICP overlap" type="defend" />
                </div>
                {/* This Week */}
                <div className="space-y-2">
                  <MiniCard label="Reposition vs X" type="attack" />
                  <MiniCard label="Update battlecard" type="equip" />
                </div>
                {/* Done */}
                <div className="space-y-2">
                  <MiniCard label="Objection update" type="equip" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Tiny card for the visual board mockup */
function MiniCard({ label, type }: { label: string; type: string }) {
  const colors: Record<string, string> = {
    respond: "bg-amber-400/20 text-amber-400",
    monitor: "bg-sky-400/20 text-sky-400",
    defend: "bg-rose-400/20 text-rose-400",
    attack: "bg-emerald-400/20 text-emerald-400",
    equip: "bg-violet-400/20 text-violet-400",
  };
  return (
    <div className="p-2 rounded-card border border-border/60 bg-card dark:border-border/40 dark:bg-card/80">
      <p className="text-[10px] font-medium text-foreground leading-tight mb-1">{label}</p>
      <span className={`inline-block text-[8px] font-mono font-medium px-1.5 py-0.5 rounded-badge ${colors[type] || "bg-muted text-muted-foreground"}`}>
        {type}
      </span>
    </div>
  );
}
