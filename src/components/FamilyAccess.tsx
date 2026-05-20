import { Crown, User, Users, Eye } from "lucide-react";

const accessTiers = [
  {
    icon: Crown,
    title: "Founder/Owner",
    level: "Full Access",
    color: "bronze",
    permissions: [
      "Complete vault access",
      "Add/remove family members",
      "Set inheritance rules",
      "Record video legacy",
      "Manage all documents",
    ],
  },
  {
    icon: Users,
    title: "Core Family",
    level: "Extended Access",
    color: "navy",
    permissions: [
      "View approved documents",
      "Access family videos",
      "Add personal content",
      "View family history",
      "Limited editing rights",
    ],
  },
  {
    icon: User,
    title: "Extended Family",
    level: "View Access",
    color: "forest",
    permissions: [
      "View shared content",
      "Watch public videos",
      "Read family stories",
      "No editing access",
      "Request upgrades",
    ],
  },
  {
    icon: Eye,
    title: "Future Heirs",
    level: "Time-Locked",
    color: "muted",
    permissions: [
      "Scheduled access dates",
      "Milestone unlocks",
      "Inherit permissions",
      "Guided onboarding",
      "Legacy viewing",
    ],
  },
];

const FamilyAccess = () => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "bronze":
        return {
          bg: "bg-bronze/10",
          border: "border-bronze/30 hover:border-bronze/50",
          icon: "bg-bronze/20",
          iconColor: "text-bronze",
          badge: "bg-bronze/20 text-bronze",
        };
      case "navy":
        return {
          bg: "bg-navy/5",
          border: "border-navy/20 hover:border-navy/40",
          icon: "bg-navy/10",
          iconColor: "text-navy",
          badge: "bg-navy/10 text-navy",
        };
      case "forest":
        return {
          bg: "bg-forest/5",
          border: "border-forest/20 hover:border-forest/40",
          icon: "bg-forest/10",
          iconColor: "text-forest",
          badge: "bg-forest/10 text-forest",
        };
      default:
        return {
          bg: "bg-muted/30",
          border: "border-border hover:border-muted-foreground/30",
          icon: "bg-muted",
          iconColor: "text-muted-foreground",
          badge: "bg-muted text-muted-foreground",
        };
    }
  };

  return (
    <section id="access" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
            Tailored Family Access
          </h2>
          <p className="text-muted-foreground text-lg">
            Different generations, different needs. Set precise permissions for every family member.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {accessTiers.map((tier) => {
            const colors = getColorClasses(tier.color);
            return (
              <div
                key={tier.title}
                className={`p-6 rounded-2xl ${colors.bg} border ${colors.border} transition-all duration-300`}
              >
                <div className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center mb-6`}>
                  <tier.icon className={`w-7 h-7 ${colors.iconColor}`} />
                </div>

                <h3 className="font-serif text-xl text-foreground mb-1">{tier.title}</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors.badge} mb-4`}>
                  {tier.level}
                </span>

                <ul className="space-y-3">
                  {tier.permissions.map((permission) => (
                    <li key={permission} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FamilyAccess;
