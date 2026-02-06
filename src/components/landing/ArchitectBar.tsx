import victorProfile from "@/assets/victor-profile.png";

export function ArchitectBar() {
  return (
    <div className="py-4 px-6 border-b border-border bg-card/50">
      <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <img
            src={victorProfile}
            alt="Victor Ugochukwu"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
            <span className="font-semibold text-foreground">Victor Ugochukwu</span>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <span className="text-muted-foreground">Architect & Operator</span>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <span className="text-muted-foreground">Signal Plane</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center sm:text-right">
          Open to senior PMM, GTM strategy & fractional roles
        </p>
      </div>
    </div>
  );
}
