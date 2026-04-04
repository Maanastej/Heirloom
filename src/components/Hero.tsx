import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <section className="relative min-h-screen bg-hero flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--cream)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bronze/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-bronze/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />

      <div className="container mx-auto px-6 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream/10 border border-cream/20 mb-8 animate-fade-up">
            <div className="w-2 h-2 rounded-full bg-bronze animate-pulse" />
            <span className="text-cream/80 text-sm font-medium">Private Family Legacy Platform</span>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl text-cream leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Preserve Your Family's
            <span className="block text-gradient-bronze">Legacy Forever</span>
          </h1>

          <p className="text-cream/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
            A secure vault for your family's most precious assets—documents, videos, stories, and wisdom—passed down through generations with complete privacy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" onClick={handleCTA}>
              {user ? "Go to Dashboard" : "Begin Your Legacy"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl font-serif text-bronze mb-1">256-bit</div>
              <div className="text-cream/50 text-sm">Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif text-bronze mb-1">50+</div>
              <div className="text-cream/50 text-sm">Years Storage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif text-bronze mb-1">Zero</div>
              <div className="text-cream/50 text-sm">Data Sharing</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
