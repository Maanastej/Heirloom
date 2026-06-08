import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyDomain } from '../../src/lib/domainClassifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DatasetEvalResult {
  total: number;
  correct: number;
  accuracy: number;
  perDomainMetrics: Record<string, { correct: number; total: number; accuracy: number; falsePositives: number; falseNegatives: number; precision: number; recall: number }>;
  confidenceBuckets: Record<string, { correct: number; total: number; accuracy: number }>;
  llmCostSavings: number; // Cost saved by avoiding LLM calls
  ambiguousQueriesDetected: number;
}

export interface ClassificationEvalResult {
  template: DatasetEvalResult;
  human: DatasetEvalResult;
}

async function evaluateDataset(datasetPath: string, datasetName: string, apiKey: string): Promise<DatasetEvalResult> {
  console.log(`\nEvaluating ${datasetName} Dataset...`);
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Dataset not found at ${datasetPath}`);
  }

  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  let correct = 0;
  const perDomainMetrics: Record<string, { correct: number; total: number; falsePositives: number; falseNegatives: number; accuracy: number; precision: number; recall: number }> = {};
  
  const confidenceBuckets = {
    "0-20%": { correct: 0, total: 0, accuracy: 0 },
    "20-40%": { correct: 0, total: 0, accuracy: 0 },
    "40-60%": { correct: 0, total: 0, accuracy: 0 },
    "60-80%": { correct: 0, total: 0, accuracy: 0 },
    "80-100%": { correct: 0, total: 0, accuracy: 0 }
  };

  const domains = [
    "Marriage", "Relationships", "Family", "Career", 
    "Startup", "Entrepreneurship", "Finance", "Property", 
    "Legacy", "Health", "Education", "Life Purpose"
  ];
  domains.forEach(d => perDomainMetrics[d] = { correct: 0, total: 0, falsePositives: 0, falseNegatives: 0, accuracy: 0, precision: 0, recall: 0 });

  let llmFallbackCount = 0;
  let ambiguousQueriesDetected = 0;

  for (const item of dataset) {
    if (!item.ambiguous) {
      if (perDomainMetrics[item.expected_domain]) {
        perDomainMetrics[item.expected_domain].total++;
      }
    }

    const originalConsoleLog = console.log;
    let fallbackTriggered = false;
    let finalConfidence = 0;
    console.log = (...args) => {
      if (args[0] === "LLM_DOMAIN_RESULT" && args[1] !== "FAILED") fallbackTriggered = true;
      if (args[0] === "FINAL_DOMAIN_RESULT") finalConfidence = args[1]?.confidence || 0;
    };

    const result = await classifyDomain(item.query, apiKey);
    
    console.log = originalConsoleLog;

    if (fallbackTriggered) {
      llmFallbackCount++;
    }

    const predicted = result.primaryDomain;

    if (item.ambiguous) {
      if (finalConfidence < 0.60) {
        ambiguousQueriesDetected++;
      }
    } else {
      let isCorrect = predicted === item.expected_domain;
      if (isCorrect) {
        correct++;
        if (perDomainMetrics[item.expected_domain]) {
          perDomainMetrics[item.expected_domain].correct++;
        }
      } else {
        if (perDomainMetrics[item.expected_domain]) perDomainMetrics[item.expected_domain].falseNegatives++;
        if (perDomainMetrics[predicted]) perDomainMetrics[predicted].falsePositives++;
      }

      // Confidence bucket logging
      const confPct = finalConfidence * 100;
      let bucket = "0-20%";
      if (confPct > 20 && confPct <= 40) bucket = "20-40%";
      else if (confPct > 40 && confPct <= 60) bucket = "40-60%";
      else if (confPct > 60 && confPct <= 80) bucket = "60-80%";
      else if (confPct > 80) bucket = "80-100%";

      confidenceBuckets[bucket as keyof typeof confidenceBuckets].total++;
      if (isCorrect) confidenceBuckets[bucket as keyof typeof confidenceBuckets].correct++;
    }
  }

  for (const domain of domains) {
    const metrics = perDomainMetrics[domain];
    metrics.accuracy = metrics.total > 0 ? (metrics.correct / metrics.total) : 0;
    const precisionDenom = metrics.correct + metrics.falsePositives;
    metrics.precision = precisionDenom > 0 ? (metrics.correct / precisionDenom) : 0;
    const recallDenom = metrics.correct + metrics.falseNegatives;
    metrics.recall = recallDenom > 0 ? (metrics.correct / recallDenom) : 0;
  }

  for (const bucket in confidenceBuckets) {
    const b = confidenceBuckets[bucket as keyof typeof confidenceBuckets];
    b.accuracy = b.total > 0 ? b.correct / b.total : 0;
  }

  const nonAmbiguousTotal = dataset.filter((d: any) => !d.ambiguous).length;
  const accuracy = nonAmbiguousTotal > 0 ? correct / nonAmbiguousTotal : 0;
  const llmCostSavings = (nonAmbiguousTotal - llmFallbackCount) * 0.0005;

  console.log(`${datasetName} Accuracy: ${(accuracy * 100).toFixed(2)}%`);

  return {
    total: nonAmbiguousTotal,
    correct,
    accuracy,
    perDomainMetrics,
    confidenceBuckets,
    llmCostSavings,
    ambiguousQueriesDetected
  };
}

export async function runClassificationEval(): Promise<ClassificationEvalResult> {
  console.log("Running Domain Classification Evaluation...");

  const apiKey = process.env.GROQ_API_KEY || "";
  
  const templatePath = path.join(__dirname, '..', 'datasets', 'classification_gold.json');
  const humanPath = path.join(__dirname, '..', 'datasets', 'human_validation_dataset.json');

  const templateResults = await evaluateDataset(templatePath, "Template Benchmark", apiKey);
  const humanResults = await evaluateDataset(humanPath, "Human Validation", apiKey);

  const results: ClassificationEvalResult = {
    template: templateResults,
    human: humanResults
  };

  const resultsDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, 'classification_eval.json'), JSON.stringify(results, null, 2));

  return results;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('run_classification_eval.ts')) {
  runClassificationEval().catch(console.error);
}
