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
  scores: {
    risk: number;
    trust: number;
    horizon: number;
    adversity: number;
    ethics: number;
  };
  answers: {
    values: string;
    rules: string;
    experiences: string;
  };
  archetype: string;
  isSelf?: boolean;
}

const mcqQuestions = [
  {
    id: 1,
    dimension: "risk",
    question: "Risk vs Reward: You are offered a highly stable but low-growth opportunity versus a risky gamble with a massive legacy upside. What do you do?",
    options: [
      { text: "Prioritize absolute stability. The risk isn't worth losing what's built.", score: 1 },
      { text: "Take a carefully structured risk with backups.", score: 3 },
      { text: "Take the leap boldly. Growth only comes from stepping into the unknown.", score: 5 }
    ]
  },
  {
    id: 2,
    dimension: "trust",
    question: "Trust & Alliances: When initiating a critical family alliance or business venture, your base assumption is to...",
    options: [
      { text: "Assume guarded boundaries. Make others earn trust slowly over time.", score: 1 },
      { text: "Trust but verify with strict legal agreements and metrics.", score: 3 },
      { text: "Trust them from the outset unless they give a reason not to.", score: 5 }
    ]
  },
  {
    id: 3,
    dimension: "horizon",
    question: "Legacy Horizon: Would you accept a painful financial or career sacrifice today if it guaranteed a massive benefit for your family's future in 25 years?",
    options: [
      { text: "No. The immediate well-being and peace of today must not be bartered.", score: 1 },
      { text: "Only if the probability of the long-term legacy outcome is extremely high.", score: 3 },
      { text: "Yes. Short-term sacrifices are standard requirements for legacy builders.", score: 5 }
    ]
  },
  {
    id: 4,
    dimension: "adversity",
    question: "Adversity Response: When hit by a sudden, devastating crisis, your first instinct is to...",
    options: [
      { text: "Emotionally process the event fully with loved ones before trying to solve it.", score: 1 },
      { text: "Assess the situation carefully, balancing emotional support with action.", score: 3 },
      { text: "Emotionally detach immediately and engineer a precise recovery strategy.", score: 5 }
    ]
  },
  {
    id: 5,
    dimension: "ethics",
    question: "Ethical Anchor: If a family member makes a costly mistake that violates a strict rule, but did so out of love or good intentions, how do you handle it?",
    options: [
      { text: "The rules must stand. Letting it slide compromises structural integrity.", score: 1 },
      { text: "Uphold the standard, but handle the specific individual with private grace.", score: 3 },
      { text: "Prioritize love and relationships completely above written rules.", score: 5 }
    ]
  }
];

interface ValidationCase {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  getAIProbability: (scores: any) => number;
}

const validationCases: ValidationCase[] = [
  {
    id: 1,
    question: "A relative proposes a high-risk tech startup requiring 40% of family capital but offering 10x potential returns.",
    optionA: "Accept the risk for growth",
    optionB: "Decline to preserve capital",
    getAIProbability: (scores) => 1 / (1 + Math.exp(-(scores.risk - 3.0) * 1.5))
  },
  {
    id: 2,
    question: "A long-time business partner commits a minor breach. Do you enforce the legal penalties or waive them?",
    optionA: "Waive penalties (Prioritize relationship)",
    optionB: "Enforce penalties (Prioritize rules)",
    getAIProbability: (scores) => 1 / (1 + Math.exp(-(scores.ethics - 3.0) * 1.5))
  },
  {
    id: 3,
    question: "In a market crash, do you sell family real estate for immediate cash or take a high-interest loan to preserve the property?",
    optionA: "Take high-interest loan (Preserve legacy asset)",
    optionB: "Sell family property (Secure short-term liquidity)",
    getAIProbability: (scores) => 1 / (1 + Math.exp(-(scores.horizon - 3.0) * 1.5))
  },
  {
    id: 4,
    question: "A security breach exposes minor records. Do you immediately disclose it or patch it quietly?",
    optionA: "Disclose immediately (Prioritize absolute trust)",
    optionB: "Patch quietly (Prioritize risk mitigation)",
    getAIProbability: (scores) => 1 / (1 + Math.exp(-(scores.trust - 3.0) * 1.5))
  },
  {
    id: 5,
    question: "An abrasive manager performs well but causes staff tension. Do you replace or keep them?",
    optionA: "Replace them (Prioritize harmony)",
    optionB: "Keep them (Prioritize performance)",
    getAIProbability: (scores) => 1 / (1 + Math.exp(-((6 - scores.adversity) - 3.0) * 1.5))
  }
];

export default function DecisionDNA() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("list");
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTrainedSelf, setHasTrainedSelf] = useState(false);

  // Profile Generation Form States
  const [draftMCQScores, setDraftMCQScores] = useState<Record<string, number>>({});
  const [draftAnswers, setDraftAnswers] = useState({
    values: "",
    rules: "",
    experiences: ""
  });

  // Simulator Chat States
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; content: string; steps?: string[]; memory?: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Calibration States
  interface CalibrationResults {
    f1: number;
    auc: number;
    precision: number;
    recall: number;
    accuracy: number;
  }
  const [calibrationResults, setCalibrationResults] = useState<CalibrationResults | null>(null);
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [calibrationAnswers, setCalibrationAnswers] = useState<Record<number, number>>({});

  // Load Seed / Database Profiles
  useEffect(() => {
    loadDNAProfiles();
  }, [user]);

  useEffect(() => {
    if (activeProfileId) {
      const cachedResult = localStorage.getItem(`heirloom_calibration_${activeProfileId}`);
      if (cachedResult) {
        setCalibrationResults(JSON.parse(cachedResult));
      } else {
        setCalibrationResults(null);
      }
      setCalibrationAnswers({});
    }
  }, [activeProfileId]);

  const handleSubmitCalibration = () => {
    if (!activeProfileId) return;
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    if (!activeProfile) return;

    let tp = 0, fp = 0, tn = 0, fn = 0;
    const scoredCases = validationCases.map(c => {
      const y = calibrationAnswers[c.id]; // 0 or 1
      const p = c.getAIProbability(activeProfile.scores); // 0.0 to 1.0
      const yHat = p >= 0.5 ? 1 : 0;
      
      if (y === 1 && yHat === 1) tp++;
      if (y === 0 && yHat === 1) fp++;
      if (y === 0 && yHat === 0) tn++;
      if (y === 1 && yHat === 0) fn++;
      
      return { id: c.id, y, p, yHat };
    });

    const accuracy = (tp + tn) / 5;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    // ROC-AUC calculation
    const sorted = [...scoredCases].sort((a, b) => b.p - a.p);
    const positives = sorted.filter(c => c.y === 1);
    const negatives = sorted.filter(c => c.y === 0);

    let auc = 0.5;
    if (positives.length > 0 && negatives.length > 0) {
      let rankSum = 0;
      sorted.forEach((c, idx) => {
        const rank = 5 - idx; // Rank 1 is lowest probability, Rank 5 is highest
        if (c.y === 1) {
          rankSum += rank;
        }
      });
      const np = positives.length;
      const nn = negatives.length;
      const u = rankSum - (np * (np + 1)) / 2;
      auc = u / (np * nn);
    } else {
      const matches = sorted.filter(c => c.y === c.yHat).length;
      auc = matches === 5 ? 1.0 : 0.5;
    }

    const results: CalibrationResults = {
      f1,
      auc,
      precision,
      recall,
      accuracy
    };

    setCalibrationResults(results);
    localStorage.setItem(`heirloom_calibration_${activeProfileId}`, JSON.stringify(results));
    setShowCalibrateModal(false);

    toast({
      title: "Calibration Successful",
      description: `Model verified. Fidelity match at ${Math.round(f1 * 100)}% with ROC-AUC of ${auc.toFixed(2)}.`,
    });
  };

  const loadDNAProfiles = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from("dna_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            relationship: d.relationship,
            scores: {
              risk: d.risk_score || 3,
              trust: d.trust_score || 3,
              horizon: d.horizon_score || 3,
              adversity: d.adversity_score || 3,
              ethics: d.ethics_score || 3,
            },
            answers: {
              values: d.core_values,
              rules: d.decision_rules,
              experiences: d.life_experiences
            },
            archetype: calculateArchetype(
              d.risk_score || 3,
              d.trust_score || 3,
              d.horizon_score || 3,
              d.adversity_score || 3,
              d.ethics_score || 3
            ),
            isSelf: d.created_by === user.id
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
    } else {
      // Seed initial default profiles of family members
      const activeFamilyList = JSON.parse(localStorage.getItem("heirloom_family_members") || "[]");
      const currentUserName = user?.user_metadata?.full_name || "Arthur Sterling";
      
      const seedProfiles: AIProfile[] = [];
      
      // Let's seed Grandpa Richard as a family model that already exists!
      seedProfiles.push({
        id: "grandpa-1",
        name: "Grandpa Richard",
        relationship: "Grandfather",
        scores: { risk: 2, trust: 4, horizon: 5, adversity: 3, ethics: 5 },
        answers: {
          values: "Hard work, faith, integrity, and absolute devotion to family legacy.",
          rules: "Always save 30% of what you make, never go to sleep angry at your kin, and back up your words with consistent actions.",
          experiences: "Rebuilding our family farm after a critical drought in 1982 taught me that local communities and family trust are the only assets that never lose valuation."
        },
        archetype: "The Compassionate Guardian"
      });

      // Let's seed Matriarch Eleanor Sterling as well
      seedProfiles.push({
        id: "eleanor-1",
        name: "Eleanor Sterling",
        relationship: "Matriarch",
        scores: { risk: 3, trust: 3, horizon: 4, adversity: 5, ethics: 4 },
        answers: {
          values: "Intellect, constant curiosity, relational harmony, and elegance.",
          rules: "Learn something new every single day, never trade long-term respect for immediate wealth.",
          experiences: "Leading the city heritage preservation society in 1995 proved that historical preservation anchors families to a common foundation."
        },
        archetype: "The Legacy Builder"
      });

      setProfiles(seedProfiles);
      localStorage.setItem("heirloom_dna_profiles", JSON.stringify(seedProfiles));
      setHasTrainedSelf(false);
    }
    setLoading(false);
  };

  const calculateArchetype = (r: number, t: number, h: number, a: number, e: number): string => {
    if (r >= 4 && t <= 2) return "The Guarded Trailblazer";
    if (h >= 4 && e >= 4) return "The Legacy Builder";
    if (r <= 2 && e >= 4) return "The Compassionate Guardian";
    if (r >= 4 && h >= 4) return "The Strategic Pioneer";
    if (a >= 4 && t <= 2) return "The Stoic Defender";
    return "The Pragmatic Counselor";
  };

  const handleMCQSelect = (dimension: string, score: number) => {
    setDraftMCQScores((prev) => ({
      ...prev,
      [dimension]: score,
    }));
  };

  const startNewAI = () => {
    setDraftMCQScores({});
    setDraftAnswers({ values: "", rules: "", experiences: "" });
    setStep("mcq");
  };

  const finishMCQ = () => {
    const unanswered = mcqQuestions.filter(q => draftMCQScores[q.dimension] === undefined);
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

    const risk = draftMCQScores["risk"] || 3;
    const trust = draftMCQScores["trust"] || 3;
    const horizon = draftMCQScores["horizon"] || 3;
    const adversity = draftMCQScores["adversity"] || 3;
    const ethics = draftMCQScores["ethics"] || 3;

    // Pull current user details
    const currentUserName = user?.user_metadata?.full_name || "Arthur Sterling";
    const currentUserRole = user?.user_metadata?.relationship || "Founder";

    const simulatedProfile: AIProfile = {
      id: "dna-" + Date.now(),
      name: currentUserName,
      relationship: currentUserRole + " (Self)",
      scores: { risk, trust, horizon, adversity, ethics },
      answers: draftAnswers,
      archetype: calculateArchetype(risk, trust, horizon, adversity, ethics),
      isSelf: true
    };

    // Attempt to persist to Supabase
    try {
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("family_id, relationship")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prof?.family_id) {
          await supabase.from("dna_profiles").insert({
            family_id: prof.family_id,
            created_by: user.id,
            name: currentUserName,
            relationship: prof.relationship || "Family Member",
            risk_score: risk,
            trust_score: trust,
            horizon_score: horizon,
            adversity_score: adversity,
            ethics_score: ethics,
            core_values: draftAnswers.values,
            decision_rules: draftAnswers.rules,
            life_experiences: draftAnswers.experiences
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

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeProfileId) return;

    const userQ = question;
    setChatHistory(prev => [...prev, { role: "user", content: userQ }]);
    setQuestion("");
    setIsTyping(true);

    const activeProfile = profiles.find(p => p.id === activeProfileId);
    if (!activeProfile) return;

    // Advanced RAP Model Response Simulation
    setTimeout(() => {
      const q = userQ.toLowerCase();
      
      // 1. Context Category Detection
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

      // 2. Persona Intro
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

      // 3. Archetype Perspective Paragraph
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

      // 4. Core Values & Decision Rules weaving
      const valStr = activeProfile.answers.values.trim();
      const valuesRef = valStr 
        ? `Looking at my core values—which are centered around "${valStr}"—this choice must align with that standard.` 
        : `We must stay anchored to our core values, ensuring no temporary crisis makes us drift from our true north.`;

      const ruleStr = activeProfile.answers.rules.trim();
      const rulesRef = ruleStr
        ? `Remember the rules I live by: "${ruleStr}". In moments of high stress, these strict boundaries are not optional; they are the shields that prevent us from making catastrophic errors.`
        : `In moments of crisis, we must abide by consistent rules. We never make permanent structural decisions under temporary emotional duress.`;

      // 5. Connect to Life Experience
      const expStr = activeProfile.answers.experiences.trim();
      let experienceRef = "";
      if (expStr) {
        experienceRef = `This reminds me deeply of the life lesson earned from: "${expStr}". That experience proved that when the storm hits, the only assets that remain standing are our character and our core alliances.`;
      } else {
        experienceRef = `History shows us that every challenge we survive is an opportunity to calibrate our digital twin and harden our resolve for the generations to follow.`;
      }

      // 6. Final recommendation block
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

      // 7. Assemble response content
      const responseContent = `**${intro}**

${archetypeTone}

**Applying Our Core Framework:**
*   **Values Alignment:** ${valuesRef}
*   **Decision Rules:** ${rulesRef}
*   **Hard-won Experience:** ${experienceRef}

---

${finalRec}`;

      // 8. Cognitive Reasoning Trail Steps
      const riskVal = activeProfile.scores.risk;
      const ethicsVal = activeProfile.scores.ethics;
      const horizonVal = activeProfile.scores.horizon;

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
    }, 2500);
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

                <Button variant={p.isSelf ? "outline" : "hero"} className="w-full mt-4 h-10 shadow-card" onClick={() => openChat(p.id)}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Consult Advisor
                </Button>
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
                      onClick={() => handleMCQSelect(q.dimension, opt.score)}
                      className={`w-full text-left p-4 rounded-lg border text-xs transition-all flex items-start gap-3.5 leading-relaxed ${
                        draftMCQScores[q.dimension] === opt.score
                          ? "bg-bronze/10 border-bronze text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-bronze/50"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                        draftMCQScores[q.dimension] === opt.score ? "border-bronze" : "border-muted-foreground"
                      }`}>
                        {draftMCQScores[q.dimension] === opt.score && <div className="w-2 h-2 rounded-full bg-bronze" />}
                      </div>
                      <span>{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t border-border">
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
                          {Math.round(calibrationResults.f1 * 100)}% Match
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">F1-Score</span>
                          <span className="font-bold text-foreground block mt-0.5">{calibrationResults.f1.toFixed(2)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">ROC-AUC</span>
                          <span className="font-bold text-foreground block mt-0.5">{calibrationResults.auc.toFixed(2)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Precision</span>
                          <span className="font-bold text-foreground block mt-0.5">{calibrationResults.precision.toFixed(2)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Recall</span>
                          <span className="font-bold text-foreground block mt-0.5">{calibrationResults.recall.toFixed(2)}</span>
                        </div>
                      </div>

                      <Button 
                        type="button"
                        variant="outline" 
                        size="xs" 
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
