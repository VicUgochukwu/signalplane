import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Logo } from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal navbar */}
      <nav className="px-6 h-14 flex items-center border-b border-border/30">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="w-8 h-8" />
          <span className="font-mono font-semibold text-foreground text-sm tracking-tight">
            CONTROL PLANE
          </span>
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Left-aligned, not centered — feels intentional, not generic */}
          <div className="text-8xl font-bold text-muted-foreground/10 tabular-nums mb-4 select-none font-mono">
            404
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            This page doesn't exist
          </h1>
          <p className="text-muted-foreground mb-2 leading-relaxed">
            The page at <code className="text-sm bg-muted/50 px-1.5 py-0.5 rounded text-foreground/80">{location.pathname}</code> couldn't be found.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            It may have been moved or the URL might be incorrect.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="btn-primary text-[12px] px-5 py-2.5">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary text-[12px] px-5 py-2.5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
            <Link
              to="/demo/developer-tools"
              className="inline-flex items-center justify-center font-mono text-[12px] font-medium uppercase tracking-wide px-5 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4 mr-2" />
              Try a Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
