import { MemoryObject, DecisionJournalObject, PrincipleObject } from "./graphrag";
import { getMemories } from "./services/memoryService";
import { getDecisions } from "./services/decisionService";
import { getPrinciples } from "./services/principleService";

export interface PrincipleEvolutionSnapshot {
  id: string;
  principle_id: string;
  title: string;
  confidence_score: number;
  timestamp: string;
}

// Memory & Decision similarity grouping — dynamic theme detection from actual content
export const groupEvidenceByTheme = (
  memories: MemoryObject[],
  decisions: DecisionJournalObject[]
): Record<string, { memories: MemoryObject[]; decisions: DecisionJournalObject[] }> => {
  const groups: Record<string, { memories: MemoryObject[]; decisions: DecisionJournalObject[] }> = {};

  // Define theme detection keywords — themes are created dynamically from evidence
  const themePatterns: { name: string; keywords: string[] }[] = [
    { name: "Family & Relationships", keywords: ["family", "kin", "children", "relational", "wife", "husband", "parent", "sibling"] },
    { name: "Financial Stability", keywords: ["debt", "leverage", "stability", "cautious", "foreclose", "save", "budget", "conservative"] },
    { name: "Long-Term Planning", keywords: ["long-term", "legacy", "years", "future", "generation", "invest", "compound"] },
    { name: "Career & Growth", keywords: ["career", "work", "job", "promotion", "growth", "business", "company"] },
    { name: "Risk Management", keywords: ["risk", "gamble", "volatile", "loss", "protect", "insurance", "hedge"] },
    { name: "Ethics & Values", keywords: ["honest", "integrity", "moral", "faith", "trust", "principle", "right"] },
  ];

  // Only create theme groups that have actual evidence
  themePatterns.forEach(theme => {
    const matchedMemories = memories.filter(m => {
      const text = (m.title + " " + m.content).toLowerCase();
      return theme.keywords.some(k => text.includes(k));
    });

    const matchedDecisions = decisions.filter(d => {
      const text = (d.situation + " " + d.reasoning).toLowerCase();
      return theme.keywords.some(k => text.includes(k));
    });

    // Only add the group if there's at least one piece of evidence
    if (matchedMemories.length > 0 || matchedDecisions.length > 0) {
      groups[theme.name] = { memories: matchedMemories, decisions: matchedDecisions };
    }
  });

  return groups;
};

// Calculate dynamic confidence score (ratio of supporting evidence, outcome qualities)
export const calculateDynamicConfidence = (
  supportingMemories: MemoryObject[],
  supportingDecisions: DecisionJournalObject[],
  contradictingCount: number
): number => {
  const totalEvidence = supportingMemories.length + supportingDecisions.length;
  if (totalEvidence === 0) return 0;

  const memoryWeight = supportingMemories.reduce((sum, m) => sum + (m.importance_score / 10), 0);
  const decisionWeight = supportingDecisions.reduce((sum, d) => sum + (d.outcome_quality / 10), 0);

  const baseConfidence = (memoryWeight + decisionWeight) / totalEvidence;
  const penalty = contradictingCount * 0.15;

  // Stepwise cap based on evidence count
  let cap = 0.80;
  if (totalEvidence < 3) cap = 0.40;
  else if (totalEvidence < 5) cap = 0.55;
  else if (totalEvidence < 8) cap = 0.70;

  return Math.min(cap, Math.max(0, baseConfidence - penalty));
};

// Pipeline for Principle Extraction — DATABASE ONLY
export const runPrincipleExtractionPipeline = async (
  profileId: string
): Promise<{ principles: PrincipleObject[]; evolution: PrincipleEvolutionSnapshot[] }> => {
  // 1. Fetch source memories & decisions FROM DATABASE
  const memories = await getMemories(profileId);
  const decisions = await getDecisions(profileId);

  // If no data exists, return empty — never fabricate
  if (memories.length === 0 && decisions.length === 0) {
    return { principles: [], evolution: [] };
  }

  // 2. Perform thematic clustering on real data
  const clusters = groupEvidenceByTheme(memories, decisions);

  // 3. Extract principles from clusters
  const existingPrinciples = await getPrinciples(profileId);
  const extracted: PrincipleObject[] = [];

  Object.entries(clusters).forEach(([theme, items]) => {
    const contradictingCount = decisions.filter(d => 
      d.selected_option.toLowerCase().includes("leverage") && theme.includes("Stability")
    ).length;

    const confidence = calculateDynamicConfidence(items.memories, items.decisions, contradictingCount);

    // Check if principle already exists to merge/update
    const existing = existingPrinciples.find(p => p.title.toLowerCase() === theme.toLowerCase());
    
    const principle: PrincipleObject = {
      id: existing?.id || `prin-${theme.replace(/\s+/g, "-").toLowerCase()}-${profileId}`,
      profile_id: profileId,
      title: theme,
      description: existing?.description || `Behavioral pattern regarding ${theme.toLowerCase()} derived from ${items.memories.length} memories and ${items.decisions.length} decisions.`,
      category: theme.includes("Stability") || theme.includes("Risk") ? "risk" : theme.includes("Family") ? "family" : "ethics",
      confidence_score: Number(confidence.toFixed(2)),
      supporting_evidence: [...items.memories.map(m => m.id), ...items.decisions.map(d => d.id)],
      contradicting_evidence: contradictingCount > 0 ? ["contradiction-detected"] : []
    };

    extracted.push(principle);
  });

  // 4. Build evolution snapshots from existing principles only (no backfill)
  const evolution: PrincipleEvolutionSnapshot[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  extracted.forEach(p => {
    evolution.push({
      id: `ev-${p.id}-${Date.now()}`,
      principle_id: p.id,
      title: p.title,
      confidence_score: p.confidence_score,
      timestamp: todayStr
    });
  });

  return { principles: extracted, evolution };
};
