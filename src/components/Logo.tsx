import signalPlaneLight from "@/assets/signal-plane-logo-new.png";
import signalPlaneDark from "@/assets/signal-plane-logo-dark.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  alt?: string;
}

/**
 * Theme-aware logo — swaps between light and dark variants.
 * Light mode → transparent-bg logo
 * Dark mode  → dark-bg logo
 */
export function Logo({ className = "w-9 h-9", alt = "Signal Plane" }: LogoProps) {
  return (
    <>
      <img
        src={signalPlaneLight}
        alt={alt}
        className={cn(className, "block dark:hidden")}
      />
      <img
        src={signalPlaneDark}
        alt={alt}
        className={cn(className, "hidden dark:block")}
      />
    </>
  );
}
