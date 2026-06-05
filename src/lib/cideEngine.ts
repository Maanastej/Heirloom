// Conversational Identity Discovery Engine (CIDE) logic
// Path: src/lib/cideEngine.ts

export interface CIDEValueProfile {
  family_vs_work: number;
  risk_tolerance: number;
  financial_priority: number;
  legacy_orientation: number;
  stability_vs_growth: number;
  
  confidence_family_vs_work: number;
  confidence_risk_tolerance: number;
  confidence_financial_priority: number;
  confidence_legacy_orientation: number;
  confidence_stability_vs_growth: number;
  
  contradiction_flags: string[];
  last_updated: string;
}

export interface CIDEEvidence {
  id: string;
  trait: keyof CIDEValueProfile;
  evidence_type: "story" | "tradeoff" | "follow-up" | "reflection";
  content: string;
  score_impact: number;
  timestamp: string;
}

export interface CIDEMessage {
  role: "user" | "assistant";
  content: string;
  dilemmaId?: string;
  selectedOptionIndex?: number;
}

export interface CIDEState {
  profileId: string;
  messages: CIDEMessage[];
  profile: CIDEValueProfile;
  evidence: CIDEEvidence[];
  currentDilemmaId: string | null;
  askedDilemmaIds: string[];
}

export interface CIDEOption {
  text: string;
  traitImpact: { trait: keyof CIDEValueProfile; value: number };
  followUpText: string;
}

export interface CIDEDilemma {
  id: string;
  trait: keyof CIDEValueProfile;
  type: "story" | "tradeoff" | "reflection";
  questionText: string;
  options?: CIDEOption[];
}

// adaptive Dilemma bank
export const CIDE_DILEMMAS: CIDEDilemma[] = [
  {
    id: "d1-family-work",
    trait: "family_vs_work",
    type: "tradeoff",
    questionText: "Imagine this scenario: Same compensation, same corporate title. Option A: A position closer to family but with limited international career exposure. Option B: A position requiring relocation abroad with massive global career acceleration prospects. What would you prioritize?",
    options: [
      {
        text: "Option A: Prioritize family proximity over global career expansion.",
        traitImpact: { trait: "family_vs_work", value: 0.2 },
        followUpText: "Understood. Would you stick with this decision if passing on the global role meant you couldn't secure a promotion for the next five years?"
      },
      {
        text: "Option B: Prioritize international career growth and relocate.",
        traitImpact: { trait: "family_vs_work", value: 0.8 },
        followUpText: " relocation affects close family bonds. How would you plan to mitigate that distance or manage relational expectations?"
      }
    ]
  },
  {
    id: "d2-risk-tolerance",
    trait: "risk_tolerance",
    type: "tradeoff",
    questionText: "Your family legacy wealth needs allocation: Option A: Invest entirely in guaranteed 4% government treasury notes. Option B: Allocate 40% to a high-upside family business expansion with a 25% chance of total capital loss. Which path resonates with your responsibility?",
    options: [
      {
        text: "Option A: Secure guaranteed preserving yields.",
        traitImpact: { trait: "risk_tolerance", value: 0.15 },
        followUpText: "Inflation might erode that capital over generations. Does that loss of purchasing power feel safer than an active business risk?"
      },
      {
        text: "Option B: Take the business expansion bet.",
        traitImpact: { trait: "risk_tolerance", value: 0.85 },
        followUpText: "In the event of a total capital loss, how would you justify that failure to the next generation?"
      }
    ]
  },
  {
    id: "d3-financial-priority",
    trait: "financial_priority",
    type: "tradeoff",
    questionText: "If you received a sudden legacy windfall, what is your immediate default mindset? Option A: Build a multi-year cash emergency cushion and pay down all debt. Option B: Invest immediately into high-leverage growth assets to multiply the wealth.",
    options: [
      {
        text: "Option A: Focus on defensive stability and debt elimination.",
        traitImpact: { trait: "financial_priority", value: 0.2 },
        followUpText: "Does debt carry a heavy psychological burden for you, or is it purely a financial calculation?"
      },
      {
        text: "Option B: Focus on aggressive growth and leverage investment.",
        traitImpact: { trait: "financial_priority", value: 0.85 },
        followUpText: "How comfortable are you with carrying debt if it yields a mathematically higher net return?"
      }
    ]
  },
  {
    id: "d4-legacy-orientation",
    trait: "legacy_orientation",
    type: "tradeoff",
    questionText: "A family business option presents itself: Option A: Liquidate now for a guaranteed payout, allowing everyone to secure their immediate personal lives. Option B: Retain ownership, lock the assets in a trust, and pass the voting rights down to the children. Which is your philosophy?",
    options: [
      {
        text: "Option A: Liquidate and prioritize current individual freedom.",
        traitImpact: { trait: "legacy_orientation", value: 0.25 },
        followUpText: "Do you believe descendants gain more from individual startup capital today than an inherited collective infrastructure tomorrow?"
      },
      {
        text: "Option B: Retain ownership, trust-lock, and preserve the dynasty.",
        traitImpact: { trait: "legacy_orientation", value: 0.9 },
        followUpText: "What happens if future generations do not share your passion for this collective business?"
      }
    ]
  },
  {
    id: "d5-stability-growth",
    trait: "stability_vs_growth",
    type: "tradeoff",
    questionText: "In an unexpected economic downturn: Option A: Proactively cut staff, scale back operations, and sit on cash reserves. Option B: Leverage cash reserves to acquire competitors and launch new products while pricing is low.",
    options: [
      {
        text: "Option A: Retreat to safe operational levels and preserve reserves.",
        traitImpact: { trait: "stability_vs_growth", value: 0.2 },
        followUpText: "Does defensive retreat ever feel like a missed opportunity to dominate your space?"
      },
      {
        text: "Option B: Expand aggressively and capture market share.",
        traitImpact: { trait: "stability_vs_growth", value: 0.8 },
        followUpText: "What triggers your threshold to stop scaling and focus purely on defensive preservation?"
      }
    ]
  },
  {
    id: "d6-story-family",
    trait: "family_vs_work",
    type: "story",
    questionText: "Could you share a personal story or memory about a moment when you had to make a tough choice between a work commitment and a family milestone? What happened, and how did it feel?"
  },
  {
    id: "d7-story-risk",
    trait: "risk_tolerance",
    type: "story",
    questionText: "Tell me about a time you made a significant risk decision that didn't go as planned. What was the fallout, and did it change how you evaluate future opportunities?"
  }
];

import { supabase } from "@/integrations/supabase/client";

export const buildInitialCIDEState = (profileId: string): CIDEState => {
  const defaultProfile: CIDEValueProfile = {
    family_vs_work: 0.5,
    risk_tolerance: 0.5,
    financial_priority: 0.5,
    legacy_orientation: 0.5,
    stability_vs_growth: 0.5,
    
    confidence_family_vs_work: 0.1,
    confidence_risk_tolerance: 0.1,
    confidence_financial_priority: 0.1,
    confidence_legacy_orientation: 0.1,
    confidence_stability_vs_growth: 0.1,
    
    contradiction_flags: [],
    last_updated: new Date().toISOString()
  };

  const welcomeMessage: CIDEMessage = {
    role: "assistant",
    content: "Welcome to the Identity Discovery Console. Rather than filling out forms, we will explore your life philosophy through stories and tradeoffs. Let's begin."
  };

  const state: CIDEState = {
    profileId,
    messages: [welcomeMessage],
    profile: defaultProfile,
    evidence: [],
    currentDilemmaId: null,
    askedDilemmaIds: []
  };

  return state;
};

// Select next best dilemma based on trait with lowest confidence
export const selectNextDilemma = (state: CIDEState): CIDEDilemma | null => {
  const traits: (keyof CIDEValueProfile)[] = [
    "family_vs_work",
    "risk_tolerance",
    "financial_priority",
    "legacy_orientation",
    "stability_vs_growth"
  ];

  // Sort traits by confidence
  const sortedTraits = [...traits].sort((a, b) => {
    const confA = state.profile[`confidence_${a}` as keyof CIDEValueProfile] as number;
    const confB = state.profile[`confidence_${b}` as keyof CIDEValueProfile] as number;
    return confA - confB;
  });

  // Find a dilemma for the lowest confidence trait that hasn't been asked yet
  for (const trait of sortedTraits) {
    const dilemma = CIDE_DILEMMAS.find(
      d => d.trait === trait && !state.askedDilemmaIds.includes(d.id)
    );
    if (dilemma) return dilemma;
  }

  // Fallback to any unasked dilemma
  const remaining = CIDE_DILEMMAS.find(d => !state.askedDilemmaIds.includes(d.id));
  return remaining || null;
};

// Process response and calculate adjustments
export const processCIDEResponse = (
  state: CIDEState,
  userText: string,
  chosenOptionIndex?: number
): CIDEState => {
  const updatedState = { ...state };
  
  // 1. Add user message
  const userMsg: CIDEMessage = {
    role: "user",
    content: userText,
    dilemmaId: state.currentDilemmaId || undefined,
    selectedOptionIndex: chosenOptionIndex
  };
  updatedState.messages = [...updatedState.messages, userMsg];

  // 2. Perform Inference
  if (state.currentDilemmaId) {
    const dilemma = CIDE_DILEMMAS.find(d => d.id === state.currentDilemmaId);
    if (dilemma) {
      const trait = dilemma.trait;
      const confidenceKey = `confidence_${trait}` as keyof CIDEValueProfile;
      const currentVal = state.profile[trait] as number;
      const currentConf = state.profile[confidenceKey] as number;

      let scoreImpact = 0;
      let impactVal = 0.5;
      let logEvidence = "";

      if (dilemma.type === "tradeoff" && chosenOptionIndex !== undefined && dilemma.options?.[chosenOptionIndex]) {
        const option = dilemma.options[chosenOptionIndex];
        impactVal = option.traitImpact.value;
        scoreImpact = (impactVal - currentVal) * 0.45; // adjustment step
        logEvidence = `Selected tradeoff choice: "${option.text}"`;
      } else {
        // Freeform story response or follow-up response analysis
        const words = userText.toLowerCase();
        
        // Simple NLP keyword-based heuristic
        if (trait === "family_vs_work") {
          if (words.includes("family") || words.includes("kids") || words.includes("wife") || words.includes("husband") || words.includes("home")) {
            impactVal = 0.2;
          } else if (words.includes("work") || words.includes("career") || words.includes("growth") || words.includes("company")) {
            impactVal = 0.8;
          }
        } else if (trait === "risk_tolerance") {
          if (words.includes("safe") || words.includes("careful") || words.includes("protect") || words.includes("lost")) {
            impactVal = 0.2;
          } else if (words.includes("chance") || words.includes("invest") || words.includes("expansion") || words.includes("bet")) {
            impactVal = 0.8;
          }
        }

        scoreImpact = (impactVal - currentVal) * 0.25;
        logEvidence = `Expressed narrative logic: "${userText.substring(0, 80)}..."`;
      }

      // Update trait profile
      const newVal = Math.max(0, Math.min(1, currentVal + scoreImpact));
      const newConf = Math.min(1.0, currentConf + 0.15); // increase confidence

      // Build evidence source
      const evidenceItem: CIDEEvidence = {
        id: "ev-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        trait,
        evidence_type: dilemma.type,
        content: logEvidence,
        score_impact: Number(scoreImpact.toFixed(3)),
        timestamp: new Date().toISOString()
      };

      updatedState.evidence = [evidenceItem, ...updatedState.evidence];

      // Contradiction detection: if score impact conflicts heavily with previous state
      const contradictionFlags = [...state.profile.contradiction_flags];
      if (Math.abs(impactVal - currentVal) > 0.5 && currentConf > 0.4) {
        const flag = `Contradicting preference registered for ${trait}: previously estimated conservative, now chose risk-seeking.`;
        if (!contradictionFlags.includes(flag)) {
          contradictionFlags.push(flag);
        }
      }

      updatedState.profile = {
        ...state.profile,
        [trait]: Number(newVal.toFixed(3)),
        [confidenceKey]: Number(newConf.toFixed(3)),
        contradiction_flags: contradictionFlags,
        last_updated: new Date().toISOString()
      };

      // Mark this dilemma asked
      if (!updatedState.askedDilemmaIds.includes(dilemma.id)) {
        updatedState.askedDilemmaIds = [...updatedState.askedDilemmaIds, dilemma.id];
      }
    }
  }

  // 3. Select next best dilemma & form next question
  const nextDilemma = selectNextDilemma(updatedState);
  if (nextDilemma) {
    updatedState.currentDilemmaId = nextDilemma.id;
    const nextMsg: CIDEMessage = {
      role: "assistant",
      content: nextDilemma.questionText,
      dilemmaId: nextDilemma.id
    };
    updatedState.messages = [...updatedState.messages, nextMsg];
  } else {
    // Session complete/all dimensions mapped
    updatedState.currentDilemmaId = null;
    const finalMsg: CIDEMessage = {
      role: "assistant",
      content: "Thank you. I have compiled a comprehensive map of your latent reasoning priorities. You can review the weights and evidence profiles on the sidebar."
    };
    updatedState.messages = [...updatedState.messages, finalMsg];
  }

  // Sync to database if profile exists in db
  syncProfileToSupabase(updatedState);

  return updatedState;
};

// Sync profile data to supabase table
const syncProfileToSupabase = async (state: CIDEState) => {
  try {
    const { data: existing } = await supabase
      .from("identity_profiles")
      .select("id")
      .eq("profile_id", state.profileId)
      .maybeSingle();

    const payload = {
      profile_id: state.profileId,
      family_vs_work: state.profile.family_vs_work,
      risk_tolerance: state.profile.risk_tolerance,
      financial_priority: state.profile.financial_priority,
      legacy_orientation: state.profile.legacy_orientation,
      stability_vs_growth: state.profile.stability_vs_growth,
      confidence_family_vs_work: state.profile.confidence_family_vs_work,
      confidence_risk_tolerance: state.profile.confidence_risk_tolerance,
      confidence_financial_priority: state.profile.confidence_financial_priority,
      confidence_legacy_orientation: state.profile.confidence_legacy_orientation,
      confidence_stability_vs_growth: state.profile.confidence_stability_vs_growth,
      contradiction_flags: state.profile.contradiction_flags,
      last_updated: new Date().toISOString()
    };

    if (existing) {
      await supabase
        .from("identity_profiles")
        .update(payload)
        .eq("profile_id", state.profileId);
    } else {
      await supabase
        .from("identity_profiles")
        .insert([payload]);
    }

    // Insert conversation
    await supabase
      .from("identity_conversations")
      .insert([{
        profile_id: state.profileId,
        messages: state.messages as any
      }]);
  } catch (err) {
    console.error("syncProfileToSupabase error:", err);
  }
};
