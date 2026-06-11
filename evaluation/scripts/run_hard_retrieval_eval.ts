import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fileURLToPath } from 'url';
import { cosineSimilarity } from '../../src/lib/behavioralEmbeddings.js';
import { retrieveGraphRAGContext } from '../../src/lib/graphrag.js';
import { setupMocks, teardownMocks, seedMockDb } from '../mocks/supabaseMock.js';

const generateDecisionEmbedding = async (obj: Record<string, any>) => {
  const input = JSON.stringify(obj);
  const res = await fetch("https://api.groq.com/openai/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-large", input }),
  });
  const data = await res.json();
  return data?.data?.[0]?.embedding ?? null;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dummy VITE_GROQ_API_KEY so behavioralEmbeddings doesn't exit early
process.env.VITE_GROQ_API_KEY = "dummy_key";

async function run() {
  // 1. Calculate keyword overlap statistics for existing benchmark
  const datasetPath = path.join(__dirname, '..', 'datasets', 'retrieval_dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  
  let overlapCount = 0;
  for (const item of dataset) {
    const q = item.query.toLowerCase();
    // Expected memory titles: Marriage overview, Startup overview, etc.
    // If the query contains 'marriage', 'startup', 'finance', 'health', or 'property', it overlaps with the memory title/keywords
    if (q.includes('marriage') || q.includes('startup') || q.includes('finance') || q.includes('health') || q.includes('property')) {
      overlapCount++;
    }
  }
  console.log(`=== Baseline Benchmark Leakage ===`);
  console.log(`Original queries with direct keyword overlap: ${overlapCount} / ${dataset.length} (${((overlapCount/dataset.length)*100).toFixed(1)}%)`);

  // 2. Create harder benchmark
  const hardDataset = [
    { query: "Should I start my own business?", expected_memory_ids: ["mem_startup_1"] },
    { query: "How should I prepare financially for the future?", expected_memory_ids: ["mem_finance_1"] },
    { query: "I'm worried about my relationship.", expected_memory_ids: ["mem_marriage_1"] },
    { query: "Am I physically ready for a marathon?", expected_memory_ids: ["mem_health_1"] },
    { query: "Where should I settle down and live?", expected_memory_ids: ["mem_property_1"] },
    { query: "Is it a good time to become an entrepreneur?", expected_memory_ids: ["mem_startup_1"] },
    { query: "How do I grow my wealth?", expected_memory_ids: ["mem_finance_1"] },
    { query: "My spouse and I are having a milestone celebration.", expected_memory_ids: ["mem_marriage_1"] },
    { query: "I need to find a place to move to.", expected_memory_ids: ["mem_property_1"] },
    { query: "My medical checkup was positive.", expected_memory_ids: ["mem_health_1"] },
    { query: "We got capital from investors.", expected_memory_ids: ["mem_startup_1"] },
    { query: "Should I put my savings into the market?", expected_memory_ids: ["mem_finance_1"] },
    { query: "What if things get tough with my partner?", expected_memory_ids: ["mem_marriage_1"] },
    { query: "Thinking of purchasing real estate.", expected_memory_ids: ["mem_property_1"] },
    { query: "My physical wellbeing is doing well right now.", expected_memory_ids: ["mem_health_1"] }
  ];

  setupMocks();

  const mockMemories = [
    { id: "mem_finance_1", title: "Finance overview", content: "I have 50k in my bank.", year: 2023 },
    { id: "mem_startup_1", title: "Startup overview", content: "We just raised a series A.", year: 2023 },
    { id: "mem_marriage_1", title: "Marriage overview", content: "Anniversary is next month.", year: 2023 },
    { id: "mem_health_1", title: "Health overview", content: "I am feeling great.", year: 2023 },
    { id: "mem_property_1", title: "Property overview", content: "Looking to buy a house in Texas.", year: 2023 },
    ...Array.from({length: 45}).map((_, i) => ({ id: `noise_mem_${i}`, title: `Noise Memory ${i}`, content: "Irrelevant content.", year: 2000 }))
  ];
  
  const mockDecisions = [
    { id: "dec_finance_1", situation: "Where to invest?", reasoning: "Chose stocks for growth." }
  ];

  const mockEdges = [
    { source: "mem_finance_1", target: "dec_finance_1", type: "CONNECTED_TO" }
  ];

  // Initialize embeddings for memories for Vector Search simulation
  for (const m of mockMemories) {
    (m as any).embedding = await generateDecisionEmbedding({ input: m.title + " " + m.content });
  }

  seedMockDb(mockMemories, mockDecisions, mockEdges, []);

  // System A: Keyword Search
  let kwHitsAt1 = 0, kwHitsAt3 = 0, kwHitsAt5 = 0;
  
  // System B: Vector Search
  let vecHitsAt1 = 0, vecHitsAt3 = 0, vecHitsAt5 = 0;

  console.log(`\n=== Running Evaluator on Hard Benchmark (${hardDataset.length} items) ===`);

  for (let i = 0; i < hardDataset.length; i++) {
    const item = hardDataset[i];
    
    // --- System A: Keyword Search (Current GraphRAG) ---
    const pkg = await retrieveGraphRAGContext("test_profile", item.query, { risk: 0.5, ambition: 0.5, tradition: 0.5, independence: 0.5 });
    const kwRetrievedIds = [...pkg.memories.map((m: any) => m.id), ...pkg.decisions.map((d: any) => d.id)];
    
    let kwBestRank = -1;
    for (const expectedId of item.expected_memory_ids) {
      const r = kwRetrievedIds.indexOf(expectedId);
      if (r !== -1 && (kwBestRank === -1 || r < kwBestRank)) {
        kwBestRank = r;
      }
    }
    if (kwBestRank !== -1) {
      if (kwBestRank < 1) kwHitsAt1++;
      if (kwBestRank < 3) kwHitsAt3++;
      if (kwBestRank < 5) kwHitsAt5++;
    }

    // --- System B: Vector Search Simulation ---
    const queryEmb = await generateDecisionEmbedding({ input: item.query });
    
    const vectorScoredMemories = mockMemories.map(m => {
      const sim = cosineSimilarity(queryEmb as number[], (m as any).embedding as number[]);
      return { id: m.id, sim };
    }).sort((a, b) => b.sim - a.sim);

    const vecRetrievedIds = vectorScoredMemories.slice(0, 5).map(m => m.id);
    let vecBestRank = -1;
    for (const expectedId of item.expected_memory_ids) {
      const r = vecRetrievedIds.indexOf(expectedId);
      if (r !== -1 && (vecBestRank === -1 || r < vecBestRank)) {
        vecBestRank = r;
      }
    }
    if (vecBestRank !== -1) {
      if (vecBestRank < 1) vecHitsAt1++;
      if (vecBestRank < 3) vecHitsAt3++;
      if (vecBestRank < 5) vecHitsAt5++;
    }
  }

  const total = hardDataset.length;
  console.log(`\nSystem A: Existing Keyword Retrieval`);
  console.log(`Recall@1: ${((kwHitsAt1/total)*100).toFixed(2)}%`);
  console.log(`Recall@3: ${((kwHitsAt3/total)*100).toFixed(2)}%`);
  console.log(`Recall@5: ${((kwHitsAt5/total)*100).toFixed(2)}%`);

  console.log(`\nSystem B: Vector Embeddings Retrieval (behavioralMemory)`);
  console.log(`Recall@1: ${((vecHitsAt1/total)*100).toFixed(2)}%`);
  console.log(`Recall@3: ${((vecHitsAt3/total)*100).toFixed(2)}%`);
  console.log(`Recall@5: ${((vecHitsAt5/total)*100).toFixed(2)}%`);

  teardownMocks();
}

run().catch(console.error);
