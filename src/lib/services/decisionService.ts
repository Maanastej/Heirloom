import { supabase } from "@/integrations/supabase/client";
import type { DecisionJournalObject } from "@/lib/graphrag";
import { generateDecisionEmbedding } from "@/lib/behavioralEmbeddings";

/**
 * Fetch all decisions for a profile from the database.
 * Returns an empty array when no data exists — never fabricates.
 */
export const getDecisions = async (profileId: string): Promise<DecisionJournalObject[]> => {
  try {
    const { data, error } = await supabase
      .from("decision_journal")
      .select("*")
      .eq("profile_id", profileId)
      .order("decision_date", { ascending: false });

    if (error) {
      console.error("decisionService.getDecisions error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      profile_id: row.profile_id,
      situation: row.situation || "",
      options: row.options || [],
      selected_option: row.selected_option || "",
      reasoning: row.reasoning || "",
      emotional_state: row.emotional_state || "calm",
      outcome: row.outcome || "",
      outcome_quality: row.outcome_quality ?? 5,
      decision_date: row.decision_date || new Date().toISOString(),
    }));
  } catch (err) {
    console.error("decisionService.getDecisions unexpected error:", err);
    return [];
  }
};

/**
 * Insert a new decision into the database.
 */
export const addDecision = async (decision: Omit<DecisionJournalObject, "id">): Promise<DecisionJournalObject | null> => {
  try {
    const contentToEmbed = (decision.situation || "") + " " + (decision.reasoning || "");
    const embedding = await generateDecisionEmbedding({ input: contentToEmbed });

    const { data, error } = await supabase
      .from("decision_journal")
      .insert([{
        profile_id: decision.profile_id,
        situation: decision.situation,
        options: decision.options,
        selected_option: decision.selected_option,
        reasoning: decision.reasoning,
        emotional_state: decision.emotional_state,
        outcome: decision.outcome,
        outcome_quality: decision.outcome_quality,
        decision_date: decision.decision_date,
        decision_embedding: embedding,
      }])
      .select()
      .single();

    if (error) {
      console.error("decisionService.addDecision error:", error);
      return null;
    }

    return {
      id: data.id,
      profile_id: data.profile_id,
      situation: data.situation || "",
      options: data.options || [],
      selected_option: data.selected_option || "",
      reasoning: data.reasoning || "",
      emotional_state: data.emotional_state || "calm",
      outcome: data.outcome || "",
      outcome_quality: data.outcome_quality ?? 5,
      decision_date: data.decision_date || new Date().toISOString(),
    };
  } catch (err) {
    console.error("decisionService.addDecision unexpected error:", err);
    return null;
  }
};
