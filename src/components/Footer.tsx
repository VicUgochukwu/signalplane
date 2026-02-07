import signalPlaneLogo from '@/assets/signal-plane-logo-new.png';

export function Footer() {
  return (
    <footer className="py-8 mt-12 border-t border-zinc-800">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <img src={signalPlaneLogo} alt="Signal Plane" className="w-5 h-5" />
          <span>© 2026 Signal Plane</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Control Plane, by Signal Plane</span>
        </div>
      </div>
    </footer>
  );
}
