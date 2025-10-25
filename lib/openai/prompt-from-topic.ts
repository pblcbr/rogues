export interface TopicLike {
  name: string;
  description?: string;
  category?: string;
  keywords?: string[];
}

export interface GeneratedPrompt {
  text: string;
  topic?: string;
  category?: string;
}

/**
 * Generate monitoring prompts for a topic using OpenAI. Falls back to heuristics.
 */
export async function generatePromptsForTopic(
  topic: TopicLike,
  count: number = 8
): Promise<GeneratedPrompt[]> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return heuristicPrompts(topic, count);
    }

    const { openai } = await import("./client");

    const system =
      "You generate realistic, high-intent monitoring prompts for AI answer engines.";
    const user = `
Topic: ${topic.name}
Category: ${topic.category || "unknown"}
Keywords: ${(topic.keywords || []).join(", ")}
Description: ${topic.description || ""}

Task: Generate EXACTLY ${count} natural-language user prompts a buyer would ask in chat-based AI. 
Guidelines:
- 6–14 words each, no punctuation at the end
- Mix of comparison, solution, recommendation, pricing, integration, credibility
- High commercial intent when relevant
Return ONLY JSON: { "prompts": ["..."] }
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const content = resp.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    const prompts: string[] = Array.isArray(parsed.prompts)
      ? parsed.prompts
      : [];

    if (prompts.length === 0) return heuristicPrompts(topic, count);

    return prompts.slice(0, count).map((text) => ({
      text,
      topic: topic.name,
      category: topic.category,
    }));
  } catch {
    return heuristicPrompts(topic, count);
  }
}

export async function generatePromptsForTopics(
  topics: TopicLike[],
  countPerTopic: number = 8
): Promise<GeneratedPrompt[]> {
  const results: GeneratedPrompt[] = [];
  for (const t of topics) {
    const ps = await generatePromptsForTopic(t, countPerTopic);
    results.push(...ps);
  }
  return results;
}

function heuristicPrompts(topic: TopicLike, count: number): GeneratedPrompt[] {
  const base = topic.name.toLowerCase();
  const k = (topic.keywords || []).slice(0, 2).join(" ");
  const seeds = [
    `best ${base} solutions ${k}`.trim(),
    `${base} pricing and plans ${k}`.trim(),
    `top ${base} providers compared ${k}`.trim(),
    `how to implement ${base} ${k}`.trim(),
    `${base} integration guide ${k}`.trim(),
    `is ${base} compliant and secure ${k}`.trim(),
    `case studies for ${base} ${k}`.trim(),
    `${base} alternatives and competitors ${k}`.trim(),
    `roi of ${base} ${k}`.trim(),
    `recommended tools for ${base} ${k}`.trim(),
  ];
  return seeds.slice(0, count).map((text) => ({
    text,
    topic: topic.name,
    category: topic.category,
  }));
}
