import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyDomain } from '../../src/lib/domainClassifier.js';
import { retrieveGraphRAGContext, generateSimulatorResponse } from '../../src/lib/graphrag.js';
import { setupMocks, teardownMocks, seedMockDb } from '../mocks/supabaseMock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LatencyMetrics {
  iterations: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  stdDev: number;
  fastest: number;
  slowest: number;
}

export interface LatencyEvalResult {
  classification: LatencyMetrics;
  retrieval: LatencyMetrics;
  endToEnd: LatencyMetrics;
}

async function measureLatency(name: string, iterations: number, fn: () => Promise<any>): Promise<LatencyMetrics> {
  console.log(`Profiling ${name} (${iterations} iterations)...`);
  const latencies: number[] = [];

  const originalLog = console.log;
  console.log = () => {};

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    latencies.push(end - start);
  }

  console.log = originalLog;

  latencies.sort((a, b) => a - b);

  const sum = latencies.reduce((a, b) => a + b, 0);
  const mean = sum / iterations;
  
  const median = latencies[Math.floor(iterations * 0.5)];
  const p95 = latencies[Math.floor(iterations * 0.95)];
  const p99 = latencies[Math.floor(iterations * 0.99)];
  
  const fastest = latencies[0];
  const slowest = latencies[iterations - 1];

  const variance = latencies.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);

  return {
    iterations,
    mean,
    median,
    p95,
    p99,
    stdDev,
    fastest,
    slowest
  };
}

export async function runLatencyEval(): Promise<LatencyEvalResult> {
  console.log("Running Latency Evaluation...");

  const apiKey = process.env.GROQ_API_KEY || "";
  const query = "I am thinking about quitting my job and starting a company.";

  setupMocks();
  seedMockDb([], [], [], []);

  const classMetrics = await measureLatency("Classification", 500, async () => {
    await classifyDomain(query, apiKey);
  });

  const retrievalMetrics = await measureLatency("Retrieval", 500, async () => {
    await retrieveGraphRAGContext("test_profile", query, { risk: 0.5, ambition: 0.5, tradition: 0.5, independence: 0.5 });
  });

  const e2eMetrics = await measureLatency("End-to-End Pipeline", 50, async () => {
    const c = await classifyDomain(query, apiKey);
    const pkg = await retrieveGraphRAGContext("test_profile", query, { risk: 0.5, ambition: 0.5, tradition: 0.5, independence: 0.5 });
    await generateSimulatorResponse("test_profile", query, pkg, [], apiKey);
  });

  teardownMocks();

  const results: LatencyEvalResult = {
    classification: classMetrics,
    retrieval: retrievalMetrics,
    endToEnd: e2eMetrics
  };

  const resultsDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, 'latency_eval.json'), JSON.stringify(results, null, 2));

  return results;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('run_latency_eval.ts')) {
  runLatencyEval().catch(console.error);
}
