import { FileText, Video, Users, Lock, Clock, FolderTree } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Document Vault",
    description: "Store wills, trusts, deeds, and legal documents with military-grade encryption and organized categorization.",
  },
  {
    icon: Video,
    title: "Video Legacy",
    description: "Record and preserve personal messages, life stories, and family histories in high-quality video format.",
  },
  {
    icon: FolderTree,
    title: "Asset Organization",
    description: "Structured storage for property records, financial details, investments, and business documentation.",
  },
  {
    icon: Users,
    title: "Multi-Generation Access",
    description: "Tiered permissions allow different family members appropriate levels of visibility and control.",
  },
  {
    icon: Lock,
    title: "Complete Privacy",
    description: "Zero cross-family data exposure. Your legacy remains exclusively within your family's control.",
  },
  {
    icon: Clock,
    title: "Long-Term Preservation",
    description: "Designed for 20-50+ years of accessibility with technology evolution safeguards.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-cream-gradient">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
            Everything Your Family Needs
          </h2>
          <p className="text-muted-foreground text-lg">
            A comprehensive platform bridging practical asset management with meaningful legacy preservation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-card shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border border-border/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-bronze/10 flex items-center justify-center mb-6 group-hover:bg-bronze/20 transition-colors">
                <feature.icon className="w-7 h-7 text-bronze" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
