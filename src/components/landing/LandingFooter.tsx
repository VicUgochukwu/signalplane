import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function LandingFooter() {
  return (
    <footer aria-label="Site footer" className="py-10 px-6 border-t border-border dark:border-border/50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo className="w-7 h-7 opacity-60" />
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Signal Plane
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link
            to="/privacy-policy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/cookie-policy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
