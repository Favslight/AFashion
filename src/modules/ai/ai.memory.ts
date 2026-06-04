import { query, queryOne } from "../../database/db.js";

export async function buildFashionMemoryContext(userId: string) {
  const [memory, recentWearHistory, feedback, recommendationLogs] = await Promise.all([
    query(
      `SELECT id, memory_type, memory_key, memory_value, confidence_score, source, updated_at
       FROM user_style_memory
       WHERE user_id = $1
       ORDER BY confidence_score DESC, updated_at DESC
       LIMIT 120`,
      [userId]
    ),
    query(
      `SELECT id, outfit_id, wardrobe_item_ids, occasion_slug, worn_date, location, weather_context, user_rating, notes
       FROM outfit_wear_history
       WHERE user_id = $1
       ORDER BY worn_date DESC
       LIMIT 60`,
      [userId]
    ),
    query(
      `SELECT ofb.*, o.title AS outfit_title
       FROM outfit_feedback ofb
       JOIN outfits o ON o.id = ofb.outfit_id
       WHERE ofb.user_id = $1
       ORDER BY ofb.created_at DESC
       LIMIT 60`,
      [userId]
    ),
    query(
      `SELECT occasion_slug, recommendation_reason, accepted, rejected, feedback, created_at
       FROM outfit_recommendation_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 60`,
      [userId]
    )
  ]);

  return { memory, recentWearHistory, feedback, recommendationLogs };
}

export async function updateMemoryFromFeedback(userId: string, outfitId: string, feedback: {
  rating?: number;
  liked_parts?: string[];
  disliked_parts?: string[];
  feedback_note?: string | null;
  would_wear_again?: boolean | null;
}) {
  const memoryValue = {
    outfit_id: outfitId,
    rating: feedback.rating,
    liked_parts: feedback.liked_parts ?? [],
    disliked_parts: feedback.disliked_parts ?? [],
    feedback_note: feedback.feedback_note,
    would_wear_again: feedback.would_wear_again
  };

  await upsertMemory(userId, "feedback", `outfit:${outfitId}`, memoryValue, confidenceFromRating(feedback.rating), "outfit_feedback");

  for (const disliked of feedback.disliked_parts ?? []) {
    await upsertMemory(userId, "disliked_style", disliked.toLowerCase(), { label: disliked }, 0.7, "outfit_feedback");
  }

  for (const liked of feedback.liked_parts ?? []) {
    await upsertMemory(userId, "liked_style", liked.toLowerCase(), { label: liked }, 0.7, "outfit_feedback");
  }
}

export async function updateMemoryFromWearHistory(userId: string) {
  const rows = await query<{ category: string; wears: number }>(
    `SELECT COALESCE(wi.category, 'unknown') AS category, COUNT(*)::int AS wears
     FROM outfit_wear_history owh
     JOIN wardrobe_items wi ON wi.id = ANY(owh.wardrobe_item_ids)
     WHERE owh.user_id = $1
     GROUP BY wi.category
     ORDER BY wears DESC
     LIMIT 20`,
    [userId]
  );

  for (const row of rows) {
    await upsertMemory(userId, "worn_category", row.category, row, Math.min(1, row.wears / 10), "wear_history");
  }

  return rows;
}

export async function detectRepeatedStylePatterns(userId: string) {
  return query(
    `SELECT wi.id, wi.name, wi.category, wi.color, COUNT(*)::int AS wears
     FROM outfit_wear_history owh
     JOIN wardrobe_items wi ON wi.id = ANY(owh.wardrobe_item_ids)
     WHERE owh.user_id = $1 AND owh.worn_date >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY wi.id, wi.name, wi.category, wi.color
     HAVING COUNT(*) > 1
     ORDER BY wears DESC`,
    [userId]
  );
}

export async function detectDislikedStylePatterns(userId: string) {
  return query(
    `SELECT disliked_part, COUNT(*)::int AS count
     FROM outfit_feedback, unnest(disliked_parts) AS disliked_part
     WHERE user_id = $1
     GROUP BY disliked_part
     ORDER BY count DESC
     LIMIT 20`,
    [userId]
  );
}

export async function getRecentlyWornItems(userId: string, days = 14) {
  return query<{ wardrobe_item_id: string; last_worn_date: string; wears: number }>(
    `SELECT item_id::text AS wardrobe_item_id, MAX(worn_date)::text AS last_worn_date, COUNT(*)::int AS wears
     FROM outfit_wear_history, unnest(wardrobe_item_ids) AS item_id
     WHERE user_id = $1 AND worn_date >= CURRENT_DATE - ($2::int * INTERVAL '1 day')
     GROUP BY item_id
     ORDER BY MAX(worn_date) DESC`,
    [userId, days]
  );
}

export async function shouldAvoidWardrobeItem(userId: string, wardrobeItemId: string, options: {
  allowRecentlyWorn?: boolean;
  avoidItemsWornWithinDays?: number;
}) {
  if (options.allowRecentlyWorn) return { avoid: false, reason: null };
  const recent = await queryOne<{ worn_date: string }>(
    `SELECT worn_date::text
     FROM outfit_wear_history
     WHERE user_id = $1
       AND $2::uuid = ANY(wardrobe_item_ids)
       AND worn_date >= CURRENT_DATE - ($3::int * INTERVAL '1 day')
     ORDER BY worn_date DESC
     LIMIT 1`,
    [userId, wardrobeItemId, options.avoidItemsWornWithinDays ?? 14]
  );

  return recent ? { avoid: true, reason: `Recently worn on ${recent.worn_date}` } : { avoid: false, reason: null };
}

async function upsertMemory(userId: string, type: string, key: string, value: unknown, confidence: number, source: string) {
  return queryOne(
    `INSERT INTO user_style_memory (user_id, memory_type, memory_key, memory_value, confidence_score, source)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, memory_type, memory_key) DO UPDATE SET
       memory_value = EXCLUDED.memory_value,
       confidence_score = GREATEST(user_style_memory.confidence_score, EXCLUDED.confidence_score),
       source = EXCLUDED.source
     RETURNING *`,
    [userId, type, key, value, confidence, source]
  );
}

function confidenceFromRating(rating?: number) {
  if (!rating) return 0.5;
  return Math.min(1, Math.max(0.2, rating / 5));
}
