import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES = [
  "Career history", "Education", "Family relationships", "Marriage", 
  "Children", "Financial experiences", "Investments", "Startup experiences", 
  "Health conditions", "Hobbies", "Travel", "Personal values", 
  "Regrets", "Major life events", "Achievements", "Preferences", "Long-term goals"
];

const E2E_SCENARIOS = [
  "Career transition", "Burnout", "Divorce", "Parenting decisions", 
  "Retirement planning", "Medical diagnosis", "Startup failure", 
  "Investment allocation", "Family conflict", "Relocation decisions", 
  "Work-life balance", "Major purchases", "Education choices"
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateBatchLLM(prompt: string, apiKey: string) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });
    const data = await res.json();
    if (!data.choices) {
      console.error("Groq generation failed", data);
      return [];
    }
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    return parsed.items || [];
  } catch (err) {
    console.error("Error calling Groq", err);
    return [];
  }
}

async function generateExtractionV3(apiKey: string) {
  console.log("Generating Memory Extraction V3 (Procedural LLM Generation)...");
  const dataset: any[] = [];
  let idCounter = 1;

  for (const cat of CATEGORIES) {
    console.log(`Generating 10 extraction items for category: ${cat}`);
    const prompt = `
You are creating a rigorous evaluation dataset for an AI memory extraction system.
Generate exactly 10 highly diverse, natural conversational responses from a user regarding their "${cat}".
Some should be short, some complex, some ambiguous. Some should contain multiple extractable memories, and 1 or 2 should contain NO extractable memory.

Output STRICT JSON matching this exact schema:
{
  "items": [
    {
      "query": "A conversational question asked to the user",
      "response": "The user's highly natural, human-like response",
      "expected_memories": [
        { "title": "Brief title of memory", "event_type": "career|financial|family|health|other" }
      ],
      "expected_decisions": [
        { "situation": "The choice faced", "selected_option": "What they chose", "reasoning": "Why" }
      ]
    }
  ]
}
`;
    const items = await generateBatchLLM(prompt, apiKey);
    for (const item of items) {
      item.id = `ext_v3_${idCounter++}`;
      item.category = cat;
      dataset.push(item);
    }
    await sleep(2000); // Rate limit protection
  }

  const outPath = path.join(__dirname, '..', 'datasets', 'memory_extraction_v3.json');
  fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2));
  console.log(`Saved ${dataset.length} unique extraction items.`);
  return dataset;
}

async function generateE2EV3(apiKey: string) {
  console.log("Generating End-to-End V3 (Procedural LLM Generation)...");
  const dataset: any[] = [];
  let idCounter = 1;

  for (const scenario of E2E_SCENARIOS) {
    console.log(`Generating 5 E2E items for scenario: ${scenario}`);
    const prompt = `
You are creating a rigorous evaluation dataset for an AI Digital Twin simulator.
Generate exactly 5 highly diverse scenarios involving "${scenario}".
Each scenario must contain a user query, 1-3 available historical memories that would exist in their database, and 2-4 expected behavioral traits the AI should exhibit in its response.

Output STRICT JSON matching this exact schema:
{
  "items": [
    {
      "query": "User asking for advice or perspective",
      "available_memories": [
        { "id": "uuid-like-string", "title": "Memory title", "content": "Detailed memory content", "year": 2022 }
      ],
      "expected_traits": [
        "Acknowledge past mistake",
        "Advise caution"
      ]
    }
  ]
}
`;
    const items = await generateBatchLLM(prompt, apiKey);
    for (const item of items) {
      item.id = `e2e_v3_${idCounter++}`;
      item.scenario = scenario;
      dataset.push(item);
    }
    await sleep(2000); // Rate limit protection
  }

  const outPath = path.join(__dirname, '..', 'datasets', 'end_to_end_v3.json');
  fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2));
  console.log(`Saved ${dataset.length} unique E2E scenarios.`);
  return dataset;
}

function generateDiversityReport(extDataset: any[], e2eDataset: any[]) {
  const reportPath = path.join(__dirname, '..', 'datasets', 'diversity_report.md');
  
  // Checking exact duplicate responses
  const uniqueExtResponses = new Set(extDataset.map(i => i.response));
  const duplicateExtCount = extDataset.length - uniqueExtResponses.size;

  const uniqueE2eQueries = new Set(e2eDataset.map(i => i.query));
  const duplicateE2eCount = e2eDataset.length - uniqueE2eQueries.size;

  const extCatDist: Record<string, number> = {};
  extDataset.forEach(i => { extCatDist[i.category] = (extCatDist[i.category] || 0) + 1; });

  const e2eScenDist: Record<string, number> = {};
  e2eDataset.forEach(i => { e2eScenDist[i.scenario] = (e2eScenDist[i.scenario] || 0) + 1; });

  const md = `# Dataset Diversity Report

## Memory Extraction V3 Dataset
- **Total Examples:** ${extDataset.length}
- **Duplicate Responses Detected:** ${duplicateExtCount}
- **Unique Responses:** ${uniqueExtResponses.size}

### Category Distribution
${Object.entries(extCatDist).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

---

## End-to-End V3 Dataset
- **Total Scenarios:** ${e2eDataset.length}
- **Duplicate Queries Detected:** ${duplicateE2eCount}
- **Unique Queries:** ${uniqueE2eQueries.size}

### Scenario Distribution
${Object.entries(e2eScenDist).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`;

  fs.writeFileSync(reportPath, md, 'utf8');
  console.log("Diversity Report generated.");
}

async function run() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY missing. Cannot procedurally generate datasets.");
    process.exit(1);
  }

  const dsPath = path.join(__dirname, '..', 'datasets');
  if (!fs.existsSync(dsPath)) fs.mkdirSync(dsPath, { recursive: true });

  const extData = await generateExtractionV3(apiKey);
  const e2eData = await generateE2EV3(apiKey);
  
  generateDiversityReport(extData, e2eData);
}

run();
