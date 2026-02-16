export function MetricsBanner() {
  const metrics = [
    {
      value: "10+",
      label: "Live Monitors",
      detail: "Running weekly",
      accent: "var(--accent-signal)",
    },
    {
      value: "25+",
      label: "Signals Per Packet",
      detail: "Severity-ranked",
      accent: "var(--accent-severity)",
    },
    {
      value: "100%",
      label: "Evidence-Linked",
      detail: "Every claim sourced",
      accent: "var(--accent-evidence)",
    },
    {
      value: "52",
      label: "Packets Per Year",
      detail: "Ships every Monday",
      accent: "var(--accent-predict)",
    },
  ];

  return (
    <div className="py-12 px-6 bg-surface-elevated dark:bg-surface-base">
      <div className="max-w-6xl mx-auto">
        <div className="stagger-children grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="animate-on-scroll relative text-center p-5 rounded-card border border-border/40 dark:border-border/20 bg-surface dark:bg-surface-elevated/50 hover:scale-[1.02] transition-transform duration-200"
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 rounded-full"
                style={{ background: `hsl(${metric.accent})` }}
              />
              <span
                className="block font-mono text-3xl md:text-4xl font-bold tabular-nums tracking-tight"
                style={{ color: `hsl(${metric.accent})` }}
              >
                {metric.value}
              </span>
              <span className="block text-sm font-medium text-foreground mt-1.5">
                {metric.label}
              </span>
              <span className="block text-xs font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">
                {metric.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
