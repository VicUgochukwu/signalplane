export function MetricsBanner() {
  const metrics = [
    { value: "10+", label: "Automated Monitors" },
    { value: "25", label: "Signals Per Packet" },
    { value: "Weekly", label: "Delivery Cadence" },
    { value: "100%", label: "Evidence-Linked" },
  ];

  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <span className="text-2xl md:text-3xl font-bold text-foreground">
                {metric.value}
              </span>
              <span className="block text-xs text-muted-foreground mt-1.5 tracking-wide">
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
