import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="py-10 mt-16 border-t border-border/50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Logo className="w-7 h-7" />
          <span>&copy; {new Date().getFullYear()} Signal Plane</span>
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
          <a href="mailto:hello@signalplane.dev" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
