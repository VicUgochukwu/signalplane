import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/contexts/DemoContext';

export function DemoCtaBanner() {
  const demo = useDemo();
  if (!demo?.showCta) return null;

  return (
    <div className="rounded-xl border border-[hsl(var(--accent-signal)/0.2)] bg-[hsl(var(--accent-signal)/0.05)] p-6 my-6">
      <div className="text-center space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Like what you see?
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Track your actual competitors with real-time intelligence — not sample data.
          Your first packet ships next Monday.
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <Link to="/login">
            <Button size="sm" className="rounded-full px-5 text-xs font-medium">
              Get Started Free
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={demo.dismissCta}
          >
            Continue Exploring
          </Button>
        </div>
      </div>
    </div>
  );
}
