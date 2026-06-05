import { supabase } from "@/integrations/supabase/client";

export interface EvaluationRecord {
  id: string;
  profile_id: string;
  question: string;
  predicted_decision: string;
  real_user_decision: string;
  confidence_score: number;
  is_correct: boolean;
  created_at: string;
}

/**
 * Fetch all accuracy evaluations for a profile from the database.
 * Returns an empty array when no data exists — never fabricates.
 */
export const getEvaluations = async (profileId: string): Promise<EvaluationRecord[]> => {
  try {
    const { data, error } = await supabase
      .from("accuracy_evaluations")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("evaluationService.getEvaluations error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      profile_id: row.profile_id,
      question: row.question || "",
      predicted_decision: row.predicted_answer || "",
      real_user_decision: row.actual_answer || "",
      confidence_score: row.confidence_score ?? 0,
      is_correct: row.is_correct ?? false,
      created_at: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error("evaluationService.getEvaluations unexpected error:", err);
    return [];
  }
};

/**
 * Insert a new evaluation into the database.
 */
export const addEvaluation = async (
  profileId: string,
  evaluation: Omit<EvaluationRecord, "id" | "profile_id" | "created_at">
): Promise<EvaluationRecord | null> => {
  try {
    const { data, error } = await supabase
      .from("accuracy_evaluations")
      .insert([{
        profile_id: profileId,
        question: evaluation.question,
        predicted_answer: evaluation.predicted_decision,
        actual_answer: evaluation.real_user_decision,
        confidence_score: evaluation.confidence_score,
        is_correct: evaluation.is_correct,
      }])
      .select()
      .single();

    if (error) {
      console.error("evaluationService.addEvaluation error:", error);
      return null;
    }

    return {
      id: data.id,
      profile_id: data.profile_id,
      question: data.question || "",
      predicted_decision: data.predicted_answer || "",
      real_user_decision: data.actual_answer || "",
      confidence_score: data.confidence_score ?? 0,
      is_correct: data.is_correct ?? false,
      created_at: data.created_at || new Date().toISOString(),
    };
  } catch (err) {
    console.error("evaluationService.addEvaluation unexpected error:", err);
    return null;
  }
};
