import { Button } from "@/components/ui/button";
import { Brain, Sparkles, MessageSquare, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DecisionDNASection = () => {
  const navigate = useNavigate();

  return (
    <section id="intelligence" className="py-20 md:py-32 bg-navy relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-bronze rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-bronze-glow rounded-full blur-[100px] pointer-events-none" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="lg:w-[45%] space-y-8 md:space-y-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-bronze/10 border border-bronze/20 backdrop-blur-md">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-bronze" />
              <span className="text-bronze text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">The AI Interview Engine</span>
            </div>

            <h2 className="font-serif text-3xl md:text-5xl lg:text-7xl text-cream leading-[1.1] md:leading-[1.05] tracking-tight">
              Preserve Your <br />
              <span className="text-gradient-bronze">Decision DNA™</span>
            </h2>

            <p className="text-cream/70 text-base md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 font-light">
              Don't just leave assets. Leave your worldview. Our advanced engine captures your values and logic to create an advisory model for future generations.
            </p>

            <div className="grid gap-6 md:gap-8 font-sans text-left">
              {[
                { icon: Brain, title: "Value Modeling", desc: "Digital capture of your core ethical and logical priorities." },
                { icon: ShieldCheck, title: "Sovereign Privacy", desc: "Your DNA model remains encrypted in your private vault." },
                { icon: Zap, title: "Legacy Logic", desc: "Insights that reflect how you'd handle future challenges." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 md:gap-5 group">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-cream/5 border border-cream/10 flex items-center justify-center group-hover:bg-bronze transition-all duration-500 shadow-sm group-hover:shadow-bronze">
                    <item.icon className="w-6 h-6 md:w-7 md:h-7 text-bronze group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-cream font-serif text-lg md:text-xl mb-1">{item.title}</h4>
                    <p className="text-cream/40 text-[11px] md:text-sm leading-relaxed max-w-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 md:pt-6">
              <Button variant="hero" size="xl" onClick={() => navigate("/auth")} className="w-full sm:w-auto shadow-bronze group">
                Capture Your Legacy
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          <div className="lg:w-[55%] w-full relative mt-12 lg:mt-0">
            {/* Main AI Interaction Card */}
            <div className="relative z-10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-navy-light/40 border border-cream/10 backdrop-blur-2xl shadow-elegant overflow-hidden">
              {/* Interaction simulation */}
              <div className="space-y-6 md:space-y-8 relative font-sans">
                <div className="flex gap-3 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-bronze flex items-center justify-center flex-shrink-0 shadow-bronze ring-2 md:ring-4 ring-navy-light">
                    <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl rounded-tl-none bg-cream/5 border border-cream/10 text-cream text-[13px] md:text-base leading-relaxed shadow-sm flex-1">
                    "When evaluating these family dynamics, my core rule of 'Unity Above All' suggests we prioritize the group's long-term cohesion over individual short-term gains..."
                  </div>
                </div>
                
                <div className="flex gap-3 md:gap-4 flex-row-reverse font-sans">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-navy border border-cream/20 flex items-center justify-center flex-shrink-0 ring-2 md:ring-4 ring-navy-light shadow-elegant">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-cream/20" />
                  </div>
                  <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl rounded-tr-none bg-bronze/10 border border-bronze/20 text-cream/90 text-[12px] md:text-sm shadow-inner italic font-light flex-1">
                    "Thank you, Grandpa. That helps me make this decision with much more clarity."
                  </div>
                </div>

                {/* Input mockup */}
                <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-cream/5 font-sans">
                  <div className="relative">
                    <div className="h-10 md:h-14 rounded-xl md:rounded-2xl bg-black/20 border border-cream/10 flex items-center px-4 md:px-6 text-cream/30 text-[10px] md:text-sm italic overflow-hidden whitespace-nowrap overflow-ellipsis">
                      How would you handle a business partner breach of trust?
                    </div>
                    <div className="absolute right-1 top-1 md:right-2 md:top-2 w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-bronze flex items-center justify-center shadow-lg">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DecisionDNASection;
