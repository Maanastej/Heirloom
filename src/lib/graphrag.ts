import { supabase } from "@/integrations/supabase/client";
import { classifySituation } from "./classifySituation";
import { extractDecisionIntent } from "./extractDecisionIntent";
import { getMemories } from "./services/memoryService";
import { getDecisions } from "./services/decisionService";
import { getPrinciples } from "./services/principleService";
import { getGraphEdges } from "./services/graphService";

// Graph Schema Interfaces
export interface GraphNode {
  id: string;
  entity_type: 'Person' | 'Memory' | 'Decision' | 'Principle' | 'Asset' | 'Video' | 'Document' | 'Family Member' | 'Event';
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'MADE' | 'INFLUENCED' | 'MENTIONED' | 'OWNED' | 'REFERRED_TO' | 'CONNECTED_TO' | 'INSPIRED' | 'INHERITED' | 'CAUSED';
  properties: Record<string, any>;
}

export interface MemoryObject {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  content: string;
  year: number;
  event_type: string;
  emotion: string;
  people_involved: string[];
  importance_score: number;
}

export interface DecisionJournalObject {
  id: string;
  profile_id: string;
  situation: string;
  options: { id: string; text: string }[];
  selected_option: string;
  reasoning: string;
  emotional_state: string;
  outcome: string;
  outcome_quality: number;
  decision_date: string;
}

export interface PrincipleObject {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  category: string;
  confidence_score: number;
  supporting_evidence: string[];
  contradicting_evidence: string[];
}

export interface EvidencePackage {
  intent: string;
  situationType: string;
  profile: any;
  memories: MemoryObject[];
  decisions: DecisionJournalObject[];
  principles: PrincipleObject[];
  connectedEntities: string[];
  graphTraversalPath: string[];
}

export interface GeneratedQuestion {
  variableId: string;
  question: string;
  options: string[];
  importanceScore: number;
}

export interface SimulatorResponseData {
  recommendation: string;
  confidence: number;
  potentialConfidence: number;
  primaryReason: string;
  conflictAnalysis: {
     conflictDetected: boolean;
     supportingEvidence: string[];
     opposingEvidence: string[];
     resolution: string;
  };
  twinUncertainty: string;
  nextQuestion: GeneratedQuestion | null;
  learningSummary?: string[];
  reasoning: string;
  memories: string[];
  decisions: string[];
  principles: string[];
  potentialCounterarguments: string[];
}

// Graph Multi-Hop Expansion Logic (Phase 10 Core)
export const expandGraphNodes = (
  startNodeIds: string[],
  edges: GraphEdge[],
  maxHops = 2
): string[] => {
  const visited = new Set<string>(startNodeIds);
  let currentFrontier = [...startNodeIds];
  const traversalPath: string[] = [];

  for (let hop = 0; hop < maxHops; hop++) {
    const nextFrontier: string[] = [];
    currentFrontier.forEach(nodeId => {
      const connectedEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
      
      connectedEdges.forEach(edge => {
        const neighbor = edge.source === nodeId ? edge.target : edge.source;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nextFrontier.push(neighbor);
          traversalPath.push(`${nodeId} → [${edge.type}] → ${neighbor}`);
        }
      });
    });
    currentFrontier = nextFrontier;
  }

  return traversalPath;
};

// Advanced GraphRAG Retrieval Engine — DATABASE ONLY
export const retrieveGraphRAGContext = async (
  profileId: string,
  question: string,
  scores: Record<string, number>
): Promise<EvidencePackage> => {
  const intent = extractDecisionIntent(question);
  const situationType = classifySituation(question);

  // 1. Fetch ALL data from Supabase — no localStorage, no mock seeding
  const memories = await getMemories(profileId);
  const decisions = await getDecisions(profileId);
  const principles = await getPrinciples(profileId);
  const edges = await getGraphEdges(profileId);

  // 2. Fetch combined identity vector (stable 50%, medium 35%, live 15%)
  let combinedProfile: any = null;
  try {
    const identityStability = await import('../lib/identityStability');
    combinedProfile = await identityStability.getCombinedIdentityVector(profileId);
  } catch {
    // Identity profile may not exist yet — that's fine
  }

  // 3. If no data exists at all, return an empty evidence package
  if (memories.length === 0 && decisions.length === 0 && principles.length === 0) {
    return {
      intent,
      situationType,
      profile: { id: profileId, scores, combinedProfile },
      memories: [],
      decisions: [],
      principles: [],
      connectedEntities: [],
      graphTraversalPath: []
    };
  }

  // 4. Keyword-based scoring approximation
  const queryTerms = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // Rank a node using combined identity profile and bias factors
  const rankNode = (content: string): number => {
    let baseRank = 0;
    if (!combinedProfile) return baseRank;
    const lower = content.toLowerCase();

    // Family vs Work bias
    if (combinedProfile.family_vs_work < 0.4 && (lower.includes('family') || lower.includes('kids') || lower.includes('home'))) {
      baseRank += 3;
    } else if (combinedProfile.family_vs_work > 0.6 && (lower.includes('work') || lower.includes('career') || lower.includes('growth'))) {
      baseRank += 3;
    }

    // Risk tolerance bias
    if (combinedProfile.risk_tolerance < 0.4 && (lower.includes('safe') || lower.includes('debt-free') || lower.includes('conservative'))) {
      baseRank += 3;
    } else if (combinedProfile.risk_tolerance > 0.6 && (lower.includes('risk') || lower.includes('leverage') || lower.includes('bet'))) {
      baseRank += 3;
    }

    // Identity bias scaling using stability_vs_growth and legacy_orientation
    const stabilityFactor = 1 + ((combinedProfile.stability_vs_growth ?? 0.5) - 0.5) * 0.2;
    const legacyFactor = 1 + ((combinedProfile.legacy_orientation ?? 0.5) - 0.5) * 0.2;
    return baseRank * stabilityFactor * legacyFactor;
  };

  const scoredMems = memories.map(m => {
    let termMatches = 0;
    queryTerms.forEach(t => { if (m.title.toLowerCase().includes(t) || m.content.toLowerCase().includes(t)) termMatches++; });
    if (m.title.toLowerCase().includes(intent) || m.content.toLowerCase().includes(intent)) termMatches += 2;
    return {
      id: m.id,
      mem: m,
      score: rankNode(m.title + " " + m.content) + (termMatches * 5)
    };
  }).sort((a, b) => b.score - a.score);

  const scoredDecs = decisions.map(d => {
    let termMatches = 0;
    queryTerms.forEach(t => { if (d.situation.toLowerCase().includes(t) || d.reasoning.toLowerCase().includes(t)) termMatches++; });
    if (d.situation.toLowerCase().includes(intent) || d.reasoning.toLowerCase().includes(intent)) termMatches += 2;
    return {
      id: d.id,
      dec: d,
      score: rankNode(d.situation + " " + d.reasoning) + (termMatches * 5)
    };
  }).sort((a, b) => b.score - a.score);

  // 5. Multi-Hop Graph Expansion
  const initialMatches: string[] = [];
  scoredMems.slice(0, 2).forEach(item => initialMatches.push(item.id));
  scoredDecs.slice(0, 2).forEach(item => initialMatches.push(item.id));
  const graphTraversalPath = edges.length > 0 ? expandGraphNodes(initialMatches, edges, 2) : [];

  // 6. Context Extraction — use top-scored items directly
  const finalMemories = scoredMems.slice(0, 2).map(s => s.mem);
  const finalDecisions = scoredDecs.slice(0, 2).map(s => s.dec);
  const finalPrinciples = principles.slice(0, 2);

  const connectedEntities = [
    ...finalPrinciples.map(p => `Principle: ${p.title}`),
    ...finalMemories.map(m => `Memory: ${m.title}`),
    ...finalDecisions.map(d => `Decision: ${d.situation}`)
  ];

  return {
    intent,
    situationType,
    profile: { id: profileId, scores, combinedProfile },
    memories: finalMemories,
    decisions: finalDecisions,
    principles: finalPrinciples,
    connectedEntities,
    graphTraversalPath
  };
};

export const generateSimulatorResponse = async (
  profileName: string,
  userQuery: string,
  evidence: EvidencePackage,
  pastQA: { question: string; answer: string }[] = [],
  groqApiKey?: string
): Promise<SimulatorResponseData> => {
  // If no evidence exists, return a clear "insufficient data" response with a follow up question
  if (evidence.memories.length === 0 && evidence.decisions.length === 0 && evidence.principles.length === 0) {
    return {
      recommendation: "Insufficient Data: I don't have enough recorded memories, decisions, or principles to generate a meaningful simulation.",
      confidence: 0,
      potentialConfidence: 30,
      primaryReason: "The Digital Twin requires foundational data to emulate reasoning.",
      conflictAnalysis: {
        conflictDetected: false,
        supportingEvidence: [],
        opposingEvidence: [],
        resolution: ""
      },
      twinUncertainty: "I need to know your core values.",
      nextQuestion: {
        variableId: "core_values",
        question: "What drives your biggest life decisions?",
        options: ["Financial Security", "Family Legacy", "Personal Growth", "Stability"],
        importanceScore: 10
      },
      reasoning: "Missing historical data.",
      memories: [],
      decisions: [],
      principles: [],
      potentialCounterarguments: []
    };
  }

  const primaryPrinciple = evidence.principles[0];
  const primaryMemory = evidence.memories[0];
  const primaryDecision = evidence.decisions[0];
  
  // Calculate confidence score based on actual data depth
  let confidenceScore = 0;
  const evidenceCount = evidence.memories.length + evidence.decisions.length + evidence.principles.length;
  
  // Stepwise confidence cap based on evidence count
  if (evidenceCount >= 10) confidenceScore = 0.80;
  else if (evidenceCount >= 7) confidenceScore = 0.65;
  else if (evidenceCount >= 4) confidenceScore = 0.50;
  else if (evidenceCount >= 2) confidenceScore = 0.35;
  else confidenceScore = 0.20;

  const scores = evidence.profile.scores || {};
  const risk = scores.risk ?? 3;
  const cide = evidence.profile.combinedProfile || {};

  const recommendedDecision = (cide.risk_tolerance !== undefined ? cide.risk_tolerance : (risk / 5)) <= 0.4 
    ? `Defer action, reject high-leverage terms, or choose the option that preserves maximum equity/stability.` 
    : `Accept the challenge, adapt quickly, and mitigate the downside through a clear safety buffer.`;

  const reasoningDescription = primaryPrinciple 
    ? `Based on a risk tolerance of ${Math.round((cide.risk_tolerance ?? 0.5) * 5)}/5 and a legacy focus weight of ${Math.round((cide.legacy_orientation ?? 0.5) * 100)}%, ${profileName} consistently prioritizes structural resilience over short-term returns. Their identity scorecard anchors around: ${primaryPrinciple.title}.`
    : `Based on the limited evidence available, ${profileName} appears to favor measured, deliberate decision-making.`;

  console.log("----- GRAPH RAG TRACE -----");
  console.log("Raw Query:", userQuery);
  console.log("Extracted Intent:", evidence.intent);
  console.log("Detected Domain:", evidence.situationType);
  console.log("Retrieved Memories:", evidence.memories.map(m => m.title));
  console.log("Retrieved Principles:", evidence.principles.map(p => p.title));
  console.log("---------------------------");

  console.log("LLM_REASONING_STARTED");
  if (groqApiKey) {
    try {
      const prompt = `
You are the Digital Twin of ${profileName}. 

CRITICAL SYSTEM CONSTRAINTS:
1. ONLY answer using the provided retrieved context. Do NOT use generic or external knowledge.
2. Cite your reasoning sources internally.
3. If the retrieved context is insufficient to answer the question, state that clearly and decline.
4. Respond EXACTLY with the requested JSON schema. Do not include markdown code blocks like \`\`\`json, just pure valid JSON.

USER QUERY TO RESOLVE:
"${userQuery}"

EVIDENCE CONTEXT:Question/Scenario:
"${evidence.intent}"

Active User Value Profile (Dynamic CIDE weights):
- Family Priority: ${cide.family_vs_work !== undefined ? (cide.family_vs_work < 0.4 ? "HIGH" : "LOW") : "UNKNOWN"}
- Risk Tolerance: ${cide.risk_tolerance !== undefined ? (cide.risk_tolerance < 0.4 ? "LOW" : "HIGH") : "UNKNOWN"}
- Stability Preference: ${cide.stability_vs_growth !== undefined ? (cide.stability_vs_growth < 0.4 ? "HIGH" : "LOW") : "UNKNOWN"}

Evidence Package Context:
- Intent: ${evidence.intent}
- Situation Type: ${evidence.situationType}
- Values & Horizon: Risk=${risk}/5
- Core Principle: ${primaryPrinciple ? `${primaryPrinciple.title} (${primaryPrinciple.description})` : "None"}
- Supporting Memory: ${primaryMemory ? `"${primaryMemory.title}" - "${primaryMemory.content}"` : "None"}
- Similar Decision: ${primaryDecision ? `"${primaryDecision.situation}" -> Selected: "${primaryDecision.selected_option}". Reasoning: "${primaryDecision.reasoning}"` : "None"}
- ${profileName} Profile Scores: Risk Tolerance: ${Math.round((cide.risk_tolerance ?? 0.5) * 100)}%, Family vs Work: ${Math.round((cide.family_vs_work ?? 0.5) * 100)}%, Stability vs Growth: ${Math.round((cide.stability_vs_growth ?? 0.5) * 100)}%

RECENT CLARIFICATIONS (CRITICAL CONTEXT):
The user has provided the following answers to clarifying questions. You MUST incorporate these answers directly into your recommendation and confidence calculation.
${pastQA.length > 0 ? pastQA.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n") : "No clarifying questions asked yet."}

Based on the user's explicit query above, identify the missing variables that are preventing a 100% confident recommendation. 
Calculate their Priority Score based on Expected Information Gain (Importance * Recommendation Impact * (1 - Confidence)).
Select the SINGLE highest priority unknown.
Generate a targeted question for this unknown, providing 3-4 structured options.

CRITICAL MAPPING RULES:
- If uncertainty = failure_consequence, ask about the specific consequences of failure.
- If uncertainty = financial_runway, ask about financial runway.
- If uncertainty = family_dependency, ask about family dependency.
- DO NOT fall back to generic behavioral-history questions (like "have you taken risks before?") unless the highest EIG variable is literally historical behavior.
- The question must directly gather the data for the target variableId.

DO NOT ask about generic conflicting priorities or generic traits. Ask a hyper-specific scenario-based question.
DO NOT ask any question from this list of previously asked questions: [${pastQA.map(qa => qa.question).join(", ")}].
If the user's recent answers provide enough clarity, you MUST increase your confidence score accordingly and you may choose to set nextQuestion to null.

CONTRADICTION DETECTION:
If the user's recent answers in RECENT CLARIFICATIONS contradict their Core Principles or Active User Value Profile, you MUST set conflictDetected to true, and formulate the nextQuestion to ask: "Has your perspective changed recently regarding [Topic]?"

If confidence < 0.70, you MUST NOT generate a final recommendation. Instead, the recommendation MUST state: "Recommendation withheld. I need more information before I can confidently simulate your decision-making." and \`nextQuestion\` must be asked.
Your calculated current confidence score is ${confidenceScore}. Assume potentialConfidence will be ~20% higher if they answer the question.

Output a raw JSON object with exactly this structure:
{
  "recommendation": "State the recommended option clearly in 1-2 sentences. If low confidence, defer recommendation.",
  "confidence": ${confidenceScore},
  "potentialConfidence": ${confidenceScore + 0.20 > 1 ? 1 : confidenceScore + 0.20},
  "primaryReason": "A human-friendly explanation of why you lean this way (e.g., 'Historical evidence shows willingness to take risk for long-term family benefit.').",
  "conflictAnalysis": {
     "conflictDetected": false,
     "supportingEvidence": ["Evidence supporting risk/action"],
     "opposingEvidence": ["Evidence supporting safety/inaction"],
     "resolution": "Rule resolving the conflict"
  },
  "twinUncertainty": "A human-friendly explanation of exactly what specific context is missing. Start with 'I understand X, but I do not yet understand Y in this situation.'",
  "nextQuestion": {
     "variableId": "e.g. failure_consequence, financial_runway, etc.",
     "question": "Targeted clarifying question for the highest EIG unknown.",
     "options": ["Highly specific scenario option 1", "Specific option 2", "Specific option 3"],
     "importanceScore": 85
  },
  "learningSummary": ["Summary of what was learned from recent answers (e.g. 'Risk tolerance evaluated', 'Career ambition increased')"],
  "reasoning": "Detailed graph trace and evidence mapping. Include citations.",
  "memories": ["Title (Year): Summary of memory"],
  "decisions": ["Situation: Selected option because reasoning"],
  "principles": ["Title: Description"],
  "potentialCounterarguments": ["Point of contradicting evidence 1", "Point 2"]
}
`;

      console.log("FINAL_PROMPT", prompt);
      console.log("PROMPT_SENT", prompt);

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.15,
          max_tokens: 1000
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          try {
             // Parse JSON, handle markdown wrappers if any
             const jsonMatch = text.match(/\{[\s\S]*\}/);
             const rawJson = jsonMatch ? jsonMatch[0] : text;
             const parsed = JSON.parse(rawJson);

             if (parsed.nextQuestion) {
                 console.log("Detected Uncertainty:\n" + parsed.nextQuestion.variableId);
                 console.log("Generated Question:\n" + parsed.nextQuestion.question);

                 // Validation Phase
                 const qText = parsed.nextQuestion.question.toLowerCase();
                 const optsText = Array.isArray(parsed.nextQuestion.options) ? parsed.nextQuestion.options.join(" ").toLowerCase() : "";
                 
                 // If the target is NOT historical context, but the question asks about the past, reject it.
                 if (parsed.nextQuestion.variableId !== "historical_context" && 
                     (qText.includes("in the past") || qText.includes("have you taken risks") || optsText.includes("took a big risk"))) {
                     console.error("Validation Failed: Generated question asks for history instead of target variable:", parsed.nextQuestion.variableId);
                     parsed.nextQuestion = {
                         variableId: parsed.nextQuestion.variableId,
                         question: `What is the specific impact regarding ${parsed.nextQuestion.variableId.replace("_", " ")}?`,
                         options: ["Significant impact", "Moderate impact", "Minimal impact", "Unknown"],
                         importanceScore: parsed.nextQuestion.importanceScore
                     };
                 }
                 
                 // LOOP DETECTION
                 if (pastQA.some(qa => qa.question === parsed.nextQuestion.question)) {
                     console.error("DISCOVERY_LOOP_DETECTED");
                     parsed.nextQuestion = {
                         variableId: "discovery_loop_fallback",
                         question: "I need to approach this differently. Can you elaborate on your priorities here?",
                         options: ["Focusing on long-term stability", "Seeking short-term growth", "Prioritizing family needs", "Minimizing financial risk"],
                         importanceScore: 100
                     };
                 }
             }

             console.log("LLM_RESPONSE_RECEIVED", parsed);
             console.log("RECOMMENDATION_PATH_1_LLM_SUCCESS");
             return {
                recommendation: parsed.recommendation || recommendedDecision,
                confidence: parsed.confidence || confidenceScore,
                potentialConfidence: parsed.potentialConfidence || confidenceScore + 0.2,
                primaryReason: parsed.primaryReason || "Based on historical precedents and core values.",
                conflictAnalysis: parsed.conflictAnalysis || { conflictDetected: false, supportingEvidence: [], opposingEvidence: [], resolution: "" },
                twinUncertainty: parsed.twinUncertainty || "Unknown missing context.",
                nextQuestion: parsed.nextQuestion || null,
                learningSummary: parsed.learningSummary || [],
                reasoning: parsed.reasoning || reasoningDescription,
                memories: parsed.memories || [`${primaryMemory?.title || "Unknown"} (${primaryMemory?.year || "N/A"}): ${primaryMemory?.content || "N/A"}`],
                decisions: parsed.decisions || [`${primaryDecision?.situation || "Unknown"}: Selected "${primaryDecision?.selected_option || "N/A"}" because: "${primaryDecision?.reasoning || "N/A"}"`],
                principles: parsed.principles || [`${primaryPrinciple?.title || "Unknown"}: ${primaryPrinciple?.description || "N/A"}`],
                potentialCounterarguments: parsed.potentialCounterarguments || []
             };
          } catch (e) {
             console.error("Failed to parse LLM JSON", e);
          }
        }
      }
    } catch (err) {
      console.error("GraphRAG LLM synthesis failed, fallback to local pipeline", err);
      console.warn("FALLBACK_ENGINE_TRIGGERED");
    }
  }

  console.warn("FALLBACK_ENGINE_TRIGGERED_DUE_TO_NO_KEY_OR_ERROR");
  // Pure Local Simulation generator — uses only real evidence
  let nextQuestion: GeneratedQuestion | null = null;
  
  if (confidenceScore < 0.7) {
      // Phase 20: Map generic local uncertainties directly to the correct variable
      // Since we don't have LLM inference here, we generate a hardcoded matching pair
      nextQuestion = {
         variableId: "failure_consequence",
         question: "What would happen if this opportunity failed?",
         options: ["Loss of savings", "Family financial stress", "Career setback", "Emotional disappointment"],
         importanceScore: 100
      };
  }

  console.log("RECOMMENDATION_PATH_2_LOCAL_FALLBACK");
  return {
    recommendation: confidenceScore < 0.4 ? "Insufficient historical data to make a definitive recommendation." : recommendedDecision,
    confidence: confidenceScore,
    potentialConfidence: confidenceScore + 0.2,
    primaryReason: "Historical data suggests a lean towards measured decisions, but specific scenario impacts are unknown.",
    conflictAnalysis: { conflictDetected: false, supportingEvidence: [], opposingEvidence: [], resolution: "" },
    twinUncertainty: "I understand your general risk profile, but I do not yet understand the specific consequences of failure in this situation.",
    nextQuestion,
    learningSummary: [],
    reasoning: reasoningDescription,
    memories: primaryMemory ? [`${primaryMemory.title} (${primaryMemory.year || "N/A"}): ${primaryMemory.content}`] : [],
    decisions: primaryDecision ? [`${primaryDecision.situation}: Selected "${primaryDecision.selected_option}" because: "${primaryDecision.reasoning}"`] : [],
    principles: primaryPrinciple ? [`${primaryPrinciple.title}: ${primaryPrinciple.description}`] : [],
    potentialCounterarguments: [
      "A faster, higher-leverage strategy might yield quicker rewards if market timing is perfect.",
      "Delaying action could miss a short-lived growth window."
    ]
  };
};
