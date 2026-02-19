/**
 * Google Tag Manager + GA4 analytics with Consent Mode v2.
 *
 * Flow:
 *   1. `bootAnalytics()` is called once on app boot (main.tsx).
 *      It pushes consent defaults (all denied) so GA4 knows not to store cookies.
 *   2. When the user interacts with the cookie banner, `updateConsent()` pushes
 *      the new consent state and `loadGTM()` injects the GTM script if analytics
 *      were accepted.
 *   3. `pushEvent()` is a thin wrapper apps/hooks use to fire custom events.
 *
 * GTM container ID and GA4 measurement ID are configured inside GTM itself —
 * this file only manages the container loader + consent signals.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GTM_CONTAINER_ID = "GTM-NT3GHRS6";
const COOKIE_CONSENT_KEY = "sp_cookie_consent";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CookiePreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
};

// Extend window for dataLayer + gtag
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

// ---------------------------------------------------------------------------
// Consent helpers
// ---------------------------------------------------------------------------

/** Read stored cookie preferences (or null if not yet set). */
export function getStoredConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? (JSON.parse(raw) as CookiePreferences) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// DataLayer + Consent Mode
// ---------------------------------------------------------------------------

let dataLayerInitialized = false;

/**
 * Initialize `window.dataLayer` and set GA4 Consent Mode v2 defaults.
 * Must be called once before GTM loads (typically in main.tsx).
 */
export function initDataLayer(): void {
  if (dataLayerInitialized) return;

  window.dataLayer = window.dataLayer || [];

  // gtag() helper — pushes to dataLayer in the format GA4 expects
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments as unknown as Record<string, unknown>);
  };

  // Set consent defaults — everything denied until user opts in.
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted", // always allowed
    wait_for_update: 500, // ms to wait for consent update before first hit
  });

  // If the user already consented in a previous session, apply it immediately.
  const stored = getStoredConsent();
  if (stored) {
    applyConsent(stored);
  }

  dataLayerInitialized = true;
}

/** Push a consent update to GA4 based on user preferences. */
function applyConsent(prefs: CookiePreferences): void {
  window.gtag("consent", "update", {
    ad_storage: prefs.marketing ? "granted" : "denied",
    ad_user_data: prefs.marketing ? "granted" : "denied",
    ad_personalization: prefs.marketing ? "granted" : "denied",
    analytics_storage: prefs.analytics ? "granted" : "denied",
    functionality_storage: prefs.essential ? "granted" : "denied",
    personalization_storage: prefs.personalization ? "granted" : "denied",
  });
}

/**
 * Called after the user saves cookie preferences.
 * Updates GA4 consent signals and loads GTM if analytics were accepted.
 *
 * Accepts either CookiePreferences or Record<string, boolean> for
 * backward compatibility with existing CookieBanner component.
 */
export function updateConsent(prefs: CookiePreferences | Record<string, boolean>): void {
  const normalized: CookiePreferences = {
    essential: (prefs as CookiePreferences).essential ?? true,
    analytics: (prefs as CookiePreferences).analytics ?? false,
    marketing: (prefs as CookiePreferences).marketing ?? false,
    personalization: (prefs as CookiePreferences).personalization ?? false,
  };

  applyConsent(normalized);

  if (normalized.analytics) {
    loadGTM();
  }
}

// ---------------------------------------------------------------------------
// GTM Loader
// ---------------------------------------------------------------------------

let gtmLoaded = false;

/** Dynamically inject the GTM <script> tag. Idempotent. */
export function loadGTM(): void {
  if (gtmLoaded) return;
  if (typeof document === "undefined") return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;

  // Push gtm.start event before the script loads
  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  document.head.appendChild(script);
  gtmLoaded = true;
}

// ---------------------------------------------------------------------------
// Event helpers
// ---------------------------------------------------------------------------

/**
 * Push a custom event to the dataLayer.
 *
 * @example
 *   pushEvent("sign_up", { method: "email" });
 *   pushEvent("packet_view", { packet_id: "abc123" });
 */
export function pushEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  if (!window.dataLayer) return;

  window.dataLayer.push({
    event: eventName,
    ...params,
  });
}

// ---------------------------------------------------------------------------
// Boot helper (called from main.tsx)
// ---------------------------------------------------------------------------

/**
 * One-call init: sets up dataLayer, applies stored consent, loads GTM if allowed.
 */
export function bootAnalytics(): void {
  initDataLayer();

  const stored = getStoredConsent();
  if (stored?.analytics) {
    loadGTM();
  }
}
