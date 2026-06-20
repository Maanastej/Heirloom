import { supabase } from "@/integrations/supabase/client";
import type { MemoryObject } from "@/lib/graphrag";
import { generateDecisionEmbedding } from "@/lib/behavioralEmbeddings";

/**
 * Fetch all memories for a profile from the database.
 * Returns an empty array when no data exists — never fabricates.
 */
export const getMemories = async (profileId: string): Promise<MemoryObject[]> => {
  try {
    const { data, error } = await supabase
      .from("dna_memories")
      .select("*")
      .eq("profile_id", profileId)
      .order("year", { ascending: false });

    if (error) {
      console.error("memoryService.getMemories error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      profile_id: row.profile_id,
      title: row.title || "",
      description: row.description || "",
      content: row.content || "",
      year: row.year ?? new Date().getFullYear(),
      event_type: row.event_type || "family",
      emotion: row.emotion || "neutral",
      people_involved: row.people_involved || [],
      importance_score: row.importance_score ?? 5,
    }));
  } catch (err) {
    console.error("memoryService.getMemories unexpected error:", err);
    return [];
  }
};

/**
 * Insert a new memory into the database.
 */
export const addMemory = async (memory: Omit<MemoryObject, "id">): Promise<MemoryObject | null> => {
  try {
    const contentToEmbed = (memory.title || "") + " " + (memory.content || "");
    const embedding = await generateDecisionEmbedding({ input: contentToEmbed });

    const { data, error } = await supabase
      .from("dna_memories")
      .insert([{
        profile_id: memory.profile_id,
        title: memory.title,
        description: memory.description,
        content: memory.content,
        year: memory.year,
        event_type: memory.event_type,
        emotion: memory.emotion,
        people_involved: memory.people_involved,
        importance_score: memory.importance_score,
        memory_embedding: embedding,
      }])
      .select()
      .single();

    if (error) {
      console.error("memoryService.addMemory error:", error);
      return null;
    }

    return {
      id: data.id,
      profile_id: data.profile_id,
      title: data.title || "",
      description: data.description || "",
      content: data.content || "",
      year: data.year ?? new Date().getFullYear(),
      event_type: data.event_type || "family",
      emotion: data.emotion || "neutral",
      people_involved: data.people_involved || [],
      importance_score: data.importance_score ?? 5,
    };
  } catch (err) {
    console.error("memoryService.addMemory unexpected error:", err);
    return null;
  }
};
