import { useState, useEffect } from "react";
import { 
  Activity, Sparkles, TrendingUp, GitFork, RefreshCcw, ShieldCheck, 
  AlertCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LiveTwinStatusPanelProps {
  profileId: string;
}

export default function LiveTwinStatusPanel({ profileId }: LiveTwinStatusPanelProps) {
  const [profile, setProfile] = useState<any>(null);
  const [pulseActive, setPulseActive] = useState(false);
  const [recentLogs, setRecentLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("identity_profiles")
          .select("*")
          .eq("profile_id", profileId)
          .maybeSingle();

        if (data) {
          setProfile(data);
          setRecentLogs(prev => {
            const initialLog = "Successfully synchronized identity weights with database.";
            if (!prev.includes(initialLog)) {
              return [initialLog, ...prev].slice(0, 5);
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("LiveTwinStatusPanel fetch error:", err);
      }
    };

    fetchProfile();

    const interval = setInterval(() => {
      fetchProfile();
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 800);
    }, 10000);

    return () => clearInterval(interval);
  }, [profileId]);

  if (!profile) {
    return (
      <div className="bg-card border rounded-xl p-5 shadow-elegant text-center text-xs text-muted-foreground italic">
        No active identity profile discovered. Map Decision DNA or start Identity Discovery Chat to initialize.
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-5 shadow-elegant space-y-5 text-xs font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 border-border">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 text-bronze ${pulseActive ? "animate-ping" : ""}`} />
          <h4 className="font-serif text-foreground font-semibold">Live Twin Status</h4>
        </div>
        <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">
          <ShieldCheck className="w-3 h-3" /> System Synchronized
        </span>
      </div>

      {/* Trait Monitor */}
      <div className="space-y-3">
        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Identity Alignment weights</span>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-muted/30 p-2 rounded border border-border">
            <span className="text-muted-foreground block text-[8px] uppercase">Family Focus</span>
            <span className="font-bold text-foreground text-xs mt-1 block">{Math.round((1 - (profile.family_vs_work ?? 0.5)) * 100)}%</span>
          </div>
          <div className="bg-muted/30 p-2 rounded border border-border">
            <span className="text-muted-foreground block text-[8px] uppercase">Risk Tolerance</span>
            <span className="font-bold text-foreground text-xs mt-1 block">{Math.round((profile.risk_tolerance ?? 0.5) * 100)}%</span>
          </div>
          <div className="bg-muted/30 p-2 rounded border border-border">
            <span className="text-muted-foreground block text-[8px] uppercase">Stability Bias</span>
            <span className="font-bold text-foreground text-xs mt-1 block">{Math.round((1 - (profile.stability_vs_growth ?? 0.5)) * 100)}%</span>
          </div>
          <div className="bg-muted/30 p-2 rounded border border-border">
            <span className="text-muted-foreground block text-[8px] uppercase">Legacy Focus</span>
            <span className="font-bold text-foreground text-xs mt-1 block">{Math.round((profile.legacy_orientation ?? 0.5) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Graph Pulse and Activity Indicator */}
      <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border">
        <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase">
          <span>Graph Activity Pulse</span>
          <span className="text-bronze flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5 animate-bounce" /> Active
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className={`h-full bg-bronze transition-all duration-700 ${pulseActive ? "w-full" : "w-1/3"}`} />
        </div>
        <p className="text-[9px] text-muted-foreground leading-normal">
          Traversal nodes are dynamically re-ranked before every GraphRAG query to match active CIDE weights.
        </p>
      </div>

      {/* Learning Logs */}
      <div className="space-y-2.5">
        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">System Learning Logs</span>
        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
          {recentLogs.length > 0 ? (
            recentLogs.map((log, idx) => (
              <div key={idx} className="bg-muted/40 p-2 rounded border border-border/60 text-[9px] text-muted-foreground leading-snug flex items-start gap-1.5">
                <Sparkles className="w-3 h-3 text-bronze mt-0.5 flex-shrink-0" />
                <span>{log}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground italic text-[9px]">
              Waiting for events to fire...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
