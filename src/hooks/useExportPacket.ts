import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { IntelPacket } from '@/types/report';
import { invokeEdgeFunction, invokeEdgeFunctionSilent } from '@/lib/edge-functions';

export function useExportPacket() {
  const { toast } = useToast();

  const emailMutation = useMutation({
    mutationFn: async (report: IntelPacket) => {
      return await invokeEdgeFunction('export-packet', {
        action: 'email',
        packet_id: report.id,
        packet_data: report,
      });
    },
    onSuccess: (data) => {
      toast({ title: 'Packet sent', description: data.message || 'Check your email.' });
      invokeEdgeFunctionSilent('loops-sync', {
        action: 'track_event',
        event_name: 'packet_emailed',
        properties: { packet_title: emailMutation.variables?.packet_title || '' },
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    },
  });

  const downloadAsMarkdown = (report: IntelPacket) => {
    const md = generateMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.packet_title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Packet saved as Markdown file.' });
    invokeEdgeFunctionSilent('loops-sync', {
      action: 'track_event',
      event_name: 'packet_downloaded',
      properties: { packet_title: report.packet_title },
    });
  };

  return {
    emailPacket: (report: IntelPacket) => emailMutation.mutate(report),
    isEmailing: emailMutation.isPending,
    downloadAsMarkdown,
  };
}

// ──────────────────────────────────────────────────────
// Merged section mapping (matches ReportDetail 3-tab layout)
// ──────────────────────────────────────────────────────
const MERGED_SECTIONS = [
  { title: 'Competitive Changes', keys: ['messaging', 'narrative'] },
  { title: 'Market Direction', keys: ['icp', 'horizon'] },
  { title: 'Objections & Risk', keys: ['objection'] },
] as const;

function generateMarkdown(report: IntelPacket): string {
  const lines: string[] = [];

  lines.push(`# ${report.packet_title}`);
  lines.push(`**${report.week_start} — ${report.week_end}**`);
  lines.push('');

  // Metrics + prediction accuracy (inline)
  if (report.metrics) {
    const items: string[] = [];
    if (report.metrics.signals_detected != null) items.push(`Signals: ${report.metrics.signals_detected}`);
    if (report.metrics.confidence_score != null) items.push(`Confidence: ${report.metrics.confidence_score}%`);
    if (report.metrics.impact_score != null) items.push(`Impact: ${report.metrics.impact_score}`);

    // Inline prediction accuracy (replaces Judgment Loop)
    const allPreds = mergedPredictions(report);
    const scored = allPreds.filter(p => p.outcome && p.outcome !== 'pending');
    if (scored.length > 0) {
      const correct = scored.filter(p => p.outcome === 'correct').length;
      const pct = Math.round((correct / scored.length) * 100);
      items.push(`Prediction Accuracy: ${pct}% (${scored.length} scored)`);
    }

    if (items.length) {
      lines.push(items.join(' | '));
      lines.push('');
    }
  }

  // Executive Summary
  if (report.exec_summary?.length) {
    lines.push('## Executive Summary');
    for (const item of report.exec_summary) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Key Questions (moved up — primes reader before intel)
  if (report.key_questions?.length) {
    lines.push('## This Week\'s Key Questions');
    lines.push('');
    for (let i = 0; i < report.key_questions.length; i++) {
      lines.push(`${i + 1}. ${report.key_questions[i]}`);
    }
    lines.push('');
  }

  // Intel Sections — merged 3-tab structure
  if (report.sections) {
    for (const group of MERGED_SECTIONS) {
      const summaryParts: string[] = [];
      const highlights: string[] = [];

      for (const key of group.keys) {
        const s = report.sections[key as keyof typeof report.sections];
        if (!s) continue;
        if (s.summary) summaryParts.push(s.summary);
        if (s.highlights?.length) highlights.push(...s.highlights);
      }

      if (!summaryParts.length && !highlights.length) continue;

      lines.push(`## ${group.title}`);

      if (summaryParts.length) {
        lines.push(summaryParts.join(' '));
        lines.push('');
      }

      if (highlights.length) {
        lines.push('### Highlights');
        for (const h of highlights) {
          lines.push(`- ${h}`);
        }
        lines.push('');
      }
    }
  }

  // Predictions & Hypotheses (bets folded in)
  const allPredictions = mergedPredictions(report);
  if (allPredictions.length) {
    lines.push('## Predictions & Hypotheses');
    lines.push('');
    lines.push('| Prediction | Timeframe | Confidence |');
    lines.push('|------------|-----------|------------|');
    for (const p of allPredictions) {
      lines.push(`| ${p.prediction} | ${p.timeframe} | ${p.confidence}% |`);
    }
    lines.push('');
  }

  // Market Winners
  if (report.market_winners) {
    const proven = report.market_winners.proven || [];
    const emerging = report.market_winners.emerging || [];
    if (proven.length || emerging.length) {
      lines.push('## What\'s Winning in Your Market');
      lines.push('');
      for (const tier of [{ label: 'Proven', items: proven }, { label: 'Emerging', items: emerging }]) {
        if (!tier.items.length) continue;
        lines.push(`### ${tier.label}`);
        for (const w of tier.items) {
          lines.push(`- **${w.pattern_label}** (${w.where_seen.join(', ')}) — ${w.survival_weeks}w, ${w.propagation_count} adopted`);
          if (w.your_gap) lines.push(`  - ⚠️ ${w.your_gap}`);
          if (w.what_changed) lines.push(`  - ${w.what_changed}`);
        }
        lines.push('');
      }
    }
  }

  // Action Mapping
  if (report.action_mapping) {
    if (report.action_mapping.this_week?.length) {
      lines.push('## This Week');
      lines.push('');
      lines.push('| Action | Owner | Priority |');
      lines.push('|--------|-------|----------|');
      for (const a of report.action_mapping.this_week) {
        lines.push(`| ${a.action} | ${a.owner} | ${a.priority} |`);
      }
      lines.push('');
    }

    if (report.action_mapping.monitor?.length) {
      lines.push('## Monitor');
      lines.push('');
      for (const m of report.action_mapping.monitor) {
        lines.push(`**${m.signal}**`);
        lines.push(`- Trigger: ${m.trigger}`);
        lines.push(`- Action: ${m.action}`);
        lines.push('');
      }
    }
  }

  lines.push('---');
  lines.push('*Generated by [Signal Plane](https://signalplane.dev)*');

  return lines.join('\n');
}

/** Fold bets into predictions (deduped) — mirrors ReportDetail logic */
function mergedPredictions(report: IntelPacket): Array<{ prediction: string; timeframe: string; confidence: number; outcome?: string }> {
  const preds = [...(report.predictions || [])].map(p => ({
    prediction: p.prediction,
    timeframe: p.timeframe,
    confidence: p.confidence,
    outcome: p.outcome,
  }));
  for (const bet of (report.bets || [])) {
    const isDuplicate = preds.some(p =>
      p.prediction.toLowerCase().includes(bet.hypothesis.toLowerCase().slice(0, 40)) ||
      bet.hypothesis.toLowerCase().includes(p.prediction.toLowerCase().slice(0, 40))
    );
    if (!isDuplicate) {
      preds.push({
        prediction: bet.hypothesis,
        timeframe: 'Ongoing',
        confidence: bet.confidence,
      });
    }
  }
  return preds;
}
