import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupMocks, teardownMocks, seedMockDb } from '../mocks/supabaseMock.js';
import { retrieveGraphRAGContext } from '../../src/lib/graphrag.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RetrievalMetrics {
  recallAt1: number;
  recallAt3: number;
  recallAt5: number;
  recallAt10: number;
  mrr: number;
  hitRate: number;
}

interface RetrievalEvalResult {
  totalQueries: number;
  baseline: RetrievalMetrics;
  graphrag: RetrievalMetrics;
}

export async function runRetrievalEval(): Promise<RetrievalEvalResult> {
  console.log("Running Memory Retrieval Evaluation...");

  const datasetPath = path.join(__dirname, '..', 'datasets', 'retrieval_dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  setupMocks();

  // Seed a complex graph into the mock DB with matching topics to our dataset
  const mockMemories = [
    { id: "mem_finance_1", title: "Finance overview", content: "I have 50k in my bank.", year: 2023 },
    { id: "mem_startup_1", title: "Startup overview", content: "We just raised a series A.", year: 2023 },
    { id: "mem_marriage_1", title: "Marriage overview", content: "Anniversary is next month.", year: 2023 },
    { id: "mem_health_1", title: "Health overview", content: "I am feeling great.", year: 2023 },
    { id: "mem_property_1", title: "Property overview", content: "Looking to buy a house in Texas.", year: 2023 },
    // Add noise memories
    ...Array.from({length: 45}).map((_, i) => ({ id: `noise_mem_${i}`, title: `Noise Memory ${i}`, content: "Irrelevant content.", year: 2000 }))
  ];
  
  const mockDecisions = [
    { id: "dec_finance_1", situation: "Where to invest?", reasoning: "Chose stocks for growth." }
  ];

  const mockEdges = [
    { source: "mem_finance_1", target: "dec_finance_1", type: "CONNECTED_TO" }
  ];

  const runTest = async (useGraphRAG: boolean): Promise<RetrievalMetrics> => {
    seedMockDb(mockMemories, mockDecisions, useGraphRAG ? mockEdges : [], []);
    
    let hitsAt1 = 0, hitsAt3 = 0, hitsAt5 = 0, hitsAt10 = 0, anyHit = 0;
    let mrrSum = 0;

    for (const item of dataset) {
      const pkg = await retrieveGraphRAGContext("test_profile", item.query, { risk: 0.5, ambition: 0.5, tradition: 0.5, independence: 0.5 });
      
      const retrievedIds = [...pkg.memories.map((m: any) => m.id), ...pkg.decisions.map((d: any) => d.id)];
      
      // Calculate rank of the first expected ID found
      let bestRank = -1;
      for (const expectedId of item.expected_memory_ids) {
        const r = retrievedIds.indexOf(expectedId);
        if (r !== -1 && (bestRank === -1 || r < bestRank)) {
          bestRank = r;
        }
      }
      
      if (bestRank !== -1) {
        anyHit++;
        mrrSum += 1 / (bestRank + 1);
        if (bestRank < 1) hitsAt1++;
        if (bestRank < 3) hitsAt3++;
        if (bestRank < 5) hitsAt5++;
        if (bestRank < 10) hitsAt10++;
      }
    }

    const total = dataset.length;
    return {
      recallAt1: total > 0 ? hitsAt1 / total : 0,
      recallAt3: total > 0 ? hitsAt3 / total : 0,
      recallAt5: total > 0 ? hitsAt5 / total : 0,
      recallAt10: total > 0 ? hitsAt10 / total : 0,
      hitRate: total > 0 ? anyHit / total : 0,
      mrr: total > 0 ? mrrSum / total : 0
    };
  };

  const baselineResults = await runTest(false);
  const graphragResults = await runTest(true);

  teardownMocks();

  const results: RetrievalEvalResult = {
    totalQueries: dataset.length,
    baseline: baselineResults,
    graphrag: graphragResults
  };

  const resultsDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, 'retrieval_eval.json'), JSON.stringify(results, null, 2));

  console.log(`Baseline Recall@5: ${(baselineResults.recallAt5 * 100).toFixed(2)}%`);
  console.log(`GraphRAG Recall@5: ${(graphragResults.recallAt5 * 100).toFixed(2)}%`);

  return results;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('run_retrieval_eval.ts')) {
  runRetrievalEval().catch(console.error);
}
