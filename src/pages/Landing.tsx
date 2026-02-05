import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { SignalPlaneSection } from "@/components/landing/SignalPlaneSection";
import { ApproachSection } from "@/components/landing/ApproachSection";
import { BackgroundSection } from "@/components/landing/BackgroundSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Landing = () => {
  const containerRef = useScrollAnimation();

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <LandingNavbar />
      <main>
        <div className="animate-on-scroll">
          <LandingHero />
        </div>
        <div className="animate-on-scroll">
          <SignalPlaneSection />
        </div>
        <div className="animate-on-scroll">
          <ApproachSection />
        </div>
        <div className="animate-on-scroll">
          <BackgroundSection />
        </div>
        <div className="animate-on-scroll">
          <ContactSection />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
