import { Button } from "@/components/ui/button";

export function ProductHero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-content mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
          Every week, your GTM team makes decisions based on what they heard last.
        </h1>
        <p className="text-xl md:text-2xl text-primary font-medium mb-6">
          Control Plane replaces hearsay with evidence.
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          12+ automated monitors. One weekly decision packet. Every claim evidence-linked. Every prediction tracked.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <a href="#intelligence">See the intelligence</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#contact">Talk to Victor</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
