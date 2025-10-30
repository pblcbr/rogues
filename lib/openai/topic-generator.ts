type TopicCategory =
  | "awareness"
  | "consideration"
  | "decision"
  | "retention"
  | "advocacy";

type TopicPriority = "high" | "medium" | "low";

export interface GeneratedTopic {
  name: string;
  description: string;
  category: TopicCategory;
  estimated_prompts: number;
  priority: TopicPriority;
  keywords: string[];
  why_it_matters: string;
}

interface DomainProfile {
  summary: string;
}

interface GenerationResult {
  domain_profile: DomainProfile;
  topics: GeneratedTopic[];
}

interface GenerationContext {
  icps?: string;
  use_cases?: string;
  integrations?: string;
  regions_languages?: string;
  entities_or_standards?: string;
  competitors?: string;
  exclusions?: string;
}

interface GenerationOptions {
  count?: number;
  brandHint?: string;
  context?: GenerationContext;
}

/**
 * Banned generic terms for topics
 */
const BANNED_GENERIC_TERMS = [
  "general services",
  "basic information",
  "standard features",
  "common questions",
];

/**
 * Check if a topic name is too generic
 */
function isGenericTopic(name: string): boolean {
  const lower = name.toLowerCase();
  return BANNED_GENERIC_TERMS.some((term) => lower.includes(term));
}

/**
 * Deduplicate topics by name
 */
function dedupeByName<T extends { name: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Extract domain from email address
 * @param email - Email address
 * @returns Domain without TLD (e.g., "acme" from "user@acme.com")
 */
export function extractDomain(email: string): string {
  const match = email.match(/@(.+)\./);
  return match ? match[1] : "";
}

/**
 * Generates high-quality, specific monitoring topics for AEO
 * Uses GPT-4o to identify topic categories that matter for the domain
 *
 * @param domain - Company domain (e.g., "taclia.com")
 * @param opts - Optional parameters (count, brandHint, context)
 * @returns Generation result with domain profile and topics
 */
export async function generateTopicsForDomain(
  domain: string,
  opts?: GenerationOptions
): Promise<GenerationResult> {
  const count = opts?.count ?? 10;

  // Infer primary country/region from context/brand/domain
  const inferredCountry = ((): string | null => {
    const signal = `${domain} ${opts?.brandHint || ""} ${Object.values(
      opts?.context || {}
    ).join(" ")}`;
    return inferCountry(signal, domain);
  })();

  try {
    // Debug: Log environment variable status
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("[OpenAI] Debug - API Key check:", {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey?.substring(0, 10) || "none",
      env: process.env.NODE_ENV,
    });

    // Check if OpenAI API key is configured
    if (!apiKey) {
      console.warn("[OpenAI] API key not configured. Using fallback prompts.");
      console.warn(
        "[OpenAI] To enable AI-generated topics, add OPENAI_API_KEY to your .env.local file"
      );
      return {
        domain_profile: {
          summary: "Generic fallback topics (OpenAI not configured)",
        },
        topics: getFallbackTopics(count),
      };
    }

    // Import OpenAI client only when needed (server-side)
    console.log("[OpenAI] Importing OpenAI client...");
    const { openai } = await import("./client");

    console.log(`[OpenAI] Generating topics for domain: ${domain}`);

    const systemPrompt = `You are an AEO (Answer Engine Optimization) strategist specialized in identifying strategic TOPIC CATEGORIES for monitoring brand visibility in AI search engines (ChatGPT, Claude, Gemini, Perplexity, Bing Copilot).

YOUR GOAL:
Generate topics that represent REAL SCENARIOS where customers would naturally ask questions in AI chat interfaces, and where the brand should appear in responses. These topics will generate monitoring prompts that measure actual brand visibility.

WHAT IS A TOPIC:
- A topic is a SPECIFIC SCENARIO or USE CASE where buyers would ask questions in ChatGPT/Claude
- Each topic represents a real-world situation where brand visibility matters
- Topics should be concrete, specific to the industry/domain, not abstract categories
- Each topic will generate 8-12 prompts that customers actually ask in LLMs

CRITICAL RULES:
- NO generic topics like "Brand Awareness", "General Information", "Basic Services"
- Topics must be SPECIFIC scenarios tied to the domain's actual business
- Think: "In what REAL situations would someone ask ChatGPT about this domain/brand?"
- Focus on action-oriented scenarios: solving problems, making decisions, comparing options
- Include industry-specific terminology, competitor names, technical terms relevant to the domain

TOPIC QUALITY CRITERIA:
1. SPECIFICITY: "NetSuite Invoice Automation for Manufacturing" NOT "Invoice Automation"
2. CONTEXT: "Pricing for 50-person SaaS companies" NOT "Pricing Information"
3. USE CASE: "Migrating from QuickBooks to Modern AP Software" NOT "Integration Topics"
4. REALITY: Topics should reflect actual buyer journeys in this industry
5. VISIBILITY OPPORTUNITY: Each topic should have scenarios where the brand could/should be mentioned

COVERAGE REQUIREMENTS:
- Problem-solving scenarios (how do I solve X with Y?)
- Comparison scenarios (what's the best option for X? compare A vs B)
- Decision scenarios (should I choose X or Y? what should I know about X?)
- Implementation scenarios (how do I set up X? what do I need for X?)
- Industry-specific scenarios (compliance, certifications, standards relevant to domain)

OUTPUT:
- First, produce a DOMAIN PROFILE (max 120 words) analyzing: industry, target customers, main pain points, competitive landscape, key differentiators
- Then produce EXACTLY N topics following the JSON schema

EXAMPLES (DO NOT COPY - adapt based on domain context):

For a B2B SaaS Invoice Automation Tool:
1. "ROI Calculation for Automated Invoice Processing in Mid-Market Companies" | category: awareness | priority: high
2. "NetSuite vs SAP Invoice Automation Integration Options" | category: consideration | priority: high  
3. "EU e-Invoicing Compliance Requirements & Solution Vendors" | category: consideration | priority: high
4. "Implementation Timeline & Costs for AP Automation Tools" | category: decision | priority: high
5. "Comparing Tipalti vs Bill.com for International Payment Processing" | category: consideration | priority: high

For an E-commerce Platform:
1. "Shopify Store Migration Guide & Recommended Agencies" | category: awareness | priority: high
2. "Best Payment Gateways for High-Volume D2C Brands" | category: consideration | priority: high
3. "Multi-Channel Inventory Sync Solutions (Shopify, Amazon, eBay)" | category: consideration | priority: medium
4. "E-commerce Platform Pricing Comparison for $1M+ Revenue Stores" | category: decision | priority: high`;

    const ctx = opts?.context;
    const regionsLanguages = ctx?.regions_languages
      ? ctx.regions_languages
      : inferredCountry
        ? `${inferredCountry}`
        : "global, English";
    const userPrompt = `Domain: ${domain}
Brand hint (optional): ${opts?.brandHint || ""}
Known context (optional):
- Primary ICPs: ${ctx?.icps || "infer from domain"}
- Core use cases: ${ctx?.use_cases || "infer from domain"}
- Key features/integrations: ${ctx?.integrations || "infer from domain"}
- Regions/languages: ${regionsLanguages}
- Must-mention entities/standards: ${ctx?.entities_or_standards || "infer relevant standards"}
- Known competitors (if any): ${ctx?.competitors || "infer from market"}

TASK:
1) Build a concise DOMAIN PROFILE (<=120 words) analyzing the business context.
2) Generate EXACTLY ${count} SPECIFIC, ACTIONABLE TOPICS that represent real buyer scenarios.

IMPORTANT: Each topic should be a SPECIFIC SCENARIO where:
- A real customer would ask ChatGPT/Claude a question
- The brand could/should appear in the AI's response
- The scenario is concrete and tied to actual industry problems/solutions

AVOID generic topics. FOCUS on specific, actionable scenarios.

Think like a customer: What problems are they solving? What decisions are they making? What information do they need?

CATEGORY GUIDANCE (distribute naturally):
- awareness: scenarios where customers discover solutions to problems
- consideration: scenarios where customers compare/evaluate options
- decision: scenarios where customers make purchase decisions
- retention: scenarios for existing customers
- advocacy: scenarios where customers recommend/share

PRIORITY GUIDANCE:
- High priority: Scenarios where brand visibility directly impacts sales/conversions
- Medium priority: Scenarios important for brand awareness/positioning
- Low priority: Nice-to-have scenarios for comprehensive monitoring

RETURN ONLY THIS JSON SCHEMA (no extra keys, no markdown):

{
  "domain_profile": {
    "summary": "string (<=120 words)"
  },
  "topics": [
    {
      "name": "string (topic name, 2-6 words, specific to domain)",
      "description": "string (1-2 sentences explaining what this topic covers)",
      "category": "awareness|consideration|decision|retention|advocacy",
      "estimated_prompts": "number (5-15, how many specific prompts this topic could generate)",
      "priority": "high|medium|low",
      "keywords": ["array of 3-6 relevant keywords/entities for this topic"],
      "why_it_matters": "string (1 sentence: why monitoring this topic is valuable for the brand)"
    }
  ]
}`;

    console.log("[OpenAI] 🚀 Calling OpenAI API...");
    console.log("[OpenAI] Model: gpt-4o");
    console.log("[OpenAI] Domain:", domain);
    console.log("[OpenAI] Count requested:", count);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // Lower for more consistent, specific output
      top_p: 0.3, // Reduce randomness
      presence_penalty: 0.0,
      frequency_penalty: 0.2, // Discourage repetition
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    console.log("[OpenAI] ✅ Response received from OpenAI");
    console.log("[OpenAI] Response ID:", response.id);
    console.log("[OpenAI] Model used:", response.model);
    console.log("[OpenAI] Tokens used:", response.usage?.total_tokens);

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    console.log("[OpenAI] Raw response received");
    console.log("[OpenAI] Content length:", content.length, "characters");

    const parsed = JSON.parse(content);
    let topics: GeneratedTopic[] = parsed.topics || [];
    const domainProfile: DomainProfile = parsed.domain_profile || {
      summary: "",
    };

    console.log("[OpenAI] Initial topics received:", topics.length);

    // Post-model validations
    const initialCount = topics.length;

    // Filter out generic topics
    topics = topics.filter((t) => {
      const isGen = isGenericTopic(t.name);
      if (isGen) {
        console.log("[OpenAI] ⚠️ Filtered generic topic:", t.name);
      }
      return !isGen;
    });

    console.log(
      `[OpenAI] After generic filter: ${topics.length}/${initialCount} topics kept`
    );

    // Deduplicate
    const beforeDedup = topics.length;
    topics = dedupeByName(topics);

    if (beforeDedup > topics.length) {
      console.log(
        `[OpenAI] ⚠️ Removed ${beforeDedup - topics.length} duplicate topics`
      );
    }

    // Enforce exact count
    if (topics.length > count) {
      console.log(`[OpenAI] Trimming from ${topics.length} to ${count} topics`);
      topics = topics.slice(0, count);
    }

    console.log(
      `[OpenAI] ✅ Successfully generated ${topics.length} high-quality topics for domain: ${domain}`
    );

    return {
      domain_profile: domainProfile,
      topics,
    };
  } catch (error) {
    console.error("[OpenAI] Error generating topics:", error);
    if (error instanceof Error) {
      console.error("[OpenAI] Error details:", error.message);
    }
    console.log("[OpenAI] Returning fallback topics");
    return {
      domain_profile: { summary: "Fallback topics due to error" },
      topics: getFallbackTopics(count, {
        domain,
        brandHint: opts?.brandHint,
        context: opts?.context,
        country: inferredCountry || undefined,
      }),
    };
  }
}

/**
 * Fallback topics if OpenAI fails
 */
type Sector =
  | "saas"
  | "ecommerce"
  | "services"
  | "healthcare"
  | "education"
  | "travel"
  | "generic";

function inferSector(input?: string): Sector {
  const s = (input || "").toLowerCase();
  if (
    /(shop|store|cart|retail|ecommerce|boutique|fashion|apparel|wear|shoes)/.test(
      s
    )
  )
    return "ecommerce";
  if (/(clinic|health|med|dental|pharma|care|wellness|hospital)/.test(s))
    return "healthcare";
  if (
    /(school|academy|edu|learning|course|university|college|bootcamp)/.test(s)
  )
    return "education";
  if (/(travel|hotel|hostel|flight|tour|booking|stay)/.test(s)) return "travel";
  if (/(software|saas|cloud|data|dev|tech|io|app)/.test(s)) return "saas";
  if (/(agency|consult|studio|services|repair|plumb|hvac|legal|law)/.test(s))
    return "services";
  return "generic";
}

// --- Country/Region inference helpers ---
const TLD_COUNTRY_MAP: Record<string, string> = {
  es: "Spain",
  fr: "France",
  de: "Germany",
  it: "Italy",
  pt: "Portugal",
  nl: "Netherlands",
  se: "Sweden",
  no: "Norway",
  dk: "Denmark",
  fi: "Finland",
  pl: "Poland",
  cz: "Czech Republic",
  at: "Austria",
  ch: "Switzerland",
  be: "Belgium",
  ie: "Ireland",
  uk: "United Kingdom",
  co_uk: "United Kingdom",
  us: "United States",
  ca: "Canada",
  mx: "Mexico",
  br: "Brazil",
  ar: "Argentina",
  cl: "Chile",
  au: "Australia",
  nz: "New Zealand",
  in: "India",
  sg: "Singapore",
  hk: "Hong Kong",
  jp: "Japan",
  kr: "South Korea",
};

function extractTld(domain?: string): string | null {
  if (!domain) return null;
  const d = domain.toLowerCase();
  if (d.endsWith(".co.uk")) return "co_uk";
  const parts = d.split(".");
  const tld = parts[parts.length - 1];
  return tld || null;
}

function inferCountry(signal: string, domain?: string): string | null {
  const s = signal.toLowerCase();
  for (const name of Object.values(TLD_COUNTRY_MAP)) {
    if (s.includes(name.toLowerCase())) return name;
  }
  if (/\buk\b|united kingdom|england|britain/.test(s)) return "United Kingdom";
  if (/\busa\b|united states|america/.test(s)) return "United States";
  if (/spain|españa/.test(s)) return "Spain";
  if (/france|français/.test(s)) return "France";

  const tld = extractTld(domain);
  if (tld && TLD_COUNTRY_MAP[tld]) return TLD_COUNTRY_MAP[tld];
  return null;
}

// Fallback topic seeds by sector
function getFallbackTopics(
  n = 10,
  args?: {
    domain?: string;
    brandHint?: string;
    context?: GenerationContext;
    country?: string;
  }
): GeneratedTopic[] {
  const signal = `${args?.domain || ""} ${args?.brandHint || ""} ${Object.values(
    args?.context || {}
  ).join(" ")}`;
  const sector = inferSector(signal);

  const allTopics: GeneratedTopic[] = [
    // Generic/Universal topics
    {
      name: "Brand Awareness & Recognition",
      description:
        "Monitor how your brand is mentioned and perceived in AI responses.",
      category: "awareness",
      estimated_prompts: 10,
      priority: "high",
      keywords: ["brand", "reputation", "mentions", "awareness"],
      why_it_matters:
        "Understanding brand visibility helps optimize positioning strategy.",
    },
    {
      name: "Product Comparisons",
      description:
        "Track how your products/services are compared to competitors.",
      category: "consideration",
      estimated_prompts: 12,
      priority: "high",
      keywords: ["comparison", "alternatives", "competitors", "vs"],
      why_it_matters:
        "Competitive intelligence reveals differentiation opportunities.",
    },
    {
      name: "Pricing & Value Proposition",
      description: "Analyze pricing inquiries and value perception questions.",
      category: "decision",
      estimated_prompts: 8,
      priority: "high",
      keywords: ["pricing", "cost", "value", "ROI"],
      why_it_matters: "Pricing queries are high-intent purchase signals.",
    },
    {
      name: "Customer Reviews & Testimonials",
      description: "Monitor questions about social proof and user experiences.",
      category: "consideration",
      estimated_prompts: 10,
      priority: "medium",
      keywords: ["reviews", "testimonials", "case studies", "feedback"],
      why_it_matters: "Social proof drives trust and conversion decisions.",
    },
    {
      name: "Use Case Discovery",
      description:
        "Identify how potential customers search for solutions to their problems.",
      category: "awareness",
      estimated_prompts: 15,
      priority: "high",
      keywords: ["use case", "solution", "how to", "workflow"],
      why_it_matters:
        "Understanding buyer problems helps capture early-stage demand.",
    },
    {
      name: "Technical Integration & Setup",
      description: "Track implementation and integration-related questions.",
      category: "consideration",
      estimated_prompts: 12,
      priority: "medium",
      keywords: ["integration", "API", "setup", "implementation"],
      why_it_matters:
        "Technical feasibility is a key decision factor for buyers.",
    },
    {
      name: "Compliance & Security",
      description:
        "Monitor compliance, security, and regulatory queries relevant to your industry.",
      category: "decision",
      estimated_prompts: 10,
      priority: "medium",
      keywords: ["compliance", "security", "GDPR", "certification"],
      why_it_matters:
        "Regulatory requirements are critical for enterprise buyers.",
    },
    {
      name: "Customer Support & Service",
      description:
        "Analyze questions about support quality and service levels.",
      category: "retention",
      estimated_prompts: 8,
      priority: "medium",
      keywords: ["support", "service", "help", "customer care"],
      why_it_matters: "Support quality affects retention and advocacy.",
    },
    {
      name: "Industry-Specific Solutions",
      description:
        "Track vertical or niche-specific queries for your target market.",
      category: "consideration",
      estimated_prompts: 12,
      priority: "medium",
      keywords: ["industry", "vertical", "sector", "niche"],
      why_it_matters:
        "Industry specialization signals differentiation and expertise.",
    },
    {
      name: "Feature Requests & Roadmap",
      description:
        "Monitor what features buyers are looking for in your category.",
      category: "advocacy",
      estimated_prompts: 10,
      priority: "low",
      keywords: ["features", "roadmap", "development", "updates"],
      why_it_matters: "Feature gaps reveal product development opportunities.",
    },
  ];

  // SaaS-specific topics
  const saasTopics: GeneratedTopic[] = [
    {
      name: "Platform Integrations & API",
      description:
        "Track questions about software integrations and API capabilities.",
      category: "consideration",
      estimated_prompts: 15,
      priority: "high",
      keywords: ["integrations", "API", "webhooks", "connectors"],
      why_it_matters: "Integration ecosystem is a key SaaS buying criterion.",
    },
    {
      name: "Pricing Tiers & Subscription Plans",
      description: "Monitor subscription model and pricing tier questions.",
      category: "decision",
      estimated_prompts: 12,
      priority: "high",
      keywords: ["subscription", "plans", "tiers", "billing"],
      why_it_matters: "SaaS pricing complexity requires clear visibility.",
    },
    {
      name: "Onboarding & Training Resources",
      description:
        "Analyze questions about getting started and learning curve.",
      category: "retention",
      estimated_prompts: 10,
      priority: "medium",
      keywords: ["onboarding", "training", "tutorials", "documentation"],
      why_it_matters: "Smooth onboarding reduces churn risk.",
    },
  ];

  // E-commerce-specific topics
  const ecommerceTopics: GeneratedTopic[] = [
    {
      name: "Shipping & Delivery Options",
      description:
        "Track questions about shipping policies, costs, and delivery times.",
      category: "decision",
      estimated_prompts: 12,
      priority: "high",
      keywords: ["shipping", "delivery", "tracking", "returns"],
      why_it_matters: "Shipping is a critical purchase decision factor.",
    },
    {
      name: "Return & Refund Policies",
      description: "Monitor return policy and refund-related inquiries.",
      category: "consideration",
      estimated_prompts: 10,
      priority: "medium",
      keywords: ["returns", "refunds", "exchanges", "policy"],
      why_it_matters: "Clear return policies reduce purchase hesitation.",
    },
    {
      name: "Product Quality & Materials",
      description:
        "Analyze product quality, materials, and durability questions.",
      category: "awareness",
      estimated_prompts: 12,
      priority: "medium",
      keywords: ["quality", "materials", "durability", "specs"],
      why_it_matters: "Product details influence purchase decisions.",
    },
  ];

  // Services-specific topics
  const servicesTopics: GeneratedTopic[] = [
    {
      name: "Service Delivery & Timeline",
      description:
        "Track questions about service scope and delivery timelines.",
      category: "decision",
      estimated_prompts: 10,
      priority: "high",
      keywords: ["timeline", "delivery", "scope", "process"],
      why_it_matters: "Delivery expectations impact service selection.",
    },
    {
      name: "Certifications & Expertise",
      description:
        "Monitor queries about qualifications and professional credentials.",
      category: "consideration",
      estimated_prompts: 10,
      priority: "medium",
      keywords: ["certifications", "expertise", "credentials", "experience"],
      why_it_matters: "Professional credentials build trust for services.",
    },
  ];

  // Select appropriate topic mix based on sector
  let sectorSpecific: GeneratedTopic[] = [];
  switch (sector) {
    case "saas":
      sectorSpecific = saasTopics;
      break;
    case "ecommerce":
      sectorSpecific = ecommerceTopics;
      break;
    case "services":
    case "healthcare":
    case "education":
      sectorSpecific = servicesTopics;
      break;
    default:
      sectorSpecific = [];
  }

  // Mix generic and sector-specific
  const combined = [...sectorSpecific, ...allTopics];

  // Return exactly n topics
  return combined.slice(0, n);
}

// Export for backward compatibility (not used, kept to avoid breaking imports)
export { getFallbackTopics };
