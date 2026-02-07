export function MetricsBanner() {
  const metrics = [
    { value: "10", label: "Live Monitors" },
    { value: "25", label: "Signals Per Packet" },
    { value: "7", label: "Day Recency Decay" },
    { value: "52", label: "Packets Per Year" },
  ];

  return (
    <div className="py-8 px-6">
      <div className="max-w-content mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`flex flex-col items-center justify-center text-center py-4 ${
                index < metrics.length - 1 ? "md:border-r md:border-border" : ""
              }`}
            >
              <span className="text-3xl font-mono font-bold text-primary">
                {metric.value}
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
