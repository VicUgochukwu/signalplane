import { IconCompany, IconSignalHorizon } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OnboardingChoiceModalProps {
  onSetupCompany: () => void;
  onSkip: () => void;
}

export function OnboardingChoiceModal({ onSetupCompany, onSkip }: OnboardingChoiceModalProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg bg-card border-border">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-foreground text-2xl">
            Welcome to Control Plane
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            How would you like to use the intelligence feed?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Option 1: Set up for company */}
          <button
            onClick={onSetupCompany}
            className="w-full p-5 rounded-lg border-2 border-border hover:border-[#6B9B9B] bg-muted/50 hover:bg-muted transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#6B9B9B]/20 text-[#6B9B9B] group-hover:bg-[#6B9B9B]/30">
                <IconCompany className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold text-lg mb-1">
                  Set up for my company
                </h3>
                <p className="text-muted-foreground text-sm">
                  Get personalized battlecards, filtered signals, and intel packets
                  tailored to your specific competitors.
                </p>
                <p className="text-[#6B9B9B] text-xs mt-2 font-medium">
                  Recommended for GTM teams
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Skip / Explore */}
          <button
            onClick={onSkip}
            className="w-full p-5 rounded-lg border border-border hover:border-border/80 bg-muted/30 hover:bg-muted/50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-muted/50 text-muted-foreground group-hover:text-foreground">
                <IconSignalHorizon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold text-lg mb-1">
                  Just exploring
                </h3>
                <p className="text-muted-foreground text-sm">
                  Browse the general market intelligence feed. You can always
                  set up your company later in Settings.
                </p>
              </div>
            </div>
          </button>

          <p className="text-center text-muted-foreground text-xs pt-2">
            You can change this anytime from Settings → Company Profile
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
