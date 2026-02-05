import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, MessageSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { packets as staticPackets, WeeklyPacket } from "@/data/packets";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChangelogEntry } from "@/types/changelog";
import { format, parseISO, addDays } from "date-fns";

const AUTO_ROTATE_INTERVAL = 6000; // 6 seconds

// Map icons for dynamic key shifts
const shiftIcons = [TrendingUp, AlertTriangle, MessageSquare, Target];

interface WeeklyPacketCarouselProps {
  entries?: ChangelogEntry[];
  isLoading?: boolean;
}

export function WeeklyPacketCarousel({ entries, isLoading }: WeeklyPacketCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Transform real data into packet format or fall back to static
  const packets = useMemo(() => {
    if (!entries || entries.length === 0) return staticPackets;

    // Group entries by week
    const groups: Record<string, ChangelogEntry[]> = {};
    entries.forEach((entry) => {
      if (!groups[entry.week_start_date]) {
        groups[entry.week_start_date] = [];
      }
      groups[entry.week_start_date].push(entry);
    });

    // Transform to packet format
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6) // Limit to 6 most recent weeks
      .map(([weekStart, weekEntries], index) => {
        const weekDate = parseISO(weekStart);
        const weekEnd = addDays(weekDate, 6);
        const weekNum = Object.keys(groups).length - index;

        // Get unique companies and tags
        const companies = [...new Set(weekEntries.map(e => e.company_name))];
        const tagCounts: Record<string, number> = {};
        weekEntries.forEach(e => {
          tagCounts[e.primary_tag] = (tagCounts[e.primary_tag] || 0) + 1;
        });

        // Get major and moderate changes as key shifts
        const keyChanges = weekEntries
          .filter(e => e.change_magnitude === 'major' || e.change_magnitude === 'moderate')
          .slice(0, 3);

        // Create summary from implications
        const majorChanges = weekEntries.filter(e => e.change_magnitude === 'major');
        const summary = majorChanges.length > 0
          ? majorChanges.slice(0, 2).map(e => e.implication).join(' ')
          : weekEntries.slice(0, 2).map(e => e.implication).join(' ');

        // Generate open questions from entries
        const openQuestions = weekEntries
          .filter(e => e.change_magnitude === 'major')
          .slice(0, 2)
          .map(e => `What does ${e.company_name}'s ${e.primary_tag.toLowerCase()} change imply for our positioning?`);

        const packet: WeeklyPacket = {
          id: index + 1,
          week: `Week ${weekNum}`,
          title: `Week of ${format(weekDate, 'MMM d')}: ${companies.slice(0, 2).join(' & ')} Activity`,
          date: format(weekEnd, 'MMM d, yyyy'),
          dateRange: `${format(weekDate, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`,
          status: index === 0 ? 'live' : index < 3 ? 'published' : 'archived',
          summary: summary || 'Multiple signals detected across tracked competitors.',
          signalsDetected: weekEntries.length,
          avgConfidence: Math.round(weekEntries.reduce((acc, e) => acc + e.confidence, 0) / weekEntries.length),
          keyInsights: Math.min(5, Math.ceil(weekEntries.length / 2)),
          keyShifts: keyChanges.length > 0 ? keyChanges.map((e, i) => ({
            icon: shiftIcons[i % shiftIcons.length],
            text: `${e.company_name}: ${e.diff_summary}`,
          })) : [{ icon: TrendingUp, text: 'Monitoring ongoing changes across competitors' }],
          openQuestions: openQuestions.length > 0 ? openQuestions : ['What patterns are emerging across competitors?'],
          highlights: weekEntries
            .filter(e => e.change_magnitude === 'major')
            .slice(0, 3)
            .map(e => `${e.company_name} ${e.primary_tag.toLowerCase()} update detected`),
        };

        return packet;
      });
  }, [entries]);

  const currentPacket = packets[currentIndex];

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === packets.length - 1 ? 0 : prev + 1));
  }, [packets.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? packets.length - 1 : prev - 1));
  };

  // Auto-rotation effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(goToNext, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, [isPaused, goToNext]);

  // Loading state
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  const hasRealData = entries && entries.length > 0;

  return (
    <div
      className="mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel header */}
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-sm text-muted-foreground">
          {hasRealData ? "Recent Weekly Packets" : "Sample Weekly Packets"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevious}
            aria-label="Previous packet"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-mono text-xs text-muted-foreground min-w-[60px] text-center">
            {currentIndex + 1} / {packets.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToNext}
            aria-label="Next packet"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Packet card */}
      <div className="rounded-lg border border-border bg-card p-6 transition-all duration-300">
        {/* Packet header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div>
            <h4 className="font-mono font-semibold text-foreground">
              {currentPacket.week}
            </h4>
            <p className="text-xs text-muted-foreground">{currentPacket.dateRange}</p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded bg-primary/10 text-primary">
            Control Plane
          </span>
        </div>

        {/* Executive Summary */}
        <div className="mb-6">
          <h5 className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Executive Summary
          </h5>
          <p className="text-sm text-foreground leading-relaxed">
            {currentPacket.summary}
          </p>
        </div>

        {/* Key Shifts */}
        <div className="mb-6">
          <h5 className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Key Shifts
          </h5>
          <ul className="space-y-2">
            {currentPacket.keyShifts.map((shift, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <shift.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{shift.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Open Questions */}
        <div>
          <h5 className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Open Questions
          </h5>
          <ul className="space-y-2">
            {currentPacket.openQuestions.map((question, index) => (
              <li key={index} className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30">
                {question}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dot indicators with progress */}
      <div className="flex justify-center gap-2 mt-4">
        {packets.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex
                ? "bg-primary"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to packet ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
