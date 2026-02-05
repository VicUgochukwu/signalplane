import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { packets } from "@/data/packets";

const AUTO_ROTATE_INTERVAL = 6000; // 6 seconds

export function WeeklyPacketCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentPacket = packets[currentIndex];

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === packets.length - 1 ? 0 : prev + 1));
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? packets.length - 1 : prev - 1));
  };

  // Auto-rotation effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(goToNext, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, [isPaused, goToNext]);

  return (
    <div
      className="mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel header */}
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-sm text-muted-foreground">
          Sample Weekly Packets
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
