import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-sm border-b border-cream/10">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bronze/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-bronze" />
          </div>
          <span className="font-serif text-xl text-cream tracking-wide">Heirloom</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-cream/70 hover:text-cream transition-colors text-sm font-medium">Features</a>
          <a href="#video-legacy" className="text-cream/70 hover:text-cream transition-colors text-sm font-medium">Video Legacy</a>
          <a href="#security" className="text-cream/70 hover:text-cream transition-colors text-sm font-medium">Security</a>
          <a href="#access" className="text-cream/70 hover:text-cream transition-colors text-sm font-medium">Family Access</a>
        </nav>

        <Button variant="hero" size="sm" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
          {user ? "Dashboard" : "Request Access"}
        </Button>
      </div>
    </header>
  );
};

export default Header;
