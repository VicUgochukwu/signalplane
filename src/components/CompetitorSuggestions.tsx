import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import {
  fetchCompetitorSuggestions,
  confidenceBadge,
} from '@/lib/competitorSuggestions';
import type { CompetitorSuggestion } from '@/lib/competitorSuggestions';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ChevronDown, ChevronUp, Radar, RefreshCw } from 'lucide-react';

interface CompetitorSuggestionsProps {
  onAddSuggestion: (company: { name: string; domain: string }) => void;
}

export function CompetitorSuggestions({ onAddSuggestion }: CompetitorSuggestionsProps) {
  const { profile, competitors } = useOnboarding();
  const [suggestions, setSuggestions] = useState<CompetitorSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState(false);

  const trackedDomains = new Set(
    (competitors || []).map((c) => c.competitor_domain?.toLowerCase()).filter(Boolean),
  );

  // Filter out already-tracked
  const filtered = suggestions.filter(
    (s) => !trackedDomains.has(s.domain.toLowerCase()),
  );

  if (!profile?.company_name) return null;

  const handleFetch = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetchCompetitorSuggestions(undefined, forceRefresh);
      setSuggestions(res.suggestions || []);
      setHasLoaded(true);
    } catch (err) {
      console.warn('AI suggestions failed:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const visibleSuggestions = showAll ? filtered : filtered.slice(0, 4);

  // Not yet loaded — show the trigger button
  if (!hasLoaded) {
    return (
      <Button
        variant="outline"
        onClick={() => handleFetch()}
        disabled={isLoading}
        className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Finding competitors...
          </>
        ) : (
          <>
            <Radar className="h-4 w-4 mr-2" />
            Find suggested competitors
          </>
        )}
      </Button>
    );
  }

  // Loaded but no results
  if (filtered.length === 0 && !error) {
    return (
      <p className="text-xs text-muted-foreground">
        No new competitors to suggest right now.{' '}
        <button onClick={() => handleFetch(true)} className="text-[#6B9B9B] hover:underline">
          Try again
        </button>
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-muted-foreground">
        Couldn't generate suggestions.{' '}
        <button onClick={() => handleFetch(true)} className="text-[#6B9B9B] hover:underline">
          Try again
        </button>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Inline header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-[#6B9B9B]" />
          <span className="text-sm font-medium text-muted-foreground">
            Competitors we think you should track
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => handleFetch(true)}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Suggestion pills */}
      <div className="flex flex-wrap gap-2">
        {visibleSuggestions.map((s) => (
          <SuggestionPill
            key={s.domain}
            suggestion={s}
            onAdd={() => onAddSuggestion({ name: s.name, domain: s.domain })}
          />
        ))}

        {filtered.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-dashed border-border hover:border-muted-foreground transition-colors"
          >
            {showAll ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>+{filtered.length - 4} more <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function SuggestionPill({
  suggestion,
  onAdd,
}: {
  suggestion: CompetitorSuggestion;
  onAdd: () => void;
}) {
  return (
    <button
      onClick={onAdd}
      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/50 hover:border-[#6B9B9B]/50 hover:bg-[#6B9B9B]/10 transition-colors"
      title={suggestion.reason}
    >
      <Plus className="h-3 w-3 text-muted-foreground group-hover:text-[#6B9B9B] transition-colors" />
      <span className="text-sm text-foreground">{suggestion.name}</span>
      <span className="text-[10px] text-muted-foreground">{suggestion.domain}</span>
      <span className={`text-[9px] px-1 py-0.5 rounded border ${confidenceBadge(suggestion.confidence)}`}>
        {Math.round(suggestion.confidence * 100)}%
      </span>
    </button>
  );
}
