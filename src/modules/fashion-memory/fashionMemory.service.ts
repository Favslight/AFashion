import { query, queryOne } from "../../database/db.js";
import { fashionMemoryAgent } from "../ai/ai.agents.js";
import { buildFashionMemoryContext, detectDislikedStylePatterns, detectRepeatedStylePatterns, updateMemoryFromWearHistory } from "../ai/ai.memory.js";
import { buildUserFashionContext } from "../ai/ai.context.js";
import { ensureMinimumPlan, getCurrentSubscription } from "../subscriptions/subscriptions.service.js";

export async function listMemory(userId: string) {
  return query("SELECT * FROM user_style_memory WHERE user_id = $1 ORDER BY updated_at DESC", [userId]);
}

export async function createMemory(userId: string, input: {
  memory_type: string;
  memory_key: string;
  memory_value: Record<string, unknown>;
  confidence_score: number;
  source?: string;
}) {
  await ensureMemoryLimit(userId);
  return queryOne(
    `INSERT INTO user_style_memory (user_id, memory_type, memory_key, memory_value, confidence_score, source)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, input.memory_type, input.memory_key, input.memory_value, input.confidence_score, input.source ?? "manual"]
  );
}

export async function updateMemory(userId: string, id: string, input: Record<string, unknown>) {
  await getMemory(userId, id);
  return queryOne(
    `UPDATE user_style_memory
     SET memory_type = COALESCE($3, memory_type),
       memory_key = COALESCE($4, memory_key),
       memory_value = COALESCE($5, memory_value),
       confidence_score = COALESCE($6, confidence_score),
       source = COALESCE($7, source)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, input.memory_type, input.memory_key, input.memory_value, input.confidence_score, input.source]
  );
}

export async function deleteMemory(userId: string, id: string) {
  await getMemory(userId, id);
  return queryOne("DELETE FROM user_style_memory WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
}

export async function rebuildMemory(userId: string) {
  await ensureMinimumPlan(userId, ["Pro", "Premium"], "Fashion memory rebuild");
  const context = {
    fashion_context: await buildUserFashionContext(userId),
    memory_context: await buildFashionMemoryContext(userId),
    repeated_patterns: await detectRepeatedStylePatterns(userId),
    disliked_patterns: await detectDislikedStylePatterns(userId)
  };
  const result = await fashionMemoryAgent(userId, context);

  for (const memory of result.memories) {
    await queryOne(
      `INSERT INTO user_style_memory (user_id, memory_type, memory_key, memory_value, confidence_score, source)
       VALUES ($1, $2, $3, $4, $5, 'ai_rebuild')
       ON CONFLICT (user_id, memory_type, memory_key) DO UPDATE SET
         memory_value = EXCLUDED.memory_value,
         confidence_score = EXCLUDED.confidence_score,
         source = EXCLUDED.source
       RETURNING id`,
      [userId, memory.memoryType, memory.memoryKey, memory.memoryValue, memory.confidenceScore]
    );
  }

  await queryOne(
    `INSERT INTO user_style_memory (user_id, memory_type, memory_key, memory_value, confidence_score, source)
     VALUES ($1, 'summary', 'style_personality', $2, 0.8, 'ai_rebuild')
     ON CONFLICT (user_id, memory_type, memory_key) DO UPDATE SET memory_value = EXCLUDED.memory_value, confidence_score = EXCLUDED.confidence_score, source = EXCLUDED.source
     RETURNING id`,
    [userId, { summary: result.stylePersonalitySummary }]
  );
  await updateMemoryFromWearHistory(userId);
  return { rebuilt_entries: result.memories.length, style_personality_summary: result.stylePersonalitySummary };
}

export async function insights(userId: string) {
  const [favoriteColors, favoriteCategories, mostWornItems, leastWornItems, repeated, aesthetics, disliked, gaps, summary] = await Promise.all([
    query("SELECT color, COUNT(*)::int AS count FROM wardrobe_items WHERE user_id = $1 AND is_favorite = TRUE AND deleted_at IS NULL GROUP BY color ORDER BY count DESC LIMIT 10", [userId]),
    query("SELECT category, COUNT(*)::int AS count FROM wardrobe_items WHERE user_id = $1 AND is_favorite = TRUE AND deleted_at IS NULL GROUP BY category ORDER BY count DESC LIMIT 10", [userId]),
    query("SELECT id, name, category, color, times_worn FROM wardrobe_items WHERE user_id = $1 AND deleted_at IS NULL ORDER BY times_worn DESC LIMIT 10", [userId]),
    query("SELECT id, name, category, color, times_worn FROM wardrobe_items WHERE user_id = $1 AND deleted_at IS NULL ORDER BY times_worn ASC, created_at ASC LIMIT 10", [userId]),
    detectRepeatedStylePatterns(userId),
    query("SELECT memory_key, memory_value, confidence_score FROM user_style_memory WHERE user_id = $1 AND memory_type IN ('liked_style','preferred_aesthetic') ORDER BY confidence_score DESC LIMIT 20", [userId]),
    detectDislikedStylePatterns(userId),
    query("SELECT memory_value FROM user_style_memory WHERE user_id = $1 AND memory_type IN ('wardrobe_gap','shopping_gap') ORDER BY confidence_score DESC LIMIT 20", [userId]),
    queryOne("SELECT memory_value FROM user_style_memory WHERE user_id = $1 AND memory_type = 'summary' AND memory_key = 'style_personality'", [userId])
  ]);

  return {
    favoriteColors,
    favoriteCategories,
    mostWornItems,
    leastWornItems,
    recentlyRepeatedItems: repeated,
    preferredAesthetics: aesthetics,
    dislikedStyles: disliked,
    wardrobeGaps: gaps,
    stylePersonalitySummary: (summary as { memory_value?: { summary?: string } } | null)?.memory_value?.summary ?? ""
  };
}

async function getMemory(userId: string, id: string) {
  const memory = await queryOne("SELECT * FROM user_style_memory WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!memory) {
    const error = new Error("Fashion memory entry not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  return memory;
}

async function ensureMemoryLimit(userId: string) {
  const subscription = await getCurrentSubscription(userId);
  const planName = subscription.plan?.name?.toLowerCase() ?? "free";
  const limits = { free: 20, pro: 200, premium: 1000 };
  const limit = limits[planName as keyof typeof limits] ?? limits.free;
  const row = await queryOne<{ count: number }>("SELECT COUNT(*)::int AS count FROM user_style_memory WHERE user_id = $1", [userId]);
  if ((row?.count ?? 0) >= limit) {
    const error = new Error("Fashion memory limit reached for your current plan");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}
