export interface JudgeScores {
  personalization_score?: number;
  memory_utilization_score?: number;
  actionability_score?: number;
  consistency_score?: number;
  hallucination_flag?: number;
  memories_used_correctly?: string[];
  true_positives?: number;
  false_negatives?: number;
  false_positives?: number;
}

export interface IJudge {
  name: string;
  evaluateExtraction(expected: any, actual: string[], apiKey: string): Promise<JudgeScores | null>;
  evaluateE2E(query: string, memories: any[], response: string, expectedTraits: string[], apiKey: string): Promise<JudgeScores | null>;
}

export class GroqJudge implements IJudge {
  name: string;
  model: string;

  constructor(name: string, model: string = "llama-3.3-70b-versatile") {
    this.name = name;
    this.model = model;
  }

  async evaluateExtraction(expected: any, actual: string[], apiKey: string): Promise<JudgeScores | null> {
    const prompt = `
You are an expert evaluator for an AI Memory Extraction system.
Your job is to compare the EXPECTED structured memories/decisions with the ACTUAL extracted strings.

EXPECTED JSON:
${JSON.stringify(expected, null, 2)}

ACTUAL EXTRACTED ITEMS:
${JSON.stringify(actual, null, 2)}

Determine:
1. True Positives (TP): How many EXPECTED items are meaningfully present in the ACTUAL items?
2. False Negatives (FN): How many EXPECTED items are missing from the ACTUAL items?
3. False Positives (FP): How many ACTUAL items were extracted that do not align with any EXPECTED item?

Output strict JSON:
{
  "true_positives": number,
  "false_negatives": number,
  "false_positives": number
}
`;
    return this.callGroq(prompt, apiKey);
  }

  async evaluateE2E(query: string, memories: any[], response: string, expectedTraits: string[], apiKey: string): Promise<JudgeScores | null> {
    const prompt = `
You are an expert evaluator for an AI Digital Twin simulator.
Your job is to score the AI's response based on the query, the provided context memories, and the expected traits.

QUERY: "${query}"

AVAILABLE MEMORIES:
${JSON.stringify(memories, null, 2)}

FINAL AI RESPONSE:
"${response}"

EXPECTED BEHAVIORAL TRAITS:
${JSON.stringify(expectedTraits, null, 2)}

Score the response strictly on the following dimensions:
1. personalization_score (1-5): How uniquely tailored is the response to the user's memories?
2. memory_utilization_score (1-5): Did the AI effectively weave the available memories into the response naturally?
3. actionability_score (1-5): Does the response offer clear, practical follow-up or insight?
4. consistency_score (1-5): Does the response align with the expected behavioral traits?
5. hallucination_flag (0 or 1): Is there any hallucinated fact (1) or is it fully grounded (0)?
6. memories_used_correctly (Array of Strings): List the exact IDs of the available memories that were successfully referenced.

Output strict JSON:
{
  "personalization_score": number,
  "memory_utilization_score": number,
  "actionability_score": number,
  "consistency_score": number,
  "hallucination_flag": number,
  "memories_used_correctly": []
}
`;
    return this.callGroq(prompt, apiKey);
  }

  private async callGroq(prompt: string, apiKey: string): Promise<JudgeScores | null> {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });
      const data = await res.json();
      if (!data.choices) return null;
      return JSON.parse(data.choices[0].message.content);
    } catch (err) {
      return null;
    }
  }
}

export class JudgeFactory {
  static getJudges(): IJudge[] {
    // Return Judge A (Self) and Judge B (Independent)
    return [
      new GroqJudge("Judge A (Llama 3.3 70b)", "llama-3.3-70b-versatile"),
      new GroqJudge("Judge B (Mixtral 8x7b)", "mixtral-8x7b-32768")
    ];
  }
}
