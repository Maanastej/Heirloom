export type DecisionIntent =
  | "spending_boundary"
  | "business_exit"
  | "career_move"
  | "relationship_conflict"
  | "emotional_support"
  | "risk_tradeoff"
  | "self_control"
  | "long_term_planning"
  | "conflict_resolution"
  | "identity_conflict"
  | "general_decision";

const intentPatterns: Record<DecisionIntent, string[]> = {
  spending_boundary: [
    "spend",
    "luxury",
    "expensive",
    "buy",
    "purchase",
    "afford",
    "budget",
    "cost",
    "credit",
    "charge",
    "price",
    "shopping",
    "style inflation",
    "emotional spending"
  ],
  business_exit: [
    "sell company",
    "sell my company",
    "sell business",
    "business exit",
    "exit",
    "sell",
    "acquisition",
    "acquire",
    "merger",
    "founder",
    "startup",
    "investor",
    "valuation"
  ],
  career_move: [
    "hate my job",
    "quit",
    "resign",
    "career",
    "job",
    "boss",
    "promotion",
    "hire",
    "workplace",
    "role",
    "career move",
    "opportunity"
  ],
  relationship_conflict: [
    "cofounder betrayed",
    "partner",
    "spouse",
    "relationship",
    "conflict",
    "fight",
    "argue",
    "betray",
    "marriage",
    "friend",
    "family",
    "trust"
  ],
  emotional_support: [
    "feel",
    "anxious",
    "overwhelmed",
    "depressed",
    "sad",
    "lonely",
    "support",
    "therapy",
    "cope",
    "emotion",
    "stress",
    "help me"
  ],
  risk_tradeoff: [
    "risk",
    "reward",
    "tradeoff",
    "gamble",
    "upside",
    "downside",
    "chance",
    "uncertain",
    "balance",
    "risk/reward",
    "risk tradeoff"
  ],
  self_control: [
    "discipline",
    "habit",
    "addiction",
    "temptation",
    "resist",
    "control",
    "withdraw",
    "avoid",
    "stop",
    "limit",
    "boundary",
    "self control"
  ],
  long_term_planning: [
    "long term",
    "future",
    "retirement",
    "legacy",
    "plan",
    "decade",
    "goal",
    "roadmap",
    "savings",
    "financial plan",
    "long-term"
  ],
  conflict_resolution: [
    "resolve",
    "mediation",
    "compromise",
    "negotiate",
    "reconcile",
    "settle",
    "disagreement",
    "peace",
    "team conflict",
    "conflict resolution"
  ],
  identity_conflict: [
    "identity",
    "who am i",
    "purpose",
    "authenticity",
    "meaning",
    "values",
    "self",
    "belonging",
    "identity conflict",
    "self image",
    "identity crisis"
  ],
  general_decision: []
};

export const extractDecisionIntent = (input: string): DecisionIntent => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return "general_decision";

  const scores = Object.keys(intentPatterns).reduce<Record<DecisionIntent, number>>((acc, key) => {
    acc[key as DecisionIntent] = 0;
    return acc;
  }, {} as Record<DecisionIntent, number>);

  Object.entries(intentPatterns).forEach(([intent, patterns]) => {
    patterns.forEach((pattern) => {
      if (!pattern) return;
      if (normalized.includes(pattern)) {
        scores[intent as DecisionIntent] += 1;
      }
    });
  });

  const sorted = (Object.entries(scores) as [DecisionIntent, number][]) .sort((a, b) => b[1] - a[1]);
  const [bestIntent, bestScore] = sorted[0];
  return bestScore > 0 ? bestIntent : "general_decision";
};
