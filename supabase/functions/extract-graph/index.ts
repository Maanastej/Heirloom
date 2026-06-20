import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const groqApiKey = Deno.env.get("GROQ_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // We expect payload.record from Supabase webhooks for inserts
    const record = payload.record;
    const table = payload.table;

    if (!record || !table) {
      return new Response(JSON.stringify({ error: "Missing record or table in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!groqApiKey || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let contentToAnalyze = "";
    if (table === "dna_memories") {
      contentToAnalyze = `Memory Title: ${record.title}\nMemory Content: ${record.content}\nEmotion: ${record.emotion}\nPeople Involved: ${record.people_involved?.join(", ")}`;
    } else if (table === "decision_journal") {
      contentToAnalyze = `Decision Situation: ${record.situation}\nSelected Option: ${record.selected_option}\nReasoning: ${record.reasoning}\nOutcome: ${record.outcome}`;
    } else {
      return new Response(JSON.stringify({ message: "Ignored table" }), { status: 200, headers: corsHeaders });
    }

    // Call Groq API
    const systemPrompt = `
You are an expert Knowledge Graph Extractor.
Extract entities (Nodes) and relationships (Edges) from the following text.
Output MUST be a valid JSON object with the exact following schema:
{
  "nodes": [
    {
      "id": "A unique slug for this entity (e.g. 'person_john_doe', 'memory_123')",
      "entity_type": "Person" | "Memory" | "Decision" | "Principle" | "Asset" | "Video" | "Document" | "Family Member" | "Event",
      "label": "Human readable name",
      "properties": {}
    }
  ],
  "edges": [
    {
      "source_node_id": "Must match a node id",
      "target_node_id": "Must match a node id",
      "relationship_type": "MADE" | "INFLUENCED" | "MENTIONED" | "OWNED" | "REFERRED_TO" | "CONNECTED_TO" | "INSPIRED" | "INHERITED" | "CAUSED",
      "properties": {}
    }
  ]
}
Only output raw JSON, no markdown formatting like \`\`\`json.
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentToAnalyze }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${await response.text()}`);
    }

    const groqData = await response.json();
    let textOutput = groqData.choices[0].message.content.trim();
    // In case the model still outputs markdown
    textOutput = textOutput.replace(/^```json/g, "").replace(/```$/g, "").trim();

    const graphData = JSON.parse(textOutput);

    const profileId = record.profile_id;

    // Insert Nodes
    if (graphData.nodes && graphData.nodes.length > 0) {
      const nodesToInsert = graphData.nodes.map((n: any) => ({
        id: n.id,
        profile_id: profileId,
        entity_type: n.entity_type || "Event",
        label: n.label,
        properties: n.properties || {}
      }));
      
      const { error: nodeError } = await supabase.from('knowledge_graph_nodes').upsert(nodesToInsert, { onConflict: 'id' });
      if (nodeError) console.error("Error inserting nodes:", nodeError);
    }

    // Insert Edges
    if (graphData.edges && graphData.edges.length > 0) {
      const edgesToInsert = graphData.edges.map((e: any) => ({
        profile_id: profileId,
        source_node_id: e.source_node_id,
        target_node_id: e.target_node_id,
        relationship_type: e.relationship_type || "CONNECTED_TO",
        properties: e.properties || {}
      }));

      const { error: edgeError } = await supabase.from('knowledge_graph_edges').insert(edgesToInsert);
      if (edgeError) console.error("Error inserting edges:", edgeError);
    }

    return new Response(JSON.stringify({ success: true, extracted: graphData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
