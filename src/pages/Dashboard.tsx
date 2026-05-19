import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Video, FileText, BarChart3, LogOut, Home, Brain, Menu, X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import VideoLegacyDash from "@/components/dashboard/VideoLegacyDash";
import DocumentVault from "@/components/dashboard/DocumentVault";
import AssetManager from "@/components/dashboard/AssetManager";
import DecisionDNA from "@/components/dashboard/DecisionDNA";
import FamilyHub from "@/components/dashboard/FamilyHub";

const tabs = [
  { id: "videos", label: "Video Legacy", icon: Video },
  { id: "documents", label: "Document Vault", icon: FileText },
  { id: "assets", label: "Asset Manager", icon: BarChart3 },
  { id: "dna", label: "Decision DNA", icon: Brain },
  { id: "family", label: "Family Hub", icon: Users },
] as const;

type TabId = typeof tabs[number]["id"];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabId>("videos");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const currentTabLabel = tabs.find((t) => t.id === activeTab)?.label;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Mobile Header (Search/Menu Toggle) */}
      <div className="md:hidden bg-navy border-b border-cream/10 p-4 sticky top-0 z-[60] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-bronze/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-bronze" />
          </div>
          <span className="font-serif text-base text-cream">Heirloom</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-cream/70 hover:text-cream bg-cream/5 rounded-lg"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Overlay for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop / Drawer on Mobile) */}
      <aside
        className={`
          flex flex-col bg-navy border-r border-cream/10 z-[80] transition-all duration-300
          fixed inset-y-0 left-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
          w-[280px] md:relative
        `}
      >
        <div className="p-6 flex items-center justify-between border-b border-cream/10">
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
            <div className="w-9 h-9 rounded-lg bg-bronze/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-bronze" />
            </div>
            <span className="font-serif text-lg text-cream tracking-wide">Heirloom</span>
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 text-cream/40 hover:text-bronze bg-cream/5 rounded hover:bg-bronze/10 transition-all border border-cream/5"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 p-3 md:p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center p-3 rounded-lg text-sm transition-all group
                ${activeTab === tab.id
                  ? "bg-bronze text-white shadow-bronze"
                  : "text-cream/60 hover:text-cream hover:bg-cream/5"
                }
                ${isSidebarCollapsed ? 'md:justify-center' : 'gap-3'}
              `}
              title={isSidebarCollapsed ? tab.label : ''}
            >
              <tab.icon className={`w-4 h-4 ${isSidebarCollapsed ? 'md:w-5 md:h-5' : ''}`} />
              <span className={`transition-opacity duration-200 ${isSidebarCollapsed ? 'md:hidden' : 'opacity-100'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-cream/10 space-y-2">
          <button
            onClick={() => navigate("/")}
            className={`w-full flex items-center rounded-lg text-sm text-cream/60 hover:text-cream hover:bg-cream/5 transition-all ${isSidebarCollapsed ? 'md:justify-center' : 'gap-3 px-4 py-2'}`}
          >
            <Home className="w-4 h-4" />
            <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Home</span>
          </button>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center rounded-lg text-sm text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all ${isSidebarCollapsed ? 'md:justify-center' : 'gap-3 px-4 py-2'}`}
          >
            <LogOut className="w-4 h-4" />
            <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/5 backdrop-blur-sm border-b border-border px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="font-serif text-lg md:text-xl text-foreground">
              {currentTabLabel}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
              Welcome, {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-4 mt-4 sm:mt-0">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-cream/10" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Premium Family Account</span>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === "videos" && <VideoLegacyDash />}
            {activeTab === "documents" && <DocumentVault />}
            {activeTab === "assets" && <AssetManager />}
            {activeTab === "dna" && <DecisionDNA />}
            {activeTab === "family" && <FamilyHub />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
