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
  count: number = 8,
  language?: string,
  region?: string
): Promise<GeneratedPrompt[]> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return heuristicPrompts(topic, count, language, region);
    }

    const { openai } = await import("./client");

    const system = `You generate REALISTIC prompts that ACTUAL BUYERS would type when they're actively looking for solutions to buy. These are NOT educational questions - they're purchase-intent queries from people who need to make decisions NOW.

CRITICAL: Generate prompts that reflect REAL BUYER BEHAVIOR - people looking to purchase, compare, or evaluate solutions, not learn about concepts.

**LANGUAGE COMPLIANCE IS MANDATORY**: Write ALL prompts in the exact target language specified.

BUYER INTENT PATTERNS (focus on these):
1. **COMPARISON DECISIONS**: "Should I choose X or Y?", "What's better between A and B?", "Comparing X vs Y for my situation"
2. **IMMEDIATE PROBLEM-SOLVING**: "I need X to solve Y problem", "My current solution isn't working, what are alternatives?", "I'm looking for X that does Y"
3. **PURCHASE EVALUATION**: "What should I look for when buying X?", "What are the key features I need in X?", "What's a reasonable price for X?"
4. **IMPLEMENTATION DECISIONS**: "How hard is it to switch from X to Y?", "What do I need to know before implementing X?", "Can X work with my existing Y?"
5. **SPECIFIC CONTEXT NEEDS**: "I have a 50-person company that needs X", "For a small business in Spain, what X options exist?", "I need X that handles GDPR compliance"

PROMPT QUALITY REQUIREMENTS:
- Sound like someone ACTIVELY SHOPPING/EVALUATING options (use "I need", "I'm looking for", "I want to compare", "Should I choose")
- Include SPECIFIC context (company size, industry, location, current situation)
- Reflect URGENCY or IMMEDIATE NEED (not theoretical learning)
- Ask about DECISIONS, COMPARISONS, or SPECIFIC SOLUTIONS
- Use natural, conversational language in the target language
- Length: 8-25 words (enough to include context)

STRICTLY AVOID:
- Educational/how-to questions ("Clientes me recomiendan...?")
- Generic advice-seeking ("¿Qué estrategias...?", "¿Cuáles son las mejores prácticas...?")
- Theoretical questions about concepts
- Questions that sound like marketing research or SEO queries
- Overly formal or academic language
- Questions without purchase intent or decision context`;

    const targetLanguage = language || "English";
    const targetRegion = region || "United States";

    const user = `
Topic: ${topic.name}
Category: ${topic.category || "unknown"}
Keywords: ${(topic.keywords || []).join(", ")}
Description: ${topic.description || ""}
Target Language: ${targetLanguage}
Target Region: ${targetRegion}

TASK: Generate EXACTLY ${count} prompts that ACTUAL BUYERS would ask when they're actively looking to purchase or evaluate solutions related to this topic.

CRITICAL REQUIREMENTS:
1. **LANGUAGE**: Write EVERYTHING in ${targetLanguage} - use natural, conversational ${targetLanguage}
2. **BUYER INTENT**: Each prompt must reflect someone ACTIVELY SHOPPING/EVALUATING/DECIDING, not learning
3. **SPECIFIC CONTEXT**: Include realistic details (company size, industry, location in ${targetRegion}, current situation)
4. **DECISION-FOCUSED**: Focus on comparisons, evaluations, purchase decisions, implementation concerns
5. **LENGTH**: 8-25 words to include context and specificity

GOOD PROMPT EXAMPLES (reflect active buyer behavior):
English:
- "I'm comparing Stripe vs PayPal for my e-commerce store, which is better for European customers"
- "I need an invoicing system that works with NetSuite, what are my options"
- "My company has 100 employees, should I get Salesforce or HubSpot for CRM"
- "I'm spending too much on manual invoice processing, what automated solutions should I consider"

Spanish (${targetLanguage === "Spanish" ? "USE THIS STYLE" : "example for reference"}):
- "Estoy comparando entre X e Y para mi tienda online, ¿cuál es mejor para clientes españoles?"
- "Necesito un sistema de facturación que funcione con mi ERP actual, ¿qué opciones tengo?"
- "Mi empresa tiene 50 empleados, ¿debería elegir X o Y para gestión de proyectos?"
- "Estoy gastando mucho tiempo en tareas manuales, ¿qué herramientas automatizadas debería considerar?"

BAD PROMPT EXAMPLES (avoid these - they're too generic or educational):
- "¿Cómo puedo mejorar el reconocimiento de mi marca?" (too generic, no purchase intent)
- "¿Qué estrategias recomiendas para X?" (advice-seeking, not buyer behavior)
- "¿Cuáles son las mejores prácticas para Y?" (educational, not purchase decision)
- "mejores soluciones de X" (keyword-stuffy, no context)

Generate prompts that sound like someone actively SHOPPING or EVALUATING solutions right now, with specific context about their situation.

Return ONLY JSON: { "prompts": ["..."] }
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7, // Higher temperature for more natural, varied prompts
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const content = resp.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    const prompts: string[] = Array.isArray(parsed.prompts)
      ? parsed.prompts
      : [];

    if (prompts.length === 0)
      return heuristicPrompts(topic, count, language, region);

    return prompts.slice(0, count).map((text) => ({
      text,
      topic: topic.name,
      category: topic.category || undefined,
    }));
  } catch {
    return heuristicPrompts(topic, count, language, region);
  }
}

export async function generatePromptsForTopics(
  topics: TopicLike[],
  countPerTopic: number = 8,
  language?: string,
  region?: string
): Promise<GeneratedPrompt[]> {
  const results: GeneratedPrompt[] = [];
  for (const t of topics) {
    const ps = await generatePromptsForTopic(
      t,
      countPerTopic,
      language,
      region
    );
    results.push(...ps);
  }
  return results;
}

function heuristicPrompts(
  topic: TopicLike,
  count: number,
  language?: string,
  region?: string
): GeneratedPrompt[] {
  const base = topic.name.toLowerCase();
  const k = (topic.keywords || []).slice(0, 2).join(" ");
  const isSpanish =
    language?.toLowerCase().includes("spanish") ||
    language?.toLowerCase() === "español";

  // Buyer-intent focused prompts - reflect active shopping/evaluation
  const seeds = isSpanish
    ? [
        `Estoy comparando opciones para ${base}, ¿qué debería considerar ${k}`.trim(),
        `Necesito una solución de ${base} para mi empresa, ¿qué opciones hay ${k}`.trim(),
        `Mi empresa actualmente usa X pero necesito cambiar a algo mejor para ${base}, ¿qué me recomiendas ${k}`.trim(),
        `Estoy buscando herramientas de ${base} que funcionen con mi sistema actual ${k}`.trim(),
        `¿Cuánto debería esperar pagar por una solución de ${base} para una pyme ${k}`.trim(),
        `Estoy evaluando entre dos opciones para ${base}, ¿cuál es mejor para mi caso ${k}`.trim(),
        `Necesito ayuda para elegir la mejor herramienta de ${base} para mi situación ${k}`.trim(),
        `¿Qué características son esenciales en una solución de ${base} ${k}`.trim(),
        `Mi empresa tiene problemas con ${base}, ¿qué alternativas debería considerar ${k}`.trim(),
        `Estoy investigando opciones de ${base} para implementar este año, ¿qué debo saber ${k}`.trim(),
      ]
    : [
        `I'm comparing options for ${base}, what should I consider ${k}`.trim(),
        `I need a ${base} solution for my company, what options exist ${k}`.trim(),
        `My company currently uses X but I need something better for ${base}, what do you recommend ${k}`.trim(),
        `I'm looking for ${base} tools that work with my current system ${k}`.trim(),
        `What should I expect to pay for a ${base} solution for a small business ${k}`.trim(),
        `I'm evaluating between two options for ${base}, which is better for my case ${k}`.trim(),
        `I need help choosing the best ${base} tool for my situation ${k}`.trim(),
        `What features are essential in a ${base} solution ${k}`.trim(),
        `My company has issues with ${base}, what alternatives should I consider ${k}`.trim(),
        `I'm researching ${base} options to implement this year, what should I know ${k}`.trim(),
      ];

  return seeds.slice(0, count).map((text) => ({
    text,
    topic: topic.name,
    category: topic.category || undefined,
  }));
}
