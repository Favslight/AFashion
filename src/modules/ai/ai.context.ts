import { query, queryOne } from "../../database/db.js";
import { getCurrentSubscription } from "../subscriptions/subscriptions.service.js";
import { buildFashionMemoryContext } from "./ai.memory.js";

export async function buildUserFashionContext(userId: string) {
  const [profile, wardrobe_items, subscription, recent_outfits, cultural_preferences] = await Promise.all([
    queryOne(
      `SELECT gender_preference, body_type, budget_range, climate_location, fashion_goals,
        favorite_aesthetics, favorite_colors, preferred_categories, fashion_inspirations
       FROM user_style_profiles
       WHERE user_id = $1`,
      [userId]
    ),
    buildWardrobeContext(userId),
    getCurrentSubscription(userId),
    query(
      `SELECT o.id, o.title, o.mood, o.weather_context, o.ai_summary, o.why_this_works,
        o.color_harmony_score, o.formality_score, o.comfort_score, oc.slug AS occasion_slug, oc.name AS occasion_name
       FROM outfits o
       LEFT JOIN outfit_occasions oc ON oc.id = o.occasion_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 12`,
      [userId]
    ),
    queryOne(
      `SELECT country, ethnic_group, preferred_cultural_styles, wears_traditional_attire, cultural_style_notes
       FROM user_cultural_preferences
       WHERE user_id = $1`,
      [userId]
    )
  ]);

  const [style_rules, color_rules, body_type_rules, climate_rules, aesthetics] = await Promise.all([
    query(
      `SELECT title, category, gender_support, rule_text, priority
       FROM style_rules
       WHERE is_active = TRUE
       ORDER BY priority DESC, created_at ASC
       LIMIT 80`
    ),
    query(
      `SELECT primary_color, matching_color, harmony_type, score, description
       FROM color_combinations
       ORDER BY score DESC
       LIMIT 120`
    ),
    query(
      `SELECT body_type, gender_support, recommended_fits, avoid_fits, styling_tips
       FROM body_type_rules
       ORDER BY created_at ASC`
    ),
    query(
      `SELECT climate_type, recommended_fabrics, avoid_fabrics, recommended_categories, styling_tips
       FROM climate_style_rules
       ORDER BY created_at ASC`
    ),
    query(
      `SELECT name, slug, description, keywords, recommended_colors, common_categories
       FROM fashion_aesthetics
       ORDER BY name ASC`
    )
  ]);

  return {
    profile,
    wardrobe_items,
    subscription: subscription.plan ? {
      plan_name: subscription.plan.name,
      max_wardrobe_items: subscription.plan.max_wardrobe_items,
      max_ai_generations_per_month: subscription.plan.max_ai_generations_per_month,
      features: subscription.plan.features
    } : null,
    recent_outfits,
    cultural_preferences,
    style_rules,
    color_rules,
    body_type_rules,
    climate_rules,
    aesthetics
  };
}

export async function buildOccasionContext(occasionSlug: string) {
  const [occasion, occasion_rules] = await Promise.all([
    queryOne(
      `SELECT id, name, slug, formality_level, gender_support, recommended_categories, avoid_categories, style_tone
       FROM outfit_occasions
       WHERE slug = $1`,
      [occasionSlug]
    ),
    query(
      `SELECT occasion_slug, rule_type, rule_text, recommended_categories, avoid_categories,
        recommended_colors, avoid_colors, formality_level, gender_support, priority
       FROM occasion_rules
       WHERE occasion_slug = $1 AND is_active = TRUE
       ORDER BY priority DESC, created_at ASC`,
      [occasionSlug]
    )
  ]);

  if (!occasion) {
    const error = new Error("Occasion not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return { occasion, occasion_rules };
}

export async function buildWardrobeContext(userId: string) {
  return query(
    `SELECT id, name, category, subcategory, gender_fit, color, secondary_colors,
      style_tags, material, season_tags, ai_description, ai_confidence, times_worn, is_favorite
     FROM wardrobe_items
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY is_favorite DESC, created_at DESC
     LIMIT 160`,
    [userId]
  );
}

export async function buildOutfitGenerationContext(userId: string, occasionSlug: string) {
  const [userContext, occasionContext, fashionMemory] = await Promise.all([
    buildUserFashionContext(userId),
    buildOccasionContext(occasionSlug),
    buildFashionMemoryContext(userId)
  ]);

  return {
    ...userContext,
    ...occasionContext,
    fashion_memory: fashionMemory
  };
}

export async function buildCulturalFashionContext(input: {
  userId: string;
  cultureSlug: string;
  occasionSlug?: string;
  genderPreference?: string;
  useWardrobe?: boolean;
}) {
  const [profile, user_cultural_preferences, wardrobe_items] = await Promise.all([
    queryOne(
      `SELECT id, country, region, ethnic_group, slug, description, male_signature_outfits,
        female_signature_outfits, unisex_signature_outfits, common_fabrics, common_colors,
        symbolic_colors, common_accessories, modern_variations, cultural_notes, mistakes_to_avoid
       FROM cultural_fashion_profiles
       WHERE slug = $1 AND is_active = TRUE`,
      [input.cultureSlug]
    ),
    queryOne(
      `SELECT country, ethnic_group, preferred_cultural_styles, wears_traditional_attire, cultural_style_notes
       FROM user_cultural_preferences
       WHERE user_id = $1`,
      [input.userId]
    ),
    input.useWardrobe === false ? Promise.resolve([]) : buildWardrobeContext(input.userId)
  ]);

  if (!profile) {
    const error = new Error("Cultural fashion profile not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const [occasion_rules, outfit_components] = await Promise.all([
    input.occasionSlug
      ? query(
          `SELECT occasion_slug, dress_code_level, male_recommendations, female_recommendations,
            unisex_recommendations, accessories, color_guidance, avoid_rules, formality_notes
           FROM cultural_occasion_rules
           WHERE cultural_profile_id = $1 AND occasion_slug = $2
           ORDER BY created_at ASC`,
          [(profile as { id: string }).id, input.occasionSlug]
        )
      : query(
          `SELECT occasion_slug, dress_code_level, male_recommendations, female_recommendations,
            unisex_recommendations, accessories, color_guidance, avoid_rules, formality_notes
           FROM cultural_occasion_rules
           WHERE cultural_profile_id = $1
           ORDER BY occasion_slug ASC, created_at ASC`,
          [(profile as { id: string }).id]
        ),
    query(
      `SELECT name, component_type, gender_support, description, common_pairings, suitable_occasions
       FROM cultural_outfit_components
       WHERE cultural_profile_id = $1
         AND ($2::text IS NULL OR $2 = ANY(gender_support) OR 'unisex' = ANY(gender_support))
       ORDER BY component_type ASC, name ASC`,
      [(profile as { id: string }).id, input.genderPreference ?? null]
    )
  ]);

  return {
    cultural_profile: profile,
    cultural_occasion_rules: occasion_rules,
    cultural_outfit_components: outfit_components,
    user_cultural_preferences,
    wardrobe_items,
    request: {
      culture_slug: input.cultureSlug,
      occasion_slug: input.occasionSlug,
      gender_preference: input.genderPreference,
      use_wardrobe: input.useWardrobe ?? true
    }
  };
}

export async function buildChatContext(userId: string, message: string) {
  const context = await buildUserFashionContext(userId);
  const recent_messages = await query(
    `SELECT role, content
     FROM ai_chat_messages
     WHERE user_id = $1 AND role IN ('user', 'assistant')
     ORDER BY created_at DESC
     LIMIT 12`,
    [userId]
  );

  const inferredOccasion = inferOccasionSlug(message);
  const occasion_context = inferredOccasion ? await buildOccasionContext(inferredOccasion).catch(() => null) : null;

  return {
    ...context,
    fashion_memory: await buildFashionMemoryContext(userId),
    occasion_context,
    recent_messages: recent_messages.reverse(),
    current_message: message
  };
}

function inferOccasionSlug(message: string) {
  const normalized = message.toLowerCase();
  const matchers: Array<[string, string[]]> = [
    ["church-service", ["church"]],
    ["corporate-meeting", ["corporate", "meeting"]],
    ["date-night", ["date"]],
    ["traditional-event", ["traditional", "native"]],
    ["gym-fitness", ["gym", "fitness", "workout"]],
    ["hot-weather", ["hot weather", "heat"]],
    ["rainy-weather", ["rain", "rainy"]],
    ["wedding", ["wedding"]],
    ["office", ["office", "work"]],
    ["dinner", ["dinner"]],
    ["interview", ["interview"]],
    ["travel", ["travel", "trip"]]
  ];

  return matchers.find(([, terms]) => terms.some((term) => normalized.includes(term)))?.[0];
}
