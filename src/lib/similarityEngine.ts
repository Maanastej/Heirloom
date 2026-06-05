import { DecisionJournalObject, PrincipleObject, GraphEdge } from "./graphrag";

export interface SimilarDecisionMatch {
  decision: DecisionJournalObject;
  similarity_score: number;
  vector_score: number;
  graph_score: number;
  principle_score: number;
  outcome_score: number;
  relevant_principles: string[];
}

// Helper to compute keyword matching score (Vector similarity approximation)
export const computeKeywordSimilarity = (q: string, text: string): number => {
  const queryWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (queryWords.length === 0) return 0.5;
  
  const targetText = text.toLowerCase();
  let matches = 0;
  queryWords.forEach(w => {
    if (targetText.includes(w)) matches++;
  });
  return matches / queryWords.length;
};

// Main Hybrid Ranking Engine
export const getSimilarDecisions = (
  query: string,
  decisions: DecisionJournalObject[],
  principles: PrincipleObject[],
  graphEdges: GraphEdge[]
): SimilarDecisionMatch[] => {
  return decisions.map(dec => {
    // 1. Vector similarity (keyword overlap approximation for client, scale 0-1)
    const vectorScore = computeKeywordSimilarity(query, dec.situation + " " + dec.reasoning);

    // 2. Principle overlap (20%)
    // Check if decision is linked to any of the same principles
    const decisionLinkedPrinciples = principles.filter(p => p.supporting_evidence?.includes(dec.id));
    const matchedPrinciplesNames = decisionLinkedPrinciples.map(p => p.title);
    const principleScore = decisionLinkedPrinciples.length > 0 ? 0.9 : 0.2;

    // 3. Graph proximity (30%)
    // Count connected edge links (traversing Decision -> Asset/Principle)
    const connectedEdges = graphEdges.filter(e => e.source === `node-${dec.id}` || e.target === `node-${dec.id}`);
    const graphScore = Math.min(1.0, 0.2 + (connectedEdges.length * 0.25));

    // 4. Outcome relevance (10%)
    // High outcome quality decisions score higher for simulation guidance
    const outcomeScore = dec.outcome_quality ? (dec.outcome_quality / 10) : 0.5;

    // Hybrid combined rank score
    // vector similarity (40%) + graph proximity (30%) + principle overlap (20%) + outcome relevance (10%)
    const finalScore = (vectorScore * 0.4) + (graphScore * 0.3) + (principleScore * 0.2) + (outcomeScore * 0.1);

    return {
      decision: dec,
      similarity_score: Number(finalScore.toFixed(2)),
      vector_score: Number(vectorScore.toFixed(2)),
      graph_score: Number(graphScore.toFixed(2)),
      principle_score: Number(principleScore.toFixed(2)),
      outcome_score: Number(outcomeScore.toFixed(2)),
      relevant_principles: matchedPrinciplesNames
    };
  })
  .sort((a, b) => b.similarity_score - a.similarity_score)
  .slice(0, 10);
};
