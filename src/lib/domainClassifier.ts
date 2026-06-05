export interface DomainClassification {
  primaryDomain: string;
  secondaryDomain: string;
  confidence: number;
}

const DOMAIN_RULES: Record<string, string[]> = {
  "Marriage": ["marry", "marriage", "wedding", "husband", "wife", "spouse", "fiance", "fiancé", "fiancée", "wed"],
  "Relationships": ["relationship", "girlfriend", "boyfriend", "partner", "dating", "breakup", "divorce", "couple", "lover"],
  "Family": ["family", "parents", "mother", "father", "kids", "children", "son", "daughter", "brother", "sister", "ancestral", "ancestor", "relatives", "sibling"],
  "Career": ["career", "job", "work", "promotion", "boss", "company", "interview", "hiring", "resume", "salary", "employer", "quit", "colleague", "coworker"],
  "Startup": ["startup", "founder", "co-founder", "venture", "seed", "funding", "investor", "equity", "bootstrapping"],
  "Entrepreneurship": ["business", "entrepreneur", "own business", "launch", "product", "hustle"],
  "Finance": ["finance", "money", "savings", "invest", "investment", "debt", "budget", "salary", "wealth", "retire", "pension", "fund"],
  "Property": ["property", "house", "home", "real estate", "mortgage", "rent", "buy a house", "sell", "land", "apartment", "condo"],
  "Legacy": ["legacy", "heirloom", "inherit", "inheritance", "pass down", "generation", "ancestral", "will", "estate"],
  "Health": ["health", "medical", "sick", "illness", "doctor", "disease", "treatment", "surgery", "fitness", "diet", "mental health", "therapy"],
  "Education": ["education", "degree", "college", "university", "school", "masters", "phd", "study", "student", "learn", "course"],
  "Life Purpose": ["purpose", "meaning", "passion", "fulfill", "life goal", "move abroad", "relocate", "travel", "explore", "happiness", "calling"]
};

const extractRuleBasedDomains = (query: string): DomainClassification | null => {
  const lowerQuery = query.toLowerCase();
  
  const scores: Record<string, number> = {};
  
  Object.keys(DOMAIN_RULES).forEach(domain => scores[domain] = 0);

  // Score matching
  Object.entries(DOMAIN_RULES).forEach(([domain, keywords]) => {
    keywords.forEach(keyword => {
      // Use regex to match whole words or phrases, allowing punctuation
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerQuery)) {
        scores[domain] += 1.0;
      } else if (lowerQuery.includes(keyword)) {
        // Partial match with lower weight
        scores[domain] += 0.5;
      }
    });
  });

  const sortedDomains = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedDomains.length === 0) {
    return null;
  }

  const primaryDomain = sortedDomains[0][0];
  const primaryScore = sortedDomains[0][1];
  
  const secondaryDomain = sortedDomains.length > 1 ? sortedDomains[1][0] : "Unknown";
  const secondaryScore = sortedDomains.length > 1 ? sortedDomains[1][1] : 0;

  // Calculate confidence based on score magnitude and margin
  let confidence = 0.5;
  if (primaryScore >= 2.0) confidence += 0.3;
  else if (primaryScore >= 1.0) confidence += 0.15;
  
  if (primaryScore - secondaryScore >= 1.0) confidence += 0.1; // Clear winner

  confidence = Math.min(confidence, 0.95);

  const result = {
    primaryDomain,
    secondaryDomain,
    confidence
  };

  console.log("RULE_DOMAIN_RESULT", result);
  return result;
};

export const classifyDomain = async (query: string, apiKey: string): Promise<DomainClassification> => {
  // 1. Try Offline Rule-Based Extraction First
  const ruleResult = extractRuleBasedDomains(query);
  
  // 2. If confidence is high enough, bypass LLM entirely
  if (ruleResult && ruleResult.confidence >= 0.60) {
    console.log("FINAL_DOMAIN_RESULT", ruleResult);
    return ruleResult;
  }

  // 3. Fallback to LLM if rule result is weak or null
  if (!apiKey) {
    const fallback = ruleResult || { primaryDomain: "General", secondaryDomain: "Unknown", confidence: 0.5 };
    console.log("FINAL_DOMAIN_RESULT", fallback);
    return fallback;
  }

  const prompt = `
Analyze the following user query and classify it into its primary and secondary life domains.
Possible domains include (but are not limited to):
- Career
- Relationships
- Marriage
- Family
- Finance
- Startup
- Entrepreneurship
- Legacy
- Property
- Education
- Health
- Life Purpose

Query: "${query}"

Output a raw JSON object with exactly this structure:
{
  "primaryDomain": "Primary Domain",
  "secondaryDomain": "Secondary Domain",
  "confidence": 0.95
}
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const rawJson = jsonMatch ? jsonMatch[0] : text;
        const parsed = JSON.parse(rawJson);
        const llmResult = {
          primaryDomain: parsed.primaryDomain || ruleResult?.primaryDomain || "General",
          secondaryDomain: parsed.secondaryDomain || ruleResult?.secondaryDomain || "Unknown",
          confidence: parsed.confidence || 0.5
        };
        console.log("LLM_DOMAIN_RESULT", llmResult);
        console.log("FINAL_DOMAIN_RESULT", llmResult);
        return llmResult;
      }
    } else {
        console.warn(`Groq classification failed: HTTP ${response.status}`);
    }
  } catch (err) {
    console.error("Domain classification failed", err);
  }

  const fallback = ruleResult || { primaryDomain: "General", secondaryDomain: "Unknown", confidence: 0.5 };
  console.log("LLM_DOMAIN_RESULT", "FAILED");
  console.log("FINAL_DOMAIN_RESULT", fallback);
  return fallback;
};
