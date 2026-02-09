export function ArchitectBar() {
  return (
    <div className="py-4 px-6 border-b border-border bg-card/50">
      <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
          <span className="font-semibold text-foreground">Signal Plane</span>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <span className="text-muted-foreground">Built by a PMM who got tired of stale intel</span>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-primary/60 text-center sm:text-right">
          GTM Decision Infrastructure
        </p>
      </div>
    </div>
  );
}
