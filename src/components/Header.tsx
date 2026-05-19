import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy/80 backdrop-blur-xl border-b border-cream/5 shadow-elegant">
      <div className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-12 h-12 rounded-xl bg-gradient-bronze flex items-center justify-center shadow-bronze group-hover:scale-110 transition-transform duration-500">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-serif text-2xl text-cream tracking-tight">Heirloom<span className="text-bronze italic">.</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-10">
          {[
            { name: "AI Advisor", href: "#intelligence" },
            { name: "The Vault", href: "#features" },
            { name: "Family Stories", href: "#video-legacy" },
            { name: "Security", href: "#security" }
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-cream/60 hover:text-white transition-all text-xs font-bold uppercase tracking-[0.2em] relative group"
            >
              {item.name}
              <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-bronze transition-all group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-cream/70 hover:text-white" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
          <Button variant="hero" size="lg" className="rounded-full shadow-bronze hover:scale-105" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
            {user ? "Dashboard" : "Reserve Access"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
