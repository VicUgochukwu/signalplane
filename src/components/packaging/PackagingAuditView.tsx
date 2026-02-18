import { useState } from 'react';
import {
  Calendar,
  FileText,
  Loader2,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  Lightbulb,
  Flame,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePackagingAudits } from '@/hooks/usePackagingIntel';
import type { PackagingAudit, SOTEntry } from '@/types/packagingIntel';

// âââ PackagingAuditView âââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function PackagingAuditView() {
  const { data: audits = [], isLoading } = usePackagingAudits();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No packaging audits</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Quarterly packaging audits are generated at the start of each quarter.
          They synthesize landscape data, pricing changes, and competitive signals
          into a SWOT analysis of your packaging position.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {audits.map((audit) => (
        <AuditCard key={audit.id} audit={audit} />
      ))}
    </div>
  );
}

// âââ AuditCard ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function AuditCard({ audit }: { audit: PackagingAudit }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!audit.content_md) return;
    await navigator.clipboard.writeText(audit.content_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse SWOT arrays (may be JSON strings or arrays)
  const strengths = parseSOTArray(audit.strengths);
  const vulnerabilities = parseSOTArray(audit.vulnerabilities);
  const opportunities = parseSOTArray(audit.opportunities);
  const threats = parseSOTArray(audit.threats);

  const totalEntries = strengths.length + vulnerabilities.length + opportunities.length + threats.length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{audit.title}</CardTitle>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {audit.quarter}
              </div>
              {totalEntries > 0 && (
                <span>{totalEntries} findings</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {audit.content_md && (
              <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 gap-1.5">
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="h-7"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* SWOT summary badges */}
      <CardContent className="pt-0 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {strengths.length > 0 && (
            <Badge variant="outline" className="text-xs text-emerald-400 bg-emerald-500/10 border-transparent">
              <Shield className="h-3 w-3 mr-1" />
              {strengths.length} Strength{strengths.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {vulnerabilities.length > 0 && (
            <Badge variant="outline" className="text-xs text-red-400 bg-red-500/10 border-transparent">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {vulnerabilities.length} Vulnerabilit{vulnerabilities.length !== 1 ? 'ies' : 'y'}
            </Badge>
          )}
          {opportunities.length > 0 && (
            <Badge variant="outline" className="text-xs text-blue-400 bg-blue-500/10 border-transparent">
              <Lightbulb className="h-3 w-3 mr-1" />
              {opportunities.length} Opportunit{opportunities.length !== 1 ? 'ies' : 'y'}
            </Badge>
          )}
          {threats.length > 0 && (
            <Badge variant="outline" className="text-xs text-amber-400 bg-amber-500/10 border-transparent">
              <Flame className="h-3 w-3 mr-1" />
              {threats.length} Threat{threats.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Expanded content */}
      {expanded && (
        <CardContent className="pt-0">
          {/* SWOT sections */}
          <div className="space-y-4 border-t border-border/50 pt-3">
            {strengths.length > 0 && (
              <SWOTSection
                title="Strengths"
                entries={strengths}
                icon={<Shield className="h-3.5 w-3.5" />}
                color="text-emerald-400"
                bgColor="bg-emerald-500/5"
                entryKey="claim"
              />
            )}
            {vulnerabilities.length > 0 && (
              <SWOTSection
                title="Vulnerabilities"
                entries={vulnerabilities}
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                color="text-red-400"
                bgColor="bg-red-500/5"
                entryKey="gap"
              />
            )}
            {opportunities.length > 0 && (
              <SWOTSection
                title="Opportunities"
                entries={opportunities}
                icon={<Lightbulb className="h-3.5 w-3.5" />}
                color="text-blue-400"
                bgColor="bg-blue-500/5"
                entryKey="position"
              />
            )}
            {threats.length > 0 && (
              <SWOTSection
                title="Threats"
                entries={threats}
                icon={<Flame className="h-3.5 w-3.5" />}
                color="text-amber-400"
                bgColor="bg-amber-500/5"
                entryKey="threat"
              />
            )}
          </div>

          {/* Full markdown content */}
          {audit.content_md ? (
            <div className="prose prose-sm prose-invert max-w-none text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed border-t border-border/50 pt-3 mt-4">
              {audit.content_md}
            </div>
          ) : audit.content_json && Object.keys(audit.content_json).length > 0 ? (
            <div className="space-y-2 border-t border-border/50 pt-3 mt-4">
              {Object.entries(audit.content_json).map(([key, value]) => (
                <div key={key}>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-foreground/80">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pt-3 border-t border-border/50 mt-4">
              No content available
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// âââ SWOT Section âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function SWOTSection({
  title,
  entries,
  icon,
  color,
  bgColor,
  entryKey,
}: {
  title: string;
  entries: SOTEntry[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  entryKey: 'claim' | 'gap' | 'position' | 'threat';
}) {
  return (
    <div className={`rounded-lg ${bgColor} p-3`}>
      <div className={`text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5 ${color}`}>
        {icon}
        {title}
      </div>
      <div className="space-y-2">
        {entries.map((entry, idx) => (
          <SOTRow key={idx} entry={entry} entryKey={entryKey} />
        ))}
      </div>
    </div>
  );
}

function SOTRow({
  entry,
  entryKey,
}: {
  entry: SOTEntry;
  entryKey: 'claim' | 'gap' | 'position' | 'threat';
}) {
  const mainText = entry[entryKey] || '';
  const competitor = entry.competitor || (entry.competitors && entry.competitors.length > 0 ? entry.competitors.join(', ') : null);

  return (
    <div className="flex items-start gap-3 py-1">
      <div className="min-w-0 flex-1">
        <div className="text-sm text-foreground">{mainText}</div>
        {entry.rationale && (
          <div className="text-xs text-muted-foreground mt-0.5">{entry.rationale}</div>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {competitor && (
            <span className="text-xs text-muted-foreground">{competitor}</span>
          )}
          {entry.severity && (
            <Badge variant="outline" className={`text-xs border-transparent ${
              entry.severity === 'high' ? 'text-red-400' :
              entry.severity === 'medium' ? 'text-amber-400' :
              'text-blue-400'
            }`}>
              {entry.severity}
            </Badge>
          )}
          {entry.urgency && (
            <Badge variant="outline" className={`text-xs border-transparent ${
              entry.urgency === 'high' ? 'text-red-400' :
              entry.urgency === 'medium' ? 'text-amber-400' :
              'text-blue-400'
            }`}>
              {entry.urgency} urgency
            </Badge>
          )}
          {entry.evidence_count != null && entry.evidence_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {entry.evidence_count} signal{entry.evidence_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// âââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function parseSOTArray(raw: unknown): SOTEntry[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}
