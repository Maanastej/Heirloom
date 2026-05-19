import { FileText, Video, Users, Lock, Clock, FolderTree, Brain, Sparkles } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Decision DNA™",
    description: "Our proprietary AI engine that models your ethical framework and decision-making logic for future guidance.",
    highlight: true,
  },
  {
    icon: FileText,
    title: "Secure Document Vault",
    description: "Military-grade encryption for wills, deeds, and legal papers with automated legacy organization.",
  },
  {
    icon: Video,
    title: "High-Fidelity Video",
    description: "Capture personal messages and life stories in 4K resolution, archived for generations.",
  },
  {
    icon: FolderTree,
    title: "Multi-Asset Ledger",
    description: "Comprehensive tracking of property, investments, and business interests in a family-only environment.",
  },
  {
    icon: Users,
    title: "Inheritance Controls",
    description: "Granular permission settings to manage exactly what each family member can view and when.",
  },
  {
    icon: Lock,
    title: "Privacy Sovereignty",
    description: "Zero-knowledge architecture means your data is purely yours. Not even we can see your legacy.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-32 bg-cream-gradient relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 font-sans">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="font-serif text-4xl md:text-6xl text-foreground mb-6 leading-tight">
            The Infrastructure <br /><span className="text-bronze">of Legacy</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed">
            Heirloom combines sovereign security with intuitive organization to bridge the gap between financial wealth and family wisdom.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-10 rounded-[2.5rem] bg-card/60 backdrop-blur-sm border border-border/50 transition-all duration-300 ${
                feature.highlight 
                  ? 'border-bronze shadow-lg bg-white' 
                  : 'hover:border-bronze/30 shadow-sm hover:shadow-elegant'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${
                feature.highlight
                  ? 'bg-gradient-bronze text-white'
                  : 'bg-bronze/10 text-bronze'
              }`}>
                <feature.icon className="w-8 h-8" />
              </div>

              {feature.highlight && (
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bronze/10 text-bronze mb-4">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Advanced Tech</span>
                 </div>
              )}

              <h3 className="font-serif text-2xl text-foreground mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-light">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
