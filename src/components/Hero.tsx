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
      {/* Background Elements (Static) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--cream)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-bronze/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-bronze/5 rounded-full blur-[80px] pointer-events-none" />
      </div>

      <div className="container mx-auto px-6 pt-32 pb-16 md:pt-40 md:pb-24 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-8xl text-cream leading-[1.1] md:leading-[1.05] tracking-tight mb-8">
            Wealth is temporary.
            <span className="block text-gradient-bronze mt-2">Legacy is Eternal.</span>
          </h1>

          <p className="text-cream/70 text-base md:text-lg lg:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            A sovereign digital vault for your family's most sacred assets—documents, stories, and decision logic—protected across generations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button variant="hero" size="xl" onClick={handleCTA} className="px-12 shadow-bronze">
              {user ? "Go to Dashboard" : "Begin Your Legacy"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="heroOutline" 
              size="xl" 
              className="px-12 backdrop-blur-sm"
              onClick={() => document.getElementById('intelligence')?.scrollIntoView({ behavior: 'smooth' })}
            >
                Explore the Technology
            </Button>
          </div>

          <div className="mt-24 pt-12 border-t border-cream/5">
            <p className="text-cream/30 text-[10px] font-bold uppercase tracking-[3px] mb-8">Trusted by Global Founding Families</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 opacity-30 grayscale">
               <div className="flex items-center justify-center font-serif text-cream text-xl">Rothschild</div>
               <div className="flex items-center justify-center font-serif text-cream text-xl">Rockefeller</div>
               <div className="flex items-center justify-center font-serif text-cream text-xl">Morgan</div>
               <div className="flex items-center justify-center font-serif text-cream text-xl">Walton</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
