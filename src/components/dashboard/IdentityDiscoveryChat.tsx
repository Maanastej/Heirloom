import { useState, useEffect, useRef } from "react";
import { 
  Brain, MessageSquare, Shield, Activity, TrendingUp, AlertTriangle, 
  CheckCircle, Sparkles, Send, SkipForward, HelpCircle, Scale, Users, 
  Heart, Landmark, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  buildInitialCIDEState, 
  processCIDEResponse, 
  CIDE_DILEMMAS, 
  CIDEState, 
  CIDEValueProfile 
} from "@/lib/cideEngine";

interface IdentityDiscoveryChatProps {
  profileId: string;
  profileName: string;
  onClose?: () => void;
}

export default function IdentityDiscoveryChat({ 
  profileId, 
  profileName, 
  onClose 
}: IdentityDiscoveryChatProps) {
  const [state, setState] = useState<CIDEState | null>(null);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profileId) {
      const initialState = buildInitialCIDEState(profileId);
      setState(initialState);
    }
  }, [profileId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state?.messages]);

  if (!state) return null;

  const currentDilemma = CIDE_DILEMMAS.find(d => d.id === state.currentDilemmaId);

  const handleSendText = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const nextState = processCIDEResponse(state, inputText.trim());
    setState(nextState);
    setInputText("");
  };

  const handleSelectOption = (optionIndex: number) => {
    if (!currentDilemma || !currentDilemma.options) return;
    const option = currentDilemma.options[optionIndex];
    const nextState = processCIDEResponse(state, option.text, optionIndex);
    setState(nextState);
  };

  const handleSkip = () => {
    const nextState = processCIDEResponse(state, "I would prefer to skip this dilemma.");
    setState(nextState);
  };

  // Helper to format trait label nicely
  const getTraitLabel = (trait: string) => {
    switch (trait) {
      case "family_vs_work": return "Family vs Work Focus";
      case "risk_tolerance": return "Risk Tolerance Mindset";
      case "financial_priority": return "Financial Stability & Cushion";
      case "legacy_orientation": return "Generational Legacy Direction";
      case "stability_vs_growth": return "Operational Stability vs Expansion";
      default: return trait;
    }
  };

  const getTraitIcon = (trait: string) => {
    switch (trait) {
      case "family_vs_work": return <Users className="w-4 h-4 text-emerald-500" />;
      case "risk_tolerance": return <Activity className="w-4 h-4 text-rose-500" />;
      case "financial_priority": return <Landmark className="w-4 h-4 text-amber-500" />;
      case "legacy_orientation": return <Shield className="w-4 h-4 text-purple-500" />;
      case "stability_vs_growth": return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default: return <Scale className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTraitDescription = (trait: string, val: number) => {
    if (trait === "family_vs_work") {
      return val < 0.4 ? "Family-Centric" : val > 0.6 ? "Work-Driven" : "Harmonized";
    }
    if (trait === "risk_tolerance") {
      return val < 0.4 ? "Conservative Preservation" : val > 0.6 ? "Calculated Risk-Taker" : "Balanced Risk";
    }
    if (trait === "financial_priority") {
      return val < 0.4 ? "Defensive/Debt-Free" : val > 0.6 ? "Leverage/Growth-Seeking" : "Pragmatic Finance";
    }
    if (trait === "legacy_orientation") {
      return val < 0.4 ? "Immediate Payout" : val > 0.6 ? "Dynastic Asset Preservation" : "Legacy-Aware";
    }
    if (trait === "stability_vs_growth") {
      return val < 0.4 ? "Operational Security" : val > 0.6 ? "Aggressive Scale" : "Measured Expansion";
    }
    return "";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch animate-fade-in text-xs h-[560px]">
      
      {/* LEFT & CENTER PANEL: Interactive Chat Room */}
      <div className="lg:col-span-3 bg-card border rounded-xl flex flex-col overflow-hidden shadow-elegant h-full">
        
        {/* Chat Header */}
        <div className="bg-navy px-5 py-3.5 border-b border-cream/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-bronze/10 rounded-full flex items-center justify-center border border-bronze/20">
              <Brain className="w-4 h-4 text-bronze animate-pulse" />
            </div>
            <div>
              <h4 className="font-serif text-cream text-xs font-semibold">Conversational Identity Discovery</h4>
              <p className="text-[9px] text-cream/50">Profiling latent values for {profileName}</p>
            </div>
          </div>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-[9px] text-cream border-cream/20 hover:bg-cream/10">
              Return to Profile
            </Button>
          )}
        </div>

        {/* Messaging Box */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background">
          {state.messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border ${
                msg.role === "user" ? "bg-navy border-cream/10 text-cream" : "bg-bronze/10 border-bronze/30 text-bronze"
              }`}>
                {msg.role === "user" ? <Users className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
              </div>
              
              <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                msg.role === "user" 
                  ? "bg-navy text-cream rounded-tr-none border border-cream/10" 
                  : "bg-card border border-border text-foreground rounded-tl-none font-serif font-light whitespace-pre-wrap"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-card border-t border-border space-y-3">
          
          {/* Options for tradeoffs if current dilemma has them */}
          {currentDilemma && currentDilemma.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-2">
              {currentDilemma.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectOption(i)}
                  className="text-left p-3 rounded-lg border border-border bg-muted/40 hover:border-bronze hover:bg-bronze/5 transition-all text-[11px] leading-snug flex items-start gap-2.5 font-sans"
                >
                  <div className="w-4 h-4 rounded-full border border-bronze flex items-center justify-center text-[9px] font-bold text-bronze flex-shrink-0 mt-0.5">
                    {i === 0 ? "A" : "B"}
                  </div>
                  <span className="text-foreground">{opt.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Text input form */}
          <form onSubmit={handleSendText} className="flex gap-2 items-center">
            <Input 
              placeholder={currentDilemma?.type === "story" ? "Share your narrative history..." : "Type custom thoughts or refine your choice..."} 
              value={inputText} 
              onChange={e => setInputText(e.target.value)}
              className="text-xs h-10 flex-1 bg-background"
            />
            {currentDilemma && (
              <Button type="button" variant="outline" size="icon" onClick={handleSkip} className="h-10 w-10 flex-shrink-0" title="Skip this dilemma">
                <SkipForward className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
            <Button type="submit" variant="hero" disabled={!inputText.trim()} className="h-10 text-xs px-4 font-semibold">
              <Send className="w-3.5 h-3.5 mr-1.5" /> Send
            </Button>
          </form>
        </div>

      </div>

      {/* RIGHT SIDE PANEL: Real-time Profile Status */}
      <div className="lg:col-span-1 space-y-6 flex flex-col justify-between h-full overflow-y-auto pr-1">
        
        {/* DNA Value Scores */}
        <div className="bg-card border rounded-xl p-5 shadow-elegant space-y-4">
          <div>
            <span className="text-[9px] text-bronze uppercase tracking-widest font-bold block">Inferred DNA Weights</span>
            <h4 className="font-serif text-sm font-semibold text-foreground mt-0.5">Core Decision-Making Profile</h4>
          </div>

          <div className="space-y-4">
            {Object.keys(state.profile)
              .filter(k => !k.startsWith("confidence_") && k !== "contradiction_flags" && k !== "last_updated")
              .map(trait => {
                const val = state.profile[trait as keyof CIDEValueProfile] as number;
                const conf = state.profile[`confidence_${trait}` as keyof CIDEValueProfile] as number;
                return (
                  <div key={trait} className="space-y-1 bg-muted/20 p-2.5 rounded-lg border border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        {getTraitIcon(trait)}
                        {getTraitLabel(trait)}
                      </span>
                      <span className="font-bold text-bronze">{Math.round(val * 100)}%</span>
                    </div>
                    
                    {/* Linear Slider visualization */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-bronze transition-all" 
                        style={{ width: `${val * 100}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[9px] text-muted-foreground pt-0.5">
                      <span>{getTraitDescription(trait, val)}</span>
                      <span className="font-semibold text-foreground bg-card px-1.5 py-0.5 rounded border border-border">
                        Confidence: {Math.round(conf * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Contradiction / Conflict Alarms */}
        {state.profile.contradiction_flags.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl space-y-2">
            <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest block flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Cognitive Contradictions
            </span>
            <div className="space-y-1">
              {state.profile.contradiction_flags.map((flag, i) => (
                <p key={i} className="text-[10px] text-red-600/90 leading-relaxed font-sans">{flag}</p>
              ))}
            </div>
          </div>
        )}

        {/* Inferred Evidence Cards */}
        <div className="bg-card border rounded-xl p-5 shadow-elegant space-y-3 flex-1 flex flex-col min-h-[180px]">
          <div>
            <span className="text-[9px] text-bronze uppercase tracking-widest font-bold block">Source Evidence Ledger</span>
            <h4 className="font-serif text-sm font-semibold text-foreground mt-0.5">Inference Grounding</h4>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 max-h-[160px] pr-1">
            {state.evidence.length > 0 ? (
              state.evidence.map(ev => (
                <div key={ev.id} className="bg-muted/40 p-2.5 rounded-lg border border-border/80 text-[10px] space-y-1 font-sans">
                  <div className="flex items-center justify-between border-b border-border/50 pb-1">
                    <span className="font-bold text-foreground truncate max-w-[120px]">{getTraitLabel(ev.trait)}</span>
                    <span className={`text-[8px] font-mono px-1 rounded uppercase ${
                      ev.score_impact >= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
                    }`}>
                      {ev.score_impact >= 0 ? "+" : ""}{ev.score_impact}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-normal italic">"{ev.content}"</p>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground italic text-center py-6">
                No active evidence logged. Complete a dilemma to ground traits.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
