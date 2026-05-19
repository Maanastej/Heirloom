import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const CTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <section className="py-32 bg-navy relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-bronze/10 rounded-full blur-[120px] animate-pulse-soft" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto p-12 md:p-20 rounded-[3rem] bg-navy-light/30 border border-cream/10 backdrop-blur-xl shadow-elegant text-center relative overflow-hidden group">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-bronze/20 to-transparent pointer-events-none" />
          
          <div className="w-20 h-20 rounded-3xl bg-gradient-bronze flex items-center justify-center mx-auto mb-10 shadow-bronze group-hover:rotate-12 transition-transform duration-700">
            <Shield className="w-10 h-10 text-white" />
          </div>

          <h2 className="font-serif text-5xl md:text-7xl text-cream leading-[1.1] mb-8">
            Your Family's Legacy <br />
            <span className="text-gradient-bronze">Deserves Permanence.</span>
          </h2>

          <p className="text-cream/60 text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            We are currently accepting a limited number of founding families into our private beta. Secure your lineage's future today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Button variant="hero" size="xl" onClick={handleCTA} className="px-16 py-8 text-xl shadow-bronze group/btn">
              {user ? "Go to Dashboard" : "Request Founding Access"}
              <ArrowRight className="w-6 h-6 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-cream/40 text-xs font-bold uppercase tracking-[2px]">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-bronze" /> Sovereign Data Ownership</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-bronze" /> 50+ Year Accessibility Node</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-bronze" /> Decision DNA Integration</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
