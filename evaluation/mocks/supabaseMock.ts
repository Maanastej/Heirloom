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

    // Intercept Supabase calls
    if (url.includes("supabase.co/rest/v1")) {
      const tableMatch = url.match(/rest\/v1\/([^?]+)/);
      const table = tableMatch ? tableMatch[1] : "";
      
      const method = init?.method || "GET";

      // Mock INSERTs
      if (method === "POST") {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        if (table === "memories") {
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
        if (table === "memories") return new Response(JSON.stringify(memoryDb), { status: 200, headers: { "Content-Type": "application/json" } });
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
