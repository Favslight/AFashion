import { getClient, query, queryOne } from "../../database/db.js";
import { generateOutfitAgent, memoryAwareOutfitAgent } from "../ai/ai.agents.js";
import { buildCulturalFashionContext } from "../ai/ai.context.js";
import { buildFashionMemoryContext, getRecentlyWornItems } from "../ai/ai.memory.js";
import {
  calculateColorHarmonyScore,
  calculateComfortScore,
  calculateFormalityScore,
  calculateOccasionFitScore,
  calculateOverallOutfitScore,
  calculateWardrobeMatchScore
} from "../ai/ai.scoring.js";
import { ensureAiLimit } from "../subscriptions/subscriptions.service.js";
import { ensureMinimumPlan } from "../subscriptions/subscriptions.service.js";
import { getCurrentWeather } from "../weather/weather.service.js";

interface GenerateOutfitInput {
  occasion_id?: string;
  occasion_slug?: string;
  occasionSlug?: string;
  weather?: string;
  weatherData?: unknown;
  location?: string;
  useWeather?: boolean;
  includeAlternatives?: boolean;
  allowRecentlyWorn?: boolean;
  avoidItemsWornWithinDays?: number;
  eventId?: string;
  useFashionMemory?: boolean;
  cultureSlug?: string;
  culturalOccasion?: boolean;
  mood?: string;
  gender_style_preference?: string;
}

export async function listOccasions() {
  return query(
    `SELECT *
     FROM outfit_occasions
     ORDER BY formality_level ASC, name ASC`
  );
}

export async function generateOutfit(userId: string, input: GenerateOutfitInput) {
  await ensureAiLimit(userId);
  let weatherContext: unknown = input.weatherData ?? input.weather ?? null;
  if (input.useWeather) {
    await ensureMinimumPlan(userId, ["Pro", "Premium"], "Weather-aware outfit generation");
    if (!weatherContext && input.location) {
      weatherContext = await getCurrentWeather(input.location);
    }
  }
  const occasion = await getOccasion(input);

  if (!occasion) {
    const error = new Error("Occasion not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const occasionSlug = (occasion as { slug: string }).slug;
  const [fashionMemory, recentlyWornItems, culturalContext] = await Promise.all([
    input.useFashionMemory === false ? null : buildFashionMemoryContext(userId),
    getRecentlyWornItems(userId, input.avoidItemsWornWithinDays ?? 14),
    input.cultureSlug
      ? buildCulturalFashionContext({
          userId,
          cultureSlug: input.cultureSlug,
          occasionSlug,
          genderPreference: input.gender_style_preference,
          useWardrobe: true
        })
      : null
  ]);
  const recentIds = new Set(recentlyWornItems.map((item) => item.wardrobe_item_id));
  const agent = input.useFashionMemory === false ? generateOutfitAgent : memoryAwareOutfitAgent;
  const { result: aiResult, context } = await agent(userId, {
    occasionSlug,
    weather: typeof weatherContext === "string" ? weatherContext : JSON.stringify(weatherContext),
    mood: input.mood,
    genderStylePreference: input.gender_style_preference,
    extraContext: {
      fashion_memory: fashionMemory,
      recently_worn_items: recentlyWornItems,
      repetition_policy: {
        allow_recently_worn: input.allowRecentlyWorn ?? false,
        avoid_items_worn_within_days: input.avoidItemsWornWithinDays ?? 14
      },
      event_id: input.eventId,
      cultural_context: culturalContext,
      cultural_occasion: input.culturalOccasion ?? Boolean(input.cultureSlug)
    }
  });

  const wardrobeItems = context.wardrobe_items as Array<{ id: string }>;
  if (!wardrobeItems.length) {
    const error = new Error("Upload wardrobe items before generating outfits");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const ownedIds = new Set(wardrobeItems.map((item) => item.id));
  const originalSelectedIds = aiResult.selectedWardrobeItemIds.filter((id) => ownedIds.has(id));
  let selectedIds = originalSelectedIds;
  const recentlyWornWarnings = originalSelectedIds
    .filter((id) => recentIds.has(id))
    .map((id) => {
      const recent = recentlyWornItems.find((item) => item.wardrobe_item_id === id);
      return { wardrobe_item_id: id, last_worn_date: recent?.last_worn_date };
    });

  if (!input.allowRecentlyWorn) {
    selectedIds = originalSelectedIds.filter((id) => !recentIds.has(id));
    if (!selectedIds.length) selectedIds = originalSelectedIds;
  }

  if (!selectedIds.length) {
    const error = new Error("AI did not select valid wardrobe items");
    (error as Error & { statusCode?: number }).statusCode = 502;
    throw error;
  }

  const selectedItems = wardrobeItems.filter((item) => selectedIds.includes(item.id));
  const calculatedScores = calculateOverallOutfitScore({
    color_harmony_score: calculateColorHarmonyScore(selectedItems, context.color_rules),
    occasion_fit_score: calculateOccasionFitScore(selectedItems, context.occasion_rules),
    formality_score: calculateFormalityScore(selectedItems, context.occasion),
    comfort_score: calculateComfortScore(selectedItems, context.climate_rules, typeof weatherContext === "string" ? weatherContext : JSON.stringify(weatherContext)),
    wardrobe_match_score: calculateWardrobeMatchScore(selectedItems, context.profile)
  });

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const outfitResult = await client.query(
      `INSERT INTO outfits (
         user_id,
         occasion_id,
         title,
         mood,
        weather_context,
        ai_summary,
        why_this_works,
        color_harmony_score,
        formality_score,
         comfort_score
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        (occasion as { id: string }).id,
        aiResult.title,
        input.mood ?? null,
        weatherContext ? JSON.stringify(weatherContext) : null,
        `${aiResult.stylingNotes}\nAccessories: ${aiResult.accessorySuggestions.join(", ")}`,
        aiResult.whyThisWorks,
        calculatedScores.color_harmony_score,
        calculatedScores.formality_score,
        calculatedScores.comfort_score
      ]
    );

    const outfit = outfitResult.rows[0];
    for (const wardrobeItemId of selectedIds) {
      await client.query(
        `INSERT INTO outfit_items (outfit_id, wardrobe_item_id, item_role)
         VALUES ($1, $2, 'selected')`,
        [outfit.id, wardrobeItemId]
      );
    }
    await client.query(
      `INSERT INTO outfit_recommendation_logs (user_id, outfit_id, occasion_slug, recommendation_reason)
       VALUES ($1, $2, $3, $4)`,
      [
        userId,
        outfit.id,
        occasionSlug,
        `${aiResult.whyThisWorks}${fashionMemory ? "\nPersonal memory was used." : ""}`
      ]
    );

    const scoreResult = await client.query(
      `INSERT INTO outfit_scores (
         outfit_id,
         color_harmony_score,
         occasion_fit_score,
         formality_score,
         comfort_score,
         wardrobe_match_score,
         overall_score,
         score_breakdown
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        outfit.id,
        calculatedScores.color_harmony_score,
        calculatedScores.occasion_fit_score,
        calculatedScores.formality_score,
        calculatedScores.comfort_score,
        calculatedScores.wardrobe_match_score,
        calculatedScores.overall_score,
        {
          ...calculatedScores.score_breakdown,
          ai_scores: aiResult.scores,
          accessory_suggestions: aiResult.accessorySuggestions,
          cultural_context_used: Boolean(culturalContext),
          cultural_profile: culturalContext ? (culturalContext.cultural_profile as { slug?: string; ethnic_group?: string }) : null
        }
      ]
    );

    await client.query("COMMIT");

    return {
      outfit,
      scores: scoreResult.rows[0],
      selected_wardrobe_item_ids: selectedIds,
      why_this_fits_user: aiResult.whyThisWorks,
      cultural_context: culturalContext ? {
        culture_slug: input.cultureSlug,
        cultural_occasion: input.culturalOccasion ?? Boolean(input.cultureSlug),
        profile: culturalContext.cultural_profile,
        rules: culturalContext.cultural_occasion_rules
      } : null,
      recently_worn_warnings: recentlyWornWarnings,
      accessory_suggestions: aiResult.accessorySuggestions,
      alternative_combinations: input.includeAlternatives === false ? [] : aiResult.alternativeCombinations
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listOutfits(userId: string) {
  return query(
    `SELECT o.*, oc.name AS occasion_name, oc.slug AS occasion_slug
     FROM outfits o
     LEFT JOIN outfit_occasions oc ON oc.id = o.occasion_id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
}

export async function getOutfit(userId: string, outfitId: string) {
  const outfit = await queryOne(
    `SELECT o.*, oc.name AS occasion_name, oc.slug AS occasion_slug
     FROM outfits o
     LEFT JOIN outfit_occasions oc ON oc.id = o.occasion_id
     WHERE o.id = $1 AND o.user_id = $2`,
    [outfitId, userId]
  );

  if (!outfit) {
    const error = new Error("Outfit not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const items = await query(
    `SELECT wi.*, oi.item_role
     FROM outfit_items oi
     JOIN wardrobe_items wi ON wi.id = oi.wardrobe_item_id
     WHERE oi.outfit_id = $1 AND wi.user_id = $2 AND wi.deleted_at IS NULL
     ORDER BY oi.created_at ASC`,
    [outfitId, userId]
  );

  return {
    outfit,
    items
  };
}

export async function saveOutfit(userId: string, outfitId: string) {
  await getOutfit(userId, outfitId);
  return queryOne(
    `UPDATE outfits
     SET is_saved = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [outfitId, userId]
  );
}

export async function deleteOutfit(userId: string, outfitId: string) {
  await getOutfit(userId, outfitId);
  return queryOne(
    "DELETE FROM outfits WHERE id = $1 AND user_id = $2 RETURNING id",
    [outfitId, userId]
  );
}

async function getOccasion(input: GenerateOutfitInput) {
  if (input.occasion_id) {
    return queryOne("SELECT * FROM outfit_occasions WHERE id = $1", [input.occasion_id]);
  }

  return queryOne("SELECT * FROM outfit_occasions WHERE slug = $1", [input.occasion_slug ?? input.occasionSlug]);
}
