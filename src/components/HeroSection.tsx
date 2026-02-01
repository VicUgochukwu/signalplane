import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const { user, loading } = useAuth();

  return (
    <section className="py-16 text-center space-y-6">
      <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight">
        Messaging Diff Tracker
      </h1>
      <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
        Track how competitors change their web messaging weekly. Powered by AI classification.
      </p>
      <div className="flex flex-col items-center gap-4">
        <Button
          asChild
          size="lg"
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-base px-8"
          disabled={loading}
        >
          <Link to={user ? '/my-pages' : '/login'}>
            Start Tracking
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <p className="text-sm text-zinc-500">
          Open source. Community-powered.
        </p>
      </div>
    </section>
  );
}
