import { Shield, Server, Eye, Key, RefreshCw, Globe } from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    title: "256-bit AES Encryption",
    description: "Military-grade encryption protects every file, video, and document.",
  },
  {
    icon: Server,
    title: "Redundant Storage",
    description: "Your data is replicated across multiple secure data centers.",
  },
  {
    icon: Eye,
    title: "Zero-Knowledge Architecture",
    description: "Even we cannot access your family's private content.",
  },
  {
    icon: Key,
    title: "Multi-Factor Authentication",
    description: "Advanced security protocols for every access point.",
  },
  {
    icon: RefreshCw,
    title: "Technology Migration",
    description: "Automatic format updates ensure 50+ year accessibility.",
  },
  {
    icon: Globe,
    title: "Jurisdiction Protection",
    description: "Data stored in privacy-respecting legal jurisdictions.",
  },
];

const Security = () => {
  return (
    <section id="security" className="py-24 bg-cream-gradient">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest/10 border border-forest/20 mb-6">
            <Shield className="w-4 h-4 text-forest" />
            <span className="text-forest text-sm font-medium">Bank-Level Security</span>
          </div>

          <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
            Your Family's Privacy is Sacred
          </h2>
          <p className="text-muted-foreground text-lg">
            Built from the ground up with zero-compromise security. Your legacy, your control, forever.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-card/50 hover:bg-card border border-border/50 hover:border-forest/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-forest/10 flex items-center justify-center flex-shrink-0 group-hover:bg-forest/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-forest" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-60">
          <div className="text-center">
            <div className="font-serif text-2xl text-foreground">SOC 2</div>
            <div className="text-muted-foreground text-xs">Certified</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="font-serif text-2xl text-foreground">GDPR</div>
            <div className="text-muted-foreground text-xs">Compliant</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="font-serif text-2xl text-foreground">HIPAA</div>
            <div className="text-muted-foreground text-xs">Ready</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="font-serif text-2xl text-foreground">ISO 27001</div>
            <div className="text-muted-foreground text-xs">Aligned</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
