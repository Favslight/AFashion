function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function clamp(score: number) {
  return Math.max(0, Math.min(10, Number(score.toFixed(2))));
}

export function calculateColorHarmonyScore(items: unknown[], colorRules: unknown[] = []) {
  const wardrobeItems = items as Array<{ color?: string; secondary_colors?: string[] }>;
  const colors = wardrobeItems.flatMap((item) => [item.color, ...(item.secondary_colors ?? [])]).map(normalize).filter(Boolean);
  if (colors.length <= 1) return 7;

  const rules = colorRules as Array<{ primary_color?: string; matching_color?: string; score?: number }>;
  let pairScores = 0;
  let pairs = 0;

  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      const first = colors[i];
      const second = colors[j];
      const rule = rules.find((candidate) => {
        const primary = normalize(candidate.primary_color);
        const matching = normalize(candidate.matching_color);
        return (primary === first && matching === second) || (primary === second && matching === first);
      });
      pairScores += Number(rule?.score ?? 6.5);
      pairs += 1;
    }
  }

  return clamp(pairScores / Math.max(1, pairs));
}

export function calculateOccasionFitScore(items: unknown[], occasionRules: unknown[] = []) {
  const wardrobeItems = items as Array<{ category?: string; color?: string }>;
  const rules = occasionRules as Array<{
    recommended_categories?: string[];
    avoid_categories?: string[];
    recommended_colors?: string[];
    avoid_colors?: string[];
    priority?: number;
  }>;

  let score = 6;
  for (const item of wardrobeItems) {
    const category = normalize(item.category);
    const color = normalize(item.color);
    for (const rule of rules) {
      const weight = Number(rule.priority ?? 1) * 0.25;
      if ((rule.recommended_categories ?? []).map(normalize).includes(category)) score += weight;
      if ((rule.avoid_categories ?? []).map(normalize).includes(category)) score -= weight * 1.5;
      if ((rule.recommended_colors ?? []).map(normalize).includes(color)) score += weight * 0.7;
      if ((rule.avoid_colors ?? []).map(normalize).includes(color)) score -= weight;
    }
  }

  return clamp(score);
}

export function calculateFormalityScore(items: unknown[], occasion: unknown) {
  const wardrobeItems = items as Array<{ category?: string; style_tags?: string[] }>;
  const occasionData = occasion as { formality_level?: number | string } | null;
  const target = Number(occasionData?.formality_level ?? 3);
  const formalTerms = ["suit", "blazer", "shirt", "dress", "heels", "loafers", "trousers", "skirt", "traditional wear"];
  const casualTerms = ["hoodie", "t-shirt", "shorts", "slides", "sneakers", "gymwear", "joggers"];
  let outfitLevel = 3;

  for (const item of wardrobeItems) {
    const category = normalize(item.category);
    const tags = (item.style_tags ?? []).map(normalize);
    if (formalTerms.includes(category) || tags.some((tag) => ["formal", "corporate", "elegant"].includes(tag))) outfitLevel += 0.6;
    if (casualTerms.includes(category) || tags.some((tag) => ["casual", "sporty", "streetwear"].includes(tag))) outfitLevel -= 0.45;
  }

  return clamp(10 - Math.abs(target - outfitLevel) * 1.7);
}

export function calculateComfortScore(items: unknown[], climateRules: unknown[] = [], weather?: string) {
  const wardrobeItems = items as Array<{ material?: string; category?: string; season_tags?: string[] }>;
  const normalizedWeather = normalize(weather);
  let score = 7;

  const climate = (climateRules as Array<{
    climate_type?: string;
    recommended_fabrics?: string[];
    avoid_fabrics?: string[];
    recommended_categories?: string[];
  }>).find((rule) => normalizedWeather.includes(normalize(rule.climate_type)));

  if (!climate) return score;

  for (const item of wardrobeItems) {
    const material = normalize(item.material);
    const category = normalize(item.category);
    if ((climate.recommended_fabrics ?? []).map(normalize).includes(material)) score += 0.7;
    if ((climate.avoid_fabrics ?? []).map(normalize).includes(material)) score -= 0.9;
    if ((climate.recommended_categories ?? []).map(normalize).includes(category)) score += 0.5;
  }

  return clamp(score);
}

export function calculateWardrobeMatchScore(items: unknown[], profile: unknown) {
  const wardrobeItems = items as Array<{ color?: string; category?: string; style_tags?: string[] }>;
  const userProfile = profile as {
    favorite_colors?: string[];
    preferred_categories?: string[];
    favorite_aesthetics?: string[];
  } | null;

  if (!userProfile) return 6.5;

  let score = 6;
  for (const item of wardrobeItems) {
    if ((userProfile.favorite_colors ?? []).map(normalize).includes(normalize(item.color))) score += 0.6;
    if ((userProfile.preferred_categories ?? []).map(normalize).includes(normalize(item.category))) score += 0.5;
    const tags = (item.style_tags ?? []).map(normalize);
    if ((userProfile.favorite_aesthetics ?? []).map(normalize).some((aesthetic) => tags.includes(aesthetic))) score += 0.4;
  }

  return clamp(score);
}

export function calculateOverallOutfitScore(scores: {
  color_harmony_score: number;
  occasion_fit_score: number;
  formality_score: number;
  comfort_score: number;
  wardrobe_match_score: number;
}) {
  const overall = (
    scores.color_harmony_score * 0.2 +
    scores.occasion_fit_score * 0.28 +
    scores.formality_score * 0.18 +
    scores.comfort_score * 0.17 +
    scores.wardrobe_match_score * 0.17
  );

  return {
    ...scores,
    overall_score: clamp(overall),
    score_breakdown: {
      weights: {
        color_harmony: 0.2,
        occasion_fit: 0.28,
        formality: 0.18,
        comfort: 0.17,
        wardrobe_match: 0.17
      }
    }
  };
}
