import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { IconDeals, IconTrophy } from '@/components/icons';
import { useDeals } from '@/hooks/useDeals';
import { useTierGate } from '@/hooks/useTierGate';
import { useOnboarding } from '@/hooks/useOnboarding';
import { AppNavigation } from './AppNavigation';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import type { DealOutcome } from '@/types/teams';

const OUTCOME_CONFIG: Record<DealOutcome, { label: string; color: string }> = {
  won: { label: 'Won', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  lost: { label: 'Lost', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export default function DealLogger() {
  const { deals, winsCount, lossesCount, inProgressCount, isLoading, logDeal } = useDeals();
  const { canUse } = useTierGate();
  const canLogDeals = canUse('win_loss');
  const { competitors } = useOnboarding();
  const { toast } = useToast();

  const [competitorName, setCompetitorName] = useState('');
  const [outcome, setOutcome] = useState<DealOutcome>('won');
  const [dealName, setDealName] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!competitorName.trim()) return;

    // Validate deal value if provided
    if (dealValue) {
      const parsed = parseFloat(dealValue);
      if (isNaN(parsed) || parsed < 0) {
        toast({ title: 'Invalid Value', description: 'Deal value must be a positive number', variant: 'destructive' });
        return;
      }
    }

    try {
      await logDeal.mutateAsync({
        competitor_name: competitorName.trim(),
        outcome,
        deal_name: dealName.trim() || undefined,
        deal_value: dealValue ? parseFloat(dealValue) : undefined,
        notes: notes.trim() || undefined,
      });
      toast({ title: 'Deal Logged', description: `${outcome === 'won' ? 'Win' : outcome === 'lost' ? 'Loss' : 'Deal'} recorded vs ${competitorName}` });
      setCompetitorName('');
      setDealName('');
      setDealValue('');
      setNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log deal';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <IconDeals className="h-6 w-6 text-primary" />
            Win/Loss Log
          </h1>
          <p className="text-muted-foreground mt-2">
            Track competitive deal outcomes to find signal-to-outcome correlations
          </p>
        </div>

        {/* Free tier gate */}
        {!canLogDeals && (
          <Card className="rounded-xl border border-border/50 mb-6">
            <CardContent className="py-12 text-center space-y-3">
              <IconDeals className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-foreground font-medium">Win/Loss tracking requires Growth plan</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Upgrade to Growth to log deals, track outcomes, and discover which competitor signals correlate with wins and losses.
              </p>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg mt-2">
                Upgrade to Growth
              </Button>
            </CardContent>
          </Card>
        )}

        {canLogDeals && (
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400 tabular-nums">{winsCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Wins</div>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
                <div className="text-2xl font-bold text-rose-400 tabular-nums">{lossesCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Losses</div>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
                <div className="text-2xl font-bold text-amber-400 tabular-nums">{inProgressCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">In Progress</div>
              </div>
            </div>

            {/* Log new deal */}
            <Card className="rounded-xl border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Log a Deal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Competitor *</label>
                    <Select value={competitorName} onValueChange={setCompetitorName}>
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue placeholder="Select competitor" />
                      </SelectTrigger>
                      <SelectContent>
                        {(competitors || []).map((c) => (
                          <SelectItem key={c.id} value={c.competitor_name}>
                            {c.competitor_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Outcome *</label>
                    <Select value={outcome} onValueChange={(v) => setOutcome(v as DealOutcome)}>
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Deal Name</label>
                    <Input
                      placeholder="Acme Corp Q2"
                      value={dealName}
                      onChange={(e) => setDealName(e.target.value)}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Deal Value ($)</label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Notes</label>
                    <Textarea
                      placeholder="Key factors in the outcome..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[40px] bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!competitorName.trim() || logDeal.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                >
                  {logDeal.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <IconTrophy className="h-4 w-4 mr-1.5" />
                  )}
                  Log Deal
                </Button>
              </CardContent>
            </Card>

            {/* Deal history */}
            <Card className="rounded-xl border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Recent Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : deals.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No deals logged yet. Start tracking wins and losses to build your competitive record.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {deals.slice(0, 20).map((deal) => (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-foreground font-medium">
                              {deal.deal_name || `vs ${deal.competitor_name}`}
                            </p>
                            <Badge variant="outline" className={`text-xs ${OUTCOME_CONFIG[deal.outcome].color}`}>
                              {OUTCOME_CONFIG[deal.outcome].label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{deal.competitor_name}</span>
                            {deal.deal_value && <span>${deal.deal_value.toLocaleString()}</span>}
                            <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <div className="container max-w-6xl mx-auto px-4">
        <Footer />
      </div>
    </div>
  );
}
