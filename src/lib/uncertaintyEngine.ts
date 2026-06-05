export interface CognitiveProfile {
  primaryFocus: string;
  timeHorizon: string;
  decisionBias: string;
  regretSensitivity: string;
  evaluationStyle: string;
}

export interface UserState {
  ageStage: string;
  financialPressure: string;
  riskTolerance: string;
  dependencyLoad: string;
  urgencyLevel: string;
}

export interface UserStateInfluence {
  dominantFactor: string;
  riskAdjustment: string;
  timeHorizonAdjustment: string;
}

export interface ConflictResolution {
  dominantDomain: string;
  suppressedDomain: string;
  conflictType: string;
  tradeoffAxis: string;
  resolutionStrategy: string;
  finalRecommendationBias: string;
}

export interface FinalDecisionSynthesis {
  finalDecision: string;
  decisionType: string;
  reasoningSummary: string;
  keyTradeoffs: string[];
  riskProfile: string;
  expectedOutcomeTrajectory: string;
}

export interface UncertaintyData {
  primaryDomain: string;
  secondaryDomain: string;
  userStateInfluence: UserStateInfluence;
  adjustedCognitiveProfile: CognitiveProfile;
  conflictResolution: ConflictResolution;
  finalDecisionSynthesis: FinalDecisionSynthesis;
  adjustedUncertaintyVariables: string[];
  adjustedQuestions: string[];
  finalDecisionDirection: string;
  confidence: number;
}

const FALLBACK_UNCERTAINTY_MAP: Record<string, Omit<UncertaintyData, 'userStateInfluence' | 'finalDecisionDirection' | 'conflictResolution' | 'finalDecisionSynthesis'>> = {
  "Marriage": {
    primaryDomain: "Marriage",
    secondaryDomain: "Relationships",
    adjustedCognitiveProfile: {
      primaryFocus: "emotional_stability",
      timeHorizon: "lifelong",
      decisionBias: "commitment_quality > opportunity_cost",
      regretSensitivity: "high",
      evaluationStyle: "relational_alignment"
    },
    adjustedUncertaintyVariables: ["relationship_readiness", "emotional_maturity", "long_term_alignment"],
    adjustedQuestions: [],
    confidence: 0.5
  },
  "Career": {
    primaryDomain: "Career",
    secondaryDomain: "Finance",
    adjustedCognitiveProfile: {
      primaryFocus: "compounding_growth",
      timeHorizon: "5–15 years",
      decisionBias: "skill_growth > immediate_rewards",
      regretSensitivity: "medium",
      evaluationStyle: "trajectory_optimization"
    },
    adjustedUncertaintyVariables: ["growth_trajectory", "skill_compounding", "job_security_vs_growth"],
    adjustedQuestions: [],
    confidence: 0.5
  },
  "Startup": {
    primaryDomain: "Startup",
    secondaryDomain: "Career",
    adjustedCognitiveProfile: {
      primaryFocus: "asymmetric_returns",
      timeHorizon: "2–7 years",
      decisionBias: "upside_potential > stability",
      regretSensitivity: "high_on_missed_opportunity",
      evaluationStyle: "risk_asymmetry_analysis"
    },
    adjustedUncertaintyVariables: ["downside_tolerance", "equity_vs_salary_tradeoff", "failure_acceptance"],
    adjustedQuestions: [],
    confidence: 0.5
  },
  "Entrepreneurship": {
    primaryDomain: "Entrepreneurship",
    secondaryDomain: "Career",
    adjustedCognitiveProfile: {
      primaryFocus: "control_and_execution",
      timeHorizon: "3–10 years",
      decisionBias: "autonomy > security",
      regretSensitivity: "medium",
      evaluationStyle: "execution_feasibility"
    },
    adjustedUncertaintyVariables: ["execution_capability", "market_validation_risk", "scalability_potential"],
    adjustedQuestions: [],
    confidence: 0.5
  },
  "Finance": {
    primaryDomain: "Finance",
    secondaryDomain: "Property",
    adjustedCognitiveProfile: {
      primaryFocus: "capital_efficiency",
      timeHorizon: "variable",
      decisionBias: "risk_adjusted_returns",
      regretSensitivity: "high",
      evaluationStyle: "probabilistic_allocation"
    },
    adjustedUncertaintyVariables: ["capital_risk_exposure", "liquidity_need", "return_horizon"],
    adjustedQuestions: [],
    confidence: 0.5
  },
  "Property": {
    primaryDomain: "Property",
    secondaryDomain: "Finance",
    adjustedCognitiveProfile: {
      primaryFocus: "legacy_continuity",
      timeHorizon: "generational",
      decisionBias: "preservation > liquidity",
      regretSensitivity: "high",
      evaluationStyle: "inheritance_and_family_structure"
    },
    adjustedUncertaintyVariables: ["legacy_preservation", "liquidity_vs_assets", "family_consensus_risk"],
    adjustedQuestions: [],
    confidence: 0.5
  },
  "Family": {
    primaryDomain: "Family",
    secondaryDomain: "Relationships",
    adjustedCognitiveProfile: {
      primaryFocus: "relational_stability",
      timeHorizon: "lifelong",
      decisionBias: "harmony > optimization",
      regretSensitivity: "high",
      evaluationStyle: "emotional_system_balance"
    },
    adjustedUncertaintyVariables: ["emotional_obligation", "dependency_level", "conflict_risk"],
    adjustedQuestions: [],
    confidence: 0.5
  },
  "Education": {
    primaryDomain: "Education",
    secondaryDomain: "Career",
    adjustedCognitiveProfile: {
      primaryFocus: "optionality_creation",
      timeHorizon: "5–20 years",
      decisionBias: "long_term_ROI > short_term_effort",
      regretSensitivity: "low",
      evaluationStyle: "capability_building"
    },
    adjustedUncertaintyVariables: ["long_term_roi", "interest_alignment", "opportunity_cost"],
    adjustedQuestions: [],
    confidence: 0.5
  },
  "Health": {
    primaryDomain: "Health",
    secondaryDomain: "Life Purpose",
    adjustedCognitiveProfile: {
      primaryFocus: "risk_avoidance",
      timeHorizon: "immediate_to_lifetime",
      decisionBias: "safety > optimization",
      regretSensitivity: "high",
      evaluationStyle: "biological_constraint_management"
    },
    adjustedUncertaintyVariables: ["risk_severity", "recovery_time", "lifestyle_impact"],
    adjustedQuestions: [],
    confidence: 0.5
  },
  "Life Purpose": {
    primaryDomain: "Life Purpose",
    secondaryDomain: "Career",
    adjustedCognitiveProfile: {
      primaryFocus: "identity_coherence",
      timeHorizon: "lifetime",
      decisionBias: "meaning > efficiency",
      regretSensitivity: "high",
      evaluationStyle: "existential_alignment"
    },
    adjustedUncertaintyVariables: ["identity_clarity", "long_term_direction", "regret_minimization"],
    adjustedQuestions: [],
    confidence: 0.5
  }
};

export const generateDomainUncertainty = async (
  query: string,
  primaryDomain: string,
  secondaryDomain: string,
  userState: UserState,
  apiKey: string
): Promise<UncertaintyData> => {
  const mapFallback = FALLBACK_UNCERTAINTY_MAP[primaryDomain] || {
    primaryDomain,
    secondaryDomain,
    adjustedCognitiveProfile: {
      primaryFocus: "general_stability",
      timeHorizon: "variable",
      decisionBias: "balanced",
      regretSensitivity: "medium",
      evaluationStyle: "general_tradeoff"
    },
    adjustedUncertaintyVariables: ["situational_context", "tradeoff_clarity", "risk_appetite"],
    adjustedQuestions: [],
    confidence: 0.5
  };

  const fallback: UncertaintyData = {
    ...mapFallback,
    userStateInfluence: {
      dominantFactor: "Fallback - Unknown",
      riskAdjustment: "Neutral",
      timeHorizonAdjustment: "Neutral"
    },
    conflictResolution: {
      dominantDomain: primaryDomain,
      suppressedDomain: secondaryDomain,
      conflictType: "survival_conflict",
      tradeoffAxis: "security vs exploration",
      resolutionStrategy: "prioritize_survival",
      finalRecommendationBias: "Prioritize general stability"
    },
    finalDecisionSynthesis: {
      finalDecision: "Requires deeper context to synthesize an action.",
      decisionType: "delay",
      reasoningSummary: "Unable to reach a high-confidence structural decision without real-time evaluation.",
      keyTradeoffs: ["Action vs Inaction"],
      riskProfile: "Unknown",
      expectedOutcomeTrajectory: "Status Quo"
    },
    finalDecisionDirection: "Requires more dynamic evaluation."
  };

  if (!apiKey) {
    console.log("UNCERTAINTY_ENGINE: Using Offline Fallback (No Key)");
    return fallback;
  }

  const prompt = `
FINAL DECISION SYNTHESIS ENGINE (WITH DOMAIN, STATE & CONFLICT LAYERS)

OBJECTIVE:
1. Transform domain outputs into full cognitive profiles adjusted for the specific USER STATE.
2. Resolve conflicts when primaryDomain and secondaryDomain suggest opposing actions.
3. Convert all upstream reasoning into a single actionable decision output (Final Decision Synthesis).

INPUTS:
Query: "${query}"
Primary Domain: "${primaryDomain}"
Secondary Domain: "${secondaryDomain}"

USER STATE:
- Age Stage: ${userState.ageStage}
- Financial Pressure: ${userState.financialPressure}
- Risk Tolerance: ${userState.riskTolerance}
- Dependency Load: ${userState.dependencyLoad}
- Urgency Level: ${userState.urgencyLevel}

CONFLICT RESOLUTION RULES:
If domains conflict (e.g. Marriage vs Career, Startup vs Finance), DO NOT average them.
1. NEVER merge domains into a single blended answer.
2. ALWAYS pick a dominant domain based on User State.
3. ALWAYS explicitly suppress one domain.
4. ALWAYS output conflict type (time_conflict, value_conflict, risk_conflict, emotional_conflict, survival_conflict).
5. NEVER output a generic "balanced approach".
6. Select a resolutionStrategy: prioritize_survival, prioritize_long_term_compounding, prioritize_emotional_stability, prioritize_asymmetric_upside, or staged_decision.

FINAL DECISION SYNTHESIS RULES:
1. Decision MUST reflect userState adjustments.
2. Must NOT contradict the conflict resolution layer.
3. Must NOT reintroduce generic reasoning.
4. Must include explicit tradeoffs.
5. Must produce different outputs for different userStates.

OUTPUT FORMAT (STRICT JSON):
{
  "primaryDomain": "${primaryDomain}",
  "secondaryDomain": "${secondaryDomain}",
  "userStateInfluence": {
    "dominantFactor": "string",
    "riskAdjustment": "string",
    "timeHorizonAdjustment": "string"
  },
  "adjustedCognitiveProfile": {
    "primaryFocus": "string",
    "timeHorizon": "string",
    "decisionBias": "string",
    "regretSensitivity": "string",
    "evaluationStyle": "string"
  },
  "conflictResolution": {
    "dominantDomain": "string",
    "suppressedDomain": "string",
    "conflictType": "string",
    "tradeoffAxis": "string",
    "resolutionStrategy": "string",
    "finalRecommendationBias": "string"
  },
  "finalDecisionSynthesis": {
    "finalDecision": "string",
    "decisionType": "yes | no | delay | conditional_yes | split_path",
    "reasoningSummary": "string",
    "keyTradeoffs": ["string", "string"],
    "riskProfile": "string",
    "expectedOutcomeTrajectory": "string"
  },
  "adjustedUncertaintyVariables": ["string", "string"],
  "adjustedQuestions": ["string", "string"],
  "finalDecisionDirection": "string (Summary of how the user state and conflict resolution shifts the decision)",
  "confidence": 0.0
}
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const rawJson = jsonMatch ? jsonMatch[0] : text;
        const parsed = JSON.parse(rawJson);
        console.log("UNCERTAINTY_ENGINE: LLM Success", parsed);
        return {
          primaryDomain: parsed.primaryDomain || primaryDomain,
          secondaryDomain: parsed.secondaryDomain || secondaryDomain,
          userStateInfluence: parsed.userStateInfluence || fallback.userStateInfluence,
          adjustedCognitiveProfile: parsed.adjustedCognitiveProfile || fallback.adjustedCognitiveProfile,
          conflictResolution: parsed.conflictResolution || fallback.conflictResolution,
          finalDecisionSynthesis: parsed.finalDecisionSynthesis || fallback.finalDecisionSynthesis,
          adjustedUncertaintyVariables: parsed.adjustedUncertaintyVariables || fallback.adjustedUncertaintyVariables,
          adjustedQuestions: parsed.adjustedQuestions || fallback.adjustedQuestions,
          finalDecisionDirection: parsed.finalDecisionDirection || fallback.finalDecisionDirection,
          confidence: parsed.confidence || 0.8
        };
      }
    } else {
      console.warn(`UNCERTAINTY_ENGINE: Groq HTTP ${response.status}`);
    }
  } catch (err) {
    console.error("UNCERTAINTY_ENGINE: LLM Failed", err);
  }

  console.log("UNCERTAINTY_ENGINE: Using Offline Fallback (Network Error)");
  return fallback;
};
