import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import signalPlaneLogo from "@/assets/signal-plane-logo-new.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal navbar */}
      <nav className="px-6 h-16 flex items-center border-b border-border/30">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={signalPlaneLogo} alt="Signal Plane" className="w-7 h-7" />
          <span className="font-semibold text-foreground text-[15px] tracking-tight">
            Signal Plane
          </span>
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Left-aligned, not centered — feels intentional, not generic */}
          <div className="text-8xl font-bold text-muted-foreground/10 tabular-nums mb-4 select-none">
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
            <Link to="/">
              <Button className="rounded-full px-5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
            <Button
              variant="outline"
              className="rounded-full px-5 border-border/60"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Link to="/demo/developer-tools">
              <Button variant="ghost" className="rounded-full px-5 text-muted-foreground hover:text-foreground">
                <Search className="w-4 h-4 mr-2" />
                Try a Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
