import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { updateConsent } from "@/lib/analytics";

type CookiePreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
};

const COOKIE_CONSENT_KEY = "sp_cookie_consent";

function getStoredConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeConsent(prefs: CookiePreferences) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    storeConsent(allAccepted);
    updateConsent(allAccepted);
    setVisible(false);
  };

  const handleRejectAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    storeConsent(essentialOnly);
    updateConsent(essentialOnly);
    setVisible(false);
  };

  const handleSavePreferences = () => {
    storeConsent(preferences);
    updateConsent(preferences);
    setVisible(false);
    setShowCustomize(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === "essential") return;
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-end p-4 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      {/* Banner */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-foreground mb-2">
          Cookie settings
        </h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          We use cookies to deliver and improve our services, analyze site usage,
          and if you agree, to customize or personalize your experience and market
          our services to you. You can read our{" "}
          <Link
            to="/cookie-policy"
            className="underline hover:text-foreground transition-colors"
          >
            Cookie Policy
          </Link>{" "}
          here.
        </p>

        {showCustomize && (
          <div className="mb-5 space-y-3 border-t border-border pt-4">
            {(
              [
                {
                  key: "essential" as const,
                  label: "Essential",
                  desc: "Required for the site to function. Cannot be disabled.",
                },
                {
                  key: "analytics" as const,
                  label: "Analytics",
                  desc: "Help us understand how visitors use the site.",
                },
                {
                  key: "marketing" as const,
                  label: "Marketing",
                  desc: "Used to deliver relevant ads and track campaigns.",
                },
                {
                  key: "personalization" as const,
                  label: "Personalization",
                  desc: "Allow us to customize your experience.",
                },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={preferences[item.key]}
                  disabled={item.key === "essential"}
                  onChange={() => togglePreference(item.key)}
                  className="mt-1 h-4 w-4 rounded border-border bg-secondary accent-primary cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </label>
            ))}

            <button
              onClick={handleSavePreferences}
              className="w-full mt-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        )}

        {!showCustomize && (
          <button
            onClick={() => setShowCustomize(true)}
            className="w-full mb-3 text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors text-center"
          >
            Customize Cookie Settings
          </button>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleRejectAll}
            className="flex-1 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Reject All Cookies
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
          >
            Accept All Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
