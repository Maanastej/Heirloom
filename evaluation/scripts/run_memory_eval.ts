import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupMocks, teardownMocks, clearMockDb } from '../mocks/supabaseMock.js';
import { analyzeUserResponse } from '../../src/lib/extractionEngine.js';
import { JudgeFactory } from './lib/judgeFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ErrorLog {
  id: string;
  expected: any;
  actual: string[];
  falsePositivesFound: number;
  falseNegativesFound: number;
  judgeName: string;
}

export async function runMemoryEval(useHumanBenchmark = false) {
  console.log(`Running Memory Extraction Evaluation V3 (${useHumanBenchmark ? 'HUMAN' : 'SYNTHETIC'})...`);

  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    console.log("No GROQ_API_KEY found. Skipping memory extraction evaluation gracefully.");
    return { skippedStatus: true };
  }

  const dsName = useHumanBenchmark ? 'human_benchmark_extraction.json' : 'memory_extraction_v3.json';
  const datasetPath = path.join(__dirname, '..', 'datasets', dsName);
  
  let dataset = [];
  if (fs.existsSync(datasetPath)) {
    dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  } else {
    console.warn(`${dsName} not found. Skipping.`);
    return { skippedStatus: true };
  }

  setupMocks();

  const judges = JudgeFactory.getJudges();
  const resultsByJudge: Record<string, any> = {};
  const errorLogs: ErrorLog[] = [];
  const disagreements: any[] = [];
  let extractedConceptsTotal = 0;
  
  let agreementCount = 0;
  let evaluatedCount = 0;

  for (const j of judges) {
    resultsByJudge[j.name] = { tp: 0, fp: 0, fn: 0 };
  }

  const subset = dataset.slice(0, 20);

  for (const item of subset) {
    clearMockDb();
    
    // 1. Generation
    const result = await analyzeUserResponse("test_profile_id", item.query, item.response, apiKey);
    extractedConceptsTotal += result.extractedItems.length;

    await new Promise(r => setTimeout(r, 800)); // Rate limit

    // 2. Evaluation by Multiple Judges
    const judgeScores = [];
    for (const judge of judges) {
      const score = await judge.evaluateExtraction({
        memories: item.expected_memories,
        decisions: item.expected_decisions
      }, result.extractedItems, apiKey);
      
      if (score) {
        const expectedCount = (item.expected_memories || []).length;
        const actualCount = result.extractedItems.length;

        let tp = 0;
        let fp = 0;
        let fn = 0;

        if (score.alignments) {
          const validAlignments = score.alignments.filter((a: any) => a.match_confidence >= 0.8);
          const matchedExpectedIndices = new Set(validAlignments.map((a: any) => a.expected_index));
          const matchedExtractedIndices = new Set(validAlignments.map((a: any) => a.extracted_index));

          tp = matchedExpectedIndices.size;
          fn = Math.max(0, expectedCount - tp);
          fp = Math.max(0, actualCount - matchedExtractedIndices.size);
        }

        resultsByJudge[judge.name].tp += tp;
        resultsByJudge[judge.name].fp += fp;
        resultsByJudge[judge.name].fn += fn;
        
        if (fp > 0 || fn > 0) {
           errorLogs.push({
             id: item.id || 'unknown',
             expected: { memories: item.expected_memories, decisions: item.expected_decisions },
             actual: result.extractedItems,
             falsePositivesFound: fp,
             falseNegativesFound: fn,
             judgeName: judge.name
           });
        }
      }
      judgeScores.push(score);
      await new Promise(r => setTimeout(r, 800)); // Rate limit
    }

    // 3. Agreement Calculation
    if (judgeScores.length === 2 && judgeScores[0] && judgeScores[1]) {
       // Deep compare alignments or just compare calculated TP/FP/FN. For simplicity, just count it based on length of valid alignments.
       // We'll compare the objects stringified for true strict agreement, but let's just log disagreement for now.
       const str0 = JSON.stringify(judgeScores[0].alignments || []);
       const str1 = JSON.stringify(judgeScores[1].alignments || []);
       if (str0 === str1) {
          agreementCount++;
       } else {
          disagreements.push({
             item_id: item.id,
             judge_A_scores: judgeScores[0],
             judge_B_scores: judgeScores[1],
             actual_extracted: result.extractedItems
          });
       }
    }
    console.log(`\n--- Example ${evaluatedCount + 1} ---`);
    console.log(`Input Query: "${item.query}"`);
    console.log(`User Response: "${item.response}"`);
    console.log(`Expected Memories:`, item.expected_memories);
    console.log(`Extracted Memories:`, result.extractedItems);
    console.log(`Judge A Scores:`, judgeScores[0] || 'NULL (failed)');
    console.log(`Judge B Scores:`, judgeScores[1] || 'NULL (failed)');
    
    evaluatedCount++;
  }

  teardownMocks();

  const primaryJudge = judges[0].name;
  const metrics = resultsByJudge[primaryJudge];
  
  const precision = (metrics.tp + metrics.fp) > 0 ? metrics.tp / (metrics.tp + metrics.fp) : 0;
  const recall = (metrics.tp + metrics.fn) > 0 ? metrics.tp / (metrics.tp + metrics.fn) : 0;
  const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

  const resultsDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const finalResults = {
    datasetSize: dataset.length,
    evaluated: evaluatedCount,
    skipped: dataset.length - evaluatedCount,
    coveragePercent: (evaluatedCount / dataset.length) * 100,
    extractedConcepts: extractedConceptsTotal,
    precision,
    recall,
    f1Score,
    truePositives: metrics.tp,
    falsePositives: metrics.fp,
    falseNegatives: metrics.fn,
    judgeAgreementPercentage: evaluatedCount > 0 ? (agreementCount / evaluatedCount) * 100 : 0,
    skippedStatus: false,
    benchmarkType: useHumanBenchmark ? 'Human' : 'Synthetic'
  };

  const prefix = useHumanBenchmark ? 'human_' : 'synthetic_';
  
  fs.writeFileSync(path.join(resultsDir, `${prefix}extraction_eval.json`), JSON.stringify(finalResults, null, 2));
  fs.writeFileSync(path.join(resultsDir, `${prefix}error_analysis_extraction.json`), JSON.stringify(errorLogs, null, 2));
  fs.writeFileSync(path.join(resultsDir, `${prefix}judge_disagreements_extraction.json`), JSON.stringify(disagreements, null, 2));

  console.log(`Memory Extraction F1 (${prefix}): ${(f1Score * 100).toFixed(2)}% (Judge Agreement: ${finalResults.judgeAgreementPercentage.toFixed(1)}%)`);
  return finalResults;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('run_memory_eval.ts')) {
  runMemoryEval().catch(console.error);
}
