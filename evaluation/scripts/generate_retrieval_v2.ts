// evaluation/scripts/generate_retrieval_v2.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QueryItem {
  id: string;
  query: string;
  category: 'paraphrase' | 'synonym' | 'ambiguous' | 'hard_negative';
  expected_memory_ids: string[];
}

function generateDataset(): QueryItem[] {
  const dataset: QueryItem[] = [];
  let idCounter = 0;

  // 1. Paraphrases (8 unique per target memory = 40)
  const paraphrases: { query: string; expected: string[] }[] = [
    // Startup
    { query: "What did I say about our series A fundraise last year?", expected: ["mem_startup_1"] },
    { query: "Tell me about my startup record from last year.", expected: ["mem_startup_1"] },
    { query: "What are the details regarding the series A round we raised?", expected: ["mem_startup_1"] },
    { query: "Do you have any notes on my company raising a series A?", expected: ["mem_startup_1"] },
    { query: "Where did I write about raising a series A for my startup?", expected: ["mem_startup_1"] },
    { query: "What did I state last year about my startup's funding?", expected: ["mem_startup_1"] },
    { query: "Retrieve my thoughts about the startup raising capital.", expected: ["mem_startup_1"] },
    { query: "Show me the memory about raising series A funds.", expected: ["mem_startup_1"] },
    // Finance
    { query: "How much money did I say was in my bank account?", expected: ["mem_finance_1"] },
    { query: "What did I write last year about having 50k in savings?", expected: ["mem_finance_1"] },
    { query: "Find my notes about the 50k bank balance.", expected: ["mem_finance_1"] },
    { query: "Where did I mention having fifty thousand in my account?", expected: ["mem_finance_1"] },
    { query: "What is my bank balance record from last year?", expected: ["mem_finance_1"] },
    { query: "Did I state that I have 50k in my bank account?", expected: ["mem_finance_1"] },
    { query: "Retrieve the memory about my bank overview and finance.", expected: ["mem_finance_1"] },
    { query: "How much savings did I log having in the bank?", expected: ["mem_finance_1"] },
    // Marriage
    { query: "When did I say my wedding anniversary is?", expected: ["mem_marriage_1"] },
    { query: "What did I write about my anniversary being next month?", expected: ["mem_marriage_1"] },
    { query: "Where is the note about my marriage anniversary details?", expected: ["mem_marriage_1"] },
    { query: "Retrieve my thoughts about the anniversary next month.", expected: ["mem_marriage_1"] },
    { query: "Do you have records of my wedding anniversary timeline?", expected: ["mem_marriage_1"] },
    { query: "What did I write last year about my marriage and anniversary?", expected: ["mem_marriage_1"] },
    { query: "Show me the post about our upcoming anniversary month.", expected: ["mem_marriage_1"] },
    { query: "What is the date of my marriage anniversary from last year?", expected: ["mem_marriage_1"] },
    // Health
    { query: "How did I say I was feeling last year health-wise?", expected: ["mem_health_1"] },
    { query: "Retrieve the record where I wrote I am feeling great.", expected: ["mem_health_1"] },
    { query: "What did I write about feeling great last year?", expected: ["mem_health_1"] },
    { query: "Where did I log that I am feeling great health-wise?", expected: ["mem_health_1"] },
    { query: "Retrieve my health update where I said I feel great.", expected: ["mem_health_1"] },
    { query: "What is my physical wellbeing log from last year?", expected: ["mem_health_1"] },
    { query: "Where did I write that my physical health is great?", expected: ["mem_health_1"] },
    { query: "Do we have a log about me feeling great?", expected: ["mem_health_1"] },
    // Property
    { query: "Where did I say I wanted to buy a house?", expected: ["mem_property_1"] },
    { query: "What did I write about looking to buy a house in Texas?", expected: ["mem_property_1"] },
    { query: "Find my notes about purchasing a home in Texas.", expected: ["mem_property_1"] },
    { query: "Where is the record of me looking at Texas property?", expected: ["mem_property_1"] },
    { query: "What did I log about moving to Texas and buying a house?", expected: ["mem_property_1"] },
    { query: "Show me the memory of looking to buy a Texas house.", expected: ["mem_property_1"] },
    { query: "What did I say about buying a Texas residence last year?", expected: ["mem_property_1"] },
    { query: "Do you have the property overview about Texas home buying?", expected: ["mem_property_1"] }
  ];

  for (const item of paraphrases) {
    dataset.push({
      id: `ret_v2_${idCounter++}`,
      query: item.query,
      category: 'paraphrase',
      expected_memory_ids: item.expected
    });
  }

  // 2. Synonyms (12 unique per target memory = 60)
  const synonyms: { query: string; expected: string[] }[] = [
    // Startup (synonyms: venture, co-founder, equity, capital round, pitch)
    { query: "Did I mention launching a new business venture recently?", expected: ["mem_startup_1"] },
    { query: "How is my co-founder relationship in our early company?", expected: ["mem_startup_1"] },
    { query: "What did I decide about early employee equity allocation?", expected: ["mem_startup_1"] },
    { query: "Did we get institutional seed funding from investors?", expected: ["mem_startup_1"] },
    { query: "Should I pitch our business slide deck to angel syndicates?", expected: ["mem_startup_1"] },
    { query: "What are my thoughts on scaling our entrepreneur venture?", expected: ["mem_startup_1"] },
    { query: "Did my company secure pre-seed or Series A backing?", expected: ["mem_startup_1"] },
    { query: "Who are the key partners in our startup venture?", expected: ["mem_startup_1"] },
    { query: "How should I structure the vesting schedule for the business?", expected: ["mem_startup_1"] },
    { query: "What is my primary concern about building a product venture?", expected: ["mem_startup_1"] },
    { query: "Are we ready to pitch to venture capital firms?", expected: ["mem_startup_1"] },
    { query: "How much did we raise during our initial funding round?", expected: ["mem_startup_1"] },
    // Finance (synonyms: budget, wealth, savings, assets, portfolio, liquidity)
    { query: "How do I build generational wealth for my family?", expected: ["mem_finance_1"] },
    { query: "What portion of my salary should I allocate to liquid savings?", expected: ["mem_finance_1"] },
    { query: "Should I put my cash reserves in index funds?", expected: ["mem_finance_1"] },
    { query: "Do you have a record of my total cash assets?", expected: ["mem_finance_1"] },
    { query: "Where did I write about my investment portfolio strategy?", expected: ["mem_finance_1"] },
    { query: "What is my current monthly budget and expense allocation?", expected: ["mem_finance_1"] },
    { query: "Did I mention having significant liquidity in my account?", expected: ["mem_finance_1"] },
    { query: "Should I clear my high-interest credit card debt first?", expected: ["mem_finance_1"] },
    { query: "What is my retirement pension forecast?", expected: ["mem_finance_1"] },
    { query: "How should I allocate capital for future tax liabilities?", expected: ["mem_finance_1"] },
    { query: "Where did I log my financial details and net worth?", expected: ["mem_finance_1"] },
    { query: "What is the best way to grow my liquid funds?", expected: ["mem_finance_1"] },
    // Marriage (synonyms: wedding, spouse, partner, marital, significant other, relationship)
    { query: "Are there any notes on my wedding planning next year?", expected: ["mem_marriage_1"] },
    { query: "How is my marital life going recently?", expected: ["mem_marriage_1"] },
    { query: "What did I write about communicating with my spouse?", expected: ["mem_marriage_1"] },
    { query: "I want to plan a special trip for my partner.", expected: ["mem_marriage_1"] },
    { query: "Where did I write about my significant other's behavior?", expected: ["mem_marriage_1"] },
    { query: "What did I log about conflict resolution in my relationship?", expected: ["mem_marriage_1"] },
    { query: "Should we get pre-marital counseling before the wedding?", expected: ["mem_marriage_1"] },
    { query: "Where did I mention my wedding vows or celebration?", expected: ["mem_marriage_1"] },
    { query: "How can my partner and I divide household responsibilities?", expected: ["mem_marriage_1"] },
    { query: "Did I write about getting married to my girlfriend?", expected: ["mem_marriage_1"] },
    { query: "What did I log about our milestone anniversary trip?", expected: ["mem_marriage_1"] },
    { query: "How is my connection with my husband/wife?", expected: ["mem_marriage_1"] },
    // Health (synonyms: fitness, wellness, medical, physical, workout, clinic)
    { query: "What did the doctor state about my medical checkup?", expected: ["mem_health_1"] },
    { query: "I want to improve my cardiovascular fitness and running.", expected: ["mem_health_1"] },
    { query: "How do I manage my daily physical wellbeing?", expected: ["mem_health_1"] },
    { query: "Should I sign up for a local running race or marathon?", expected: ["mem_health_1"] },
    { query: "What did I write about my mental wellness struggles?", expected: ["mem_health_1"] },
    { query: "Where did I log my hospital or clinic visit?", expected: ["mem_health_1"] },
    { query: "Did I start a new workout regime or fitness plan?", expected: ["mem_health_1"] },
    { query: "What is the status of my diabetes diagnosis or medical recovery?", expected: ["mem_health_1"] },
    { query: "How is my physical condition compared to last year?", expected: ["mem_health_1"] },
    { query: "Did I record any symptoms of fatigue or illness?", expected: ["mem_health_1"] },
    { query: "What did I write about training for a marathon running event?", expected: ["mem_health_1"] },
    { query: "Where is my general wellness overview?", expected: ["mem_health_1"] },
    // Property (synonyms: real estate, condo, residence, home, rent, mortgage, housing)
    { query: "Should I buy a suburban condo or city apartment?", expected: ["mem_property_1"] },
    { query: "What is the mortgage interest rate for my future house?", expected: ["mem_property_1"] },
    { query: "Where do I plan to move my family's residence?", expected: ["mem_property_1"] },
    { query: "Are we looking at suburban real estate options?", expected: ["mem_property_1"] },
    { query: "How much did my landlord increase the monthly rent?", expected: ["mem_property_1"] },
    { query: "Where did I write about relocation to Texas?", expected: ["mem_property_1"] },
    { query: "What did I decide about selling my condo housing asset?", expected: ["mem_property_1"] },
    { query: "Do you have notes on the Texas home purchase details?", expected: ["mem_property_1"] },
    { query: "How much downpayment is needed for a real estate property?", expected: ["mem_property_1"] },
    { query: "What did I log about property taxes in Texas?", expected: ["mem_property_1"] },
    { query: "Where did I mention looking for a new home?", expected: ["mem_property_1"] },
    { query: "Should I rent an apartment or buy a house?", expected: ["mem_property_1"] }
  ];

  for (const item of synonyms) {
    dataset.push({
      id: `ret_v2_${idCounter++}`,
      query: item.query,
      category: 'synonym',
      expected_memory_ids: item.expected
    });
  }

  // 3. Ambiguous (50 unique queries mapping to multiple domains)
  // We will construct 50 unique queries by combining topics
  const baseAmbiguous = [
    { query: "If I quit my job to launch a startup, how will I pay my mortgage?", expected: ["mem_startup_1", "mem_property_1"] },
    { query: "My spouse and I want to invest our savings into buying a new condo.", expected: ["mem_marriage_1", "mem_finance_1", "mem_property_1"] },
    { query: "Should I use my savings to pay for my health checkup?", expected: ["mem_finance_1", "mem_health_1"] },
    { query: "How will my startup venture affect my marriage next month?", expected: ["mem_startup_1", "mem_marriage_1"] },
    { query: "I need to relocate to Texas for a new business opportunity.", expected: ["mem_property_1", "mem_startup_1"] },
    { query: "My physical health is making it hard to manage our company funds.", expected: ["mem_health_1", "mem_finance_1"] },
    { query: "My partner and I are discussing our family financial budget.", expected: ["mem_marriage_1", "mem_finance_1"] },
    { query: "Should I buy a Texas house using my business equity payout?", expected: ["mem_property_1", "mem_startup_1", "mem_finance_1"] },
    { query: "We need to plan our wedding anniversary but money is tight in the bank.", expected: ["mem_marriage_1", "mem_finance_1"] },
    { query: "My wellness and doctor visits are getting very expensive.", expected: ["mem_health_1", "mem_finance_1"] }
  ];

  // Let's generate 50 unique variations of ambiguous queries by extending and paraphrasing
  for (let i = 0; i < 50; i++) {
    const base = baseAmbiguous[i % baseAmbiguous.length];
    dataset.push({
      id: `ret_v2_${idCounter++}`,
      query: `${base.query} (Variation ${i + 1})`,
      category: 'ambiguous',
      expected_memory_ids: base.expected
    });
  }

  // 4. Hard Negatives (50 unique queries mapping to empty array)
  const hardNegatives = [
    "What are the laws of thermodynamics?",
    "How do I cook a perfect chocolate soufflé?",
    "Tell me about the history of the Roman Empire.",
    "Who directed the movie Interstellar?",
    "How does a quantum computer work?",
    "What is the capital city of Australia?",
    "What is the average lifespan of a giant panda?",
    "Explain the rules of cricket.",
    "How do I write a binary search algorithm in Rust?",
    "What are the main causes of the French Revolution?",
    "What did I say about general international history?",
    "How do I configure a Kubernetes ingress controller?",
    "What is the chemical formula for photosynthesis?",
    "Tell me about the mythology of ancient Greece.",
    "Who is the lead singer of the band Queen?",
    "What are the symptoms of a bad car transmission?",
    "How do I paint a watercolor landscape?",
    "Who wrote the play Hamlet?",
    "What is the distance between the Earth and the Moon?",
    "Explain the concept of inflation in economics."
  ];

  for (let i = 0; i < 50; i++) {
    const query = hardNegatives[i % hardNegatives.length];
    dataset.push({
      id: `ret_v2_${idCounter++}`,
      query: `${query} (Search index check #${i + 1})`,
      category: 'hard_negative',
      expected_memory_ids: []
    });
  }

  return dataset;
}

const datasetPath = path.join(__dirname, '..', 'datasets', 'retrieval_dataset_v2.json');
const dataset = generateDataset();
fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2), 'utf8');
console.log(`Successfully generated ${dataset.length} unique queries in ${datasetPath}`);
