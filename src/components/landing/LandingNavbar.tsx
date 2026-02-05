 import { useState, useEffect } from "react";
 import { Link } from "react-router-dom";
 import signalPlaneLogo from "@/assets/signal-plane-logo.png";

const sectionLinks = [
  { label: "Work", href: "#work" },
  { label: "Approach", href: "#approach" },
  { label: "Background", href: "#background" },
  { label: "Contact", href: "#contact" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

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
      <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-mono font-semibold text-foreground">
           <span className="flex items-center gap-3">
             <img src={signalPlaneLogo} alt="Signal Plane" className="w-14 h-14" />
             <span className="text-lg">Signal Plane</span>
           </span>
        </Link>
        <div className="hidden sm:flex items-center gap-8">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
