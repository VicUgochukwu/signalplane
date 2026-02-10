export function MetricsBanner() {
  const metrics = [
    { value: "10+", label: "Live Monitors", detail: "Running weekly" },
    { value: "25", label: "Signals Per Packet", detail: "Severity-ranked" },
    { value: "100%", label: "Evidence-Linked", detail: "Every claim sourced" },
    { value: "52", label: "Packets Per Year", detail: "Ships every Monday" },
  ];

  return (
    <div className="py-10 px-6 bg-[hsl(var(--section-alt))] dark:bg-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">
                {metric.value}
              </span>
              <span className="block text-sm font-medium text-foreground/80 mt-1">
                {metric.label}
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {metric.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
