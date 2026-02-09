import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, ArrowRight, X } from "lucide-react";
import signalPlaneLogo from "@/assets/signal-plane-logo-new.png";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={signalPlaneLogo} alt="Signal Plane" className="w-7 h-7" />
          <span className="font-semibold text-foreground text-[15px] tracking-tight">
            Signal Plane
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          <a
            href="#how-it-works"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
          >
            How It Works
          </a>
          <a
            href="#intelligence"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
          >
            Intelligence
          </a>
          <a
            href="#faq"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
          >
            FAQ
          </a>
          <a
            href="#demo-sectors"
            className="px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-full border border-primary/30 hover:bg-primary/5"
          >
            Live Demo
          </a>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-sm h-9 px-3"
            >
              Log in
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4 rounded-full"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground hover:bg-muted/50 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border animate-slide-up">
          <div className="px-6 py-4 space-y-1">
            <a href="#how-it-works" onClick={closeMobileMenu} className="block px-3 py-2.5 text-foreground hover:bg-muted/50 rounded-md transition-colors">
              How It Works
            </a>
            <a href="#intelligence" onClick={closeMobileMenu} className="block px-3 py-2.5 text-foreground hover:bg-muted/50 rounded-md transition-colors">
              Intelligence
            </a>
            <a href="#faq" onClick={closeMobileMenu} className="block px-3 py-2.5 text-foreground hover:bg-muted/50 rounded-md transition-colors">
              FAQ
            </a>
            <a href="#demo-sectors" onClick={closeMobileMenu} className="block px-3 py-2.5 text-foreground hover:bg-muted/50 rounded-md transition-colors">
              Live Demo
            </a>
            <div className="pt-3 mt-3 border-t border-border/50 flex flex-col gap-2">
              <Link to="/login" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-center text-muted-foreground">Log in</Button>
              </Link>
              <Link to="/login" onClick={closeMobileMenu}>
                <Button className="w-full justify-center bg-primary text-primary-foreground rounded-full">
                  Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
