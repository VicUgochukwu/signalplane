/**
 * Initialize dataLayer + consent mode before React renders.
 * If the user previously accepted analytics, GTM loads immediately.
 */

const COOKIE_CONSENT_KEY = "sp_cookie_consent";

export function bootAnalytics() {
  // Initialize dataLayer for GTM
  (window as any).dataLayer = (window as any).dataLayer || [];

  // Check if user previously consented to analytics
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);

  // Set default consent mode (denied until user accepts)
  (window as any).dataLayer.push({
    event: "consent_default",
    analytics_storage: consent === "accepted" ? "granted" : "denied",
  });
}

/**
 * Update consent preferences — persists to localStorage and pushes to dataLayer.
 */
export function updateConsent(preferences: Record<string, boolean>) {
  const allGranted = Object.values(preferences).every(Boolean);
  localStorage.setItem(COOKIE_CONSENT_KEY, allGranted ? "accepted" : "denied");

  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({
    event: "consent_update",
    analytics_storage: preferences.analytics ? "granted" : "denied",
  });
}

/**
 * Push a custom event to the dataLayer for GTM / analytics.
 */
export function pushEvent(event: string, params?: Record<string, unknown>) {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ event, ...params });
}
