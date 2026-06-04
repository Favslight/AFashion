import { env } from "../../config/env.js";
import { queryOne } from "../../database/db.js";
import { ensureAiLimit, logAiUsage } from "../subscriptions/subscriptions.service.js";
import {
  analyzeWardrobeItemAgent,
  generateOutfitAgent,
  occasionStylingAgent,
  outfitCriticAgent,
  stylistChatAgent
} from "./ai.agents.js";

function clampScore(value: unknown, max: number) {
  const score = Number(value);
  if (Number.isNaN(score)) return 0;
  return Math.min(max, Math.max(0, score));
}

export async function analyzeWardrobeImage(userId: string, imageUrl: string) {
  await ensureAiLimit(userId);
  const result = await analyzeWardrobeItemAgent(userId, imageUrl);

  return {
    category: result.category,
    subcategory: result.subcategory,
    color: result.color,
    secondary_colors: result.secondaryColors,
    style_tags: result.styleTags,
    material: result.materialGuess,
    season_tags: result.seasonTags,
    gender_fit: result.genderFit,
    description: result.description,
    confidence_score: clampScore(result.confidence, 1)
  };
}

export async function generateOutfit(input: {
  userId: string;
  occasionSlug?: string;
  occasion?: { slug?: string } | unknown;
  weather?: string;
  mood?: string;
  genderStylePreference?: string;
}) {
  await ensureAiLimit(input.userId);
  const occasionSlug = input.occasionSlug ?? (input.occasion as { slug?: string } | null)?.slug;
  if (!occasionSlug) {
    const error = new Error("Occasion slug is required for outfit generation");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const { result } = await generateOutfitAgent(input.userId, {
    occasionSlug,
    weather: input.weather,
    mood: input.mood,
    genderStylePreference: input.genderStylePreference
  });

  return {
    title: result.title,
    selected_wardrobe_item_ids: result.selectedWardrobeItemIds,
    styling_notes: result.stylingNotes,
    why_this_works: result.whyThisWorks,
    accessory_suggestions: result.accessorySuggestions,
    color_harmony_score: clampScore(result.scores.colorHarmony, 10),
    occasion_fit_score: clampScore(result.scores.occasionFit, 10),
    formality_score: clampScore(result.scores.formality, 10),
    comfort_score: clampScore(result.scores.comfort, 10),
    overall_score: clampScore(result.scores.overall, 10),
    alternative_combinations: result.alternativeCombinations
  };
}

export async function styleChat(userId: string, input: { session_id?: string; message: string }) {
  await ensureAiLimit(userId);

  const session = input.session_id
    ? await getOwnedSession(userId, input.session_id)
    : await createChatSession(userId, input.message.slice(0, 80));

  if (!session) {
    const error = new Error("Chat session not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  await queryOne(
    `INSERT INTO ai_chat_messages (session_id, user_id, role, content)
     VALUES ($1, $2, 'user', $3)
     RETURNING id`,
    [session.id, userId, input.message]
  );

  const answer = await stylistChatAgent(userId, input.message);

  await queryOne(
    `INSERT INTO ai_chat_messages (session_id, user_id, role, content, metadata)
     VALUES ($1, $2, 'assistant', $3, $4)
     RETURNING id`,
    [session.id, userId, answer, { agent: "stylistChatAgent" }]
  );
  await queryOne("UPDATE ai_chat_sessions SET updated_at = NOW() WHERE id = $1", [session.id]);

  return {
    session_id: session.id,
    message: answer
  };
}

export async function analyzeOutfitPhoto(userId: string, imageUrl: string, occasion?: string) {
  await ensureAiLimit(userId);
  const result = await outfitCriticAgent(userId, imageUrl, occasion);

  return {
    occasion_fit: result.occasion_suitability,
    color_harmony: result.color_harmony,
    formality: result.formality,
    fit_balance: result.fit_balance,
    what_works: result.what_works,
    styling_improvements: result.what_to_improve,
    accessory_suggestions: result.accessory_suggestions,
    final_recommendation: result.final_recommendation,
    overall_score: clampScore(result.overall_score, 10)
  };
}

export async function recommendForEvent(userId: string, input: {
  event: string;
  weather?: string;
  mood?: string;
  style_preference?: string;
}) {
  await ensureAiLimit(userId);
  return occasionStylingAgent(userId, {
    occasionSlug: input.event,
    weather: input.weather,
    mood: input.mood ?? input.style_preference
  });
}

export async function createRealtimeSessionToken(userId: string) {
  await ensureAiLimit(userId);

  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
      instructions: "You are a realtime AI fashion stylist. Use the platform's fashion rules and safety settings."
    })
  });

  if (!response.ok) {
    const error = new Error("Unable to create realtime session token");
    (error as Error & { statusCode?: number }).statusCode = 502;
    throw error;
  }

  await logAiUsage(userId, "realtime_session_token", 0, "gpt-4o-realtime-preview");
  return response.json();
}

async function getOwnedSession(userId: string, sessionId: string) {
  return queryOne<{ id: string; title: string }>(
    "SELECT id, title FROM ai_chat_sessions WHERE id = $1 AND user_id = $2",
    [sessionId, userId]
  );
}

async function createChatSession(userId: string, title: string) {
  return queryOne<{ id: string; title: string }>(
    `INSERT INTO ai_chat_sessions (user_id, title)
     VALUES ($1, $2)
     RETURNING id, title`,
    [userId, title || "Stylist chat"]
  );
}
