import { Button } from "@/components/ui/button";
import victorProfile from "@/assets/victor-profile.jpeg";

export function LandingHero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-content mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* Text content */}
          <div className="flex-1 order-2 md:order-1">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Victor Ugochukwu
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
              I build systems that turn public signals into weekly GTM decisions.
              Competitive shifts, narrative drift, ICP changes, pricing moves,
              launch patterns, hiring signals — tracked, classified, and synthesized
              so teams stop guessing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button asChild size="lg">
                <a href="#work">See the system</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#contact">Let's talk</a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Currently open to senior PMM and GTM strategy roles at B2B SaaS companies.
            </p>
          </div>

          {/* Profile photo */}
          <div className="order-1 md:order-2 flex-shrink-0">
            <img
              src={victorProfile}
              alt="Victor Ugochukwu"
              className="w-48 h-48 md:w-56 md:h-56 rounded-2xl object-cover ring-2 ring-primary/20"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
