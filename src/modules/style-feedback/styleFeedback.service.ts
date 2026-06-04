import { query, queryOne } from "../../database/db.js";
import { outfitFeedbackLearningAgent } from "../ai/ai.agents.js";
import { updateMemoryFromFeedback } from "../ai/ai.memory.js";

export async function createOutfitFeedback(userId: string, outfitId: string, input: {
  rating?: number;
  liked_parts: string[];
  disliked_parts: string[];
  feedback_note?: string | null;
  would_wear_again?: boolean | null;
}) {
  const outfit = await queryOne("SELECT id, title, ai_summary, why_this_works FROM outfits WHERE id = $1 AND user_id = $2", [outfitId, userId]);
  if (!outfit) {
    const error = new Error("Outfit not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const feedback = await queryOne(
    `INSERT INTO outfit_feedback (user_id, outfit_id, rating, liked_parts, disliked_parts, feedback_note, would_wear_again)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, outfitId, input.rating ?? null, input.liked_parts, input.disliked_parts, input.feedback_note ?? null, input.would_wear_again ?? null]
  );

  await updateMemoryFromFeedback(userId, outfitId, input);
  const learned = await outfitFeedbackLearningAgent(userId, { outfit, feedback }).catch(() => null);
  if (learned) {
    for (const memory of learned.memories) {
      await queryOne(
        `INSERT INTO user_style_memory (user_id, memory_type, memory_key, memory_value, confidence_score, source)
         VALUES ($1, $2, $3, $4, $5, 'ai_feedback_learning')
         ON CONFLICT (user_id, memory_type, memory_key) DO UPDATE SET
           memory_value = EXCLUDED.memory_value,
           confidence_score = EXCLUDED.confidence_score,
           source = EXCLUDED.source
         RETURNING id`,
        [userId, memory.memoryType, memory.memoryKey, memory.memoryValue, memory.confidenceScore]
      );
    }
  }

  return feedback;
}

export async function getOutfitFeedback(userId: string, outfitId: string) {
  return query(
    "SELECT * FROM outfit_feedback WHERE user_id = $1 AND outfit_id = $2 ORDER BY created_at DESC",
    [userId, outfitId]
  );
}

export async function myFeedback(userId: string) {
  return query(
    `SELECT ofb.*, o.title AS outfit_title
     FROM outfit_feedback ofb
     JOIN outfits o ON o.id = ofb.outfit_id
     WHERE ofb.user_id = $1
     ORDER BY ofb.created_at DESC`,
    [userId]
  );
}
