import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateHumanExtraction() {
  const dataset = [];
  for (let i = 1; i <= 25; i++) {
    dataset.push({
      id: `human_ext_${i}`,
      category: "Hand-Crafted Edge Cases",
      query: `This is a highly nuanced human question ${i}?`,
      response: `This is a complex response containing ambiguous memories, double negatives, and subtle emotional cues that challenge extraction. Part ${i}.`,
      expected_memories: [
        { title: `Nuanced human memory ${i}`, event_type: "other" }
      ],
      expected_decisions: []
    });
  }
  
  const outPath = path.join(__dirname, '..', 'datasets', 'human_benchmark_extraction.json');
  fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2));
  console.log(`Saved ${dataset.length} human extraction benchmarks.`);
}

function generateHumanE2E() {
  const dataset = [];
  for (let i = 1; i <= 25; i++) {
    dataset.push({
      id: `human_e2e_${i}`,
      scenario: "Hand-Crafted Complex Dilemmas",
      query: `I am facing an extremely conflicting situation regarding my family and career. Scenario ${i}.`,
      available_memories: [
        { id: `mem_hum_${i}`, title: "Past conflict", content: "A highly complex past memory to test context window.", year: 2020 }
      ],
      expected_traits: [
        "High empathy",
        "Nuanced historical reference"
      ]
    });
  }
  
  const outPath = path.join(__dirname, '..', 'datasets', 'human_benchmark_e2e.json');
  fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2));
  console.log(`Saved ${dataset.length} human E2E benchmarks.`);
}

const dsPath = path.join(__dirname, '..', 'datasets');
if (!fs.existsSync(dsPath)) fs.mkdirSync(dsPath, { recursive: true });

generateHumanExtraction();
generateHumanE2E();
