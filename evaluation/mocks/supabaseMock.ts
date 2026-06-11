// evaluation/mocks/supabaseMock.ts

let memoryDb: any[] = [];
let decisionDb: any[] = [];
let edgeDb: any[] = [];
let principleDb: any[] = [];

// Mock the global fetch to intercept both Supabase and optionally Groq LLM
const originalFetch = global.fetch;

export const setupMocks = () => {
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();

    // Intercept Embeddings
    if (url.includes("api.groq.com/openai/v1/embeddings") || url.includes("embeddings")) {
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

      // Mock INSERTs
      if (method === "POST") {
        const body = init?.body ? JSON.parse(init.body as string) : {};
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
