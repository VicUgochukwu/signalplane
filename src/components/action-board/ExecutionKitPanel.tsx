import { useState, useMemo, type ReactNode } from 'react';
import { ExecutionKit, KIT_TYPE_COLORS, KitDecisionType } from '@/types/actionBoard';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Copy, Check, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExecutionKitPanelProps {
  kit: ExecutionKit;
}

export function ExecutionKitPanel({ kit }: ExecutionKitPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    // First component expanded by default
    { 0: true }
  );

  const toggleItem = (idx: number) => {
    setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Execution Kit</p>
        <Badge variant="outline" className={cn(
          'text-[10px] border',
          KIT_TYPE_COLORS[kit.type as KitDecisionType] || ''
        )}>
          {kit.type}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {kit.components.map((component, idx) => (
          <KitComponent
            key={idx}
            title={component.title}
            content={component.content}
            copyable={component.copyable}
            isExpanded={!!expandedItems[idx]}
            onToggle={() => toggleItem(idx)}
          />
        ))}
      </div>
    </div>
  );
}

function KitComponent({ title, content, copyable, isExpanded, onToggle }: {
  title: string;
  content: string;
  copyable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border/30 bg-muted/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="text-sm text-muted-foreground leading-relaxed max-w-none">
            <MarkdownContent content={content} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lightweight Markdown Renderer
// Handles: tables, headers, bold, italic, inline code, bullet lists,
// numbered lists, blockquotes, horizontal rules, and plain paragraphs.
// ---------------------------------------------------------------------------

/** Render inline markdown: **bold**, *italic*, `code`, [links](url) */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Regex matches: **bold**, *italic*, `code`, [text](url)
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    // Push text before this match
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={key++} className="font-semibold text-foreground">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      // `code`
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded bg-muted/30 text-xs font-mono text-foreground/80">
          {match[4]}
        </code>
      );
    } else if (match[5] && match[6]) {
      // [text](url)
      parts.push(
        <a key={key++} href={match[6]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {match[5]}
        </a>
      );
    }

    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : [text];
}

/** Check if a line is a table separator like |---|---|---| */
function isTableSeparator(line: string): boolean {
  return /^\|[\s:-]+\|/.test(line) && /^[\s|:-]+$/.test(line);
}

/** Parse a table row into cells */
function parseTableRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());
}

/** Parse alignment from separator row */
function parseAlignments(sepLine: string): ('left' | 'center' | 'right')[] {
  return parseTableRow(sepLine).map(cell => {
    const trimmed = cell.replace(/\s/g, '');
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left';
  });
}

function MarkdownContent({ content }: { content: string }) {
  const rendered = useMemo(() => {
    const lines = content.split('\n');
    const elements: ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // --- Empty line ---
      if (trimmed === '') {
        i++;
        continue;
      }

      // --- Horizontal rule ---
      if (/^[-*_]{3,}$/.test(trimmed)) {
        elements.push(<hr key={key++} className="my-3 border-border/30" />);
        i++;
        continue;
      }

      // --- Headers ---
      const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const classes: Record<number, string> = {
          1: 'text-base font-bold text-foreground mt-3 mb-1.5',
          2: 'text-sm font-semibold text-foreground mt-2.5 mb-1',
          3: 'text-sm font-medium text-foreground mt-2 mb-1',
          4: 'text-xs font-medium text-foreground/80 uppercase tracking-wider mt-2 mb-1',
        };
        elements.push(
          <p key={key++} className={classes[level] || classes[3]}>
            {renderInline(text)}
          </p>
        );
        i++;
        continue;
      }

      // --- Table ---
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          // Determine if row 1 is separator
          const hasSep = tableLines.length >= 2 && isTableSeparator(tableLines[1]);
          const headerRow = hasSep ? parseTableRow(tableLines[0]) : null;
          const alignments = hasSep ? parseAlignments(tableLines[1]) : [];
          const bodyRows = tableLines.slice(hasSep ? 2 : 0);

          const alignStyle = (colIdx: number): React.CSSProperties | undefined => {
            const a = alignments[colIdx];
            if (!a || a === 'left') return undefined;
            return { textAlign: a };
          };

          elements.push(
            <div key={key++} className="my-2 overflow-x-auto rounded-md border border-border/30">
              <table className="w-full text-xs">
                {headerRow && (
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/20">
                      {headerRow.map((cell, ci) => (
                        <th
                          key={ci}
                          className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap"
                          style={alignStyle(ci)}
                        >
                          {renderInline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {bodyRows.map((row, ri) => {
                    const cells = parseTableRow(row);
                    return (
                      <tr
                        key={ri}
                        className={cn(
                          'border-b last:border-b-0 border-border/20',
                          ri % 2 === 1 && 'bg-muted/10'
                        )}
                      >
                        {cells.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-3 py-1.5 text-muted-foreground"
                            style={alignStyle(ci)}
                          >
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }

        // Fallback: not enough lines for a table, treat as plain text
        tableLines.forEach(tl => {
          elements.push(<p key={key++}>{renderInline(tl)}</p>);
        });
        continue;
      }

      // --- Blockquote ---
      if (trimmed.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('> ')) {
          quoteLines.push(lines[i].trim().slice(2));
          i++;
        }
        elements.push(
          <blockquote key={key++} className="my-2 border-l-2 border-primary/30 pl-3 italic text-muted-foreground/80">
            {quoteLines.map((ql, qi) => (
              <p key={qi}>{renderInline(ql)}</p>
            ))}
          </blockquote>
        );
        continue;
      }

      // --- Numbered list ---
      if (/^\d+[.)]\s/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+[.)]\s/, ''));
          i++;
        }
        elements.push(
          <ol key={key++} className="my-1.5 ml-4 list-decimal space-y-0.5 marker:text-primary/50">
            {listItems.map((item, li) => (
              <li key={li} className="pl-1">{renderInline(item)}</li>
            ))}
          </ol>
        );
        continue;
      }

      // --- Unordered list ---
      if (/^[-*+]\s/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^[-*+]\s/, ''));
          i++;
        }
        elements.push(
          <ul key={key++} className="my-1.5 ml-4 list-disc space-y-0.5 marker:text-primary/50">
            {listItems.map((item, li) => (
              <li key={li} className="pl-1">{renderInline(item)}</li>
            ))}
          </ul>
        );
        continue;
      }

      // --- Bold-only line (standalone heading-like) ---
      if (/^\*\*(.+)\*\*$/.test(trimmed)) {
        const boldText = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
        elements.push(
          <p key={key++} className="font-semibold text-foreground mt-2 mb-1">
            {boldText}
          </p>
        );
        i++;
        continue;
      }

      // --- Plain paragraph ---
      elements.push(
        <p key={key++} className="my-0.5">
          {renderInline(trimmed)}
        </p>
      );
      i++;
    }

    return elements;
  }, [content]);

  return <>{rendered}</>;
}
