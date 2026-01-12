import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-hero relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--cream)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-bronze/30 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-bronze/20 flex items-center justify-center mx-auto mb-8">
            <Shield className="w-8 h-8 text-bronze" />
          </div>

          <h2 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-6">
            Your Family's Legacy
            <span className="block text-bronze-light">Deserves Forever</span>
          </h2>

          <p className="text-cream/70 text-lg mb-10 max-w-xl mx-auto">
            Join founding families in preserving what matters most. Early access includes personalized onboarding and lifetime founder pricing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="hero" size="xl">
              Request Early Access
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl">
              Schedule a Consultation
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-cream/50 text-sm">
            <span>No credit card required</span>
            <span className="w-1 h-1 rounded-full bg-current" />
            <span>Private beta access</span>
            <span className="w-1 h-1 rounded-full bg-current" />
            <span>Family-first approach</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
