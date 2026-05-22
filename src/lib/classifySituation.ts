export type SituationType =
  | "financial_crisis"
  | "relationship_conflict"
  | "career_uncertainty"
  | "social_pressure"
  | "health_stress"
  | "opportunity_risk"
  | "identity_conflict"
  | "general_decision";

const situationKeywords: Record<SituationType, string[]> = {
  financial_crisis: [
    "money",
    "pay",
    "financial",
    "debt",
    "budget",
    "income",
    "salary",
    "bankrupt",
    "expense",
    "afford",
    "cash",
    "loan",
    "credit",
    "savings",
    "mortgage",
    "investment",
    "bills",
    "tax"
  ],
  relationship_conflict: [
    "relationship",
    "partner",
    "spouse",
    "wife",
    "husband",
    "marriage",
    "divorce",
    "breakup",
    "fight",
    "family",
    "friend",
    "betray",
    "trust",
    "support",
    "kin",
    "conflict",
    "couple",
    "argue"
  ],
  career_uncertainty: [
    "career",
    "job",
    "promotion",
    "boss",
    "work",
    "hiring",
    "interview",
    "role",
    "position",
    "offer",
    "layoff",
    "career",
    "startup",
    "business",
    "resume",
    "salary",
    "company",
    "workplace"
  ],
  social_pressure: [
    "social",
    "pressure",
    "reputation",
    "approval",
    "peer",
    "crowd",
    "acceptance",
    "expectation",
    "status",
    "event",
    "audience",
    "image",
    "public",
    "judgment",
    "trend"
  ],
  health_stress: [
    "health",
    "illness",
    "sick",
    "doctor",
    "medical",
    "pain",
    "injury",
    "treatment",
    "anxiety",
    "stress",
    "diet",
    "fitness",
    "mental",
    "depression",
    "sleep",
    "wellness",
    "condition",
    "diagnosis"
  ],
  opportunity_risk: [
    "opportunity",
    "chance",
    "investment",
    "venture",
    "growth",
    "risk",
    "reward",
    "expand",
    "scale",
    "launch",
    "deal",
    "project",
    "proposal",
    "buy",
    "sell",
    "offer"
  ],
  identity_conflict: [
    "identity",
    "self",
    "purpose",
    "values",
    "authenticity",
    "belonging",
    "culture",
    "faith",
    "role",
    "meaning",
    "who am i",
    "self-image",
    "image",
    "gender",
    "ethnic",
    "background"
  ],
  general_decision: []
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const classifySituation = (input: string): SituationType => {
  const text = input.trim().toLowerCase();
  if (!text) return "general_decision";

  const scores = Object.keys(situationKeywords).reduce<Record<SituationType, number>>((acc, key) => {
    const type = key as SituationType;
    acc[type] = 0;
    return acc;
  }, {} as Record<SituationType, number>);

  Object.entries(situationKeywords).forEach(([type, keywords]) => {
    keywords.forEach((keyword) => {
      if (keyword && text.includes(keyword)) {
        scores[type as SituationType] += 1;
      }
    });
  });

  const sorted = (Object.entries(scores) as [SituationType, number][]) .sort((a, b) => b[1] - a[1]);
  const [bestType, bestScore] = sorted[0];

  if (bestScore === 0 || bestType === "general_decision") {
    return "general_decision";
  }
  return bestType;
};

export type SituationBehaviorWeights = Record<
  | "delay_action"
  | "panic_decision"
  | "avoidance_loop"
  | "reassurance_seeking"
  | "emotional_reactivity"
  | "analysis_paralysis"
  | "overthinking",
  number
>;

const situationBehaviorModifiers: Record<SituationType, SituationBehaviorWeights> = {
  general_decision: {
    delay_action: 0,
    panic_decision: 0,
    avoidance_loop: 0,
    reassurance_seeking: 0,
    emotional_reactivity: 0,
    analysis_paralysis: 0,
    overthinking: 0,
  },
  financial_crisis: {
    delay_action: 0.05,
    panic_decision: 0.18,
    avoidance_loop: 0.12,
    reassurance_seeking: 0,
    emotional_reactivity: 0.04,
    analysis_paralysis: 0.03,
    overthinking: 0.05,
  },
  relationship_conflict: {
    delay_action: 0,
    panic_decision: 0.05,
    avoidance_loop: 0.05,
    reassurance_seeking: 0.18,
    emotional_reactivity: 0.16,
    analysis_paralysis: 0,
    overthinking: 0.06,
  },
  career_uncertainty: {
    delay_action: 0.12,
    panic_decision: 0,
    avoidance_loop: 0.08,
    reassurance_seeking: 0,
    emotional_reactivity: 0.04,
    analysis_paralysis: 0.20,
    overthinking: 0.18,
  },
  social_pressure: {
    delay_action: 0.10,
    panic_decision: 0.05,
    avoidance_loop: 0.12,
    reassurance_seeking: 0.08,
    emotional_reactivity: 0.15,
    analysis_paralysis: 0.06,
    overthinking: 0.08,
  },
  health_stress: {
    delay_action: 0.08,
    panic_decision: 0.12,
    avoidance_loop: 0.14,
    reassurance_seeking: 0.06,
    emotional_reactivity: 0.14,
    analysis_paralysis: 0.05,
    overthinking: 0.07,
  },
  opportunity_risk: {
    delay_action: 0.07,
    panic_decision: 0.10,
    avoidance_loop: 0.06,
    reassurance_seeking: 0,
    emotional_reactivity: 0.05,
    analysis_paralysis: 0.12,
    overthinking: 0.14,
  },
  identity_conflict: {
    delay_action: 0.06,
    panic_decision: 0,
    avoidance_loop: 0.08,
    reassurance_seeking: 0.12,
    emotional_reactivity: 0.12,
    analysis_paralysis: 0.16,
    overthinking: 0.10,
  },
};

export const getSituationBehaviorModifiers = (
  situationType: SituationType
): SituationBehaviorWeights => {
  return situationBehaviorModifiers[situationType] || situationBehaviorModifiers.general_decision;
};

export const applySituationWeights = (
  baseScores: SituationBehaviorWeights,
  situationType: SituationType
): SituationBehaviorWeights => {
  const modifiers = getSituationBehaviorModifiers(situationType);
  return Object.fromEntries(
    Object.entries(baseScores).map(([key, score]) => [
      key,
      clamp(score + (modifiers[key as keyof SituationBehaviorWeights] ?? 0), 0.01, 0.99),
    ])
  ) as SituationBehaviorWeights;
};
