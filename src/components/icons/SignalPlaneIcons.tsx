import React from 'react';

// Shared props type matching lucide-react pattern for drop-in replacement
interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

// =============================================================================
// NAVIGATION & CORE PRODUCT ICONS
// =============================================================================

/**
 * Control Plane / Intel Packets — Radar sweep with signal arcs
 * Replaces: BarChart3 in AppNavigation, ReportList
 */
export const IconControlPlane = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 5a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 8a4 4 0 0 1 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="12" x2="18.5" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2.5 12A9.5 9.5 0 0 0 12 21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" opacity="0.4" />
  </svg>
);

/**
 * Artifacts — Layered document with signal wave accent
 * Replaces: FileText in AppNavigation, Artifacts page
 */
export const IconArtifacts = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 15c.5-1 1-2 2-2s1.5 2 2 2 1.5-2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="8" y1="18" x2="16" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/**
 * Submit Signal — Signal beacon emitting upward
 * Replaces: PlusCircle in AppNavigation
 */
export const IconSubmitSignal = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="9" y="14" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="14" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8.5 6.5a5 5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 4a8 8 0 0 1 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="7" r="1" fill="currentColor" />
  </svg>
);

/**
 * Diff Tracker / Signal Feed — Two signals compared with delta
 * Replaces: ArrowRightLeft in AppNavigation
 */
export const IconDiffTracker = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" opacity="0.35" />
    <path d="M4 9c1-2 2-4 3.5-4S9 9 10 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15c1-1.5 2-3 3.5-3S9 15 10 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    <path d="M14 9c1-2 2-4 3.5-4S19 9 20 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 15c1-1.5 2-3 3.5-3S19 15 20 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

/**
 * Admin Shield — Shield with radar arc inside
 * Replaces: Shield in AppNavigation, Admin page
 */
export const IconShield = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 2l8 4v5c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 10a3 3 0 0 1 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 13a6 6 0 0 1 5.5-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <circle cx="12" cy="13" r="1" fill="currentColor" />
  </svg>
);

/**
 * Team — Connected people with signal arcs
 * Replaces: Users in team nav
 */
export const IconTeam = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 14.5c1.5 0 3 1 3 3v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 8.5a4 4 0 0 0 4.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" strokeDasharray="1.5 1.5" />
  </svg>
);

/**
 * Deals — Handshake with signal accent
 * Replaces: TrendingUp in deals nav
 */
export const IconDeals = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M20 8l-3-3H7L4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 8c0 0 2 2 4 2 1 0 2-.5 3-1.5L12 8l1 .5c1 1 2 1.5 3 1.5 2 0 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 12l2 2 3-1 2 2 3-1 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
  </svg>
);

/**
 * Settings — Gear with signal dot
 * Replaces: Settings in UserMenu
 */
export const IconSettings = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// =============================================================================
// SIGNAL TYPE ICONS (used in packets, reports, signal badges)
// =============================================================================

/**
 * Messaging Intel — Speech bubble with delta indicator
 * Replaces: MessageSquare in ReportDetail section config
 */
export const IconSignalMessaging = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 10l2-3 2 3 2-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Narrative Intel — Story arc with shift marker
 * Replaces: BookOpen in ReportDetail section config
 */
export const IconSignalNarrative = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M15 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M7 12h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M16 12h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/**
 * ICP Intel — Crosshair with drift indicator
 * Replaces: Users in ReportDetail section config
 */
export const IconSignalICP = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 9l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/**
 * Horizon Intel — Horizon line with emerging peak
 * Replaces: Compass in ReportDetail section config
 */
export const IconSignalHorizon = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <line x1="2" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 16l4-6 3 3 4-8 3 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <line x1="3" y1="20" x2="8" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <line x1="11" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
  </svg>
);

/**
 * Objection Intel — Shield parrying with speech element
 * Replaces: ShieldAlert in ReportDetail section config
 */
export const IconSignalObjection = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 3l7 3.5v5c0 4.7-3 8.5-7 9.5-4-1-7-4.8-7-9.5v-5L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9.5 14h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M12 8v0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Signal Launch — Rocket/launch indicator
 * For horizon/launch-type signals
 */
export const IconSignalLaunch = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11.95A22.18 22.18 0 0 1 12 15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// =============================================================================
// DASHBOARD METRIC ICONS
// =============================================================================

/**
 * Intel Packet — Sealed intelligence envelope with signal bars
 * Replaces: BarChart3 in ReportList stat card
 */
export const IconPacket = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="14" y="13" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
    <rect x="17" y="11" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.5" />
  </svg>
);

/**
 * Confidence Gauge — Semicircular gauge meter
 * Replaces: BarChart3 in ReportList avg confidence stat
 */
export const IconConfidence = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M4 18a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 18V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    <path d="M7.5 8.5l-.5-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <path d="M16.5 8.5l.5-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <line x1="12" y1="5.5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

/**
 * Signal Count — Stacked signal waves
 * Replaces: Zap in ReportList live count, ReportDetail impact
 */
export const IconSignalCount = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M4 12h2l2-4 3 8 3-6 2 4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 7h1l1.5-2 2 4 2-3 1 2h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
    <path d="M4 17h1l1.5 1 2-2 2 1.5 1-.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
  </svg>
);

/**
 * Knowledge Ledger — Brain/memory with growth indicator
 * Replaces: Database in landing page, new Knowledge Ledger card
 */
export const IconKnowledgeLedger = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <line x1="10" y1="6.5" x2="14" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    <line x1="6.5" y1="10" x2="6.5" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    <line x1="17.5" y1="10" x2="17.5" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    <line x1="10" y1="17.5" x2="14" y2="17.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    <path d="M18 15l1.5 2 2-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// =============================================================================
// JUDGMENT LOOP & PREDICTION ICONS
// =============================================================================

/**
 * Judgment Loop — Circular loop with checkpoint
 * Replaces: TrendingUp in CompoundingSection, landing page
 */
export const IconJudgmentLoop = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M21 12a9 9 0 0 1-15.36 6.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 12A9 9 0 0 1 18.36 5.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <polyline points="22 4 18.36 5.64 16.72 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="2 20 5.64 18.36 7.28 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 10v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Prediction Correct — Bullseye hit
 * Replaces: CheckCircle2 in prediction scoring
 */
export const IconPredictionCorrect = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M16 8l1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17.5 6.5l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M20.5 3.5l-1 2.5-2.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
  </svg>
);

/**
 * Prediction Incorrect — Missed target
 * Replaces: XCircle in prediction scoring
 */
export const IconPredictionIncorrect = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// =============================================================================
// FEATURE & LANDING PAGE ICONS
// =============================================================================

/**
 * Compounding — Layers stacking with growth curve
 * Replaces: Database in CompoundingSection
 */
export const IconCompounding = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <ellipse cx="12" cy="17" rx="8" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="12" cy="12" rx="8" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="12" cy="7" rx="8" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M20 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17 4l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
  </svg>
);

/**
 * Weekly Packet — Sealed intelligence brief
 * Replaces: Package in HowItWorksSection "Deliver" step
 */
export const IconWeeklyPacket = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 4v6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M15 4v6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M7 17h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <circle cx="18" cy="14" r="1" fill="currentColor" opacity="0.4" />
  </svg>
);

/**
 * Battlecard — Strategic card with edge
 * Replaces: Swords in ArtifactsSection
 */
export const IconBattlecard = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="8" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <circle cx="7" cy="5.5" r="1" fill="currentColor" />
    <path d="M15 5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Swipe File — Language snippets cascading
 * Replaces: FileText in ArtifactsSection "Buyer Language Swipe File"
 */
export const IconSwipeFile = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="6" y="2" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="4" y="6" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="10" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="5" y1="14" x2="13" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    <line x1="5" y1="17" x2="10" y2="17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/**
 * Pilot Timer — Countdown with progress ring
 * Replaces: Clock for pilot timer display
 */
export const IconPilotTimer = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 13V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 4a9 9 0 0 1 8 4.87" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.2" />
  </svg>
);

// =============================================================================
// MONITOR / INTELLIGENCE ENGINE ICONS (landing page monitors grid)
// =============================================================================

/**
 * Competitive Messaging Monitor
 * Replaces: Activity
 */
export const IconMonitorMessaging = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 10l2-3 2 3 2-3 2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 17v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Market Narrative Monitor
 * Replaces: LineChart
 */
export const IconMonitorNarrative = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M3 20L8 13l4 4 5-8 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="9" r="1.5" fill="currentColor" opacity="0.4" />
    <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
  </svg>
);

/**
 * Targeting Shifts Monitor
 * Replaces: Users
 */
export const IconMonitorTargeting = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 19v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 8l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="14" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

/**
 * Early Warning Monitor — Radar scan
 * Replaces: Radar
 */
export const IconMonitorWarning = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <line x1="12" y1="12" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="15" cy="9" r="1.5" fill="currentColor" opacity="0.3" />
  </svg>
);

/**
 * Pricing & Packaging Monitor
 * Replaces: DollarSign
 */
export const IconMonitorPricing = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
    <line x1="3" y1="14" x2="21" y2="14" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <circle cx="17" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <path d="M7 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Buyer Resistance Monitor
 * Replaces: AlertTriangle
 */
export const IconMonitorResistance = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
  </svg>
);

/**
 * Post-Launch Intel Monitor
 * Replaces: TrendingDown
 */
export const IconMonitorPostLaunch = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M22 17l-5-5-4 4-6-6-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 17h-5v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <path d="M5 4l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

/**
 * Social Proof Monitor
 * Replaces: Shield
 */
export const IconMonitorProof = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 2l8 4v5c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Channel & Partnerships Monitor
 * Replaces: Share2
 */
export const IconMonitorChannel = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8.7" y1="10.7" x2="15.3" y2="7.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8.7" y1="13.3" x2="15.3" y2="16.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Strategic Hiring Monitor
 * Replaces: Briefcase
 */
export const IconMonitorHiring = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="2" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="13" r="1.5" fill="currentColor" />
  </svg>
);

// =============================================================================
// HOW IT WORKS STEP ICONS
// =============================================================================

/**
 * Collect — Antenna receiving signals
 * Replaces: Antenna in HowItWorksSection Step 01
 */
export const IconCollect = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 22v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 22h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 14V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 3a6 6 0 0 1 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5.5 1a10 10 0 0 1 13 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

/**
 * Score & Filter — Signal being filtered/ranked
 * Replaces: SlidersHorizontal in HowItWorksSection Step 02
 */
export const IconScoreFilter = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="6" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
  </svg>
);

// =============================================================================
// WHO IT'S FOR PERSONA ICONS
// =============================================================================

/**
 * Marketing Leaders — Strategic view/telescope
 * Replaces: Target in WhoItsForSection
 */
export const IconPersonaMarketing = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <path d="M17 5l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

/**
 * Product Marketing — Crosshair precision
 * Replaces: Crosshair in WhoItsForSection
 */
export const IconPersonaPMM = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Revenue & Sales — Growth chart with deal marker
 * Replaces: TrendingUp in WhoItsForSection
 */
export const IconPersonaRevenue = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M3 20l5-5 4 2 5-7 4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 7h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <circle cx="8" cy="15" r="1.5" fill="currentColor" opacity="0.3" />
    <circle cx="12" cy="17" r="1.5" fill="currentColor" opacity="0.3" />
  </svg>
);

/**
 * Objection Library — Quote bubble with shield
 * Replaces: MessageSquareQuote in ArtifactsSection
 */
export const IconObjectionLibrary = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 8h2c.6 0 1 .4 1 1v1c0 .6-.4 1-1 1H9l1 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 8h2c.6 0 1 .4 1 1v1c0 .6-.4 1-1 1h-1l1 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// =============================================================================
// ADDITIONAL UTILITY ICONS
// =============================================================================

/**
 * Signal Radio — Signal emitter for packet headers
 * Replaces: Radio in ReportCard, ReportDetail headers
 */
export const IconSignalRadio = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8.5 14.5a5 5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5.5 11.5a9 9 0 0 1 13 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 8.5a13 13 0 0 1 18 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Trophy / Market Winners — Trophy with signal accent
 * Replaces: Trophy in MarketWinnersCard
 */
export const IconTrophy = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M6 9H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 9h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 4h12v5c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="15" x2="12" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Company/Building — Used for company-related contexts
 * Replaces: Building2 in various locations
 */
export const IconCompany = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="4" y1="22" x2="20" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="8" y="6" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="13" y="6" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="8" y="12" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="13" y="12" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="10" y="18" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

// =============================================================================
// SECTOR / INDUSTRY ICONS (for SectorPickerSection)
// =============================================================================

/** Developer Tools — Code brackets with signal dot */
export const IconSectorDevTools = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="14" y1="4" x2="10" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/** Product Analytics — Bar chart with trend line */
export const IconSectorAnalytics = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 8l7-4 7 2 4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
  </svg>
);

/** Sales Engagement — Headset with signal arc */
export const IconSectorSales = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M4 15V11a8 8 0 0 1 16 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="2" y="14" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="18" y="14" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M18 19v1a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Customer Success — Handshake with checkmark */
export const IconSectorSuccess = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M2 14l4-4 3 3 5-5 3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 4h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 20h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16.5 18l1 1 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Marketing Automation — Megaphone with signal waves */
export const IconSectorMarketing = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M19 5L5 9v4l14 4V5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 9v4h2l1 5h2l-1-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 8a3 3 0 0 1 0 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/** Data Infrastructure — Database with layers */
export const IconSectorData = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 8.5c0 1.66 3.58 3 8 3s8-1.34 8-3" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
  </svg>
);

/** Cybersecurity — Shield with keyhole */
export const IconSectorSecurity = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 2l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="12" y1="12" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Fintech — Landmark/bank building with signal */
export const IconSectorFintech = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M3 21h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 21V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M19 21V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 21V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 21V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 2l10 8H2l10-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** HR Tech — People with org chart lines */
export const IconSectorHR = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="5" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="19" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 8v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 14.5V13c0-1 1-2 2-2h10c1 0 2 1 2 2v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Collaboration — Chat bubbles overlapping */
export const IconSectorCollaboration = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M13 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M17 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/** Cloud Infrastructure — Cloud with uplink */
export const IconSectorCloud = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 13v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <path d="M10 15l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
  </svg>
);

/** AI/ML Platforms — Brain with circuit nodes */
export const IconSectorAI = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M9.5 2a6.5 6.5 0 0 0-5 10.65V14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1.35A6.5 6.5 0 0 0 9.5 2z" stroke="currentColor" strokeWidth="1.5" transform="translate(2.5 1)" />
    <path d="M8 18v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 18v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 18v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="9" r="1" fill="currentColor" opacity="0.6" />
    <circle cx="14" cy="9" r="1" fill="currentColor" opacity="0.6" />
    <path d="M10 9h4" stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
);

/** DevOps / Observability — Infinity loop with pulse */
export const IconSectorDevOps = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 12c-2-2-4-4-6-4a4 4 0 1 0 0 8c2 0 4-2 6-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 12c2 2 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 2-6 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
  </svg>
);

/** E-commerce — Shopping cart with signal dot */
export const IconSectorEcommerce = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** No-Code / Low-Code — Building blocks */
export const IconSectorNoCode = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="14" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="14" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <path d="M6 6h0.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 6h0.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 18h0.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// =============================================================================
// ADDITIONAL SIGNAL TYPE ICONS
// =============================================================================

/** Social Intelligence — Chat bubble with network nodes */
export const IconSignalSocial = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M21 12a9 9 0 0 1-9 9c-1.5 0-2.9-.4-4.1-1L3 21l1-4.9A9 9 0 1 1 21 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
  </svg>
);

/** Sales Enablement — Shield with upward arrow */
export const IconSignalEnablement = ({ className = 'h-5 w-5', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 2l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 12l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
