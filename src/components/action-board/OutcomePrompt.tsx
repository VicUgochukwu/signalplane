import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Minus, ThumbsDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OutcomeType = 'positive' | 'neutral' | 'negative';

interface OutcomePromptProps {
  cardId: string;
  actionText: string;
  onSubmit: (cardId: string, outcome: OutcomeType, notes: string) => void;
  onDismiss: () => void;
}

const OUTCOME_OPTIONS: { value: OutcomeType; label: string; icon: typeof ThumbsUp; cls: string; activeCls: string }[] = [
  { value: 'positive', label: 'Positive', icon: ThumbsUp, cls: 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10', activeCls: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { value: 'neutral', label: 'Neutral', icon: Minus, cls: 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/20', activeCls: 'text-muted-foreground bg-muted/20 border-border' },
  { value: 'negative', label: 'Negative', icon: ThumbsDown, cls: 'text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10', activeCls: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
];

export function OutcomePrompt({ cardId, actionText, onSubmit, onDismiss }: OutcomePromptProps) {
  const [selected, setSelected] = useState<OutcomeType | null>(null);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-card border border-border/50 rounded-xl shadow-xl w-full max-w-md mx-4 p-5 space-y-4">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div>
          <h3 className="text-sm font-semibold text-foreground">How did this play out?</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{actionText}</p>
        </div>

        {/* Outcome buttons */}
        <div className="flex items-center gap-2">
          {OUTCOME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-transparent transition-all text-sm font-medium',
                  isActive ? opt.activeCls : opt.cls
                )}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Optional notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional: what happened? (1 line)"
          className="w-full h-16 rounded-lg border border-border/50 bg-muted/10 p-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
        />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="text-muted-foreground"
          >
            Skip
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onSubmit(cardId, selected, notes);
              }
            }}
          >
            Record Outcome
          </Button>
        </div>
      </div>
    </div>
  );
}
