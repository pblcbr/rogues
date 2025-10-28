export async function embedTexts(texts: string[]): Promise<number[][]> {
  try {
    const { openai } = await import("@/lib/openai/client");
    const input = texts.map((t) => t || "");
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input,
    });
    return res.data.map((d: any) => d.embedding as number[]);
  } catch {
    return [];
  }
}

export function cosine(a: number[], b: number[]): number | null {
  if (!a || !b || a.length !== b.length || a.length === 0) return null;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}
