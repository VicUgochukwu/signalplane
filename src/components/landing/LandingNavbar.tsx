import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import signalPlaneLogo from "@/assets/signal-plane-logo.png";

const demoItems = [
  { to: "/control-plane", label: "Control Plane", subtitle: "Weekly intel packets" },
  { to: "/messaging-diff", label: "Messaging Diff", subtitle: "Competitor tracking" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [demosOpen, setDemosOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-mono font-semibold text-foreground">
           <span className="flex items-center gap-3">
             <img src={signalPlaneLogo} alt="Signal Plane" className="w-14 h-14" />
             <span className="text-lg">Signal Plane</span>
           </span>
        </Link>
        <div className="hidden sm:flex items-center gap-8">
          {/* Work link */}
          <a
            href="#work"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Work
          </a>

          {/* Live Demos dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setDemosOpen(true)}
            onMouseLeave={() => setDemosOpen(false)}
          >
            <button
              onClick={() => setDemosOpen(!demosOpen)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Live Demos
              <ChevronDown className={`w-3 h-3 transition-transform ${demosOpen ? "rotate-180" : ""}`} />
            </button>

            {demosOpen && (
              <div className="absolute top-full mt-2 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[220px] z-50">
                {demoItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block px-4 py-3 rounded-md hover:bg-muted transition-colors"
                    onClick={() => setDemosOpen(false)}
                  >
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Remaining anchor links */}
          <a
            href="#approach"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Approach
          </a>
          <a
            href="#background"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Background
          </a>
          <a
            href="#contact"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
}
