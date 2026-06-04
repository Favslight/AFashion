import { getClient, query, queryOne } from "../../database/db.js";
import { sendEventReminderEmail } from "../emails/email.service.js";
import { eventStylingAgent } from "../ai/ai.agents.js";
import { buildOutfitGenerationContext } from "../ai/ai.context.js";
import { buildFashionMemoryContext, getRecentlyWornItems } from "../ai/ai.memory.js";
import { getCurrentWeather } from "../weather/weather.service.js";
import { ensureAiLimit, getCurrentSubscription } from "../subscriptions/subscriptions.service.js";

export async function createEvent(userId: string, input: {
  title: string;
  occasion_slug?: string | null;
  event_date: string;
  location?: string | null;
  dress_code?: string | null;
  notes?: string | null;
  reminder_enabled: boolean;
}) {
  await ensureEventLimit(userId);
  return queryOne(
    `INSERT INTO user_fashion_events (user_id, title, occasion_slug, event_date, location, dress_code, notes, reminder_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, input.title, input.occasion_slug ?? null, input.event_date, input.location ?? null, input.dress_code ?? null, input.notes ?? null, input.reminder_enabled]
  );
}

export async function listEvents(userId: string) {
  return query("SELECT * FROM user_fashion_events WHERE user_id = $1 ORDER BY event_date ASC", [userId]);
}

export async function upcomingEvents(userId: string) {
  return query(
    "SELECT * FROM user_fashion_events WHERE user_id = $1 AND event_date >= NOW() ORDER BY event_date ASC LIMIT 30",
    [userId]
  );
}

export async function getEvent(userId: string, id: string) {
  const event = await queryOne("SELECT * FROM user_fashion_events WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!event) throwNotFound("Event not found");
  return event;
}

export async function updateEvent(userId: string, id: string, input: Record<string, unknown>) {
  await getEvent(userId, id);
  return queryOne(
    `UPDATE user_fashion_events
     SET title = COALESCE($3, title),
       occasion_slug = COALESCE($4, occasion_slug),
       event_date = COALESCE($5, event_date),
       location = COALESCE($6, location),
       dress_code = COALESCE($7, dress_code),
       notes = COALESCE($8, notes),
       selected_outfit_id = COALESCE($9, selected_outfit_id),
       reminder_enabled = COALESCE($10, reminder_enabled)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, input.title, input.occasion_slug, input.event_date, input.location, input.dress_code, input.notes, input.selected_outfit_id, input.reminder_enabled]
  );
}

export async function deleteEvent(userId: string, id: string) {
  await getEvent(userId, id);
  return queryOne("DELETE FROM user_fashion_events WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
}

export async function generateEventOutfit(userId: string, id: string, input: {
  mood?: string;
  useWeather: boolean;
  allowRecentlyWorn: boolean;
  avoidItemsWornWithinDays: number;
}) {
  await ensureAiLimit(userId);
  const event = await getEvent(userId, id) as {
    id: string;
    title: string;
    occasion_slug?: string | null;
    location?: string | null;
    dress_code?: string | null;
    notes?: string | null;
  };
  const occasionSlug = event.occasion_slug ?? "casual-visit";
  const [fashionContext, memoryContext, recentItems, weather] = await Promise.all([
    buildOutfitGenerationContext(userId, occasionSlug),
    buildFashionMemoryContext(userId),
    getRecentlyWornItems(userId, input.avoidItemsWornWithinDays),
    input.useWeather && event.location ? getCurrentWeather(event.location).catch(() => null) : null
  ]);

  const result = await eventStylingAgent(userId, {
    event,
    mood: input.mood,
    weather,
    fashion_context: fashionContext,
    fashion_memory: memoryContext,
    recent_items: recentItems,
    repetition_policy: input
  });

  const ownedIds = new Set((fashionContext.wardrobe_items as Array<{ id: string }>).map((item) => item.id));
  const selectedIds = result.selectedWardrobeItemIds.filter((itemId) => ownedIds.has(itemId));
  if (!selectedIds.length) {
    const error = new Error("AI did not select valid wardrobe items for this event");
    (error as Error & { statusCode?: number }).statusCode = 502;
    throw error;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const outfitResult = await client.query(
      `INSERT INTO outfits (user_id, occasion_id, title, mood, weather_context, ai_summary, why_this_works, color_harmony_score, formality_score, comfort_score)
       VALUES ($1, (SELECT id FROM outfit_occasions WHERE slug = $2), $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        occasionSlug,
        result.title,
        input.mood ?? null,
        weather ? JSON.stringify(weather) : null,
        result.stylingNotes,
        `${result.whyThisWorksForEvent}\n${result.whyThisFitsUser}`,
        result.eventReadinessScore,
        result.eventReadinessScore,
        result.eventReadinessScore
      ]
    );
    const outfit = outfitResult.rows[0];
    for (const itemId of selectedIds) {
      await client.query("INSERT INTO outfit_items (outfit_id, wardrobe_item_id, item_role) VALUES ($1, $2, 'event_selected')", [outfit.id, itemId]);
    }
    await client.query("UPDATE user_fashion_events SET selected_outfit_id = $3 WHERE id = $1 AND user_id = $2", [id, userId, outfit.id]);
    await client.query(
      `INSERT INTO outfit_recommendation_logs (user_id, outfit_id, occasion_slug, recommendation_reason)
       VALUES ($1, $2, $3, $4)`,
      [userId, outfit.id, occasionSlug, result.whyThisFitsUser || result.whyThisWorksForEvent]
    );
    await client.query("COMMIT");
    return { event, outfit, selected_wardrobe_item_ids: selectedIds, styling: result };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function selectOutfit(userId: string, eventId: string, outfitId: string) {
  const outfit = await queryOne("SELECT id FROM outfits WHERE id = $1 AND user_id = $2", [outfitId, userId]);
  if (!outfit) throwNotFound("Outfit not found");
  await getEvent(userId, eventId);
  return queryOne("UPDATE user_fashion_events SET selected_outfit_id = $3 WHERE id = $1 AND user_id = $2 RETURNING *", [eventId, userId, outfitId]);
}

export async function sendReminder(userId: string, eventId: string) {
  const event = await queryOne<{
    id: string;
    title: string;
    event_date: string;
    selected_outfit_id: string | null;
    user_email: string;
    full_name: string;
    outfit_title: string | null;
    outfit_summary: string | null;
  }>(
    `SELECT efe.*, u.email AS user_email, u.full_name, o.title AS outfit_title, o.ai_summary AS outfit_summary
     FROM user_fashion_events efe
     JOIN users u ON u.id = efe.user_id
     LEFT JOIN outfits o ON o.id = efe.selected_outfit_id
     WHERE efe.id = $1 AND efe.user_id = $2`,
    [eventId, userId]
  );
  if (!event) throwNotFound("Event not found");

  await sendEventReminderEmail(event.user_email, event.full_name, {
    eventTitle: event.title,
    eventDate: event.event_date,
    outfitTitle: event.outfit_title,
    outfitSummary: event.outfit_summary,
    finalChecklist: ["Check fit and comfort", "Prepare shoes and accessories", "Steam or iron key pieces", "Confirm weather before leaving"]
  });
  return { sent: true };
}

async function ensureEventLimit(userId: string) {
  const subscription = await getCurrentSubscription(userId);
  const planName = subscription.plan?.name?.toLowerCase() ?? "free";
  const limits = { free: 3, pro: 30, premium: 100 };
  const limit = limits[planName as keyof typeof limits] ?? limits.free;
  const row = await queryOne<{ count: number }>("SELECT COUNT(*)::int AS count FROM user_fashion_events WHERE user_id = $1 AND event_date >= NOW()", [userId]);
  if ((row?.count ?? 0) >= limit) {
    const error = new Error("Event limit reached for your current plan");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

function throwNotFound(message: string): never {
  const error = new Error(message);
  (error as Error & { statusCode?: number }).statusCode = 404;
  throw error;
}
