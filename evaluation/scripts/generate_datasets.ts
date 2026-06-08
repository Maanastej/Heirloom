import fs from 'fs';
import path from 'path';

// Define the domains based on the existing classifier
const DOMAINS = [
  "Marriage", "Relationships", "Family", "Career", 
  "Startup", "Entrepreneurship", "Finance", "Property", 
  "Legacy", "Health", "Education", "Life Purpose"
];

// Helper to get random item from array
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate Classification Dataset (Target: ~200 items)
function generateClassificationDataset() {
  const dataset = [];
  let idCounter = 1;

  const templates: Record<string, string[]> = {
    "Marriage": [
      "I want to propose to my girlfriend next month.",
      "How do we handle our finances after getting married?",
      "My husband and I are thinking about renewing our vows.",
      "We've been married for 10 years now.",
      "Thinking about buying an anniversary gift for my spouse."
    ],
    "Relationships": [
      "I broke up with my partner recently.",
      "Dating has been really difficult lately.",
      "How can I communicate better with my girlfriend?",
      "My boyfriend and I are moving in together.",
      "We are going through a tough divorce."
    ],
    "Family": [
      "I want to spend more time with my kids.",
      "My brother and I don't speak anymore.",
      "Looking for ancestral records of my family.",
      "My parents are getting older and need help.",
      "I just had a daughter!"
    ],
    "Career": [
      "I'm hoping to get a promotion at work.",
      "My boss is very demanding.",
      "Updating my resume for a new job hunt.",
      "I want to quit my job and start fresh.",
      "How do I ask for a salary increase?"
    ],
    "Startup": [
      "We are looking for seed funding.",
      "My co-founder is leaving the venture.",
      "How do I pitch to an investor?",
      "Bootstrapping the startup has been hard.",
      "Giving out equity to early employees."
    ],
    "Entrepreneurship": [
      "I want to launch my own business.",
      "Hustling on my side product.",
      "Being an entrepreneur is lonely.",
      "I am building a new product from scratch.",
      "How to scale a small business?"
    ],
    "Finance": [
      "I need to budget my salary better.",
      "How do I invest in index funds?",
      "Trying to clear my credit card debt.",
      "Planning for my retirement pension.",
      "Building generational wealth."
    ],
    "Property": [
      "I want to buy a house in the suburbs.",
      "My landlord is increasing the rent.",
      "Looking for a new apartment.",
      "Thinking about paying off the mortgage early.",
      "Selling our condo to move to the country."
    ],
    "Legacy": [
      "I want to pass down my heirloom to my grandson.",
      "Writing my will and estate planning.",
      "Leaving an inheritance for my children.",
      "What legacy will I leave behind?",
      "Preserving our ancestral home."
    ],
    "Health": [
      "I've been feeling very sick lately.",
      "Need to schedule a doctor's appointment.",
      "My mental health is struggling right now.",
      "Trying a new diet and fitness routine.",
      "Recovering from a recent surgery."
    ],
    "Education": [
      "I'm applying to a master's degree program.",
      "College tuition is so expensive.",
      "I want to learn a new programming language.",
      "Studying for my final exams.",
      "My son is going to university next year."
    ],
    "Life Purpose": [
      "I want to travel the world and explore.",
      "Moving abroad to find my passion.",
      "Seeking a deeper meaning in my work.",
      "Finding my true calling in life.",
      "What is the key to true happiness?"
    ]
  };

  // Generate 15 variations per domain (12 * 15 = 180)
  for (const domain of DOMAINS) {
    const sentences = templates[domain];
    for (let i = 0; i < 15; i++) {
      const sentence = randomItem(sentences);
      dataset.push({
        id: `cls_${idCounter++}`,
        query: `${sentence} ${i > 5 ? 'This is something I care about.' : ''}`,
        expected_domain: domain,
        ambiguous: false
      });
    }
  }

  // Add some ambiguous/multi-domain queries (20)
  const ambiguous = [
    { query: "If I quit my job to launch a startup, how will I pay my mortgage?", expected_domain: "Career" }, // Or Startup/Property
    { query: "My wife and I want to invest our savings into buying a new condo.", expected_domain: "Finance" }, // Or Marriage/Property
    { query: "Should I use my inheritance to pay for my daughter's college degree?", expected_domain: "Legacy" }, // Or Education/Family
    { query: "My health is failing so I need to write my will.", expected_domain: "Health" }, // Or Legacy
    { query: "I want to move abroad with my family to find my life purpose.", expected_domain: "Life Purpose" } // Or Family
  ];

  for (let i = 0; i < 20; i++) {
    const amb = randomItem(ambiguous);
    dataset.push({
      id: `cls_${idCounter++}`,
      query: amb.query,
      expected_domain: amb.expected_domain,
      ambiguous: true
    });
  }

  return dataset;
}

// Generate Memory Extraction Dataset (Target: ~100 items)
function generateExtractionDataset() {
  const dataset = [];
  let idCounter = 1;

  // We need query/response pairs
  const templates = [
    {
      question: "What is your main financial goal?",
      response: "I want to buy a house in two years.",
      memories: [
        { type: "goal", value: "buy a house" },
        { type: "timeline", value: "two years" }
      ]
    },
    {
      question: "Who are you planning this for?",
      response: "My son Michael.",
      memories: [
        { type: "family_member", value: "son" },
        { type: "person_name", value: "Michael" }
      ]
    },
    {
      question: "Why did you quit your last job?",
      response: "The boss was toxic and I was burnt out.",
      memories: [
        { type: "reason", value: "toxic boss" },
        { type: "health_state", value: "burnt out" }
      ]
    },
    {
      question: "What did you do with the inheritance?",
      response: "I invested it in index funds.",
      memories: [
        { type: "action", value: "invested" },
        { type: "asset", value: "index funds" }
      ]
    },
    {
      question: "How is your health?",
      response: "I was just diagnosed with diabetes.",
      memories: [
        { type: "health_condition", value: "diabetes" }
      ]
    }
  ];

  for (let i = 0; i < 100; i++) {
    const template = randomItem(templates);
    dataset.push({
      id: `ext_${idCounter++}`,
      question: template.question,
      response: template.response,
      expected_memories: template.memories
    });
  }

  return dataset;
}

// Generate Retrieval Dataset (Target: ~100 items)
function generateRetrievalDataset() {
  const dataset = [];
  let idCounter = 1;

  const templates = [
    {
      query: "Did I ever mention investing in stocks?",
      expected_retrieval_id: "mem_finance_1" // we will mock this ID in the mock DB
    },
    {
      query: "What is my son's name?",
      expected_retrieval_id: "mem_family_1"
    },
    {
      query: "Why did I leave my first company?",
      expected_retrieval_id: "mem_career_1"
    },
    {
      query: "What do I want to pass down?",
      expected_retrieval_id: "mem_legacy_1"
    }
  ];

  for (let i = 0; i < 100; i++) {
    const template = randomItem(templates);
    dataset.push({
      id: `ret_${idCounter++}`,
      query: template.query,
      expected_retrieval_id: template.expected_retrieval_id
    });
  }

  return dataset;
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetsDir = path.join(__dirname, '..', 'datasets');
if (!fs.existsSync(datasetsDir)) {
  fs.mkdirSync(datasetsDir, { recursive: true });
}

// Write Classification Dataset
fs.writeFileSync(
  path.join(datasetsDir, 'classification_gold.json'),
  JSON.stringify(generateClassificationDataset(), null, 2)
);

// Write Extraction Dataset
fs.writeFileSync(
  path.join(datasetsDir, 'extraction_gold.json'),
  JSON.stringify(generateExtractionDataset(), null, 2)
);

// Write Retrieval Dataset
fs.writeFileSync(
  path.join(datasetsDir, 'retrieval_gold.json'),
  JSON.stringify(generateRetrievalDataset(), null, 2)
);

console.log("Datasets generated successfully!");
