import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupMocks, teardownMocks, seedMockDb, clearMockDb } from '../mocks/supabaseMock.js';
import { classifyDomain } from '../../src/lib/domainClassifier.js';
import { retrieveGraphRAGContext, generateSimulatorResponse } from '../../src/lib/graphrag.js';
import { JudgeFactory, JudgeScores } from './lib/judgeFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runEndToEndEval(useHumanBenchmark = false) {
  console.log(`Running End-to-End Pipeline Evaluation V3 (${useHumanBenchmark ? 'HUMAN' : 'SYNTHETIC'})...`);

  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    console.log("No GROQ_API_KEY found. Skipping E2E evaluation gracefully.");
    return { skippedStatus: true };
  }

  const dsName = useHumanBenchmark ? 'human_benchmark_e2e.json' : 'end_to_end_v3.json';
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
  const disagreements: any[] = [];
  
  for (const j of judges) {
    resultsByJudge[j.name] = { pers: 0, mem: 0, act: 0, con: 0, hal: 0, memUsed: 0 };
  }

  let totalAvailableMemories = 0;
  let agreementCount = 0;
  let evaluatedCount = 0;

  const subset = dataset.slice(0, 5); // Prevent rate limit death
  
  for (const item of subset) {
    clearMockDb();
    seedMockDb(item.available_memories, [], [], []);
    totalAvailableMemories += item.available_memories.length;

    // Run pipeline
    const classResult = await classifyDomain(item.query, apiKey);
    const pkg = await retrieveGraphRAGContext("test_profile", item.query, { risk: 0.5, ambition: 0.5, tradition: 0.5, independence: 0.5 });
    
    const originalLog = console.log; console.log = () => {};
    const finalResponseData = await generateSimulatorResponse("test_profile", item.query, pkg, [], apiKey);
    const finalResponse = finalResponseData.recommendation;
    console.log = originalLog;

    await new Promise(r => setTimeout(r, 1000));

    // Judge
    const judgeScores: JudgeScores[] = [];
    for (const judge of judges) {
      const score = await judge.evaluateE2E(item.query, item.available_memories, finalResponse, item.expected_traits, apiKey);
      if (score) {
        resultsByJudge[judge.name].pers += score.personalization_score || 0;
        resultsByJudge[judge.name].mem += score.memory_utilization_score || 0;
        resultsByJudge[judge.name].act += score.actionability_score || 0;
        resultsByJudge[judge.name].con += score.consistency_score || 0;
        resultsByJudge[judge.name].hal += score.hallucination_flag || 0;
        resultsByJudge[judge.name].memUsed += (score.memories_used_correctly || []).length;
      }
      if(score) judgeScores.push(score);
      await new Promise(r => setTimeout(r, 1000));
    }

    if (judgeScores.length === 2) {
       const scoreA = (judgeScores[0].personalization_score || 0) + (judgeScores[0].consistency_score || 0);
       const scoreB = (judgeScores[1].personalization_score || 0) + (judgeScores[1].consistency_score || 0);
       // Check if judges scored roughly similar (within 1 point total variance)
       if (Math.abs(scoreA - scoreB) <= 1) {
          agreementCount++;
       } else {
          disagreements.push({
             item_id: item.id,
             judge_A_scores: judgeScores[0],
             judge_B_scores: judgeScores[1],
             actual_response: finalResponse
          });
       }
    }

    evaluatedCount++;
  }

  teardownMocks();

  const primaryJudge = judges[0].name;
  const metrics = resultsByJudge[primaryJudge];

  const finalResults = {
    datasetSize: dataset.length,
    evaluated: evaluatedCount,
    skipped: dataset.length - evaluatedCount,
    coveragePercent: evaluatedCount > 0 ? (evaluatedCount / dataset.length) * 100 : 0,
    
    personalization: evaluatedCount > 0 ? metrics.pers / evaluatedCount : 0,
    memoryUtilization: evaluatedCount > 0 ? metrics.mem / evaluatedCount : 0,
    actionability: evaluatedCount > 0 ? metrics.act / evaluatedCount : 0,
    consistency: evaluatedCount > 0 ? metrics.con / evaluatedCount : 0,
    
    overallScore: evaluatedCount > 0 ? ((metrics.pers + metrics.mem + metrics.act + metrics.con) / (evaluatedCount * 20)) * 100 : 0,
    hallucinationRate: evaluatedCount > 0 ? metrics.hal / evaluatedCount : 0,
    memoryUtilizationRate: totalAvailableMemories > 0 ? metrics.memUsed / totalAvailableMemories : 0,
    
    judgeAgreementPercentage: evaluatedCount > 0 ? (agreementCount / evaluatedCount) * 100 : 0,
    skippedStatus: false,
    benchmarkType: useHumanBenchmark ? 'Human' : 'Synthetic'
  };

  const resultsDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const prefix = useHumanBenchmark ? 'human_' : 'synthetic_';
  fs.writeFileSync(path.join(resultsDir, `${prefix}end_to_end_eval.json`), JSON.stringify(finalResults, null, 2));
  fs.writeFileSync(path.join(resultsDir, `${prefix}judge_disagreements_e2e.json`), JSON.stringify(disagreements, null, 2));

  console.log(`E2E Overall Score (${prefix}): ${finalResults.overallScore.toFixed(2)}% (Judge Agreement: ${finalResults.judgeAgreementPercentage.toFixed(1)}%)`);
  return finalResults;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('run_end_to_end_eval.ts')) {
  runEndToEndEval().catch(console.error);
}
