import victorProfile from "@/assets/victor-profile.png";

export function AboutSection() {
  return (
    <section id="about" className="py-12 px-6 border-t border-border">
      <div className="max-w-content mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-8">
          About Signal Plane
        </h2>

        <div className="space-y-6 mb-8">
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Signal Plane builds GTM decision infrastructure. The studio brings a decade of B2B SaaS go-to-market experience across product marketing, competitive intelligence, and revenue enablement.
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Control Plane is Signal Plane's flagship product — an automated intelligence system that replaces opinion-grade competitive analysis with evidence-grade weekly decision packets.
          </p>
        </div>

        {/* Founder byline */}
        <div className="flex items-center gap-3 pt-6 border-t border-border">
          <img
            src={victorProfile}
            alt="Victor Ugochukwu"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <span className="font-semibold text-foreground">Victor Ugochukwu</span>
            <span className="text-muted-foreground ml-2">Founder, Signal Plane</span>
          </div>
        </div>
      </div>
    </section>
  );
}
