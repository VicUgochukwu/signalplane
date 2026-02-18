import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function LandingFooter() {
  return (
    <footer aria-label="Site footer" className="py-10 px-6 border-t border-border/40 dark:border-border/20 bg-surface-base">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo className="w-6 h-6 opacity-50" />
          <span className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Control Plane
          </span>
          <span className="text-xs text-muted-foreground/60">
            &copy; 2026 Signal Plane
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            to="/privacy-policy"
            className="font-mono text-xs text-muted-foreground hover:text-accent-signal uppercase tracking-wider transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/cookie-policy"
            className="font-mono text-xs text-muted-foreground hover:text-accent-signal uppercase tracking-wider transition-colors"
          >
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
