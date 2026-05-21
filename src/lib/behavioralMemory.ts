import { supabase } from "@/integrations/supabase/client";
import type { DecisionEvent } from "@/integrations/supabase/types";
import { cosineSimilarity, generateDecisionEmbedding } from "./behavioralEmbeddings";

export const getRelevantBehavioralContext = async (
  currentEvent: DecisionEvent,
  topK = 3
) => {
  // Generate embedding if not provided
  let emb = currentEvent.decision_embedding as number[] | null | undefined;
  if (!emb) {
    emb = await generateDecisionEmbedding({
      situation: currentEvent.situation_type,
      stress_level: currentEvent.inferred_stress_level,
      decision_style: currentEvent.inferred_decision_style,
      biases: currentEvent.inferred_biases,
      predicted_failure_modes: currentEvent.predicted_failure_modes,
    });
  }

  // Try Supabase nearest neighbor search first
  try {
    const { data, error } = await (supabase as any)
      .from("decision_events")
      .select("id, profile_id, timestamp, situation_type, user_input, inferred_stress_level, inferred_decision_style, outcome_status, decision_embedding")
      .neq("id", currentEvent.id || "")
      .limit(200);

    if (!error && data) {
      const withSim = (data as any[])
        .map((d) => ({
          ...d,
          similarity: d.decision_embedding && emb ? cosineSimilarity(emb, d.decision_embedding) : 0,
          recencyScore: d.timestamp ? (Date.now() - new Date(d.timestamp).getTime()) : Number.MAX_SAFE_INTEGER,
        }))
        .map((d) => ({ ...d, rankScore: (d.similarity ?? 0) * 0.7 + (1 / (1 + d.recencyScore)) * 0.2 + (1 - Math.abs((d.inferred_stress_level ?? 0) - (currentEvent.inferred_stress_level ?? 0))) * 0.1 }));

      const sorted = withSim.sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0)).slice(0, topK);
      return { context: sorted, embedding: emb };
    }
  } catch (err) {
    console.error("getRelevantBehavioralContext supabase failed", err);
  }

  // Local fallback: search localStorage events
  try {
    const cached = localStorage.getItem("heirloom_decision_events");
    if (!cached) return { context: [], embedding: emb };
    const parsed: DecisionEvent[] = JSON.parse(cached);
    const scored = parsed
      .filter((d) => d.id !== currentEvent.id)
      .map((d) => ({
        ...d,
        similarity: d.decision_embedding && emb ? cosineSimilarity(emb as number[], d.decision_embedding as number[]) : 0,
        recencyScore: d.timestamp ? (Date.now() - new Date(d.timestamp).getTime()) : Number.MAX_SAFE_INTEGER,
      }))
      .map((d) => ({ ...d, rankScore: (d.similarity ?? 0) * 0.7 + (1 / (1 + d.recencyScore)) * 0.2 + (1 - Math.abs((d.inferred_stress_level ?? 0) - (currentEvent.inferred_stress_level ?? 0))) * 0.1 }))
      .sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0))
      .slice(0, topK);

    return { context: scored, embedding: emb };
  } catch (err) {
    console.error("getRelevantBehavioralContext fallback failed", err);
    return { context: [], embedding: emb };
  }
};
