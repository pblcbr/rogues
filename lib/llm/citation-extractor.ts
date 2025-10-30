/**
 * Citation Extraction from LLM Responses
 * Extracts and analyzes URLs cited in AI responses
 */

export interface Citation {
  url: string;
  title: string | null;
  domain: string;
  faviconUrl: string | null;
  position: number; // 1 = first cited, 2 = second, etc.
  firstOccurrence: number; // Character index in response
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Generate favicon URL from domain
 */
function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/**
 * Find all URLs in text
 * Matches http(s):// URLs and common patterns
 */
function findUrls(text: string): Array<{ url: string; position: number }> {
  const urlPattern = /https?:\/\/[^\s\)>\]]+/gi;
  const matches: Array<{ url: string; position: number }> = [];

  let match;
  while ((match = urlPattern.exec(text)) !== null) {
    // Clean up URL (remove trailing punctuation)
    let url = match[0];
    url = url.replace(/[.,;:!?]+$/, "");

    matches.push({
      url,
      position: match.index,
    });
  }

  return matches;
}

/**
 * Extract citations from markdown-style links [text](url)
 */
function findMarkdownCitations(text: string): Array<{
  url: string;
  title: string;
  position: number;
}> {
  const markdownPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;
  const citations: Array<{ url: string; title: string; position: number }> = [];

  let match;
  while ((match = markdownPattern.exec(text)) !== null) {
    const title = match[1];
    let url = match[2];

    // Clean up URL
    url = url.replace(/[.,;:!?]+$/, "");

    citations.push({
      url,
      title,
      position: match.index,
    });
  }

  return citations;
}

/**
 * Extract citations from numbered references like [1], [2], etc.
 * Often used by LLMs with a references section at the end
 */
function findNumberedReferences(text: string): Map<number, string> {
  const refMap = new Map<number, string>();

  // Look for patterns like:
  // [1] https://example.com
  // [1]: https://example.com
  // 1. https://example.com
  const refPattern = /(?:\[(\d+)\]|(\d+)\.)\s*(https?:\/\/[^\s\)>\]]+)/gi;

  let match;
  while ((match = refPattern.exec(text)) !== null) {
    const refNum = parseInt(match[1] || match[2]);
    let url = match[3];
    url = url.replace(/[.,;:!?]+$/, "");
    refMap.set(refNum, url);
  }

  return refMap;
}

/**
 * Extract all citations from LLM response text
 *
 * @param responseText - Full LLM response text
 * @param llmProvider - LLM provider name (for provider-specific parsing)
 * @returns Array of citations with details
 */
export function extractCitations(
  responseText: string,
  llmProvider: string = "openai"
): Citation[] {
  if (!responseText) {
    return [];
  }

  const citations: Citation[] = [];
  const seenUrls = new Set<string>();

  // 1. Extract markdown-style citations (often includes titles)
  const markdownCitations = findMarkdownCitations(responseText);
  for (const mc of markdownCitations) {
    if (seenUrls.has(mc.url)) continue;

    const domain = extractDomain(mc.url);
    citations.push({
      url: mc.url,
      title: mc.title,
      domain,
      faviconUrl: getFaviconUrl(domain),
      position: 0, // Will be recalculated
      firstOccurrence: mc.position,
    });
    seenUrls.add(mc.url);
  }

  // 2. Extract plain URLs
  const plainUrls = findUrls(responseText);
  for (const pu of plainUrls) {
    if (seenUrls.has(pu.url)) continue;

    const domain = extractDomain(pu.url);
    citations.push({
      url: pu.url,
      title: null,
      domain,
      faviconUrl: getFaviconUrl(domain),
      position: 0, // Will be recalculated
      firstOccurrence: pu.position,
    });
    seenUrls.add(pu.url);
  }

  // Sort by first occurrence
  citations.sort((a, b) => a.firstOccurrence - b.firstOccurrence);

  // Assign positions (1-indexed)
  citations.forEach((citation, index) => {
    citation.position = index + 1;
  });

  return citations;
}

/**
 * Get unique domains from citations
 */
export function getUniqueDomains(citations: Citation[]): string[] {
  const domains = new Set<string>();
  for (const citation of citations) {
    domains.add(citation.domain);
  }
  return Array.from(domains);
}

/**
 * Check if our website is cited
 */
export function isOurWebsiteCited(
  citations: Citation[],
  ourWebsite: string
): boolean {
  if (!ourWebsite) return false;

  const ourDomain = extractDomain(ourWebsite);
  return citations.some((c) => c.domain === ourDomain);
}

/**
 * Count citations per domain
 */
export function countCitationsPerDomain(
  citations: Citation[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const citation of citations) {
    counts[citation.domain] = (counts[citation.domain] || 0) + 1;
  }

  return counts;
}

/**
 * Get best (earliest) citation position for our website
 */
export function getOurBestCitationPosition(
  citations: Citation[],
  ourWebsite: string
): number | null {
  if (!ourWebsite) return null;

  const ourDomain = extractDomain(ourWebsite);
  const ourCitations = citations.filter((c) => c.domain === ourDomain);

  if (ourCitations.length === 0) return null;

  return Math.min(...ourCitations.map((c) => c.position));
}
