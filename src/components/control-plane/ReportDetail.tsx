import { IntelPacket, PacketStatus, IntelSection } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Radio, Zap, Shield, HelpCircle, Lightbulb, Crosshair, TrendingUp, Globe, Target } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { MarketWinnersCard } from './MarketWinnersCard';
import { MarketWinner } from '@/types/controlPlane';

interface ReportDetailProps {
  report: IntelPacket;
  onBack: () => void;
}

const statusConfig: Record<PacketStatus, { label: string; class: string }> = {
  live: { label: 'LIVE', class: 'badge-success' },
  published: { label: 'PUBLISHED', class: 'badge-info' },
  draft: { label: 'DRAFT', class: 'badge-warning' },
  archived: { label: 'ARCHIVED', class: 'badge-error' },
};

interface SectionConfig {
  key: keyof Pick<IntelPacket, 'competitive_intel' | 'pipeline_intel' | 'market_intel'>;
  title: string;
  icon: typeof Crosshair;
  color: string;
}

const sectionConfigs: SectionConfig[] = [
  { key: 'competitive_intel', title: 'Competitive Intel', icon: Crosshair, color: 'text-terminal-red' },
  { key: 'pipeline_intel', title: 'Pipeline Intel', icon: TrendingUp, color: 'text-terminal-green' },
  { key: 'market_intel', title: 'Market Intel', icon: Globe, color: 'text-terminal-cyan' },
];

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-terminal-green';
  if (confidence >= 60) return 'text-terminal-amber';
  return 'text-terminal-red';
};

const getConfidenceBg = (confidence: number) => {
  if (confidence >= 80) return 'bg-terminal-green/20 border-terminal-green/40';
  if (confidence >= 60) return 'bg-terminal-amber/20 border-terminal-amber/40';
  return 'bg-terminal-red/20 border-terminal-red/40';
};

const IntelSectionCard = ({ 
  section, 
  config 
}: { 
  section: IntelSection; 
  config: SectionConfig;
}) => {
  const Icon = config.icon;
  
  return (
    <Card className="card-terminal" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          // {config.title}
        </h3>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {section.summary}
        </p>
        <ul className="space-y-2">
          {section.highlights.map((highlight, index) => (
            <li 
              key={index}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <span className={`mt-0.5 ${config.color}`}>›</span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export const ReportDetail = ({ report, onBack }: ReportDetailProps) => {
  const status = statusConfig[report.status];
  const formattedDate = format(parseISO(report.date), 'MMMM d, yyyy');

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground font-mono text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          cd ../packets
        </Button>
        
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Radio className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground font-mono">
                {report.headline}
              </h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  report.status === 'live' ? 'bg-terminal-green animate-glow-pulse' :
                  report.status === 'archived' ? 'bg-terminal-red' :
                  report.status === 'draft' ? 'bg-terminal-amber' :
                  'bg-terminal-cyan'
                }`} />
                <span className={`badge-status ${status.class}`}>
                  {status.label}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm font-mono">
              <span className="badge-range">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {report.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="card-terminal" style={{ boxShadow: 'var(--shadow-soft)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Radio className="h-5 w-5 text-terminal-cyan" />
                <div>
                  <div className="metric-value">
                    {report.metrics.signals_detected ?? '—'}
                  </div>
                  <div className="metric-label">Signals Detected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-terminal" style={{ boxShadow: 'var(--shadow-soft)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-terminal-purple" />
                <div>
                  <div className="metric-value text-terminal-purple">
                    {report.metrics.confidence_score !== undefined 
                      ? `${report.metrics.confidence_score}%` 
                      : '—'}
                  </div>
                  <div className="metric-label">Confidence Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-terminal" style={{ boxShadow: 'var(--shadow-soft)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-terminal-amber" />
                <div>
                  <div className="metric-value text-terminal-amber">
                    {report.metrics.impact_score !== undefined 
                      ? `${report.metrics.impact_score}` 
                      : '—'}
                  </div>
                  <div className="metric-label">Impact Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Executive Summary */}
      <Card className="mb-6 card-terminal" style={{ boxShadow: 'var(--shadow-soft)' }}>
        <CardHeader className="pb-3">
          <h2 className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider">
            // Executive Summary
          </h2>
        </CardHeader>
        <CardContent>
          <ul className="summary-list">
            {report.exec_summary.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Intel Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {sectionConfigs.map((config) => {
          const section = report[config.key];
          if (!section) return null;
          return (
            <IntelSectionCard 
              key={config.key} 
              section={section} 
              config={config} 
            />
          );
        })}
      </div>

      {/* Bets */}
      {report.bets && report.bets.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider px-1 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-terminal-amber" />
            // Strategic Bets
          </h2>
          <div className="space-y-3">
            {report.bets.map((bet, index) => (
              <Card 
                key={index} 
                className={`card-terminal border ${getConfidenceBg(bet.confidence)}`}
                style={{ boxShadow: 'var(--shadow-soft)' }}
              >
                <CardContent className="p-4">
                  <p className="text-foreground text-sm mb-3 leading-relaxed">
                    {bet.hypothesis}
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">
                      Confidence: <span className={getConfidenceColor(bet.confidence)}>{bet.confidence}%</span>
                    </span>
                    <span className="text-muted-foreground">
                      {bet.signal_ids.length} signal{bet.signal_ids.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Key Questions */}
      {report.key_questions && report.key_questions.length > 0 && (
        <Card className="card-terminal" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="pb-3">
            <h2 className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-terminal-cyan" />
              // Key Questions
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {report.key_questions.map((question, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <span className="text-terminal-cyan font-mono text-xs mt-0.5">Q{index + 1}</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Market Winners */}
      {report.market_winners && (
        <MarketWinnersCard 
          proven={report.market_winners.proven || []}
          emerging={report.market_winners.emerging || []}
        />
      )}
    </div>
  );
};
