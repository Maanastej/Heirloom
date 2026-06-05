import { MemoryObject, GraphNode, GraphEdge } from "./graphrag";
import { supabase } from "@/integrations/supabase/client";

export interface EnrichedMemory extends MemoryObject {
  summary: string;
  key_entities: string[];
  emotional_tone: string;
  extracted_lessons: string[];
  related_decisions: string[];
  related_assets: string[];
}

export const processUploadedMedia = async (
  profileId: string,
  assetType: 'video' | 'audio' | 'document' | 'letter',
  assetName: string,
  rawContent: string
): Promise<EnrichedMemory> => {
  // Simulating the transcription / NLP extraction pipeline
  const lowercaseContent = rawContent.toLowerCase();

  // 1. Emotion detection
  let emotionalTone = "calm";
  if (lowercaseContent.includes("anxious") || lowercaseContent.includes("worried") || lowercaseContent.includes("fear")) {
    emotionalTone = "anxiety";
  } else if (lowercaseContent.includes("happy") || lowercaseContent.includes("proud") || lowercaseContent.includes("glad")) {
    emotionalTone = "pride";
  } else if (lowercaseContent.includes("hope") || lowercaseContent.includes("wish") || lowercaseContent.includes("future")) {
    emotionalTone = "hope";
  } else if (lowercaseContent.includes("regret") || lowercaseContent.includes("sorry") || lowercaseContent.includes("wish I had")) {
    emotionalTone = "regret";
  }

  // 2. Entity & People extraction
  const keyEntities: string[] = [];
  const relatedPeople: string[] = [];
  if (lowercaseContent.includes("father") || lowercaseContent.includes("dad")) {
    relatedPeople.push("Father");
  }
  if (lowercaseContent.includes("eleanor") || lowercaseContent.includes("mother") || lowercaseContent.includes("mom")) {
    relatedPeople.push("Eleanor");
  }
  if (lowercaseContent.includes("jim") || lowercaseContent.includes("uncle")) {
    relatedPeople.push("Uncle Jim");
  }
  if (lowercaseContent.includes("farm") || lowercaseContent.includes("property") || lowercaseContent.includes("land")) {
    keyEntities.push("Family Land");
  }
  if (lowercaseContent.includes("money") || lowercaseContent.includes("debt") || lowercaseContent.includes("shares")) {
    keyEntities.push("Portfolio");
  }

  // 3. Lesson and event type detection
  let eventType = "family";
  if (lowercaseContent.includes("job") || lowercaseContent.includes("career") || lowercaseContent.includes("company")) {
    eventType = "career";
  } else if (lowercaseContent.includes("invest") || lowercaseContent.includes("market") || lowercaseContent.includes("bank")) {
    eventType = "financial";
  } else if (lowercaseContent.includes("drought") || lowercaseContent.includes("crash") || lowercaseContent.includes("crisis")) {
    eventType = "crisis";
  }

  const extractedLessons = [
    `Stewardship means preserving core strengths even when external markets panic.`,
    `A solid anchor is more valuable than leverage-driven speed.`
  ];

  // 4. Synthesizing enriched memory object
  const enriched: EnrichedMemory = {
    id: `mem-enriched-${Date.now()}`,
    profile_id: profileId,
    title: assetName.replace(/\.[^/.]+$/, ""),
    description: `AI-enriched intelligence extracted from uploaded ${assetType}.`,
    content: rawContent,
    year: new Date().getFullYear(),
    event_type: eventType,
    emotion: emotionalTone,
    people_involved: relatedPeople.length ? relatedPeople : ["Family"],
    importance_score: lowercaseContent.includes("crisis") || lowercaseContent.includes("foreclose") ? 9 : 6,
    summary: `Extracted summary of ${assetName}: The recording discusses choices regarding ${keyEntities.join(" & ") || "family events"}.`,
    key_entities: keyEntities,
    emotional_tone: emotionalTone,
    extracted_lessons: extractedLessons,
    related_decisions: [],
    related_assets: keyEntities
  };

  // 5. Save memory to local storage
  const memories: EnrichedMemory[] = JSON.parse(localStorage.getItem(`heirloom_memories_${profileId}`) || "[]");
  memories.unshift(enriched);
  localStorage.setItem(`heirloom_memories_${profileId}`, JSON.stringify(memories));

  // 6. Graph integration (Nodes and Edges)
  const nodes: GraphNode[] = JSON.parse(localStorage.getItem(`heirloom_graph_nodes_${profileId}`) || "[]");
  const edges: GraphEdge[] = JSON.parse(localStorage.getItem(`heirloom_graph_edges_${profileId}`) || "[]");

  const newMemoryNode: GraphNode = {
    id: `node-${enriched.id}`,
    entity_type: "Memory",
    label: enriched.title,
    properties: { year: enriched.year, score: enriched.importance_score, emotional_tone: emotionalTone }
  };
  nodes.push(newMemoryNode);

  const newEdge: GraphEdge = {
    id: `edge-media-${enriched.id}`,
    source: `node-person-${profileId}`,
    target: `node-${enriched.id}`,
    type: "MADE",
    properties: { source: assetType }
  };
  edges.push(newEdge);

  // Link to existing principles if relevant
  const principles = JSON.parse(localStorage.getItem(`heirloom_principles_${profileId}`) || "[]");
  if (principles.length > 0) {
    const matchedPrinciple = principles[0];
    const principleEdge: GraphEdge = {
      id: `edge-link-p-${enriched.id}`,
      source: `node-${enriched.id}`,
      target: `node-${matchedPrinciple.id}`,
      type: "INSPIRED",
      properties: {}
    };
    edges.push(principleEdge);
  }

  localStorage.setItem(`heirloom_graph_nodes_${profileId}`, JSON.stringify(nodes));
  localStorage.setItem(`heirloom_graph_edges_${profileId}`, JSON.stringify(edges));

  return enriched;
};
