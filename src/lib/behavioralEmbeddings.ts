export const generateDecisionEmbedding = async (obj: Record<string, any>) => {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!groqApiKey) return null;
  const input = JSON.stringify(obj);
  if (!input) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({ model: "text-embedding-3-large", input }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.error("generateDecisionEmbedding error", err);
    return null;
  }
};

export const cosineSimilarity = (a: number[] = [], b: number[] = []) => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
};
