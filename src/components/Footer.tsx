import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bronze/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-bronze" />
            </div>
            <span className="font-serif text-xl text-foreground">Heirloom</span>
          </div>

          <nav className="flex items-center gap-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Privacy</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Terms</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Security</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Contact</a>
          </nav>

          <p className="text-muted-foreground text-sm">
            © 2024 Heirloom Legacy Systems. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
