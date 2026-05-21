import { useState, useEffect } from "react";
import { Brain, MessageSquare, ArrowRight, Activity, Loader2, Sparkles, User, RefreshCcw, Plus, Users, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Step = "list" | "mcq" | "values" | "rules" | "experiences" | "training" | "chat";

interface AIProfile {
  id: string;
  name: string;
  relationship: string;
  // scores contains both core five dimensions (1-5 integers) and
  // a set of normalized trait keys (0..1 floats) for downstream models
  scores: Record<string, number>;
  answers: {
    values: string;
    rules: string;
    experiences: string;
  };
  archetype: string;
  embedding?: number[] | null;
  isSelf?: boolean;
}

interface DecisionLog {
  id: string;
  dna_profile_id: string;
  user_id: string;
  question: string;
  response: string;
  created_at: string;
  log_embedding?: number[] | null;
}

const mcqQuestions = [
  // Risk Processing (1–5)
  { id: 1, category: "risk_processing", trait: "risk_tolerance", question: "Choose one: A. Guaranteed smaller reward\nB. Risky larger reward", options: [{ text: "A. Guaranteed smaller reward", score: 1 }, { text: "B. Risky larger reward", score: 5 }] },
  { id: 2, category: "risk_processing", trait: "loss_aversion", question: "What feels worse?\nA. Missing a big opportunity\nB. Taking a bad risk", options: [{ text: "A. Missing a big opportunity", score: 5 }, { text: "B. Taking a bad risk", score: 1 }] },
  { id: 3, category: "risk_processing", trait: "uncertainty_tolerance", question: "When uncertain, you usually:\nA. Act quickly\nB. Gather more information", options: [{ text: "A. Act quickly", score: 5 }, { text: "B. Gather more information", score: 1 }] },
  { id: 4, category: "risk_processing", trait: "uncertainty_tolerance", question: "You trust more:\nA. Proven systems\nB. Unusual opportunities", options: [{ text: "A. Proven systems", score: 1 }, { text: "B. Unusual opportunities", score: 5 }] },
  { id: 5, category: "risk_processing", trait: "reward_sensitivity", question: "You would rather:\nA. Preserve what you have\nB. Chase something bigger", options: [{ text: "A. Preserve what you have", score: 1 }, { text: "B. Chase something bigger", score: 5 }] },

  // Decision Speed (6–9)
  { id: 6, category: "decision_speed", trait: "decisiveness", question: "Under pressure, you:\nA. Decide immediately\nB. Delay until clearer", options: [{ text: "A. Decide immediately", score: 5 }, { text: "B. Delay until clearer", score: 1 }] },
  { id: 7, category: "decision_speed", trait: "risk_of_speed", question: "Which creates more problems?\nA. Slow decisions\nB. Fast wrong decisions", options: [{ text: "A. Slow decisions", score: 1 }, { text: "B. Fast wrong decisions", score: 5 }] },
  { id: 8, category: "decision_speed", trait: "exploration_tendency", question: "When choices pile up, you:\nA. Narrow quickly\nB. Keep exploring options", options: [{ text: "A. Narrow quickly", score: 5 }, { text: "B. Keep exploring options", score: 1 }] },
  { id: 9, category: "decision_speed", trait: "regret_bias", question: "You usually regret:\nA. Acting too fast\nB. Waiting too long", options: [{ text: "A. Acting too fast", score: 5 }, { text: "B. Waiting too long", score: 1 }] },

  // Stress Response (10–14)
  { id: 10, category: "stress_response", trait: "stress_focus", question: "Unexpected problems make you:\nA. More focused\nB. More emotionally reactive", options: [{ text: "A. More focused", score: 5 }, { text: "B. More emotionally reactive", score: 1 }] },
  { id: 11, category: "stress_response", trait: "recovery_speed", question: "When plans collapse, your first instinct is:\nA. Rebuild immediately\nB. Pause and process", options: [{ text: "A. Rebuild immediately", score: 5 }, { text: "B. Pause and process", score: 1 }] },
  { id: 12, category: "stress_response", trait: "dominance_under_stress", question: "In chaos, you naturally:\nA. Take control\nB. Observe first", options: [{ text: "A. Take control", score: 5 }, { text: "B. Observe first", score: 1 }] },
  { id: 13, category: "stress_response", trait: "stress_energy", question: "Pressure usually:\nA. Sharpens your thinking\nB. Drains your energy", options: [{ text: "A. Sharpens your thinking", score: 5 }, { text: "B. Drains your energy", score: 1 }] },
  { id: 14, category: "stress_response", trait: "stress_coping", question: "When overwhelmed, you:\nA. Push harder\nB. Withdraw temporarily", options: [{ text: "A. Push harder", score: 5 }, { text: "B. Withdraw temporarily", score: 1 }] },

  // Dominance & Control (15–19)
  { id: 15, category: "dominance_control", trait: "leadership", question: "In groups, you naturally:\nA. Lead direction\nB. Support direction", options: [{ text: "A. Lead direction", score: 5 }, { text: "B. Support direction", score: 1 }] },
  { id: 16, category: "dominance_control", trait: "control_sensitivity", question: "You dislike more:\nA. Being controlled\nB. Being unsupported", options: [{ text: "A. Being controlled", score: 5 }, { text: "B. Being unsupported", score: 1 }] },
  { id: 17, category: "dominance_control", trait: "initiative", question: "If leadership is weak, you:\nA. Step in automatically\nB. Stay in your role", options: [{ text: "A. Step in automatically", score: 5 }, { text: "B. Stay in your role", score: 1 }] },
  { id: 18, category: "dominance_control", trait: "influence_priority", question: "You care more about:\nA. Influence\nB. Stability", options: [{ text: "A. Influence", score: 5 }, { text: "B. Stability", score: 1 }] },
  { id: 19, category: "dominance_control", trait: "decision_preference", question: "You prefer environments where:\nA. You decide\nB. Expectations are clear", options: [{ text: "A. You decide", score: 5 }, { text: "B. Expectations are clear", score: 1 }] },

  // Social Dependency (20–23)
  { id: 20, category: "social_dependency", trait: "self_reliance", question: "Before major decisions, you:\nA. Trust yourself first\nB. Seek outside opinions", options: [{ text: "A. Trust yourself first", score: 5 }, { text: "B. Seek outside opinions", score: 1 }] },
  { id: 21, category: "social_dependency", trait: "sensitivity_to_disapproval", question: "Disapproval from others:\nA. Rarely changes your decisions\nB. Strongly affects your thinking", options: [{ text: "A. Rarely changes your decisions", score: 5 }, { text: "B. Strongly affects your thinking", score: 1 }] },
  { id: 22, category: "social_dependency", trait: "trust_speed", question: "You trust people:\nA. Quickly\nB. Slowly after proof", options: [{ text: "A. Quickly", score: 5 }, { text: "B. Slowly after proof", score: 1 }] },
  { id: 23, category: "social_dependency", trait: "belonging_vs_independence", question: "You value more:\nA. Independence\nB. Belonging", options: [{ text: "A. Independence", score: 5 }, { text: "B. Belonging", score: 1 }] },

  // Cognitive Style (24–28)
  { id: 24, category: "cognitive_style", trait: "analysis_vs_intuition", question: "You rely more on:\nA. Logic\nB. Intuition", options: [{ text: "A. Logic", score: 1 }, { text: "B. Intuition", score: 5 }] },
  { id: 25, category: "cognitive_style", trait: "learning_mode", question: "You learn best by:\nA. Experimenting\nB. Studying first", options: [{ text: "A. Experimenting", score: 5 }, { text: "B. Studying first", score: 1 }] },
  { id: 26, category: "cognitive_style", trait: "structure_preference", question: "You prefer:\nA. Clear structure\nB. Flexible systems", options: [{ text: "A. Clear structure", score: 1 }, { text: "B. Flexible systems", score: 5 }] },
  { id: 27, category: "cognitive_style", trait: "pattern_vs_detail", question: "You notice:\nA. Patterns\nB. Details", options: [{ text: "A. Patterns", score: 5 }, { text: "B. Details", score: 1 }] },
  { id: 28, category: "cognitive_style", trait: "problem_sense", question: "You make sense of problems through:\nA. Analysis\nB. Instinctive understanding", options: [{ text: "A. Analysis", score: 1 }, { text: "B. Instinctive understanding", score: 5 }] },

  // Adaptability (29–32)
  { id: 29, category: "adaptability", trait: "flexibility", question: "Sudden change usually feels:\nA. Energizing\nB. Stressful", options: [{ text: "A. Energizing", score: 5 }, { text: "B. Stressful", score: 1 }] },
  { id: 30, category: "adaptability", trait: "variety_preference", question: "You prefer:\nA. Variety\nB. Predictability", options: [{ text: "A. Variety", score: 5 }, { text: "B. Predictability", score: 1 }] },
  { id: 31, category: "adaptability", trait: "routine_adaptation", question: "When routines break:\nA. You adapt quickly\nB. You feel disrupted", options: [{ text: "A. You adapt quickly", score: 5 }, { text: "B. You feel disrupted", score: 1 }] },
  { id: 32, category: "adaptability", trait: "work_fit", question: "You work best when:\nA. Conditions evolve\nB. Conditions stay stable", options: [{ text: "A. Conditions evolve", score: 5 }, { text: "B. Conditions stay stable", score: 1 }] },

  // Delayed Gratification (33–36)
  { id: 33, category: "delayed_gratification", trait: "delay_discounting", question: "You prefer:\nA. Immediate results\nB. Long-term payoff", options: [{ text: "A. Immediate results", score: 1 }, { text: "B. Long-term payoff", score: 5 }] },
  { id: 34, category: "delayed_gratification", trait: "saving_tendency", question: "You are more likely to:\nA. Spend now\nB. Save for future gain", options: [{ text: "A. Spend now", score: 1 }, { text: "B. Save for future gain", score: 5 }] },
  { id: 35, category: "delayed_gratification", trait: "reward_sensitivity_long", question: "Progress motivates you more when:\nA. Rewards are immediate\nB. Rewards compound slowly", options: [{ text: "A. Rewards are immediate", score: 1 }, { text: "B. Rewards compound slowly", score: 5 }] },
  { id: 36, category: "delayed_gratification", trait: "long_term_optimization", question: "You would rather:\nA. Win quickly\nB. Build something lasting", options: [{ text: "A. Win quickly", score: 1 }, { text: "B. Build something lasting", score: 5 }] },

  // Conflict Processing (37–40)
  { id: 37, category: "conflict_processing", trait: "confrontation_style", question: "When challenged unfairly, you:\nA. Respond immediately\nB. Stay controlled strategically", options: [{ text: "A. Respond immediately", score: 5 }, { text: "B. Stay controlled strategically", score: 1 }] },
  { id: 38, category: "conflict_processing", trait: "conflict_directness", question: "Conflict usually makes you:\nA. More direct\nB. More avoidant", options: [{ text: "A. More direct", score: 5 }, { text: "B. More avoidant", score: 1 }] },
  { id: 39, category: "conflict_processing", trait: "confrontation_dislike", question: "You dislike more:\nA. Open confrontation\nB. Hidden hostility", options: [{ text: "A. Open confrontation", score: 5 }, { text: "B. Hidden hostility", score: 1 }] },
  { id: 40, category: "conflict_processing", trait: "boundary_response", question: "If someone repeatedly crosses boundaries, you:\nA. Escalate directly\nB. Distance yourself quietly", options: [{ text: "A. Escalate directly", score: 5 }, { text: "B. Distance yourself quietly", score: 1 }] }
];

interface ValidationCase {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  getAIProbability: (scores: any) => number;
}

const validationCases: ValidationCase[] = [
  // Contradiction Checks (41–46)
  { id: 41, question: "You rarely second-guess major decisions:", optionA: "True", optionB: "False", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.deciciveness ?? s.decisiveness ?? s.decision_tempo ?? 0.5) - 0.5) * 0.5, 0.01), 0.99) },
  { id: 42, question: "You often replay past mistakes mentally:", optionA: "True", optionB: "False", getAIProbability: (s) => Math.min(Math.max(0.5 + ((0.5 - (s.emotional_stability ?? 0.5)))*0.6, 0.01), 0.99) },
  { id: 43, question: "You stay calm when plans suddenly change:", optionA: "True", optionB: "False", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.stress_focus ?? 0.5) - 0.5) * 0.5, 0.01), 0.99) },
  { id: 44, question: "You become mentally overloaded during uncertainty:", optionA: "True", optionB: "False", getAIProbability: (s) => Math.min(Math.max(0.5 + ((0.5 - (s.uncertainty_tolerance ?? 0.5)))*0.5, 0.01), 0.99) },
  { id: 45, question: "You prefer making decisions alone:", optionA: "True", optionB: "False", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.self_reliance ?? 0.5) - 0.5) * 0.5, 0.01), 0.99) },
  { id: 46, question: "You feel uncomfortable deciding without reassurance:", optionA: "True", optionB: "False", getAIProbability: (s) => Math.min(Math.max(0.5 + ((0.5 - (s.self_reliance ?? 0.5))) * 0.6, 0.01), 0.99) },

  // Stress-State Inversions (47–50)
  { id: 47, question: "Normally you trust:\nA. Your judgment\nB. External guidance", optionA: "A", optionB: "B", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.self_reliance ?? 0.5) - 0.5) * 0.4, 0.01), 0.99) },
  { id: 48, question: "Under high pressure you trust:\nA. Your judgment\nB. External guidance", optionA: "A", optionB: "B", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.emotional_stability ?? 0.5) < 0.4 ? -0.2 : ((s.self_reliance ?? 0.5)-0.5)*0.4), 0.01), 0.99) },
  { id: 49, question: "Normally you:\nA. Enjoy responsibility\nB. Avoid responsibility", optionA: "A", optionB: "B", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.leadership ?? 0.5) - 0.5) * 0.45, 0.01), 0.99) },
  { id: 50, question: "When exhausted you:\nA. Avoid responsibility\nB. Take more control", optionA: "A", optionB: "B", getAIProbability: (s) => Math.min(Math.max(0.5 + ((0.5 - (s.recovery_speed ?? 0.5)))*0.5, 0.01), 0.99) },

  // Temporal Consistency (51–53)
  { id: 51, question: "At work you prefer:\nA. Structured systems\nB. Flexible systems", optionA: "A", optionB: "B", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.structure_preference ?? 0.5) - 0.5) * 0.4, 0.01), 0.99) },
  { id: 52, question: "In personal life you prefer:\nA. Planned routines\nB. Spontaneous experiences", optionA: "A", optionB: "B", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.routine_adaptation ?? 0.5) - 0.5) * 0.35, 0.01), 0.99) },
  { id: 53, question: "When learning skills you prefer:\nA. Clear instruction\nB. Self-directed exploration", optionA: "A", optionB: "B", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.learning_mode ?? 0.5) - 0.5) * 0.35, 0.01), 0.99) },

  // Behavioral Simulation Checks (54–55)
  // For the multi-choice simulation, map choice B (analyze) to the conservative outcome for the binary validator
  { id: 54, question: "Your project fails publicly. First instinct:\nA. Defend your decisions\nB. Analyze what failed\nC. Protect team morale\nD. Withdraw temporarily", optionA: "A", optionB: "B", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.recovery_speed ?? 0.5) - 0.5) * 0.45 - ((s.passive_aggression ?? 0.5) - 0.5) * 0.2, 0.01), 0.99) },
  { id: 55, question: "A major opportunity appears with incomplete information. You:\nA. Move fast before others\nB. Research aggressively first\nC. Wait for stronger certainty\nD. Ask trusted people first", optionA: "A", optionB: "B", getAIProbability: (s) => Math.min(Math.max(0.5 + ((s.risk_tolerance ?? 0.5) - 0.5) * 0.45 - ((s.uncertainty_tolerance ?? 0.5) - 0.5) * 0.3, 0.01), 0.99) }
];
];

export default function DecisionDNA() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("list");
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTrainedSelf, setHasTrainedSelf] = useState(false);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>([]);

  const [draftMCQAnswers, setDraftMCQAnswers] = useState<Record<number, number>>({});
  const [draftAnswers, setDraftAnswers] = useState({
    values: "",
    rules: "",
    experiences: ""
  });

  // Compute a detailed trait vector from the raw MCQ answers.
  // Returns normalized trait scores (0..1) and core five dimensions (1..5 integers).
  const computeTraitVector = (answers: Record<number, number>) => {
    const sums: Record<string, { sum: number; count: number; rawSum: number }> = {};
    mcqQuestions.forEach((q) => {
      const raw = answers[q.id];
      if (typeof raw !== "number") return;
      const trait: string = (q as any).trait || (q as any).dimension || "misc";
      if (!sums[trait]) sums[trait] = { sum: 0, count: 0, rawSum: 0 };
      sums[trait].sum += (raw - 1) / 4; // normalize 1..5 -> 0..1
      sums[trait].rawSum += raw; // keep raw for core aggregations
      sums[trait].count += 1;
    });

    const traitScores: Record<string, number> = {};
    Object.keys(sums).forEach((t) => {
      traitScores[t] = sums[t].count > 0 ? Number((sums[t].sum / sums[t].count).toFixed(4)) : 0.5;
    });

    // Compute core five dimensions by averaging the raw question scores of categories
    const categoryBuckets: Record<string, number[]> = {};
    mcqQuestions.forEach((q) => {
      const cat: string = (q as any).category || (q as any).dimension || "misc";
      const raw = answers[q.id];
      if (typeof raw !== "number") return;
      if (!categoryBuckets[cat]) categoryBuckets[cat] = [];
      categoryBuckets[cat].push(raw);
    });

    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / (arr.length || 1);

    // Map categories to core five: risk, trust, horizon, adversity, ethics
    const coreRiskRelated = ["risk_processing"];
    const coreTrustRelated = ["social_dependency"];
    const coreHorizonRelated = ["delayed_gratification", "cognitive_style"];
    const coreAdversityRelated = ["stress_response", "adaptability"];
    const coreEthicsRelated = ["dominance_control", "conflict_processing"];

    const riskVals: number[] = coreRiskRelated.flatMap(c => categoryBuckets[c] ?? []);
    const trustVals: number[] = coreTrustRelated.flatMap(c => categoryBuckets[c] ?? []);
    const horizonVals: number[] = coreHorizonRelated.flatMap(c => categoryBuckets[c] ?? []);
    const adversityVals: number[] = coreAdversityRelated.flatMap(c => categoryBuckets[c] ?? []);
    const ethicsVals: number[] = coreEthicsRelated.flatMap(c => categoryBuckets[c] ?? []);

    const core: Record<string, number> = {
      risk: Math.round(avg(riskVals) || 3),
      trust: Math.round(avg(trustVals) || 3),
      horizon: Math.round(avg(horizonVals) || 3),
      adversity: Math.round(avg(adversityVals) || 3),
      ethics: Math.round(avg(ethicsVals) || 3),
    };

    // Final vector: include normalized traitScores and core five (core keys are 1..5 ints)
    return { traitScores, core };
  };

  const loadDNAProfiles = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data, error } = await (supabase as any)
          .from("dna_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            relationship: d.relationship,
            scores: {
              // preserve normalized trait keys where available, otherwise core five as ints
              risk: d.risk_score || 3,
              trust: d.trust_score || 3,
              horizon: d.horizon_score || 3,
              adversity: d.adversity_score || 3,
              ethics: d.ethics_score || 3,
            },
            answers: {
              values: d.core_values,
              rules: d.decision_rules,
              experiences: d.life_experiences,
            },
            archetype: calculateArchetype(
              d.risk_score || 3,
              d.trust_score || 3,
              d.horizon_score || 3,
              d.adversity_score || 3,
              d.ethics_score || 3
            ),
            embedding: d.profile_embedding ?? null,
            isSelf: d.created_by === user.id,
          }));
          setProfiles(mapped);
          setHasTrainedSelf(mapped.some((p: any) => p.isSelf));
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log("Supabase dna tables not available yet. Loading local storage mock data.");
    }

    // Local Storage Mock Seeding
    const cached = localStorage.getItem("heirloom_dna_profiles");
    if (cached) {
      const parsed = JSON.parse(cached);
      setProfiles(parsed);
      setHasTrainedSelf(parsed.some((p: any) => p.isSelf));
      setLoading(false);
      return;
    }

    // Seed example profiles
    const currentUserName = user?.user_metadata?.full_name || "Arthur Sterling";
    const seedProfiles: AIProfile[] = [];
    seedProfiles.push({
      id: "grandpa-1",
      name: "Grandpa Richard",
      relationship: "Grandfather",
      scores: { risk: 2, trust: 4, horizon: 5, adversity: 3, ethics: 5 },
      answers: {
        values: "Hard work, faith, integrity, and absolute devotion to family legacy.",
        rules: "Always save 30% of what you make, never go to sleep angry at your kin, and back up your words with consistent actions.",
        experiences: "Rebuilding our family farm after a critical drought taught me the value of local community."
      },
      archetype: "The Compassionate Guardian",
    });

    seedProfiles.push({
      id: "eleanor-1",
      name: "Eleanor Sterling",
      relationship: "Matriarch",
      scores: { risk: 3, trust: 3, horizon: 4, adversity: 5, ethics: 4 },
      answers: {
        values: "Intellect, constant curiosity, relational harmony, and elegance.",
        rules: "Learn something new every single day, never trade long-term respect for immediate wealth.",
        experiences: "Leading community preservation projects taught me about stewardship."
      },
      archetype: "The Legacy Builder",
    });

    setProfiles(seedProfiles);
    localStorage.setItem("heirloom_dna_profiles", JSON.stringify(seedProfiles));
    setHasTrainedSelf(false);
    setLoading(false);
  };

  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; content: string; steps?: string[]; memory?: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  interface CalibrationResults {
    f1?: number;
    auc?: number;
    precision?: number;
    recall?: number;
    accuracy?: number;
    kappa?: number;
    mae?: number;
    cosineSimilarity?: number;
  }
  const [calibrationResults, setCalibrationResults] = useState<CalibrationResults | null>(null);
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [calibrationAnswers, setCalibrationAnswers] = useState<Record<number, number>>({});

  const formatMetricValue = (value: unknown) => {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : "N/A";
  };

  useEffect(() => {
    loadDNAProfiles();
    loadDecisionLogs();
  }, [user]);

  useEffect(() => {
    if (activeProfileId) {
      const cachedResult = localStorage.getItem(`heirloom_calibration_${activeProfileId}`);
      if (cachedResult) {
        const parsed = JSON.parse(cachedResult);
        setCalibrationResults({
          f1: Number(parsed?.f1),
          auc: Number(parsed?.auc),
          precision: Number(parsed?.precision),
          recall: Number(parsed?.recall),
          accuracy: Number(parsed?.accuracy),
          kappa: Number(parsed?.kappa),
          mae: Number(parsed?.mae),
          cosineSimilarity: Number(parsed?.cosineSimilarity),
        });
      } else {
        setCalibrationResults(null);
      }
      setCalibrationAnswers({});
    }
  }, [activeProfileId]);

  const handleSubmitCalibration = () => {
    if (!activeProfileId) return;
    const activeProfile = profiles.find((p) => p.id === activeProfileId);
    if (!activeProfile) return;

    let tp = 0,
      fp = 0,
      tn = 0,
      fn = 0;
    let totalAbsDiff = 0;
    const Y: number[] = [];
    const YHat: number[] = [];

    validationCases.forEach((c) => {
      const y = calibrationAnswers[c.id] || 0;
      const p = c.getAIProbability(activeProfile.scores);
      const yHat = p >= 0.5 ? 1 : 0;

      Y.push(y);
      YHat.push(yHat);
      totalAbsDiff += Math.abs(y - p);

      if (y === 1 && yHat === 1) tp++;
      else if (y === 0 && yHat === 1) fp++;
      else if (y === 0 && yHat === 0) tn++;
      else if (y === 1 && yHat === 0) fn++;
    });

    const accuracy = (tp + tn) / validationCases.length;
    const pe =
      (((tp + fp) * (tp + fn)) + ((tn + fn) * (tn + fp))) / (validationCases.length ** 2);
    const kappa = pe < 1 ? (accuracy - pe) / (1 - pe) : 1;
    const mae = totalAbsDiff / validationCases.length;

    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    const dotProduct = Y.reduce((sum, y, i) => sum + y * YHat[i], 0);
    const magY = Math.sqrt(Y.reduce((sum, y) => sum + y ** 2, 0));
    const magYHat = Math.sqrt(YHat.reduce((sum, yh) => sum + yh ** 2, 0));
    const cosineSimilarity = magY * magYHat > 0 ? dotProduct / (magY * magYHat) : 0;

    const results: CalibrationResults = {
      f1,
      auc: 0,
      precision,
      recall,
      accuracy,
      kappa,
      mae,
      cosineSimilarity,
    };

    setCalibrationResults(results);
    localStorage.setItem(`heirloom_calibration_${activeProfileId}`, JSON.stringify(results));
    setShowCalibrateModal(false);
  };

  const loadDecisionLogs = async () => {
    try {
      if (user) {
        const { data, error } = await (supabase as any)
          .from("decision_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          setDecisionLogs(data as DecisionLog[]);
          return;
        }
      }
    } catch (e) {
      console.log("Could not load decision logs from Supabase:", e);
    }

    const cachedLogs = localStorage.getItem("heirloom_decision_logs");
    if (cachedLogs) {
      setDecisionLogs(JSON.parse(cachedLogs));
    } else {
      setDecisionLogs([]);
    }
  };

  const calculateArchetype = (r: number, t: number, h: number, a: number, e: number): string => {
    if (r >= 4 && t <= 2) return "The Guarded Trailblazer";
    if (h >= 4 && e >= 4) return "The Legacy Builder";
    if (r <= 2 && e >= 4) return "The Compassionate Guardian";
    if (r >= 4 && h >= 4) return "The Strategic Pioneer";
    if (a >= 4 && t <= 2) return "The Stoic Defender";
    return "The Pragmatic Counselor";
  };

  const cosineSimilarity = (a: number[], b: number[]) => {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    const dot = a.reduce((sum, value, idx) => sum + value * b[idx], 0);
    const magA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
    const magB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
    return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
  };

  const summarizeProfile = (profile: AIProfile) => {
    return `Name: ${profile.name}. Relationship: ${profile.relationship}. Scores: Risk ${profile.scores.risk}/5, Trust ${profile.scores.trust}/5, Horizon ${profile.scores.horizon}/5, Adversity ${profile.scores.adversity}/5, Ethics ${profile.scores.ethics}/5. Core values: ${profile.answers.values}. Decision rules: ${profile.answers.rules}. Life experience: ${profile.answers.experiences}.`;
  };

  const generateEmbedding = async (input: string) => {
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!groqApiKey || !input.trim()) return null;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: "text-embedding-3-large",
          input
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.data?.[0]?.embedding ?? null;
    } catch (err) {
      console.error("Embedding generation failed:", err);
      return null;
    }
  };

  const getTopSimilarDecisions = (profile: AIProfile, logs: DecisionLog[]) => {
    if (!profile.embedding || !logs.length) return [];
    return logs
      .map((log) => ({
        ...log,
        similarity: log.log_embedding ? cosineSimilarity(profile.embedding!, log.log_embedding) : 0
      }))
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
      .slice(0, 3);
  };

  const handleMCQSelect = (questionId: number, score: number) => {
    setDraftMCQAnswers((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  const startNewAI = () => {
    setDraftMCQAnswers({});
    setDraftAnswers({ values: "", rules: "", experiences: "" });
    setStep("mcq");
  };

  const finishMCQ = () => {
    const unanswered = mcqQuestions.filter(q => draftMCQAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      toast({
        title: "Incomplete Diagnostic",
        description: `Please answer all questions before proceeding. Unanswered questions: ${unanswered.map(q => q.id).join(", ")}.`,
        variant: "destructive"
      });
      return;
    }
    setStep("values");
  };

  const handleNextFromValues = () => {
    if (!draftAnswers.values.trim()) {
      toast({
        title: "Input Required",
        description: "Please share some details about your core values to proceed.",
        variant: "destructive"
      });
      return;
    }
    setStep("rules");
  };

  const handleNextFromRules = () => {
    if (!draftAnswers.rules.trim()) {
      toast({
        title: "Input Required",
        description: "Please share some details about your strict decision rules to proceed.",
        variant: "destructive"
      });
      return;
    }
    setStep("experiences");
  };

  const handleFinishFromExperiences = () => {
    if (!draftAnswers.experiences.trim()) {
      toast({
        title: "Input Required",
        description: "Please share some details about your life experiences to proceed.",
        variant: "destructive"
      });
      return;
    }
    finishTest();
  };

  const finishTest = async () => {
    setStep("training");
    // Compute full trait vector (normalized traits + core five dimensions)
    const { traitScores, core } = computeTraitVector(draftMCQAnswers);

    // Pull current user details
    const currentUserName = user?.user_metadata?.full_name || "Arthur Sterling";
    const currentUserRole = user?.user_metadata?.relationship || "Founder";

    // Build the profile.scores object: include normalized trait keys and core five (1..5 ints)
    const combinedScores: Record<string, number> = { ...traitScores, ...core };

    const simulatedProfile: AIProfile = {
      id: "dna-" + Date.now(),
      name: currentUserName,
      relationship: currentUserRole + " (Self)",
      scores: combinedScores,
      answers: draftAnswers,
      archetype: calculateArchetype(core.risk, core.trust, core.horizon, core.adversity, core.ethics),
      isSelf: true
    };

    // Attempt to persist to Supabase
    try {
      if (user) {
        const { data: prof } = await (supabase as any)
          .from("profiles")
          .select("family_id, relationship")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prof?.family_id) {
          // Persist a JSON embedding-friendly string of the trait vector for downstream models
          const profileEmbedding = await generateEmbedding(JSON.stringify({ core, traitScores }));
          await (supabase as any).from("dna_profiles").insert({
            family_id: prof.family_id,
            created_by: user.id,
            name: currentUserName,
            relationship: prof.relationship || "Family Member",
            // Keep legacy fields for compatibility
            risk_score: core.risk,
            trust_score: core.trust,
            horizon_score: core.horizon,
            adversity_score: core.adversity,
            ethics_score: core.ethics,
            core_values: draftAnswers.values,
            decision_rules: draftAnswers.rules,
            life_experiences: draftAnswers.experiences,
            profile_embedding: profileEmbedding
          });
        }
      }
    } catch (err) {
      // Local fallback
    }

    setTimeout(() => {
      const updated = [simulatedProfile, ...profiles];
      setProfiles(updated);
      localStorage.setItem("heirloom_dna_profiles", JSON.stringify(updated));
      setHasTrainedSelf(true);

      setActiveProfileId(simulatedProfile.id);
      setStep("chat");
      setChatHistory([
        {
          role: "ai",
          content: `Greetings. I am your personal simulated Decision DNA model. Ask me any life or career question, and I will analyze it using your cognitive scorecard.`,
        }
      ]);

      toast({
        title: "Model Synthesized!",
        description: "Your personal Decision DNA advisor is now live and shared with your family vault.",
      });
    }, 4500);
  };

  const openChat = (profileId: string) => {
    const prof = profiles.find(p => p.id === profileId);
    if (!prof) return;
    setActiveProfileId(profileId);
    setStep("chat");
    setChatHistory([
      {
        role: "ai",
        content: `Greetings. I am the Decision DNA model for ${prof.name} (${prof.relationship}). Ask me any life or career question, and I will analyze it through my cognitive worldview matrix.`,
      }
    ]);
  };

  const deleteAIProfile = async (profileId: string) => {
    const profileToDelete = profiles.find(p => p.id === profileId);
    if (!profileToDelete) return;

    const remaining = profiles.filter(p => p.id !== profileId);
    setProfiles(remaining);
    setHasTrainedSelf(remaining.some((p) => p.isSelf));
    localStorage.setItem("heirloom_dna_profiles", JSON.stringify(remaining));
    localStorage.removeItem(`heirloom_calibration_${profileId}`);

    if (activeProfileId === profileId) {
      setActiveProfileId(null);
      setStep("list");
      setChatHistory([]);
      setCalibrationResults(null);
      setCalibrationAnswers({});
    }

    try {
      if (user) {
        await (supabase as any).from("dna_profiles").delete().eq("id", profileId);
      }
    } catch (err) {
      console.error("Failed to delete AI profile from Supabase:", err);
    }
  };

  const deleteAndRebuildAI = async (profileId: string) => {
    await deleteAIProfile(profileId);
    startNewAI();
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeProfileId) return;

    const userQ = question;
    setChatHistory(prev => [...prev, { role: "user", content: userQ }]);
    setQuestion("");
    setIsTyping(true);

    const activeProfile = profiles.find(p => p.id === activeProfileId);
    if (!activeProfile) return;

    const riskVal = activeProfile.scores.risk;
    const ethicsVal = activeProfile.scores.ethics;
    const horizonVal = activeProfile.scores.horizon;

    // Calculate static diagnostic steps for UI
    let riskReasoning = "";
    if (riskVal <= 2) {
      riskReasoning = `Evaluating through stability preference (${riskVal}/5): Taking high-stakes risks threatens our structural security. We should prioritize long-term consolidation.`;
    } else if (riskVal >= 4) {
      riskReasoning = `Evaluating through trailblazing preference (${riskVal}/5): Risk is the primary generator of legacy. Remaining completely safe is a slow decay. We must adapt and step forward.`;
    } else {
      riskReasoning = `Evaluating through balanced risk metric (${riskVal}/5): We should seek to balance the growth opportunity with a reliable safety buffer.`;
    }

    let ethicalReasoning = "";
    if (ethicsVal >= 4) {
      ethicalReasoning = `Filtering through relationship anchors (${ethicsVal}/5): In any legacy choice, people and core family loyalty represent our primary duty. Compassion overrides strict parameters.`;
    } else {
      ethicalReasoning = `Filtering through rules anchors (${ethicsVal}/5): Institutional strength relies on consistent alignment with absolute laws and structural agreements. Compromise degrades authority.`;
    }

    let horizonReasoning = `Reflecting on the legacy horizon (${horizonVal}/5): Legacy is built on choices that project 20 to 30 years out, completely discounting immediate convenience or short-term noise.`;

    const steps = [riskReasoning, ethicalReasoning, horizonReasoning];
    const memorySnippet = activeProfile.answers.experiences;

    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (groqApiKey) {
      try {
        const systemPrompt = `You are emulating the Decision DNA simulated persona of ${activeProfile.name} (${activeProfile.relationship}), whose cognitive archetype is "${activeProfile.archetype}".

Your decision profile parameters are:
- Risk Preference: ${activeProfile.scores.risk}/5
- Trust/Alliance Focus: ${activeProfile.scores.trust}/5
- Horizon (Long-term vision): ${activeProfile.scores.horizon}/5
- Adversity Resilience: ${activeProfile.scores.adversity}/5
- Ethical Anchor: ${activeProfile.scores.ethics}/5

Core Values you guide your life by:
"${activeProfile.answers.values}"

Strict Decision Rules you enforce:
"${activeProfile.answers.rules}"

Key Life Experience / Memory Lesson you reference:
"${activeProfile.answers.experiences}"

Instructions for your behavior (Strict Hallucination Control):
1. Speak in a natural, wise, conversational, and direct tone. Never sound like a generic AI assistant. Address the user's query immediately without standard AI preamble (e.g., "As an AI..." or "Based on your scores...").
2. Your advice MUST be grounded in your values, rules, and scores. Do NOT hallucinate rules or values that contradict your blueprint. If the user asks you to violate one of your strict rules, you must reject it explicitly.
3. Reference your life experience / memory lesson only if it is naturally relevant to the dilemma.
4. Maintain consistency with prior conversational turns (use the provided chat history).
5. Provide clear, actionable guidance. Keep your response concise (2-3 paragraphs max) and format it beautifully.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [
              { role: "system", content: systemPrompt },
              ...chatHistory.map(msg => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.content
              })),
              { role: "user", content: userQ }
            ],
            temperature: 0.2, // Low temperature for high fidelity / hallucination control
            max_tokens: 800
          })
        });

        if (response.ok) {
          const data = await response.json();
          const responseContent = data.choices?.[0]?.message?.content || "";
          
          if (responseContent.trim()) {
            setChatHistory(prev => [
              ...prev,
              {
                role: "ai",
                content: responseContent,
                steps,
                memory: memorySnippet
              }
            ]);
            setIsTyping(false);
            return; // Successful Groq integration!
          }
        }
      } catch (err) {
        console.error("Groq API Call Failed: ", err);
      }
    }

    // Fallback Dynamic Simulation Generator (Local Heuristic Engine)
    setTimeout(() => {
      const q = userQ.toLowerCase();
      let category = "general";
      if (q.includes("money") || q.includes("financial") || q.includes("draining") || q.includes("struggling") || q.includes("capital") || q.includes("debt") || q.includes("sell") || q.includes("buy") || q.includes("poor") || q.includes("cost")) {
        category = "financial";
      } else if (q.includes("family") || q.includes("betray") || q.includes("relationship") || q.includes("wife") || q.includes("husband") || q.includes("son") || q.includes("daughter") || q.includes("brother") || q.includes("sister") || q.includes("friend") || q.includes("kin")) {
        category = "relationship";
      } else if (q.includes("betray") || q.includes("honour") || q.includes("integrity") || q.includes("ethics") || q.includes("rules") || q.includes("lie") || q.includes("cheat") || q.includes("legal") || q.includes("stolen")) {
        category = "moral";
      } else if (q.includes("career") || q.includes("job") || q.includes("work") || q.includes("business") || q.includes("company") || q.includes("startup") || q.includes("employ")) {
        category = "career";
      }
      
      const isFamilyVsCompany = (q.includes("family") && q.includes("company")) || q.includes("betray") || (q.includes("sell") && q.includes("family"));

      let intro = "";
      if (activeProfile.isSelf) {
        if (isFamilyVsCompany) {
          intro = `Analyzing this high-stakes tension between family preservation and corporate survival against your cognitive framework:`;
        } else if (category === "financial") {
          intro = `Processing your financial concerns against your decision scorecard:`;
        } else if (category === "relationship") {
          intro = `Evaluating this interpersonal family dilemma through your behavioral blueprint:`;
        } else if (category === "moral") {
          intro = `Testing this ethical crossroads against your core rules and values:`;
        } else if (category === "career") {
          intro = `Mapping this career choice to your legacy trajectory:`;
        } else {
          intro = `Reflecting on this dilemma using your synthesized Decision DNA:`;
        }
      } else {
        if (isFamilyVsCompany) {
          intro = `When you ask me about choosing between the family and the company, it goes straight to the foundation of what we've built. Here is how I, ${activeProfile.name}, evaluate this conflict:`;
        } else if (category === "financial") {
          intro = `I understand how heavy it feels when accounts are draining and the family is struggling. Under financial pressure, we must look at the bigger picture. Here is my perspective:`;
        } else if (category === "relationship") {
          intro = `Family relationships and trust are the ultimate bedrock. When they are tested, we need clear guidance. Here is how I see this:`;
        } else if (category === "moral") {
          intro = `This is a test of honor and integrity. In my life, I've found that character is the one asset you can never afford to lose. Here is how I think you should approach this:`;
        } else if (category === "career") {
          intro = `A career decision or business choice should align with a lifetime trajectory. Here is my counsel based on my experiences:`;
        } else {
          intro = `That is an important question. Let's look at this together through the values and rules I used to navigate my own life:`;
        }
      }

      let archetypeTone = "";
      switch (activeProfile.archetype) {
        case "The Legacy Builder":
          archetypeTone = `We must play the long game. Multi-generational legacy is built by taking short-term hits boldly to protect the long-term vision. Financial assets are easily replaced, but once family honour, trust, or the integrity of our name is compromised, the foundation of the house decays permanently. Absolute integrity and multi-decade impact override fast returns.`;
          break;
        case "The Compassionate Guardian":
          archetypeTone = `Prioritize people and relationships above all else. A company is just a tool, but the family is the reason we build in the first place. I would rather see a business dissolve entirely than witness our kin split by betrayal or resentment. Focus on protecting the core, holding the family close, and rebuilding together.`;
          break;
        case "The Guarded Trailblazer":
          archetypeTone = `We must look at this with cold, clear eyes. Risk is necessary, but blind trust is dangerous. Maintain guarded boundaries and ensure every alliance is structured legally. If a business or arrangement is dragging the family down, prune it strategically to protect our core assets, but do so with ironclad protection.`;
          break;
        case "The Strategic Pioneer":
          archetypeTone = `Every crisis is an opportunity for a calculated pivot. We cannot let emotional sentimentality lock us into a sinking model. Detach from the immediate panic, analyze the coordinates, and take a bold, calculated leap. The goal is long-term strategic leverage and survival.`;
          break;
        case "The Stoic Defender":
          archetypeTone = `In moments of severe adversity, we detach from emotional noise and act systematically. Enforce strict discipline: cut burn rates immediately, secure the perimeter, and abide strictly by the rules. We do not make compromises out of panic, and we never allow betrayal to compromise our operational security.`;
          break;
        case "The Pragmatic Counselor":
        default:
          archetypeTone = `We need a balanced, practical path forward. Avoid getting trapped in binary extremes (like total sacrifice vs total betrayal). We must seek a structured compromise—restructure the liabilities, draw clear lines of responsibility, and proceed with cautious, calculated steps.`;
          break;
      }

      const valStr = activeProfile.answers.values.trim();
      const valuesRef = valStr 
        ? `Looking at my core values—which are centered around "${valStr}"—this choice must align with that standard.` 
        : `We must stay anchored to our core values, ensuring no temporary crisis makes us drift from our true north.`;

      const ruleStr = activeProfile.answers.rules.trim();
      const rulesRef = ruleStr
        ? `Remember the rules I live by: "${ruleStr}". In moments of high stress, these strict boundaries are not optional; they are the shields that prevent us from making catastrophic errors.`
        : `In moments of crisis, we must abide by consistent rules. We never make permanent structural decisions under temporary emotional duress.`;

      const expStr = activeProfile.answers.experiences.trim();
      let experienceRef = "";
      if (expStr) {
        experienceRef = `This reminds me deeply of the life lesson earned from: "${expStr}". That experience proved that when the storm hits, the only assets that remain standing are our character and our core alliances.`;
      } else {
        experienceRef = `History shows us that every challenge we survive is an opportunity to calibrate our digital twin and harden our resolve for the generations to follow.`;
      }

      let finalRec = "";
      if (isFamilyVsCompany) {
        if (activeProfile.archetype === "The Compassionate Guardian" || activeProfile.archetype === "The Legacy Builder") {
          finalRec = `**My Deep Recommendation:** Choose the family. Restructure, sell, or even walk away from the company if you must, but protect family unity and honor. Assets are replaceable; family trust is not.`;
        } else {
          finalRec = `**My Deep Recommendation:** Act strategically. Protect the family's core financial survival. If the company cannot be salvaged without bankrupting the family, prune or liquidate it systematically before it drags everyone down.`;
        }
      } else if (category === "financial") {
        finalRec = `**My Deep Recommendation:** Stop the bleeding immediately. Cut non-essential outlays and draw up a transparent recovery plan. Rely on strict contract audits and backups, and do not make high-risk plays out of panic.`;
      } else if (category === "moral") {
        finalRec = `**My Deep Recommendation:** Stand firm. Do not trade long-term respect for immediate relief. Choose the path of absolute honor, even if it is the harder road today.`;
      } else {
        finalRec = `**My Deep Recommendation:** Take a step back to detach from the immediate pressure. Map out a structured contingency, protect your key relationships, and then move forward step-by-step.`;
      }

      const responseContent = `**${intro}**

${archetypeTone}

**Applying Our Core Framework:**
*   **Values Alignment:** ${valuesRef}
*   **Decision Rules:** ${rulesRef}
*   **Hard-won Experience:** ${experienceRef}

---

${finalRec}`;

      setChatHistory(prev => [
        ...prev,
        {
          role: "ai",
          content: responseContent,
          steps,
          memory: memorySnippet
        }
      ]);
      setIsTyping(false);
    }, 2000);
  };

  const renderWorldviewMap = (scores: { risk: number; trust: number; horizon: number; adversity: number; ethics: number }) => {
    const size = 180;
    const center = size / 2;
    const maxVal = 5;
    const rScale = (center - 20) / maxVal;
    const angles = [0, 72, 144, 216, 288];
    
    const getCoordinates = (score: number, angleDeg: number) => {
      const angleRad = (angleDeg - 90) * (Math.PI / 180);
      const x = center + score * rScale * Math.cos(angleRad);
      const y = center + score * rScale * Math.sin(angleRad);
      return { x, y };
    };

    const backgroundRings = [1, 2, 3, 4, 5].map(r => {
      const points = angles.map(a => {
        const { x, y } = getCoordinates(r, a);
        return `${x},${y}`;
      }).join(" ");
      return <polygon key={r} points={points} className="fill-none stroke-border stroke-1" />;
    });

    const axisLines = angles.map((a, i) => {
      const outer = getCoordinates(maxVal, a);
      return <line key={i} x1={center} y1={center} x2={outer.x} y2={outer.y} className="stroke-border stroke-1" />;
    });

    const scorePoints = [
      getCoordinates(scores.risk, angles[0]),
      getCoordinates(scores.trust, angles[1]),
      getCoordinates(scores.horizon, angles[2]),
      getCoordinates(scores.adversity, angles[3]),
      getCoordinates(scores.ethics, angles[4])
    ];

    const polyPoints = scorePoints.map(p => `${p.x},${p.y}`).join(" ");

    return (
      <svg width={size} height={size} className="mx-auto select-none overflow-visible">
        {backgroundRings}
        {axisLines}
        <polygon points={polyPoints} className="fill-bronze/20 stroke-bronze stroke-2 transition-all duration-500 animate-scale-in" />
        {scorePoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" className="fill-navy stroke-bronze stroke-1.5" />
        ))}
        <text x={getCoordinates(5.8, angles[0]).x} y={getCoordinates(5.8, angles[0]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Risk</text>
        <text x={getCoordinates(5.8, angles[1]).x} y={getCoordinates(5.8, angles[1]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Trust</text>
        <text x={getCoordinates(5.8, angles[2]).x} y={getCoordinates(5.8, angles[2]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Horizon</text>
        <text x={getCoordinates(5.8, angles[3]).x} y={getCoordinates(5.8, angles[3]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Adversity</text>
        <text x={getCoordinates(5.8, angles[4]).x} y={getCoordinates(5.8, angles[4]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Ethics</text>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-t-2 border-bronze rounded-full animate-spin" />
      </div>
    );
  }

  // Resolve currently active profile for rendering checks
  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? null;




  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-serif text-foreground mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-bronze" />
            Decision DNA Vault
          </h2>
          <p className="text-muted-foreground text-sm">
            Consult the simulated advisors of your entire family tree. Complete your assessment to publish your own.
          </p>
        </div>
        {step !== "list" && (
          <Button variant="outline" onClick={() => setStep("list")}>Back to Advisors</Button>
        )}
      </div>

      {step === "list" && (
        <div className="space-y-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Create Your Own Personal AI Advisor (If not trained yet) */}
            {!hasTrainedSelf && (
              <div
                onClick={startNewAI}
                className="border-2 border-dashed border-bronze/30 bg-bronze/[0.02] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-bronze/[0.05] transition-all h-[280px] shadow-elegant group"
              >
                <div className="w-12 h-12 bg-bronze/10 rounded-full flex items-center justify-center mb-4 border border-bronze/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 text-bronze animate-pulse" />
                </div>
                <h3 className="font-serif text-base text-foreground font-semibold">Train Your Personal AI Profile</h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-[220px]">
                  Map your own decision footprint so other family members can consult you.
                </p>
              </div>
            )}

            {/* List All Family Advisors */}
            {profiles.map(p => (
              <div key={p.id} className={`bg-card border rounded-xl p-6 flex flex-col justify-between h-[280px] shadow-elegant overflow-hidden relative ${
                p.isSelf ? "border-bronze/30 bg-bronze/[0.01]" : "border-border"
              }`}>
                
                {/* SVG Visual footprint in background */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.08] pointer-events-none">
                  {renderWorldviewMap(p.scores)}
                </div>

                <div>
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                      p.isSelf ? "bg-bronze/10 border-bronze/20 text-bronze" : "bg-navy border-cream/10 text-cream"
                    }`}>
                      {p.isSelf ? <Sparkles className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                    </div>
                    {p.isSelf && (
                      <span className="text-[9px] bg-bronze/10 text-bronze border border-bronze/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        My Model
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-serif text-lg text-foreground font-semibold leading-tight">{p.name}</h3>
                    <p className="text-xs text-bronze font-medium mt-0.5">{p.relationship}</p>
                    <p className="text-xs text-muted-foreground mt-2.5 font-semibold bg-muted inline-block px-2.5 py-0.5 rounded border border-border">
                      {p.archetype}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button variant={p.isSelf ? "outline" : "hero"} className="w-full h-10 shadow-card" onClick={() => openChat(p.id)}>
                    <MessageSquare className="w-4 h-4 mr-2" /> Consult Advisor
                  </Button>
                  {p.isSelf && (
                    <Button
                      variant="outline"
                      className="w-full h-10 shadow-card text-[11px]"
                      onClick={() => {
                        if (!window.confirm("Delete this advisor and build a new one?")) return;
                        deleteAndRebuildAI(p.id);
                      }}
                    >
                      Delete & Build New Advisor
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "mcq" && (
        <div className="bg-card border border-border rounded-xl p-6 lg:p-10 max-w-2xl mx-auto space-y-8 shadow-elegant">
          <div className="text-center">
            <span className="text-[10px] text-bronze uppercase tracking-widest font-bold block mb-2">Part 1 &bull; Personal Diagnostics</span>
            <h3 className="text-2xl font-serif text-foreground font-semibold">Your Decision Blueprint</h3>
            <p className="text-muted-foreground text-xs mt-2">Select the choice that best matches how you instinctively make high-stakes decisions.</p>
          </div>

          <div className="space-y-10">
            {mcqQuestions.map((q, idx) => (
              <div key={q.id} className="space-y-4 border-b border-border pb-6 last:border-b-0 last:pb-0">
                <h4 className="font-medium text-foreground text-sm leading-relaxed">
                  <span className="text-bronze font-bold mr-2">{idx + 1}.</span>
                  {q.question}
                </h4>
                <div className="space-y-3">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleMCQSelect(q.id, opt.score)}
                      className={`w-full text-left p-4 rounded-lg border text-xs transition-all flex items-start gap-3.5 leading-relaxed ${
                        draftMCQAnswers[q.id] === opt.score
                          ? "bg-bronze/10 border-bronze text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-bronze/50"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                        draftMCQAnswers[q.id] === opt.score ? "border-bronze" : "border-muted-foreground"
                      }`}>
                        {draftMCQAnswers[q.id] === opt.score && <div className="w-2 h-2 rounded-full bg-bronze" />}
                      </div>
                      <span>{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-border">
            <span className="text-[10px] text-muted-foreground">Answered {Object.keys(draftMCQAnswers).length} of {mcqQuestions.length}</span>
            <Button 
              variant="hero" 
              onClick={finishMCQ} 
              className="h-10 px-6"
            >
              Next: Deep Interview <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {(step === "values" || step === "rules" || step === "experiences") && (
        <div className="bg-card border border-border rounded-xl p-6 lg:p-10 max-w-2xl mx-auto space-y-6 shadow-elegant">
          <div className="flex items-center gap-3 mb-6">
            <div className={`h-1.5 flex-1 rounded-full ${step === "values" || step === "rules" || step === "experiences" ? "bg-bronze" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step === "rules" || step === "experiences" ? "bg-bronze" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step === "experiences" ? "bg-bronze" : "bg-muted"}`} />
          </div>

          <div>
            <span className="text-[10px] text-bronze uppercase tracking-widest font-bold block mb-1">Part 2 &bull; Core Worldview</span>
            <h3 className="text-xl font-serif text-foreground font-semibold capitalize">
              {step === "values" ? "Core Values" : step === "rules" ? "Decision Rules" : "Life Experiences"}
            </h3>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              {step === "values" ? "What values or philosophical codes guide your life decision-making?" :
               step === "rules" ? "What strict rules or boundaries do you live by and always enforce?" :
               "Describe a massive life challenge you survived and the vital lesson you learned from it."}
            </p>
          </div>

          <textarea
            className="w-full h-44 bg-background border border-border rounded-lg p-4 text-xs text-foreground focus:ring-1 focus:ring-bronze outline-none resize-none leading-relaxed"
            placeholder={
              step === "values" ? "e.g. Integrity first, protect our family unity, prioritize long-term education..." :
              step === "rules" ? "e.g. Always save 20% of income, never make structural decisions in anger, rely on contract audit..." :
              "e.g. Building our company through the recession of 2008 proved that agility and cash conservation are the only shields..."
            }
            value={draftAnswers[step]}
            onChange={(e) => setDraftAnswers({ ...draftAnswers, [step]: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            {step === "values" && <Button variant="outline" onClick={() => setStep("mcq")}>Back</Button>}
            {step === "rules" && <Button variant="outline" onClick={() => setStep("values")}>Back</Button>}
            {step === "experiences" && <Button variant="outline" onClick={() => setStep("rules")}>Back</Button>}

            {step === "values" && (
              <Button variant="hero" onClick={handleNextFromValues}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {step === "rules" && (
              <Button variant="hero" onClick={handleNextFromRules}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {step === "experiences" && (
              <Button variant="hero" onClick={handleFinishFromExperiences}>
                Synthesize Advisor <Brain className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}

      {step === "training" && (
        <div className="bg-card border border-border rounded-xl p-16 text-center max-w-md mx-auto mt-12 space-y-6 shadow-elegant">
          <Loader2 className="w-12 h-12 text-bronze animate-spin mx-auto" />
          <h3 className="text-lg font-serif text-foreground font-semibold">Synthesizing Worldview DNA...</h3>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px] mx-auto">
            Configuring prompts, scores, and life histories to construct your personal simulated persona.
          </p>
        </div>
      )}

      {step === "chat" && activeProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          
          {/* Left Column: Cognitive Diagnostic & Worldview details */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-elegant space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] text-bronze uppercase tracking-widest font-bold block mb-1">Advisor Insights</span>
                <h3 className="text-lg font-serif text-foreground font-semibold">{activeProfile.name}</h3>
                <p className="text-xs text-muted-foreground">{activeProfile.relationship}</p>
              </div>

              {/* Dynamic SVG Radar Map */}
              <div className="py-2 border-y border-border">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block text-center mb-4">Worldview Polygon</span>
                {renderWorldviewMap(activeProfile.scores)}
              </div>

              {/* Cognitive Score breakdown */}
              <div className="space-y-3">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Cognitive Matrix</span>
                <div className="bg-muted p-3.5 rounded-lg border border-border">
                  <span className="text-xs font-bold text-foreground block">{activeProfile.archetype}</span>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                    Worldview model derived from risk, trust, horizon, adversity, and ethical anchor metrics.
                  </p>
                </div>
              </div>

              {/* Model Replication Fidelity */}
              {activeProfile && activeProfile.isSelf && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Model Replication Fidelity</span>
                  
                  {calibrationResults ? (
                    <div className="bg-muted p-3.5 rounded-lg border border-border space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-muted-foreground">Fidelity Rating:</span>
                        <span className="text-xs font-bold text-emerald-600">
                          {Number.isFinite(calibrationResults.f1) ? `${Math.round(calibrationResults.f1 * 100)}% Match` : '--'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">F1-Score</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.f1)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">ROC-AUC</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.auc)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Precision</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.precision)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Recall</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.recall)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Kappa</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.kappa)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">MAE</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.mae)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Cosine Similarity</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.cosineSimilarity)}</span>
                        </div>
                      </div>

                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[9px] h-7 font-semibold"
                        onClick={() => setShowCalibrateModal(true)}
                      >
                        Recalibrate Digital Twin
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-muted p-3.5 rounded-lg border border-border text-center space-y-2">
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Verify the accuracy of your simulated persona against actual scenario choices.
                      </p>
                      <Button 
                        type="button"
                        variant="hero" 
                        size="sm" 
                        className="w-full text-[10px] h-8 font-semibold"
                        onClick={() => setShowCalibrateModal(true)}
                      >
                        Verify & Calibrate
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={() => setStep("list")} className="w-full">
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> Change Advisor
            </Button>
          </div>

          {/* Right Column: Conversational Console */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-elegant" style={{ height: "560px" }}>
            <div className="bg-navy px-6 py-4 border-b border-cream/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-bronze/10 rounded-full flex items-center justify-center border border-bronze/20">
                  <Brain className="w-4 h-4 text-bronze" />
                </div>
                <div>
                  <h3 className="font-serif text-cream text-sm font-semibold">{activeProfile.name} Simulation</h3>
                  <p className="text-[10px] text-cream/60">RAP Simulator Active & Shared</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex gap-3.5 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    msg.role === "user" ? "bg-navy border-cream/10 text-cream" : "bg-bronze/10 border-bronze/30 text-bronze"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                  </div>
                  
                  <div className="space-y-2.5">
                    <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-navy text-cream rounded-tr-none border border-cream/10" 
                        : "bg-card border border-border text-foreground rounded-tl-none"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Show Reasoning Process steps if available */}
                    {msg.role === "ai" && msg.steps && (
                      <div className="space-y-2 animate-fade-in pl-1">
                        <span className="text-[9px] font-bold text-bronze uppercase flex items-center gap-1.5">
                          <Activity className="w-3 h-3" /> Cognitive Reasoning Trail
                        </span>
                        <div className="bg-muted border border-border rounded-lg p-3 space-y-2.5 text-[10px] text-muted-foreground">
                          {msg.steps.map((step, idx) => (
                            <p key={idx} className="leading-relaxed border-l-2 border-bronze/45 pl-2">
                              {step}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show memory interpolation link if available */}
                    {msg.role === "ai" && msg.memory && (
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 text-[10px] text-amber-700/90 leading-relaxed italic flex gap-2">
                        <Quote className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold not-italic block text-[9px] uppercase tracking-wide text-bronze mb-1">Linked Memory Lesson</span>
                          "{msg.memory}"
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3.5 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-bronze/10 border border-bronze/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-bronze" />
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border rounded-tl-none flex flex-col gap-2">
                    <span className="text-[9px] text-bronze uppercase font-bold tracking-widest flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Synthesizing worldview reasoning...
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze animate-bounce delay-75" />
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleAsk} className="p-4 bg-card border-t border-border flex gap-3">
              <Input
                placeholder={`Query ${activeProfile.name}'s legacy worldview...`}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isTyping}
                className="flex-1 h-11 text-xs"
              />
              <Button type="submit" variant="hero" disabled={isTyping || !question.trim()} className="h-11 px-5 text-xs font-semibold">
                <MessageSquare className="w-4 h-4 mr-2" /> Consult
              </Button>
            </form>
          </div>

        </div>
      )}

      {showCalibrateModal && activeProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-navy px-6 py-4 border-b border-cream/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Brain className="w-5 h-5 text-bronze" />
                <h3 className="font-serif text-cream text-base font-semibold">Calibrate & Verify Digital Twin</h3>
              </div>
              <Button 
                type="button"
                variant="ghost" 
                className="text-cream/60 hover:text-cream h-8 w-8 p-0" 
                onClick={() => setShowCalibrateModal(false)}
              >
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Respond to these 5 validation scenarios. We will compare your actual choices against the AI model's computed probabilities to calculate replication metrics.
              </p>

              <div className="space-y-6 divide-y divide-border">
                {validationCases.map((c, idx) => (
                  <div key={c.id} className="pt-4 first:pt-0 space-y-3">
                    <h4 className="font-medium text-foreground text-xs leading-relaxed">
                      <span className="text-bronze font-bold mr-1.5">{idx + 1}.</span>
                      {c.question}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCalibrationAnswers(prev => ({ ...prev, [c.id]: 1 }))}
                        className={`text-left p-3 rounded-lg border text-[11px] transition-all flex items-start gap-2.5 leading-normal ${
                          calibrationAnswers[c.id] === 1
                            ? "bg-bronze/10 border-bronze text-foreground"
                            : "bg-background border-border text-muted-foreground hover:border-bronze/40"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                          calibrationAnswers[c.id] === 1 ? "border-bronze" : "border-muted-foreground"
                        }`}>
                          {calibrationAnswers[c.id] === 1 && <div className="w-1.5 h-1.5 rounded-full bg-bronze" />}
                        </div>
                        <span>{c.optionA}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalibrationAnswers(prev => ({ ...prev, [c.id]: 0 }))}
                        className={`text-left p-3 rounded-lg border text-[11px] transition-all flex items-start gap-2.5 leading-normal ${
                          calibrationAnswers[c.id] === 0
                            ? "bg-bronze/10 border-bronze text-foreground"
                            : "bg-background border-border text-muted-foreground hover:border-bronze/40"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                          calibrationAnswers[c.id] === 0 ? "border-bronze" : "border-muted-foreground"
                        }`}>
                          {calibrationAnswers[c.id] === 0 && <div className="w-1.5 h-1.5 rounded-full bg-bronze" />}
                        </div>
                        <span>{c.optionB}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowCalibrateModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  variant="hero" 
                  size="sm" 
                  onClick={handleSubmitCalibration} 
                  disabled={Object.keys(calibrationAnswers).length < validationCases.length}
                >
                  Calculate Fidelity Metrics
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
