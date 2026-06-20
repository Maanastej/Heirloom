// evaluation/mocks/supabaseMock.ts

let memoryDb: any[] = [];
let decisionDb: any[] = [];
let edgeDb: any[] = [];
let principleDb: any[] = [];

// Mock the global fetch to intercept both Supabase and optionally Groq LLM
const originalFetch = global.fetch;

export const setupMocks = (bypassEmbeddings = false) => {
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();

    // Intercept Embeddings
    if (!bypassEmbeddings && (url.includes("api.groq.com/openai/v1/embeddings") || url.includes("embeddings"))) {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const text = (body.input || "").toLowerCase();
      
      let vector = new Array(1536).fill(0);
      if (text.includes("startup") || text.includes("business") || text.includes("company") || text.includes("entrepreneur") || text.includes("investor")) vector[0] = 1;
      else if (text.includes("finance") || text.includes("money") || text.includes("invest") || text.includes("wealth") || text.includes("savings") || text.includes("future")) vector[1] = 1;
      else if (text.includes("marriage") || text.includes("relationship") || text.includes("spouse") || text.includes("partner")) vector[2] = 1;
      else if (text.includes("health") || text.includes("physical") || text.includes("medical") || text.includes("marathon")) vector[3] = 1;
      else if (text.includes("property") || text.includes("house") || text.includes("estate") || text.includes("move") || text.includes("live")) vector[4] = 1;
      else vector[5] = 1; // fallback
      
      return new Response(JSON.stringify({ data: [{ embedding: vector }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Intercept Supabase calls
    if (url.includes("supabase.co/rest/v1")) {
      const tableMatch = url.match(/rest\/v1\/([^?]+)/);
      const table = tableMatch ? tableMatch[1] : "";
      
      const method = init?.method || "GET";

      // Mock INSERTs and RPCs
      if (method === "POST") {
        const body = init?.body ? JSON.parse(init.body as string) : {};

        // Mock RPC stored procedures for pgvector similarity search
        if (table === "rpc/match_memories") {
          const queryEmbedding = body.query_embedding || [];
          const getMockVector = (text: string) => {
            let vector = new Array(1536).fill(0);
            const lower = text.toLowerCase();
            if (lower.includes("startup") || lower.includes("business") || lower.includes("company") || lower.includes("entrepreneur") || lower.includes("investor")) vector[0] = 1;
            else if (lower.includes("finance") || lower.includes("money") || lower.includes("invest") || lower.includes("wealth") || lower.includes("savings") || lower.includes("future")) vector[1] = 1;
            else if (lower.includes("marriage") || lower.includes("relationship") || lower.includes("spouse") || lower.includes("partner")) vector[2] = 1;
            else if (lower.includes("health") || lower.includes("physical") || lower.includes("medical") || lower.includes("marathon")) vector[3] = 1;
            else if (lower.includes("property") || lower.includes("house") || lower.includes("estate") || lower.includes("move") || lower.includes("live")) vector[4] = 1;
            else vector[5] = 1;
            return vector;
          };

          const cosineSimilarity = (a: number[], b: number[]) => {
            if (!a || !b || a.length !== b.length || a.length === 0) return 0;
            const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
            const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
            const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
            return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
          };

          const results = memoryDb
            .filter(m => !body.p_profile_id || m.profile_id === body.p_profile_id)
            .map(m => {
              const memEmb = m.memory_embedding || m.embedding || getMockVector(m.title + " " + m.content);
              const similarity = cosineSimilarity(queryEmbedding, memEmb);
              return { ...m, similarity };
            })
            .filter(m => m.similarity > (body.match_threshold || -1.0))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, body.match_count || 5);

          return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        if (table === "rpc/match_decisions") {
          const queryEmbedding = body.query_embedding || [];
          const getMockVector = (text: string) => {
            let vector = new Array(1536).fill(0);
            const lower = text.toLowerCase();
            if (lower.includes("startup") || lower.includes("business") || lower.includes("company") || lower.includes("entrepreneur") || lower.includes("investor")) vector[0] = 1;
            else if (lower.includes("finance") || lower.includes("money") || lower.includes("invest") || lower.includes("wealth") || lower.includes("savings") || lower.includes("future")) vector[1] = 1;
            else if (lower.includes("marriage") || lower.includes("relationship") || lower.includes("spouse") || lower.includes("partner")) vector[2] = 1;
            else if (lower.includes("health") || lower.includes("physical") || lower.includes("medical") || lower.includes("marathon")) vector[3] = 1;
            else if (lower.includes("property") || lower.includes("house") || lower.includes("estate") || lower.includes("move") || lower.includes("live")) vector[4] = 1;
            else vector[5] = 1;
            return vector;
          };

          const cosineSimilarity = (a: number[], b: number[]) => {
            if (!a || !b || a.length !== b.length || a.length === 0) return 0;
            const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
            const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
            const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
            return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
          };

          const results = decisionDb
            .filter(d => !body.p_profile_id || d.profile_id === body.p_profile_id)
            .map(d => {
              const decEmb = d.decision_embedding || d.embedding || getMockVector(d.situation + " " + d.reasoning);
              const similarity = cosineSimilarity(queryEmbedding, decEmb);
              return { ...d, similarity };
            })
            .filter(d => d.similarity > (body.match_threshold || -1.0))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, body.match_count || 5);

          return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        if (table === "memories" || table === "dna_memories") {
          const inserted = { id: `mem_${Date.now()}`, ...body };
          memoryDb.push(inserted);
          return new Response(JSON.stringify([inserted]), { status: 201, headers: { "Content-Type": "application/json" } });
        }
        if (table === "decision_journal") {
          const inserted = { id: `dec_${Date.now()}`, ...body };
          decisionDb.push(inserted);
          return new Response(JSON.stringify([inserted]), { status: 201, headers: { "Content-Type": "application/json" } });
        }
        if (table === "graph_nodes") {
          const inserted = { id: `node_${Date.now()}`, ...body };
          return new Response(JSON.stringify([inserted]), { status: 201, headers: { "Content-Type": "application/json" } });
        }
        if (table === "graph_edges") {
          const inserted = { id: `edge_${Date.now()}`, ...body };
          edgeDb.push(inserted);
          return new Response(JSON.stringify([inserted]), { status: 201, headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify([{ id: `mock_${Date.now()}` }]), { status: 201, headers: { "Content-Type": "application/json" } });
      }

      // Mock SELECTs
      if (method === "GET") {
        if (table === "memories" || table === "dna_memories") return new Response(JSON.stringify(memoryDb), { status: 200, headers: { "Content-Type": "application/json" } });
        if (table === "decision_journal") return new Response(JSON.stringify(decisionDb), { status: 200, headers: { "Content-Type": "application/json" } });
        if (table === "graph_edges") return new Response(JSON.stringify(edgeDb), { status: 200, headers: { "Content-Type": "application/json" } });
        if (table === "principles") return new Response(JSON.stringify(principleDb), { status: 200, headers: { "Content-Type": "application/json" } });
        return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      
      // Mock UPDATEs
      if (method === "PATCH") {
         return new Response(JSON.stringify([{}]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    }

    // Let other calls pass through (e.g. LLM calls)
    return originalFetch(input, init);
  };
};

export const teardownMocks = () => {
  global.fetch = originalFetch;
};

export const clearMockDb = () => {
  memoryDb = [];
  decisionDb = [];
  edgeDb = [];
  principleDb = [];
};

export const seedMockDb = (memories: any[], decisions: any[], edges: any[], principles: any[]) => {
  memoryDb = memories;
  decisionDb = decisions;
  edgeDb = edges;
  principleDb = principles;
};
