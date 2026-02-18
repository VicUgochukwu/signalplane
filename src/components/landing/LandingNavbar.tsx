import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { href: "#who-its-for", label: "Use Cases" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#intelligence", label: "Platform" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm dark:bg-background/80 dark:border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <Logo className="w-8 h-8" />
          <span className="font-mono font-semibold text-foreground text-sm tracking-tight">
            CONTROL PLANE
          </span>
        </Link>

        {/* Desktop Nav Links — small caps, tight spacing */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#demo-sectors"
            className="ml-1 px-3 py-1.5 text-[13px] font-medium text-accent-signal hover:text-accent-signal/80 transition-colors tracking-wide uppercase border border-accent-signal/30 hover:bg-accent-signal/5 rounded-badge"
          >
            Live Demo
          </a>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/login"
            className="btn-primary text-[12px] px-5 py-2"
          >
            Start Free
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background backdrop-blur-md border-b border-border animate-slide-up">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="block px-3 py-2.5 text-foreground hover:bg-muted rounded-md transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#demo-sectors"
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 text-foreground hover:bg-muted rounded-md transition-colors text-sm"
            >
              Live Demo
            </a>
            <div className="pt-3 mt-3 border-t border-border flex flex-col gap-2">
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="w-full text-center px-3 py-2.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Log in
              </Link>
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="btn-primary w-full text-center text-[12px]"
              >
                Start Free
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
