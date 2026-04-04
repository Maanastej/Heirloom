import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Video, FileText, BarChart3, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import VideoLegacyDash from "@/components/dashboard/VideoLegacyDash";
import DocumentVault from "@/components/dashboard/DocumentVault";
import AssetManager from "@/components/dashboard/AssetManager";

const tabs = [
  { id: "videos", label: "Video Legacy", icon: Video },
  { id: "documents", label: "Document Vault", icon: FileText },
  { id: "assets", label: "Asset Manager", icon: BarChart3 },
] as const;

type TabId = typeof tabs[number]["id"];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabId>("videos");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy border-r border-cream/10 flex flex-col fixed inset-y-0 left-0">
        <div className="p-6 flex items-center gap-3 border-b border-cream/10">
          <div className="w-9 h-9 rounded-lg bg-bronze/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-bronze" />
          </div>
          <span className="font-serif text-lg text-cream tracking-wide">Heirloom</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-bronze/20 text-bronze"
                  : "text-cream/60 hover:text-cream hover:bg-cream/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-cream/10 space-y-2">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-cream/60 hover:text-cream hover:bg-cream/5 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-cream/60 hover:text-cream hover:bg-cream/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        <header className="bg-navy/50 backdrop-blur-sm border-b border-cream/10 px-8 py-4">
          <h1 className="font-serif text-xl text-cream">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h1>
          <p className="text-cream/50 text-sm mt-1">
            Welcome, {user?.user_metadata?.full_name || user?.email}
          </p>
        </header>

        <div className="p-8">
          {activeTab === "videos" && <VideoLegacyDash />}
          {activeTab === "documents" && <DocumentVault />}
          {activeTab === "assets" && <AssetManager />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
