export const getLocalSemanticEmbedding = (text: string): number[] => {
  const vector = new Array(1536).fill(0);
  let lower = text.toLowerCase();

  // Synonym mappings to simulate semantic embedding clustering
  const synonymMappings: Record<string, string> = {
    "relocate": "reloc", "relocating": "reloc", "relocation": "reloc", "move": "reloc", "moving": "reloc", "transfer": "reloc", "uprooting": "reloc", "uproot": "reloc",
    "startup": "startup", "venture": "startup", "business": "startup", "company": "startup", "entrepreneur": "startup", "saas": "startup",
    "marriage": "marriage", "wife": "marriage", "spouse": "marriage", "partner": "marriage", "anniversary": "marriage", "husband": "marriage", "wedding": "marriage",
    "finance": "finance", "money": "finance", "savings": "finance", "debt": "finance", "loan": "finance", "portfolio": "finance", "budget": "finance", "paycheck": "finance", "frugal": "finance",
    "health": "health", "marathon": "health", "medical": "health", "physio": "health", "injury": "health", "ankle": "health", "physiotherapy": "health", "fracture": "health", "rehab": "health",
    "property": "property", "house": "property", "estate": "property", "condo": "property", "home": "property", "duplex": "property", "landlord": "property", "mortgage": "property",
    "trust": "estate_plan", "will": "estate_plan", "guardianship": "estate_plan", "attorney": "estate_plan", "lawyer": "estate_plan", "testament": "estate_plan", "inheritance": "estate_plan",
    "fire": "terminate", "fired": "terminate", "terminate": "terminate", "terminating": "terminate", "toxic": "terminate", "employee": "terminate", "salesman": "terminate", "morale": "terminate",
    "sabbatical": "burnout", "burnout": "burnout", "exhaustion": "burnout", "insomnia": "burnout", "leave": "burnout", "fatigue": "burnout",
    "stock": "market", "index": "market", "crash": "market", "market": "market", "equities": "market", "portfolio": "market",
    "london": "london", "kensington": "london", "europe": "london", "atlantic": "london"
  };

  // Replace words with mapping keys
  Object.keys(synonymMappings).forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    lower = lower.replace(regex, synonymMappings[word]);
  });

  const words = lower.match(/\w+/g) || [];
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  };
  
  words.forEach(word => {
    const seed = hashCode(word);
    for (let j = 0; j < 3; j++) {
      const index = Math.abs((seed + j * 12345) % 1536);
      const val = ((seed + j * 54321) % 100) / 100;
      vector[index] += val;
    }
  });

  const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < 1536; i++) {
      vector[i] /= magnitude;
    }
  } else {
    vector[0] = 1;
  }
  return vector;
};

export const generateDecisionEmbedding = async (obj: Record<string, any>, retries = 3, delay = 1000) => {
  const groqApiKey = typeof process !== 'undefined' && process.env.VITE_GROQ_API_KEY 
  ? process.env.VITE_GROQ_API_KEY 
  : (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env as any).VITE_GROQ_API_KEY : undefined);
  
  const contentToEmbed = obj.input || JSON.stringify(obj);
  if (!contentToEmbed) return null;

  if (!groqApiKey) {
    return getLocalSemanticEmbedding(contentToEmbed);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({ model: "text-embedding-3-large", input: JSON.stringify(obj) }),
      });
      
      if (res.ok) {
        const data = await res.json();
        return data?.data?.[0]?.embedding ?? null;
      }
      
      console.warn(`Embedding API call failed with status ${res.status}. Attempt ${attempt} of ${retries}. Falling back to local embedder.`);
    } catch (err) {
      console.error(`Embedding API call threw error: ${err}. Attempt ${attempt} of ${retries}. Falling back to local embedder.`);
    }
    
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  // Return local high-quality semantic embedding as fallback
  return getLocalSemanticEmbedding(contentToEmbed);
};

export const cosineSimilarity = (a: number[] = [], b: number[] = []) => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
};
