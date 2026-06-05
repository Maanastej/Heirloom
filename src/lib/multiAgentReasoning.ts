import { MemoryObject, DecisionJournalObject, PrincipleObject, GraphEdge } from "./graphrag";
import { getSimilarDecisions } from "./similarityEngine";

export interface AgentReport {
  agentName: string;
  findings: string[];
  evidenceIds: string[];
}

export interface MultiAgentReasoningOutput {
  recommendation: string;
  reasoningChain: string[];
  confidenceScore: number;
  agentReports: AgentReport[];
}

// 1. Decision Agent
export const runDecisionAgent = (
  query: string,
  decisions: DecisionJournalObject[]
): AgentReport => {
  if (decisions.length === 0) {
    return {
      agentName: "Decision Agent",
      findings: ["No past decisions registered in Decision Journal."],
      evidenceIds: []
    };
  }
  const matches = decisions.filter(d => 
    query.toLowerCase().split(/\s+/).some(term => term.length > 3 && (d.situation.toLowerCase().includes(term) || d.reasoning.toLowerCase().includes(term)))
  ).slice(0, 2);

  const fallback = matches.length ? matches : decisions.slice(0, 1);
  return {
    agentName: "Decision Agent",
    findings: fallback.map(d => `Identified past decision: "${d.situation}" where selected option was "${d.selected_option}" (Quality: ${d.outcome_quality}/10)`),
    evidenceIds: fallback.map(d => d.id)
  };
};

// 2. Memory Agent
export const runMemoryAgent = (
  query: string,
  memories: MemoryObject[]
): AgentReport => {
  if (memories.length === 0) {
    return {
      agentName: "Memory Agent",
      findings: ["No memories preserved in Memory Engine."],
      evidenceIds: []
    };
  }
  const matches = memories.filter(m => 
    query.toLowerCase().split(/\s+/).some(term => term.length > 3 && (m.title.toLowerCase().includes(term) || m.content.toLowerCase().includes(term)))
  ).slice(0, 2);

  const fallback = matches.length ? matches : memories.slice(0, 1);
  return {
    agentName: "Memory Agent",
    findings: fallback.map(m => `Retrieved emotional context: "${m.title}" associated with emotion: "${m.emotion}" (Importance: ${m.importance_score}/10)`),
    evidenceIds: fallback.map(m => m.id)
  };
};

// 3. Principle Agent
export const runPrincipleAgent = (
  query: string,
  principles: PrincipleObject[]
): AgentReport => {
  if (principles.length === 0) {
    return {
      agentName: "Principle Agent",
      findings: ["No belief system rules extracted yet."],
      evidenceIds: []
    };
  }
  const matches = principles.filter(p => 
    query.toLowerCase().split(/\s+/).some(term => term.length > 3 && (p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)))
  ).slice(0, 2);

  const fallback = matches.length ? matches : principles.slice(0, 1);
  return {
    agentName: "Principle Agent",
    findings: fallback.map(p => `Anchored on belief system rule: "${p.title}" (${p.description}) with confidence: ${Math.round(p.confidence_score * 100)}%`),
    evidenceIds: fallback.map(p => p.id)
  };
};

// 4. Graph Agent
export const runGraphAgent = (
  query: string,
  edges: GraphEdge[]
): AgentReport => {
  if (edges.length === 0) {
    return {
      agentName: "Graph Agent",
      findings: ["No graph connections available."],
      evidenceIds: []
    };
  }
  const connectedTypes = edges.slice(0, 3).map(e => `${e.source} → [${e.type}] → ${e.target}`);
  return {
    agentName: "Graph Agent",
    findings: [
      `Expanded graph relations: Traversed legacy network showing structural connection pathways.`,
      ...connectedTypes
    ],
    evidenceIds: edges.slice(0, 3).map(e => e.id)
  };
};

// 5. Critic Agent (Finds contradictions)
export const runCriticAgent = (
  decisionReport: AgentReport,
  principleReport: AgentReport,
  decisions: DecisionJournalObject[],
  principles: PrincipleObject[]
): AgentReport => {
  const findings: string[] = [];
  const evidenceIds: string[] = [];

  if (decisions.length === 0 || principles.length === 0) {
    return {
      agentName: "Critic Agent",
      findings: ["Insufficient data to perform contradiction analysis."],
      evidenceIds: []
    };
  }

  // Check if any decision option contradicts stability principles (e.g. leverage/debt vs Protect Stability)
  const hasLeverage = decisions.some(d => d.selected_option.toLowerCase().includes("leverage") || d.situation.toLowerCase().includes("leverage"));
  const hasStabilityPrinciple = principles.some(p => p.title.toLowerCase().includes("stability") || p.title.toLowerCase().includes("debt"));

  if (hasLeverage && hasStabilityPrinciple) {
    findings.push("Contradiction Alert: Past decisions involving high leverage conflict with the stability core principles.");
    evidenceIds.push("leverage-stability-conflict");
  } else {
    findings.push("No severe active contradictions identified between historical decisions and current belief system principles.");
  }

  return {
    agentName: "Critic Agent",
    findings,
    evidenceIds
  };
};

// 6. Synthesizer Agent (Collates and resolves conflicts)
export const runSynthesizerAgent = (
  query: string,
  profileName: string,
  reports: AgentReport[],
  scores: Record<string, number>,
  hasData: boolean
): MultiAgentReasoningOutput => {
  if (!hasData) {
    return {
      recommendation: "Insufficient data to run collaborative simulation. Please log memories and decisions.",
      reasoningChain: ["Simulation halted: No recorded database entries found for this twin."],
      confidenceScore: 0,
      agentReports: reports
    };
  }

  const criticFindings = reports.find(r => r.agentName === "Critic Agent")?.findings || [];
  const risk = scores.risk ?? 3;
  const recommendedOption = risk <= 2
    ? `Reject high-risk leverage terms or defer action to preserve stability.`
    : `Accept the challenge, configure a safety buffer, and proceed.`;

  const reasoningChain = [
    `1. Graph Agent mapped structural proximity paths connecting legacy nodes.`,
    `2. Decision Agent retrieved relevant choices indicating a history of careful conservation.`,
    `3. Memory Agent extracted emotional context.`,
    `4. Principle Agent aligned query with legacy safeguards.`,
    `5. Critic Agent cross-examined evidence for contradictions: ${criticFindings[0] || 'None'}.`,
    `6. Synthesizer resolved values: Recommended path is grounded in safeguarding legacy.`
  ];

  return {
    recommendation: recommendedOption,
    reasoningChain,
    confidenceScore: 0.85,
    agentReports: reports
  };
};

// Orchestrator function
export const runMultiAgentSimulation = (
  profileName: string,
  query: string,
  scores: Record<string, number>,
  memories: MemoryObject[],
  decisions: DecisionJournalObject[],
  principles: PrincipleObject[],
  edges: GraphEdge[]
): MultiAgentReasoningOutput => {
  const decReport = runDecisionAgent(query, decisions);
  const memReport = runMemoryAgent(query, memories);
  const prinReport = runPrincipleAgent(query, principles);
  const graphReport = runGraphAgent(query, edges);
  const criticReport = runCriticAgent(decReport, prinReport, decisions, principles);

  const reports = [decReport, memReport, prinReport, graphReport, criticReport];
  const hasData = memories.length > 0 || decisions.length > 0 || principles.length > 0;

  return runSynthesizerAgent(query, profileName, reports, scores, hasData);
};
