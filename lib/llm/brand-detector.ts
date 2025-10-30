/**
 * Brand Detection in LLM Responses
 * Analyzes AI responses to detect brand mentions and their positions
 */

export interface BrandMention {
  brandName: string;
  position: number; // 1 = first mentioned, 2 = second, etc.
  firstOccurrence: number; // Character index of first occurrence
  isOurBrand: boolean;
}

export interface BrandAnalysis {
  ourBrandMentioned: boolean;
  ourBrandPosition: number | null;
  brandsDetected: BrandMention[];
  totalBrandsMentioned: number;
  relevancyScore: number; // 0-100: percentage indicating if our brand or competitors mentioned
}

/**
 * Normalize brand name for case-insensitive matching
 */
function normalizeBrandName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Find all occurrences of a brand in text
 * Returns array of character positions where brand is mentioned
 */
function findBrandOccurrences(text: string, brandName: string): number[] {
  const positions: number[] = [];
  const normalizedText = text.toLowerCase();
  const normalizedBrand = normalizeBrandName(brandName);

  let searchFrom = 0;
  while (true) {
    const index = normalizedText.indexOf(normalizedBrand, searchFrom);
    if (index === -1) break;

    // Check if it's a whole word match (not part of another word)
    const before = index > 0 ? normalizedText[index - 1] : " ";
    const after =
      index + normalizedBrand.length < normalizedText.length
        ? normalizedText[index + normalizedBrand.length]
        : " ";

    const isWholeWord =
      /[\s\.,;:!?\(\)\[\]\{\}"'`\-]/.test(before) &&
      /[\s\.,;:!?\(\)\[\]\{\}"'`\-]/.test(after);

    if (isWholeWord) {
      positions.push(index);
    }

    searchFrom = index + 1;
  }

  return positions;
}

/**
 * Detect all brands mentioned in the response text
 *
 * @param responseText - Full LLM response text
 * @param ourBrand - Our brand name
 * @param competitors - Array of competitor brand names
 * @returns BrandAnalysis with detected brands and their positions
 */
export function detectBrands(
  responseText: string,
  ourBrand: string,
  competitors: string[]
): BrandAnalysis {
  if (!responseText || !ourBrand) {
    return {
      ourBrandMentioned: false,
      ourBrandPosition: null,
      brandsDetected: [],
      totalBrandsMentioned: 0,
      relevancyScore: 0,
    };
  }

  // Collect all brands to check (ours + competitors)
  const allBrands = [
    { name: ourBrand, isOurs: true },
    ...competitors.map((name) => ({ name, isOurs: false })),
  ];

  // Find first occurrence of each brand
  const brandOccurrences: Array<{
    brandName: string;
    firstOccurrence: number;
    isOurBrand: boolean;
  }> = [];

  for (const brand of allBrands) {
    const occurrences = findBrandOccurrences(responseText, brand.name);
    if (occurrences.length > 0) {
      brandOccurrences.push({
        brandName: brand.name,
        firstOccurrence: occurrences[0],
        isOurBrand: brand.isOurs,
      });
    }
  }

  // Sort by first occurrence to determine position
  brandOccurrences.sort((a, b) => a.firstOccurrence - b.firstOccurrence);

  // Assign positions
  const brandsDetected: BrandMention[] = brandOccurrences.map(
    (brand, index) => ({
      brandName: brand.brandName,
      position: index + 1,
      firstOccurrence: brand.firstOccurrence,
      isOurBrand: brand.isOurBrand,
    })
  );

  // Find our brand details
  const ourBrandMention = brandsDetected.find((b) => b.isOurBrand);
  const ourBrandMentioned = ourBrandMention !== undefined;
  const ourBrandPosition = ourBrandMention?.position || null;

  // Calculate relevancy score
  // 100 if our brand mentioned, 50 if only competitors, 0 if none
  let relevancyScore = 0;
  if (ourBrandMentioned) {
    relevancyScore = 100;
  } else if (brandsDetected.length > 0) {
    relevancyScore = 50;
  }

  return {
    ourBrandMentioned,
    ourBrandPosition,
    brandsDetected,
    totalBrandsMentioned: brandsDetected.length,
    relevancyScore,
  };
}

/**
 * Extract simple brand names array and positions object
 * Useful for storing in database
 */
export function extractBrandData(analysis: BrandAnalysis): {
  brandNames: string[];
  brandPositions: Record<string, number>;
} {
  const brandNames = analysis.brandsDetected.map((b) => b.brandName);
  const brandPositions: Record<string, number> = {};

  for (const brand of analysis.brandsDetected) {
    brandPositions[brand.brandName] = brand.position;
  }

  return { brandNames, brandPositions };
}

/**
 * Calculate competitor mention counts from multiple analyses
 * Useful for aggregating data at topic level
 */
export function aggregateCompetitorMentions(
  analyses: BrandAnalysis[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const analysis of analyses) {
    for (const brand of analysis.brandsDetected) {
      if (!brand.isOurBrand) {
        counts[brand.brandName] = (counts[brand.brandName] || 0) + 1;
      }
    }
  }

  return counts;
}

/**
 * Calculate average positions for all brands
 * Useful for topic-level aggregation
 */
export function calculateAveragePositions(
  analyses: BrandAnalysis[]
): Record<string, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const analysis of analyses) {
    for (const brand of analysis.brandsDetected) {
      const name = brand.brandName;
      sums[name] = (sums[name] || 0) + brand.position;
      counts[name] = (counts[name] || 0) + 1;
    }
  }

  const averages: Record<string, number> = {};
  for (const name in sums) {
    averages[name] = sums[name] / counts[name];
  }

  return averages;
}
