// evaluation/scripts/generate_retrieval_v3_data.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getLocalSemanticEmbedding } from '../../src/lib/behavioralEmbeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groqApiKey = process.env.VITE_GROQ_API_KEY || "";

async function fetchEmbedding(text: string, retries = 3, delay = 1000): Promise<number[] | null> {
  const input = JSON.stringify({ input: text });
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({ model: "text-embedding-3-large", input }),
      });
      if (res.ok) {
        const data = await res.json();
        return data?.data?.[0]?.embedding ?? null;
      }
      console.warn(`Attempt ${attempt} failed with status ${res.status}. Falling back if final attempt.`);
    } catch (e) {
      console.error(`Attempt ${attempt} threw error:`, e);
    }
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  // Fallback to local semantic embedder
  console.log(`Using local semantic embedding fallback for: "${text.substring(0, 40)}..."`);
  return getLocalSemanticEmbedding(text);
}

// Batch embedder to save time and handle rate limits
async function batchEmbed(texts: string[], batchSize = 20): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Embedding batch ${i / batchSize + 1} of ${Math.ceil(texts.length / batchSize)}...`);
    const promises = batch.map(text => fetchEmbedding(text));
    const results = await Promise.all(promises);
    for (let r = 0; r < results.length; r++) {
      const emb = results[r];
      if (!emb) {
        throw new Error(`Failed to generate embedding for text: "${batch[r]}"`);
      }
      embeddings.push(emb);
    }
    // Wait to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  return embeddings;
}

const targets = [
  {
    id: "mem_target_1",
    title: "Career transition to developer startup",
    content: "I resigned from a senior manager position at a fortune 500 company to join an early-stage SaaS startup as their first engineer, taking a substantial pay cut in exchange for equity because I wanted autonomy."
  },
  {
    id: "mem_target_2",
    title: "Relocating spouse for job promotion",
    content: "After my wife was offered a director role in Seattle, we had a major disagreement about uprooting our family, but decided to move because her career advancement was our shared long-term priority."
  },
  {
    id: "mem_target_3",
    title: "Paying off student loan debt aggressively",
    content: "I lived on a strict budget, cooked all meals at home, and drove an old sedan for three years to allocate every spare dollar toward paying off my hundred thousand dollar student loans."
  },
  {
    id: "mem_target_4",
    title: "Rehabilitating ankle injury for marathon",
    content: "After fracturing my ankle, I underwent six months of intensive physical therapy and low-impact swimming to rebuild my cardiovascular endurance and successfully complete the marathon."
  },
  {
    id: "mem_target_5",
    title: "Duplex real estate investment",
    content: "I purchased a residential duplex in Austin, living in one unit and renting out the other, which fully covered my mortgage and introduced me to real estate management."
  },
  {
    id: "mem_target_6",
    title: "Drafting family trust and will",
    content: "Following the birth of our second child, we worked with an estate attorney to draft a comprehensive living trust and will to secure our kids' financial guardianship."
  },
  {
    id: "mem_target_7",
    title: "Terminating toxic high-performing employee",
    content: "Despite their high sales numbers, I fired a senior account executive because their toxic behavior and arrogance were destroying team morale and driving away key designers."
  },
  {
    id: "mem_target_8",
    title: "Sabbatical after severe work burnout",
    content: "Experiencing extreme exhaustion and insomnia after three years of non-stop product launches, I negotiated a three-month unpaid sabbatical to rest, travel, and disconnect."
  },
  {
    id: "mem_target_9",
    title: "Holding index funds through stock crash",
    content: "When the stock market plummeted in early 2020, I resisted the urge to panic sell my portfolio and instead bought more index funds, which proved highly profitable during the recovery."
  },
  {
    id: "mem_target_10",
    title: "Relocating from New York to London",
    content: "I accepted an international transfer from our New York headquarters to the London office, navigating visa applications and finding a flat in Kensington to experience European culture."
  }
];

const queryDefinitions = [
  // Target 1: Career transition
  { targetId: "mem_target_1", category: "paraphrase", query: "Can you find the record of my transition from corporate manager to startup dev?" },
  { targetId: "mem_target_1", category: "paraphrase", query: "I want to recall when I resigned my manager post to be first engineer at a SaaS company." },
  { targetId: "mem_target_1", category: "synonym", query: "Tell me about leaving the Fortune 500 conglomerate for an early-stage software venture." },
  { targetId: "mem_target_1", category: "synonym", query: "When did I trade a steady paycheck for equity incentives and independence?" },
  { targetId: "mem_target_1", category: "typo_slang", query: "quit my big manager job to join a tiny startup as engineering employee number 1" },
  { targetId: "mem_target_1", category: "typo_slang", query: "resigned from corporate cuz i wanted autonomy and equity over high salary" },
  { targetId: "mem_target_1", category: "indirect", query: "Did I ever trade job security and high compensation for professional self-direction?" },
  { targetId: "mem_target_1", category: "indirect", query: "Find the memory about sacrificing short-term income for startup ownership." },
  { targetId: "mem_target_1", category: "ambiguous", query: "What did I decide when choosing between corporate structure and startup autonomy?" },
  { targetId: "mem_target_1", category: "ambiguous", query: "Tell me about my first engineering role at a SaaS company." },
  { targetId: "mem_target_1", category: "hard_negative", query: "Did I ever work as a senior sales manager at a fortune 500 company?" },
  { targetId: "mem_target_1", category: "hard_negative", query: "Show me my startup ideas that failed due to lack of dev autonomy." },
  { targetId: "mem_target_1", category: "paraphrase", query: "Where did I write about resigning from my stable manager role?" },
  { targetId: "mem_target_1", category: "synonym", query: "Details on my shift to a startup taking a pay cut." },
  { targetId: "mem_target_1", category: "typo_slang", query: "left big corp to be 1st engineer at early stage saas" },
  { targetId: "mem_target_1", category: "indirect", query: "Autonomy over compensation in my career history." },
  { targetId: "mem_target_1", category: "ambiguous", query: "autonomy decision" },
  { targetId: "mem_target_1", category: "paraphrase", query: "resignation from corporate manager" },
  { targetId: "mem_target_1", category: "synonym", query: "first engineer saas startup" },
  { targetId: "mem_target_1", category: "typo_slang", query: "quitting manager role for saas" },

  // Target 2: Relocating spouse
  { targetId: "mem_target_2", category: "paraphrase", query: "What did we decide when my wife got a director job in Seattle?" },
  { targetId: "mem_target_2", category: "paraphrase", query: "Find the argument/discussion we had about moving our family to Seattle." },
  { targetId: "mem_target_2", category: "synonym", query: "Uprooting the household to support my spouse's promotion." },
  { targetId: "mem_target_2", category: "synonym", query: "Where is the memory about relocating for my partner's career advancement?" },
  { targetId: "mem_target_2", category: "typo_slang", query: "moving to seattle because of wife's new director gig" },
  { targetId: "mem_target_2", category: "typo_slang", query: "uprooting kids and moving west coast for spouse job promotion" },
  { targetId: "mem_target_2", category: "indirect", query: "When did we prioritize my partner's professional growth over our local stability?" },
  { targetId: "mem_target_2", category: "indirect", query: "Deciding to move the family for a director level opportunity." },
  { targetId: "mem_target_2", category: "ambiguous", query: "Seattle family relocation decision." },
  { targetId: "mem_target_2", category: "ambiguous", query: "Our shared long-term priority regarding career move." },
  { targetId: "mem_target_2", category: "hard_negative", query: "Did we refuse to move to Seattle when she was offered a job?" },
  { targetId: "mem_target_2", category: "hard_negative", query: "My job relocation to Seattle headquarters." },
  { targetId: "mem_target_2", category: "paraphrase", query: "wife director offer in Seattle" },
  { targetId: "mem_target_2", category: "synonym", query: "spouse career relocation decision" },
  { targetId: "mem_target_2", category: "typo_slang", query: "wife's director job uprooted our family" },
  { targetId: "mem_target_2", category: "indirect", query: "prioritizing partner promotion over current location" },
  { targetId: "mem_target_2", category: "ambiguous", query: "Seattle move agreement" },
  { targetId: "mem_target_2", category: "paraphrase", query: "relocating family for wife's role" },
  { targetId: "mem_target_2", category: "synonym", query: "Seattle relocation long-term priorities" },
  { targetId: "mem_target_2", category: "typo_slang", query: "wife promotion to director seattle relocation" },

  // Target 3: Student loan debt
  { targetId: "mem_target_3", category: "paraphrase", query: "How did I pay off my 100k student loan debt?" },
  { targetId: "mem_target_3", category: "paraphrase", query: "Show me the details of my strict budget to eliminate student loans." },
  { targetId: "mem_target_3", category: "synonym", query: "Aggressively clearing my six-figure educational liability." },
  { targetId: "mem_target_3", category: "synonym", query: "Living frugally, cooking at home, and driving a cheap car to pay debt." },
  { targetId: "mem_target_3", category: "typo_slang", query: "paying off 100k college debt by driving an old sedan" },
  { targetId: "mem_target_3", category: "typo_slang", query: "eating cheap home cooked food to wipe out student loans" },
  { targetId: "mem_target_3", category: "indirect", query: "What did I sacrifice financially to become debt-free in my twenties?" },
  { targetId: "mem_target_3", category: "indirect", query: "Where did I write about aggressive debt repayment strategy?" },
  { targetId: "mem_target_3", category: "ambiguous", query: "My hundred thousand dollar debt story." },
  { targetId: "mem_target_3", category: "ambiguous", query: "Cooking at home and living on a tight budget." },
  { targetId: "mem_target_3", category: "hard_negative", query: "Did I take out loans to buy a duplex?" },
  { targetId: "mem_target_3", category: "hard_negative", query: "I want to buy a new sedan but I have student loans." },
  { targetId: "mem_target_3", category: "paraphrase", query: "student loans paying off" },
  { targetId: "mem_target_3", category: "synonym", query: "eliminating educational debt" },
  { targetId: "mem_target_3", category: "typo_slang", query: "frugal living to clear college debt" },
  { targetId: "mem_target_3", category: "indirect", query: "strict budget and old sedan story" },
  { targetId: "mem_target_3", category: "ambiguous", query: "hundred thousand dollar debt resolution" },
  { targetId: "mem_target_3", category: "paraphrase", query: "aggressively paying down student loans" },
  { targetId: "mem_target_3", category: "synonym", query: "frugal budgeting for college loan payoff" },
  { targetId: "mem_target_3", category: "typo_slang", query: "cooking at home to save for student loans" },

  // Target 4: Rehabilitating ankle
  { targetId: "mem_target_4", category: "paraphrase", query: "How did I recover from my fractured ankle to run the marathon?" },
  { targetId: "mem_target_4", category: "paraphrase", query: "Find the memory about physical therapy after my ankle injury." },
  { targetId: "mem_target_4", category: "synonym", query: "Rehabilitation and swimming to build stamina after bone fracture." },
  { targetId: "mem_target_4", category: "synonym", query: "Six months of physiotherapy for my broken leg joint before race." },
  { targetId: "mem_target_4", category: "typo_slang", query: "getting ready for marathon after breaking my ankle" },
  { targetId: "mem_target_4", category: "typo_slang", query: "swimming and physio therapy for fractured ankle recovery" },
  { targetId: "mem_target_4", category: "indirect", query: "How did I rebuild my fitness after a major lower body injury?" },
  { targetId: "mem_target_4", category: "indirect", query: "What did I do to prepare for the running event after being injured?" },
  { targetId: "mem_target_4", category: "ambiguous", query: "Ankle fracture recovery timeline." },
  { targetId: "mem_target_4", category: "ambiguous", query: "Six months of physical training details." },
  { targetId: "mem_target_4", category: "hard_negative", query: "Did I break my ankle while running the marathon?" },
  { targetId: "mem_target_4", category: "hard_negative", query: "Swimming to cure chronic asthma." },
  { targetId: "mem_target_4", category: "paraphrase", query: "ankle rehab marathon prep" },
  { targetId: "mem_target_4", category: "synonym", query: "recovering from broken ankle" },
  { targetId: "mem_target_4", category: "typo_slang", query: "fractured bone rehabilitation swimming physical therapy" },
  { targetId: "mem_target_4", category: "indirect", query: "healing joint to complete the long distance race" },
  { targetId: "mem_target_4", category: "ambiguous", query: "marathon recovery plan" },
  { targetId: "mem_target_4", category: "paraphrase", query: "physiotherapy after ankle fracture" },
  { targetId: "mem_target_4", category: "synonym", query: "rebuilding stamina after leg injury" },
  { targetId: "mem_target_4", category: "typo_slang", query: "ankle rehab and low impact swimming" },

  // Target 5: Duplex real estate
  { targetId: "mem_target_5", category: "paraphrase", query: "Where is the memory about buying a duplex in Austin?" },
  { targetId: "mem_target_5", category: "paraphrase", query: "How did I start managing property by renting out a duplex unit?" },
  { targetId: "mem_target_5", category: "synonym", query: "Purchasing a double-occupancy residential building in Texas." },
  { targetId: "mem_target_5", category: "synonym", query: "House hacking a duplex to cover mortgage payments." },
  { targetId: "mem_target_5", category: "typo_slang", query: "buying a duplex in austin tx and renting out half" },
  { targetId: "mem_target_5", category: "typo_slang", query: "tenant covered my mortgage in my austin duplex" },
  { targetId: "mem_target_5", category: "indirect", query: "What was my first experience as a landlord in Austin?" },
  { targetId: "mem_target_5", category: "indirect", query: "Where did I write about residential real estate investment strategy?" },
  { targetId: "mem_target_5", category: "ambiguous", query: "Duplex mortgage details." },
  { targetId: "mem_target_5", category: "ambiguous", query: "Renting one unit and living in the other." },
  { targetId: "mem_target_5", category: "hard_negative", query: "Did I buy a duplex in Seattle for my spouse's promotion?" },
  { targetId: "mem_target_5", category: "hard_negative", query: "Filing duplex rent on tax returns." },
  { targetId: "mem_target_5", category: "paraphrase", query: "austin duplex purchase" },
  { targetId: "mem_target_5", category: "synonym", query: "real estate duplex leasing" },
  { targetId: "mem_target_5", category: "typo_slang", query: "househacking duplex in austin" },
  { targetId: "mem_target_5", category: "indirect", query: "covering mortgage by renting portion of my home" },
  { targetId: "mem_target_5", category: "ambiguous", query: "Austin landlord history" },
  { targetId: "mem_target_5", category: "paraphrase", query: "buying a rental property in Austin" },
  { targetId: "mem_target_5", category: "synonym", query: "duplex real estate management" },
  { targetId: "mem_target_5", category: "typo_slang", query: "austin duplex landlord stuff" },

  // Target 6: Family trust and will
  { targetId: "mem_target_6", category: "paraphrase", query: "Why did we draft a living trust and will after our second child?" },
  { targetId: "mem_target_6", category: "paraphrase", query: "Find the document details about our estate planning for the kids." },
  { targetId: "mem_target_6", category: "synonym", query: "Setting up a family trust and testament with an attorney." },
  { targetId: "mem_target_6", category: "synonym", query: "Securing guardianship and inheritance for our children." },
  { targetId: "mem_target_6", category: "typo_slang", query: "making a family trust and will after kid number 2 was born" },
  { targetId: "mem_target_6", category: "typo_slang", query: "estate attorney helped us write trust and will for kids" },
  { targetId: "mem_target_6", category: "indirect", query: "How did we protect our offspring's future financial security?" },
  { targetId: "mem_target_6", category: "indirect", query: "Working with an estate lawyer to plan our legacy." },
  { targetId: "mem_target_6", category: "ambiguous", query: "Trust and will declaration." },
  { targetId: "mem_target_6", category: "ambiguous", query: "Second child guardianship setup." },
  { targetId: "mem_target_6", category: "hard_negative", query: "Did we buy a trust fund for our first child?" },
  { targetId: "mem_target_6", category: "hard_negative", query: "Getting a divorce and dividing the family trust." },
  { targetId: "mem_target_6", category: "paraphrase", query: "family living trust draft" },
  { targetId: "mem_target_6", category: "synonym", query: "estate planning will children guardianship" },
  { targetId: "mem_target_6", category: "typo_slang", query: "making a will after second baby" },
  { targetId: "mem_target_6", category: "indirect", query: "assigning legal guardians for our minor children" },
  { targetId: "mem_target_6", category: "ambiguous", query: "estate attorney consult" },
  { targetId: "mem_target_6", category: "paraphrase", query: "drafting a will after birth of kid" },
  { targetId: "mem_target_6", category: "synonym", query: "family trust setup" },
  { targetId: "mem_target_6", category: "typo_slang", query: "trust fund and will for kids" },

  // Target 7: Terminating toxic employee
  { targetId: "mem_target_7", category: "paraphrase", query: "Why did I fire the high-performing senior sales account executive?" },
  { targetId: "mem_target_7", category: "paraphrase", query: "Find the memory about letting go of a toxic top seller." },
  { targetId: "mem_target_7", category: "synonym", query: "Firing an executive with great numbers due to poor attitude." },
  { targetId: "mem_target_7", category: "synonym", query: "Terminating a high revenue generator for arrogance and morale disruption." },
  { targetId: "mem_target_7", category: "typo_slang", query: "firing a toxic top salesman because he was ruining the team" },
  { targetId: "mem_target_7", category: "typo_slang", query: "letting go of senior account exec for arrogance" },
  { targetId: "mem_target_7", category: "indirect", query: "When did I prioritize culture and morale over short-term revenue?" },
  { targetId: "mem_target_7", category: "indirect", query: "Dealing with an arrogant employee who alienated designers." },
  { targetId: "mem_target_7", category: "ambiguous", query: "Senior account executive termination." },
  { targetId: "mem_target_7", category: "ambiguous", query: "High numbers but toxic attitude." },
  { targetId: "mem_target_7", category: "hard_negative", query: "Did I hire a high-performing senior manager?" },
  { targetId: "mem_target_7", category: "hard_negative", query: "Promoting a toxic employee to sales manager." },
  { targetId: "mem_target_7", category: "paraphrase", query: "firing toxic high performer" },
  { targetId: "mem_target_7", category: "synonym", query: "sales rep termination team morale" },
  { targetId: "mem_target_7", category: "typo_slang", query: "canned our top seller cuz he was toxic" },
  { targetId: "mem_target_7", category: "indirect", query: "protecting design team from sales team toxicity" },
  { targetId: "mem_target_7", category: "ambiguous", query: "firing decision senior employee" },
  { targetId: "mem_target_7", category: "paraphrase", query: "toxic salesman termination" },
  { targetId: "mem_target_7", category: "synonym", query: "letting go of top sales rep" },
  { targetId: "mem_target_7", category: "typo_slang", query: "arrogant account executive fired" },

  // Target 8: Burnout / Sabbatical
  { targetId: "mem_target_8", category: "paraphrase", query: "Where did I write about taking a three-month unpaid sabbatical?" },
  { targetId: "mem_target_8", category: "paraphrase", query: "Why did I negotiate a sabbatical after severe burnout?" },
  { targetId: "mem_target_8", category: "synonym", query: "Taking unpaid leave to recover from exhaustion and insomnia." },
  { targetId: "mem_target_8", category: "synonym", query: "Taking time off to disconnect and travel after intense launches." },
  { targetId: "mem_target_8", category: "typo_slang", query: "three month sabbatical due to burnout and insomnia" },
  { targetId: "mem_target_8", category: "typo_slang", query: "negotiated unpaid leave after launch exhaustion" },
  { targetId: "mem_target_8", category: "indirect", query: "When did I step away from work to save my physical and mental health?" },
  { targetId: "mem_target_8", category: "indirect", query: "What did I do to address my severe work-related sleep issues?" },
  { targetId: "mem_target_8", category: "ambiguous", query: "Three-month disconnect decision." },
  { targetId: "mem_target_8", category: "ambiguous", query: "Negotating unpaid time off after years of work." },
  { targetId: "mem_target_8", category: "hard_negative", query: "Did I take a sabbatical to start a duplex business?" },
  { targetId: "mem_target_8", category: "hard_negative", query: "Getting fired because of my insomnia." },
  { targetId: "mem_target_8", category: "paraphrase", query: "sabbatical unpaid leave" },
  { targetId: "mem_target_8", category: "synonym", query: "three months off work burnout" },
  { targetId: "mem_target_8", category: "typo_slang", query: "unpaid break after insomnia and launch fatigue" },
  { targetId: "mem_target_8", category: "indirect", query: "recovering from launch burnout" },
  { targetId: "mem_target_8", category: "ambiguous", query: "sabbatical terms" },
  { targetId: "mem_target_8", category: "paraphrase", query: "negotiating unpaid leave" },
  { targetId: "mem_target_8", category: "synonym", query: "recovering from workplace exhaustion" },
  { targetId: "mem_target_8", category: "typo_slang", query: "needed to disconnect after major launch" },

  // Target 9: Index funds / Stock market
  { targetId: "mem_target_9", category: "paraphrase", query: "What did I do with my index funds during the 2020 crash?" },
  { targetId: "mem_target_9", category: "paraphrase", query: "Did I panic sell or buy more stocks when the market fell?" },
  { targetId: "mem_target_9", category: "synonym", query: "Holding index assets through the economic collapse of 2020." },
  { targetId: "mem_target_9", category: "synonym", query: "Buying equities during a market downturn." },
  { targetId: "mem_target_9", category: "typo_slang", query: "buying the dip in 2020 index funds stock crash" },
  { targetId: "mem_target_9", category: "typo_slang", query: "resisted panic selling when stocks tanked in 2020" },
  { targetId: "mem_target_9", category: "indirect", query: "How did I display high risk tolerance during a global market panic?" },
  { targetId: "mem_target_9", category: "indirect", query: "What was my investment behavior when my portfolio dropped in value?" },
  { targetId: "mem_target_9", category: "ambiguous", query: "2020 market crash decision." },
  { targetId: "mem_target_9", category: "ambiguous", query: "Resisting panic sell impulses." },
  { targetId: "mem_target_9", category: "hard_negative", query: "Did I sell my Austin duplex during the stock market crash?" },
  { targetId: "mem_target_9", category: "hard_negative", query: "Did I lose all my money in index funds?" },
  { targetId: "mem_target_9", category: "paraphrase", query: "buying index funds in 2020 crash" },
  { targetId: "mem_target_9", category: "synonym", query: "holding portfolio stock market downturn" },
  { targetId: "mem_target_9", category: "typo_slang", query: "didn't panic sell my index funds" },
  { targetId: "mem_target_9", category: "indirect", query: "increasing equity position during a bear market" },
  { targetId: "mem_target_9", category: "ambiguous", query: "stock market strategy" },
  { targetId: "mem_target_9", category: "paraphrase", query: "holding equities through crash" },
  { targetId: "mem_target_9", category: "synonym", query: "buying more during market plummet" },
  { targetId: "mem_target_9", category: "typo_slang", query: "held index funds 2020 crash" },

  // Target 10: London relocation
  { targetId: "mem_target_10", category: "paraphrase", query: "How did I transfer from the New York office to London?" },
  { targetId: "mem_target_10", category: "paraphrase", query: "Find the notes about my move to London and finding a flat." },
  { targetId: "mem_target_10", category: "synonym", query: "Relocating internationally from New York to the United Kingdom." },
  { targetId: "mem_target_10", category: "synonym", query: "Kensington flat and visa process for London job transfer." },
  { targetId: "mem_target_10", category: "typo_slang", query: "moving to london kensington flat corporate transfer" },
  { targetId: "mem_target_10", category: "typo_slang", query: "nyc to london move visa kensington flat" },
  { targetId: "mem_target_10", category: "indirect", query: "When did I relocate across the Atlantic for my career?" },
  { targetId: "mem_target_10", category: "indirect", query: "Experiencing European culture through a company transfer." },
  { targetId: "mem_target_10", category: "ambiguous", query: "Kensington apartment and visa details." },
  { targetId: "mem_target_10", category: "ambiguous", query: "My international relocation experience." },
  { targetId: "mem_target_10", category: "hard_negative", query: "Did I move to Seattle or London for work?" },
  { targetId: "mem_target_10", category: "hard_negative", query: "I want to take a sabbatical in London." },
  { targetId: "mem_target_10", category: "paraphrase", query: "international transfer to London" },
  { targetId: "mem_target_10", category: "synonym", query: "moving from NY to UK office" },
  { targetId: "mem_target_10", category: "typo_slang", query: "london flat hunting kensington visa" },
  { targetId: "mem_target_10", category: "indirect", query: "cross atlantic office relocation" },
  { targetId: "mem_target_10", category: "ambiguous", query: "London transition details" },
  { targetId: "mem_target_10", category: "paraphrase", query: "nyc to london office shift" },
  { targetId: "mem_target_10", category: "synonym", query: "relocating to Kensington flat" },
  { targetId: "mem_target_10", category: "typo_slang", query: "london visa and flat lease" }
];

// Generate 490 noise memories
const noiseSubjects = ["My cat", "The neighbor", "A colleague", "My cousin", "I", "We", "My friend"];
const noiseVerbs = ["bought a", "saw a", "read about", "fixed a", "learned to cook", "watched a movie about", "discussed the weather in"];
const noiseObjects = ["blue bicycle", "tasty tomato pasta", "science fiction novel", "broken garden hose", "historical documentary", "rainy day in Chicago", "cute golden retriever"];
const noiseDetails = ["It was quite interesting.", "Nothing much else happened.", "Took about two hours.", "Highly recommend it.", "Felt pretty neutral.", "The weather was nice."];

function generateNoiseMemories(count: number) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const sub = noiseSubjects[i % noiseSubjects.length];
    const verb = noiseVerbs[(i + 1) % noiseVerbs.length];
    const obj = noiseObjects[(i + 2) % noiseObjects.length];
    const detail = noiseDetails[(i + 3) % noiseDetails.length];
    
    list.push({
      id: `mem_noise_${i + 1}`,
      title: `Daily event ${i + 1}`,
      content: `${sub} ${verb} ${obj}. ${detail}`,
      year: 2015 + (i % 10),
      event_type: "family",
      emotion: "neutral",
      people_involved: ["Self"]
    });
  }
  return list;
}

async function main() {
  console.log("Starting Retrieval V3 Dataset Generation...");
  
  const noise = generateNoiseMemories(490);
  const allMemories: any[] = [...targets.map(t => ({
    ...t,
    year: 2021,
    event_type: "work",
    emotion: "neutral",
    people_involved: ["Self"]
  })), ...noise];

  console.log(`Prepared ${allMemories.length} memories (10 targets, 490 noise).`);

  // Extract text representation to embed
  const textsToEmbed = allMemories.map(m => `${m.title} ${m.content}`);
  
  console.log("Generating embeddings for all 500 memories using real Groq text-embedding-3-large model...");
  const embeddings = await batchEmbed(textsToEmbed, 30);
  
  // Attach embeddings
  for (let i = 0; i < allMemories.length; i++) {
    allMemories[i].memory_embedding = embeddings[i];
  }

  // Save memories corpus
  const datasetsDir = path.join(__dirname, '..', 'datasets');
  if (!fs.existsSync(datasetsDir)) {
    fs.mkdirSync(datasetsDir, { recursive: true });
  }

  const corpusPath = path.join(datasetsDir, 'memories_v3_corpus.json');
  fs.writeFileSync(corpusPath, JSON.stringify(allMemories, null, 2), 'utf8');
  console.log(`Successfully saved 500 embedded memories to ${corpusPath}`);

  // Create queries dataset v3
  const queries = queryDefinitions.map((qd, index) => ({
    id: `ret_v3_${index}`,
    query: qd.query,
    category: qd.category,
    expected_memory_ids: [qd.targetId]
  }));

  const datasetPath = path.join(datasetsDir, 'retrieval_dataset_v3.json');
  fs.writeFileSync(datasetPath, JSON.stringify(queries, null, 2), 'utf8');
  console.log(`Successfully saved ${queries.length} queries to ${datasetPath}`);
  
  console.log("Data generation completed successfully.");
}

main().catch(err => {
  console.error("Critical error in data generator:", err);
  process.exit(1);
});
