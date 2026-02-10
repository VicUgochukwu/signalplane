import { invokeEdgeFunction } from './edge-functions';

// ── Types ────────────────────────────────────────────────────────────

export interface DetectedPage {
  url: string;
  path: string;
  type: string;
  label: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'head' | 'sitemap' | 'industry_default';
  selected: boolean; // client-side only — for toggle state
}

export interface DetectionResult {
  domain: string;
  status: 'loading' | 'success' | 'error';
  pages: DetectedPage[];
  error?: string;
}

interface DetectPagesResponse {
  pages: Array<Omit<DetectedPage, 'selected'>>;
  detection_metadata: {
    domain: string;
    duration_ms: number;
    sitemap_found: boolean;
    head_checks: number;
    pages_found: number;
    industry_applied: string | null;
  };
}

// ── Detection wrapper ────────────────────────────────────────────────

/**
 * Call the detect-pages edge function and return pages with
 * pre-set selection: high/medium confidence → selected, low → unselected.
 */
export async function detectPages(
  domain: string,
  industry?: string,
): Promise<DetectedPage[]> {
  const response = await invokeEdgeFunction<DetectPagesResponse>(
    'detect-pages',
    { domain, industry },
  );

  return response.pages.map((page) => ({
    ...page,
    selected: page.confidence !== 'low', // auto-select high + medium
  }));
}

// ── Confidence helpers ───────────────────────────────────────────────

export function confidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'text-emerald-400';
    case 'medium':
      return 'text-amber-400';
    case 'low':
      return 'text-muted-foreground';
  }
}

export function confidenceDot(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'bg-emerald-400';
    case 'medium':
      return 'bg-amber-400';
    case 'low':
      return 'bg-muted-foreground';
  }
}

export function confidenceLabel(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'Verified';
    case 'medium':
      return 'Likely';
    case 'low':
      return 'Suggested';
  }
}
