import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { retrieveGraphRAGContext } from '../../src/lib/graphrag.js';
import { setupMocks, teardownMocks, seedMockDb } from '../mocks/supabaseMock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Provide a dummy key so the embeddings client initializes
process.env.VITE_GROQ_API_KEY = "dummy_key";

async function run() {
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

  seedMockDb(mockMemories, mockDecisions, mockEdges, []);

  const datasetPath = path.join(__dirname, '..', 'datasets', 'retrieval_dataset.json');
  const originalDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8')).slice(0, 50); // use subset to save time

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

  const modes = ['keyword', 'vector', 'hybrid'];
  const datasets = [
    { name: 'Original Benchmark', data: originalDataset },
    { name: 'Hard Semantic Benchmark', data: hardDataset }
  ];

  for (const ds of datasets) {
    console.log(`\n==========================================`);
    console.log(`Evaluating: ${ds.name} (${ds.data.length} items)`);
    console.log(`==========================================`);

    for (const mode of modes) {
      process.env.RETRIEVAL_MODE = mode;
      
      let hitsAt1 = 0, hitsAt3 = 0, hitsAt5 = 0;
      let totalLatency = 0;
      let totalMemoriesRetrieved = 0;

      for (const item of ds.data) {
        const start = performance.now();
        // Since getMemories & getDecisions hit our mocks, it's fast. 
        // Embedding mock is also fast.
        const pkg = await retrieveGraphRAGContext("test_profile", item.query, { risk: 0.5, ambition: 0.5, tradition: 0.5, independence: 0.5 });
        const latency = performance.now() - start;
        totalLatency += latency;

        totalMemoriesRetrieved += pkg.memories.length;
        
        // Context includes memories and decisions up to the slice
        // Wait, the retrieval flow takes slice(0, 2) for both memory and decisions, and maybe does graph expansion
        // To be fair and consistent, we just check the IDs retrieved in pkg.memories and pkg.decisions
        const retrievedIds = [...pkg.memories.map((m: any) => m.id), ...pkg.decisions.map((d: any) => d.id)];
        
        let bestRank = -1;
        for (const expectedId of item.expected_memory_ids) {
          const r = retrievedIds.indexOf(expectedId);
          if (r !== -1 && (bestRank === -1 || r < bestRank)) {
            bestRank = r;
          }
        }
        if (bestRank !== -1) {
          if (bestRank < 1) hitsAt1++;
          if (bestRank < 3) hitsAt3++;
          if (bestRank < 5) hitsAt5++;
        }
      }

      const total = ds.data.length;
      console.log(`\nMode: ${mode.toUpperCase()}`);
      console.log(`Recall@1: ${((hitsAt1/total)*100).toFixed(2)}%`);
      console.log(`Recall@3: ${((hitsAt3/total)*100).toFixed(2)}%`);
      console.log(`Recall@5: ${((hitsAt5/total)*100).toFixed(2)}%`);
      console.log(`Avg Latency: ${(totalLatency / total).toFixed(2)} ms`);
      console.log(`Avg Memories Retrieved: ${(totalMemoriesRetrieved / total).toFixed(2)}`);
    }
  }

  teardownMocks();
}

run().catch(console.error);
