 import signalPlaneLogo from "@/assets/signal-plane-logo.png";
 
export function LandingFooter() {
  return (
    <footer className="py-8 px-6 border-t border-border">
      <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-2">
           <img src={signalPlaneLogo} alt="Signal Plane" className="w-5 h-5" />
           <p className="text-sm text-muted-foreground">
             © 2026 Signal Plane. All rights reserved.
           </p>
         </div>
         <p className="text-sm text-muted-foreground">
           Built with conviction
         </p>
      </div>
    </footer>
  );
}
