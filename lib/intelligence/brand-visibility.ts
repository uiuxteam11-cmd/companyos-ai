export type BrandVisibilityScore = {
  aiVisibility: number;
  aiRecommendation: number;
  agentReadiness: number;
  websiteReadability: number;
  pricingDiscoverability: number;
  productUnderstanding: number;
};

export function summarizeBrandVisibility(score: BrandVisibilityScore) {
  const weakest = Object.entries(score).sort(([, left], [, right]) => left - right)[0];
  return { score: Math.round(Object.values(score).reduce((total, value) => total + value, 0) / 6), recommendedFocus: weakest?.[0] ?? "aiVisibility" };
}
