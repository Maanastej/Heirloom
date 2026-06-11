import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupMocks, teardownMocks, seedMockDb } from '../mocks/supabaseMock.js';
import { retrieveGraphRAGContext } from '../../src/lib/graphrag.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const datasetPath = path.join(__dirname, '..', 'datasets', 'retrieval_dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

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

  // Use graphrag = true
  seedMockDb(mockMemories, mockDecisions, mockEdges, []);

  const subset = dataset.slice(0, 20);
  
  for (let i = 0; i < subset.length; i++) {
    const item = subset[i];
    const pkg = await retrieveGraphRAGContext("test_profile", item.query, { risk: 0.5, ambition: 0.5, tradition: 0.5, independence: 0.5 });
    
    const retrievedIds = [...pkg.memories.map((m: any) => m.id), ...pkg.decisions.map((d: any) => d.id)];
    
    let bestRank = -1;
    for (const expectedId of item.expected_memory_ids) {
      const r = retrievedIds.indexOf(expectedId);
      if (r !== -1 && (bestRank === -1 || r < bestRank)) {
        bestRank = r;
      }
    }

    const isCorrect = bestRank !== -1 && bestRank < 5;

    console.log(`\nExample ${i + 1}:`);
    console.log(`Query: ${item.query}`);
    console.log(`Expected memory IDs: ${item.expected_memory_ids.join(', ')}`);
    
    const retrievedMemoriesAndDecisions = [...pkg.memories, ...pkg.decisions];
    console.log(`Retrieved top 5 memories/decisions:`);
    retrievedMemoriesAndDecisions.slice(0, 5).forEach((m: any, idx) => {
      console.log(`  ${idx + 1}. ID: ${m.id} | Title/Situation: ${m.title || m.situation}`);
    });
    
    console.log(`Retrieved IDs: ${retrievedIds.join(', ')}`);
    console.log(`Whether evaluation marked it correct (Recall@5): ${isCorrect}`);
  }

  teardownMocks();
}

run().catch(console.error);
