import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runClassificationEval } from './run_classification_eval.js';
import { runMemoryEval } from './run_memory_eval.js';
import { runRetrievalEval } from './run_retrieval_eval.js';
import { runEndToEndEval } from './run_end_to_end_eval.js';
import { runLatencyEval } from './run_latency_eval.js';
import { calculateProportionCI, calculateMeanCI, formatCI } from './lib/statistics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runFullEval() {
  console.log("=========================================");
  console.log("   HEIRLOOM AI EVALUATION SUITE V3 START ");
  console.log("=========================================\n");

  const resultsDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const classification = await runClassificationEval();
  console.log("\n");
  
  // Synthetic Data Executions
  const memorySyn = await runMemoryEval(false);
  console.log("\n");
  const endToEndSyn = await runEndToEndEval(false);
  console.log("\n");

  // Human Data Executions
  const memoryHum = await runMemoryEval(true);
  console.log("\n");
  const endToEndHum = await runEndToEndEval(true);
  console.log("\n");

  const retrieval = await runRetrievalEval();
  console.log("\n");
  const latency = await runLatencyEval();
  console.log("\n");

  console.log("=========================================");
  console.log("      GENERATING EVALUATION REPORT V3    ");
  console.log("=========================================\n");

  const reportPath = path.join(__dirname, '..', '..', 'Evaluation Report.md');

  // Helper for Classification
  const formatMetric = (val: number, isPercent=true) => isPercent ? `${(val*100).toFixed(1)}%` : val.toFixed(2);
  
  // Confidence Intervals
  const memHumF1CI = calculateProportionCI(memoryHum.skippedStatus ? 0 : memoryHum.f1Score, memoryHum.skippedStatus ? 0 : memoryHum.evaluated);
  const memSynF1CI = calculateProportionCI(memorySyn.skippedStatus ? 0 : memorySyn.f1Score, memorySyn.skippedStatus ? 0 : memorySyn.evaluated);
  
  const e2eHumPersCI = calculateMeanCI(endToEndHum.skippedStatus ? 0 : endToEndHum.personalization, endToEndHum.skippedStatus ? 0 : endToEndHum.evaluated);
  const e2eSynPersCI = calculateMeanCI(endToEndSyn.skippedStatus ? 0 : endToEndSyn.personalization, endToEndSyn.skippedStatus ? 0 : endToEndSyn.evaluated);

  const reportMarkdown = `# Heirloom AI Evaluation Report V3

## Executive Summary
This report summarizes the rigorous performance validation of the Heirloom AI engines. Evaluation V3 utilizes dual-LLM semantic grading, completely decoupled Synthetic and Human-Crafted benchmarking sets, explicit 95% Confidence Intervals, and zero mathematical extrapolation. 

> [!IMPORTANT]
> **Metric Categorization Rubric**
> **[A]** Real execution + human labels
> **[B]** Real execution + generated labels
> **[C]** Real execution + LLM judge
> **[D]** Simulated
> **[E]** Not measured

---

## Verified Metrics (Resume-Ready)

| Metric | Value | 95% CI | Sample Size | Coverage | Category |
|--------|-------|--------|-------------|----------|----------|
| Domain Classification Acc (Human) | ${formatMetric(classification.human.accuracy)} | N/A | ${classification.human.total} | 100% | **[A]** |
| Memory Extraction F1 (Human) | ${memoryHum.skippedStatus ? "E" : formatMetric(memoryHum.f1Score)} | ${memoryHum.skippedStatus ? "N/A" : `±${(memHumF1CI.margin * 100).toFixed(1)}%`} | ${memoryHum.skippedStatus ? 0 : memoryHum.evaluated} / ${memoryHum.skippedStatus ? 0 : memoryHum.datasetSize} | ${memoryHum.skippedStatus ? "0%" : `${memoryHum.coveragePercent.toFixed(1)}%`} | **[C]** |
| Memory Extraction F1 (Synthetic) | ${memorySyn.skippedStatus ? "E" : formatMetric(memorySyn.f1Score)} | ${memorySyn.skippedStatus ? "N/A" : `±${(memSynF1CI.margin * 100).toFixed(1)}%`} | ${memorySyn.skippedStatus ? 0 : memorySyn.evaluated} / ${memorySyn.skippedStatus ? 0 : memorySyn.datasetSize} | ${memorySyn.skippedStatus ? "0%" : `${memorySyn.coveragePercent.toFixed(1)}%`} | **[C]** |
| E2E Personalization (Human) | ${endToEndHum.skippedStatus ? "E" : formatMetric(endToEndHum.personalization, false)} / 5 | ${endToEndHum.skippedStatus ? "N/A" : `±${e2eHumPersCI.margin.toFixed(2)}`} | ${endToEndHum.skippedStatus ? 0 : endToEndHum.evaluated} / ${endToEndHum.skippedStatus ? 0 : endToEndHum.datasetSize} | ${endToEndHum.skippedStatus ? "0%" : `${endToEndHum.coveragePercent.toFixed(1)}%`} | **[C]** |
| E2E Personalization (Synthetic) | ${endToEndSyn.skippedStatus ? "E" : formatMetric(endToEndSyn.personalization, false)} / 5 | ${endToEndSyn.skippedStatus ? "N/A" : `±${e2eSynPersCI.margin.toFixed(2)}`} | ${endToEndSyn.skippedStatus ? 0 : endToEndSyn.evaluated} / ${endToEndSyn.skippedStatus ? 0 : endToEndSyn.datasetSize} | ${endToEndSyn.skippedStatus ? "0%" : `${endToEndSyn.coveragePercent.toFixed(1)}%`} | **[C]** |
| E2E Memory Utilization Rate (Syn) | ${endToEndSyn.skippedStatus ? "E" : formatMetric(endToEndSyn.memoryUtilizationRate)} | N/A | ${endToEndSyn.skippedStatus ? 0 : endToEndSyn.evaluated} / ${endToEndSyn.skippedStatus ? 0 : endToEndSyn.datasetSize} | ${endToEndSyn.skippedStatus ? "0%" : `${endToEndSyn.coveragePercent.toFixed(1)}%`} | **[C]** |
| Retrieval Recall@5 | ${formatMetric(retrieval.graphrag.recallAt5)} | N/A | ${retrieval.totalQueries} | 100% | **[B]** |
| E2E Pipeline Mean Latency | ${latency.endToEnd.mean.toFixed(1)}ms | N/A | ${latency.endToEnd.iterations} | 100% | **[A]** |

---

## 1. Judge Independence & Disagreement
To eliminate self-grading bias, the pipeline was measured utilizing multiple distinct judge LLMs.

| Benchmark | Judge Agreement Rate | Raw Disagreements Logged |
|-----------|----------------------|--------------------------|
| Extraction (Synthetic) | ${memorySyn.skippedStatus ? "N/A" : `${memorySyn.judgeAgreementPercentage.toFixed(1)}%`} | ${memorySyn.skippedStatus ? "N/A" : `Yes (evaluation/results/synthetic_judge_disagreements_extraction.json)`} |
| E2E (Synthetic) | ${endToEndSyn.skippedStatus ? "N/A" : `${endToEndSyn.judgeAgreementPercentage.toFixed(1)}%`} | ${endToEndSyn.skippedStatus ? "N/A" : `Yes (evaluation/results/synthetic_judge_disagreements_e2e.json)`} |

## 2. Error Analysis: Extraction Failures
False Positives (hallucinated memory extraction) and False Negatives (missed critical context) are actively captured. 
For deep analysis of strings causing extraction failures, view:
\`evaluation/results/synthetic_error_analysis_extraction.json\`

---
*Report auto-generated by the Heirloom Evaluation Framework V3.*
`;

  fs.writeFileSync(reportPath, reportMarkdown, 'utf8');
  console.log(`Evaluation Report V3 generated successfully at: ${reportPath}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('run_full_eval.ts')) {
  runFullEval().catch(console.error);
}
