import { Link } from "react-router-dom";
import signalPlaneLogo from '@/assets/signal-plane-logo-new.png';

export function Footer() {
  return (
    <footer className="py-8 mt-12 border-t border-border/50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src={signalPlaneLogo} alt="Signal Plane" className="w-5 h-5" />
          <span>&copy; 2026 Signal Plane</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/privacy-policy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/cookie-policy"
            className="hover:text-foreground transition-colors"
          >
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
