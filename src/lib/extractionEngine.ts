import { supabase } from "@/integrations/supabase/client";
import { addMemory } from "./services/memoryService";
import { addDecision } from "./services/decisionService";
import { runPrincipleExtractionPipeline } from "./principleEngine";
import { addGraphNode, addGraphEdge } from "./services/graphService";

/**
 * analyzes a user's answer to a follow-up question,
 * extracts implicit memories, decisions, and principles,
 * and saves them to the active twin's profile.
 */
export const analyzeUserResponse = async (
  profileId: string,
  question: string,
  response: string,
  groqApiKey?: string
): Promise<{ extractedItems: string[] }> => {
  if (!groqApiKey) {
    console.warn("No API key available for extraction engine.");
    return { extractedItems: [] };
  }

  const prompt = `
You are an active learning extraction engine for a Digital Twin.
The user was asked a follow-up question to clarify missing context, and the user provided a short answer (often a multiple choice option).
Your job is to immediately translate their answer into a structured Memory or Decision to update the twin's knowledge graph.

Question asked: "${question}"
User's Answer: "${response}"

CRITICAL: The user's answer may be extremely short (e.g., "Loss of savings"). You MUST extract this as a valid Memory or Decision anyway. Treat the question and answer pair as a definitive new piece of evidence about their life or values. DO NOT leave the arrays empty. Fabricate a reasonable "title" and "description" based on the context.

Output format exactly:
{
  "memories": [
    {
      "title": "Short title",
      "description": "Brief description",
      "content": "The full context of what they described",
      "year": 2024,
      "event_type": "family", // one of: career, financial, family, crisis
      "emotion": "hope", // one of: hope, anxiety, pride, regret, neutral
      "importance_score": 7 // 1 to 10
    }
  ],
  "decisions": [
    {
      "situation": "The choice they faced",
      "options": ["Option 1", "Option 2"],
      "selected_option": "What they chose",
      "reasoning": "Why they chose it",
      "outcome_quality": 8 // 1 to 10
    }
  ],
  "identity_updates": [
    {
      "trait": "risk_tolerance", // Must be one of: family_vs_work, risk_tolerance, financial_priority, legacy_orientation, stability_vs_growth
      "value": "higher" // "higher" or "lower"
    }
  ]
}
  `;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!res.ok) {
      console.error("Extraction engine LLM call failed");
      return { extractedItems: [] };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return { extractedItems: [] };

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { extractedItems: [] };
    
    const parsed = JSON.parse(jsonMatch[0]);
    const extractedTitles: string[] = [];

    // Save memories
    if (parsed.memories && Array.isArray(parsed.memories)) {
      for (const mem of parsed.memories) {
        const newMem = await addMemory({
          profile_id: profileId,
          title: mem.title,
          description: mem.description,
          content: mem.content,
          year: mem.year || new Date().getFullYear(),
          event_type: mem.event_type || "family",
          emotion: mem.emotion || "neutral",
          people_involved: [],
          importance_score: mem.importance_score || 5
        });

        if (newMem) {
          extractedTitles.push(`Memory: ${mem.title}`);
          const node = await addGraphNode(profileId, { id: "", entity_type: "Memory", label: newMem.title, properties: { year: newMem.year, score: newMem.importance_score } });
          if (node) {
             await addGraphEdge(profileId, { id: "", source: `node-person-${profileId}`, target: node.id, type: "MADE", properties: {} });
          }
        }
      }
    }

    // Save decisions
    if (parsed.decisions && Array.isArray(parsed.decisions)) {
      for (const dec of parsed.decisions) {
        const newDec = await addDecision({
          profile_id: profileId,
          situation: dec.situation,
          options: dec.options?.map((o: string, i: number) => ({ id: String(i), text: o })) || [],
          selected_option: dec.selected_option,
          reasoning: dec.reasoning,
          emotional_state: "neutral",
          outcome: "Unknown",
          outcome_quality: dec.outcome_quality || 5,
          decision_date: new Date().toISOString()
        });

        if (newDec) {
          extractedTitles.push(`Decision: ${dec.situation.substring(0, 30)}...`);
          const node = await addGraphNode(profileId, { id: "", entity_type: "Decision", label: dec.situation.substring(0, 30), properties: { selected: dec.selected_option } });
          if (node) {
             await addGraphEdge(profileId, { id: "", source: `node-person-${profileId}`, target: node.id, type: "MADE", properties: {} });
          }
        }
      }
    }

    // If anything was extracted, run the principle extraction pipeline to update principles
    if (extractedTitles.length > 0) {
      await runPrincipleExtractionPipeline(profileId);
    }

    // Process Identity Updates
    if (parsed.identity_updates && Array.isArray(parsed.identity_updates) && parsed.identity_updates.length > 0) {
       // BUG FIX: The foreign key is profile_id, not id
       const { data: profile } = await supabase.from('identity_profiles').select('*').eq('profile_id', profileId).single();
       if (profile) {
          const updates: Record<string, number> = {};
          for (const update of parsed.identity_updates) {
             // ensure it maps correctly to DB columns
             const trait = update.trait.replace("stable_", ""); 
             if (trait && profile.hasOwnProperty(trait)) {
                const currentVal = Number(profile[trait]) || 0.5;
                const shift = update.value === "higher" ? 0.1 : -0.1;
                updates[trait] = Math.max(0, Math.min(1.0, currentVal + shift));
                extractedTitles.push(`${trait} -> ${update.value}`);
             }
          }
          if (Object.keys(updates).length > 0) {
             // BUG FIX: The foreign key is profile_id, not id
             await supabase.from('identity_profiles').update(updates).eq('profile_id', profileId);
          }
       }
    }

    return { extractedItems: extractedTitles };

  } catch (err) {
    console.error("Extraction error", err);
    return { extractedItems: [] };
  }
};
