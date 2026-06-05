import { supabase } from "@/integrations/supabase/client";
import type { PrincipleObject } from "@/lib/graphrag";

/**
 * Fetch all principles for a profile from the database.
 * Returns an empty array when no data exists — never fabricates.
 */
export const getPrinciples = async (profileId: string): Promise<PrincipleObject[]> => {
  try {
    const { data, error } = await supabase
      .from("extracted_principles")
      .select("*")
      .eq("profile_id", profileId)
      .order("confidence_score", { ascending: false });

    if (error) {
      console.error("principleService.getPrinciples error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      profile_id: row.profile_id,
      title: row.title || "",
      description: row.description || "",
      category: row.category || "ethics",
      confidence_score: row.confidence_score ?? 0,
      supporting_evidence: row.supporting_evidence || [],
      contradicting_evidence: row.contradicting_evidence || [],
    }));
  } catch (err) {
    console.error("principleService.getPrinciples unexpected error:", err);
    return [];
  }
};

/**
 * Insert a new principle into the database.
 */
export const addPrinciple = async (principle: Omit<PrincipleObject, "id">): Promise<PrincipleObject | null> => {
  try {
    const { data, error } = await supabase
      .from("extracted_principles")
      .insert([{
        profile_id: principle.profile_id,
        title: principle.title,
        description: principle.description,
        category: principle.category,
        confidence_score: principle.confidence_score,
        supporting_evidence: principle.supporting_evidence,
        contradicting_evidence: principle.contradicting_evidence,
      }])
      .select()
      .single();

    if (error) {
      console.error("principleService.addPrinciple error:", error);
      return null;
    }

    return {
      id: data.id,
      profile_id: data.profile_id,
      title: data.title || "",
      description: data.description || "",
      category: data.category || "ethics",
      confidence_score: data.confidence_score ?? 0,
      supporting_evidence: data.supporting_evidence || [],
      contradicting_evidence: data.contradicting_evidence || [],
    };
  } catch (err) {
    console.error("principleService.addPrinciple unexpected error:", err);
    return null;
  }
};
