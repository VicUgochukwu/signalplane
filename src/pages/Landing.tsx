import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { ProductHero } from "@/components/landing/ProductHero";
import { ArchitectBar } from "@/components/landing/ArchitectBar";
import { WeeklyPacketSection } from "@/components/landing/WeeklyPacketSection";
import { IntelligenceEngineSection } from "@/components/landing/IntelligenceEngineSection";
import { ArtifactsSection } from "@/components/landing/ArtifactsSection";
import { CompoundingSection } from "@/components/landing/CompoundingSection";
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
          <ProductHero />
        </div>
        <div className="animate-on-scroll">
          <ArchitectBar />
        </div>
        <div className="animate-on-scroll">
          <WeeklyPacketSection />
        </div>
        <div className="animate-on-scroll">
          <IntelligenceEngineSection />
        </div>
        <div className="animate-on-scroll">
          <ArtifactsSection />
        </div>
        <div className="animate-on-scroll">
          <CompoundingSection />
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
