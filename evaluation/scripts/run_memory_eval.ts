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

  const subset = dataset.slice(0, 10); // Still sub-setting to prevent rate-limit deaths, but no longer extrapolating

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
        resultsByJudge[judge.name].tp += score.true_positives || 0;
        resultsByJudge[judge.name].fp += score.false_positives || 0;
        resultsByJudge[judge.name].fn += score.false_negatives || 0;
        
        if ((score.false_positives || 0) > 0 || (score.false_negatives || 0) > 0) {
           errorLogs.push({
             id: item.id || 'unknown',
             expected: { memories: item.expected_memories, decisions: item.expected_decisions },
             actual: result.extractedItems,
             falsePositivesFound: score.false_positives || 0,
             falseNegativesFound: score.false_negatives || 0,
             judgeName: judge.name
           });
        }
      }
      judgeScores.push(score);
      await new Promise(r => setTimeout(r, 800)); // Rate limit
    }

    // 3. Agreement Calculation
    if (judgeScores.length === 2 && judgeScores[0] && judgeScores[1]) {
       const agreeTP = judgeScores[0].true_positives === judgeScores[1].true_positives;
       const agreeFP = judgeScores[0].false_positives === judgeScores[1].false_positives;
       const agreeFN = judgeScores[0].false_negatives === judgeScores[1].false_negatives;
       if (agreeTP && agreeFP && agreeFN) {
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
