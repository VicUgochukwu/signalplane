import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { ProductHero } from "@/components/landing/ProductHero";
import { MetricsBanner } from "@/components/landing/MetricsBanner";
import { DifferentiatorStrip } from "@/components/landing/DifferentiatorStrip";
import { WhoItsForSection } from "@/components/landing/WhoItsForSection";
import { SectorPickerSection } from "@/components/landing/SectorPickerSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { WeeklyPacketSection } from "@/components/landing/WeeklyPacketSection";
import { ArtifactsSection } from "@/components/landing/ArtifactsSection";
import { IntelligenceEngineSection } from "@/components/landing/IntelligenceEngineSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { StructuredData } from "@/components/StructuredData";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useAuth } from "@/hooks/useAuth";

/**
 * Landing page flow — aligned with ControlPlane_Messaging_Guide hierarchy:
 *
 * 1. Hero — canonical lead: "decisions based on what they heard last"
 * 2. Metrics — system credibility (10+ monitors, 25 signals, 100% sourced, 52/yr)
 * 3. Differentiator — opinion-grade vs evidence-grade (the core frame)
 * 4. Personas — who this is for, with implicit CEO angle
 * 5. How It Works — Collect → Score → Deliver & Act
 * 6. Weekly Packet — core deliverable deep-dive
 * 7. Artifacts + Action Board — deliverables + execution loop
 * 8. Sector Picker — live demo by industry
 * 9. Intelligence Engine — monitors + compounding
 * 10. About — origin story + principles
 * 11. FAQ — objection handling + "What Control Plane Is Not"
 * 12. CTA — final conversion
 */
const Landing = () => {
  const containerRef = useScrollAnimation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users straight to the app
  useEffect(() => {
    if (!loading && user) {
      navigate('/control-plane', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <StructuredData />
      <LandingNavbar />
      <main>
        {/* Above the fold: Hero + Metrics + Differentiator */}
        <ProductHero />
        <MetricsBanner />
        <DifferentiatorStrip />

        {/* Who it's for — address ICPs with canonical leads, implicit CEO angle */}
        <div className="animate-on-scroll">
          <WhoItsForSection />
        </div>

        {/* How it works — Collect → Score → Deliver & Act */}
        <div className="animate-on-scroll">
          <HowItWorksSection />
        </div>

        {/* Product deep-dives: Packet → Artifacts + Action Board */}
        <div className="animate-on-scroll">
          <WeeklyPacketSection />
        </div>
        <div className="animate-on-scroll">
          <ArtifactsSection />
        </div>

        {/* Social proof: live demos by sector */}
        <div className="animate-on-scroll">
          <SectorPickerSection />
        </div>

        {/* Intelligence engine + compounding */}
        <div className="animate-on-scroll">
          <IntelligenceEngineSection />
        </div>

        {/* Trust + FAQ + CTA */}
        <div className="animate-on-scroll">
          <AboutSection />
        </div>
        <div className="animate-on-scroll">
          <FAQSection />
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
