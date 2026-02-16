import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI — defaults to the built-in error card */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches React rendering errors
 * and displays a recovery UI instead of a white screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex flex-col">
          {/* Minimal header */}
          <div className="px-6 h-16 flex items-center border-b border-border/30">
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <span className="font-semibold text-foreground text-[15px] tracking-tight">
                Signal Plane
              </span>
            </button>
          </div>

          {/* Error content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-destructive/10 mb-6">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-2 leading-relaxed">
                An unexpected error occurred while rendering this page.
                This has been logged and we'll look into it.
              </p>

              {this.state.error && (
                <div className="p-3 bg-muted/50 rounded-lg mt-4 mb-8">
                  <p className="text-xs font-mono text-muted-foreground break-all leading-relaxed">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {!this.state.error && <div className="mb-8" />}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="rounded-full px-5 bg-accent-signal text-white hover:bg-[hsl(var(--accent-signal)/0.9)]"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleReload}
                  className="rounded-full px-5 border-border/60"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  variant="ghost"
                  onClick={this.handleGoHome}
                  className="rounded-full px-5 text-muted-foreground hover:text-foreground"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
