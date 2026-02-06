import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu } from "lucide-react";
import signalPlaneLogo from "@/assets/signal-plane-logo.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const demoItems = [
  { to: "/control-plane", label: "Control Plane", subtitle: "Weekly intel packets" },
  { to: "/messaging-diff", label: "Messaging Diff", subtitle: "Competitor tracking" },
];

const anchorLinks = [
  { label: "Intelligence", href: "#intelligence" },
  { label: "Approach", href: "#approach" },
  { label: "Background", href: "#background" },
  { label: "Contact", href: "#contact" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [demosOpen, setDemosOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDemosOpen, setMobileDemosOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileDemosOpen(false);
  };

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

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-8">
          {/* Intelligence link */}
          <a
            href="#intelligence"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Intelligence
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
              <div className="absolute top-full left-0 pt-2 z-50">
                <div className="bg-card border border-border rounded-lg shadow-lg p-2 min-w-[220px]">
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

        {/* Mobile Hamburger Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="sm:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors">
              <Menu className="w-6 h-6" />
              <span className="sr-only">Open menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="top" className="bg-background border-border">
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-4">
              {/* Intelligence */}
              <a
                href="#intelligence"
                onClick={closeMobileMenu}
                className="px-4 py-3 text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Intelligence
              </a>

              {/* Live Demos accordion */}
              <div>
                <button
                  onClick={() => setMobileDemosOpen(!mobileDemosOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <span>Live Demos</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileDemosOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileDemosOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {demoItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={closeMobileMenu}
                        className="block px-4 py-3 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="text-sm font-medium text-foreground">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Remaining anchor links */}
              {anchorLinks.slice(1).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
