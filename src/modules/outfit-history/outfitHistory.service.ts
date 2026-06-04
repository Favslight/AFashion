import { getClient, query, queryOne } from "../../database/db.js";
import { updateMemoryFromWearHistory } from "../ai/ai.memory.js";

export async function markWorn(userId: string, input: {
  outfit_id?: string | null;
  wardrobe_item_ids?: string[];
  occasion_slug?: string;
  worn_date: string;
  location?: string;
  weather_context?: unknown;
  user_rating?: number;
  notes?: string;
}) {
  let itemIds = input.wardrobe_item_ids ?? [];
  if (input.outfit_id) {
    await ensureOwnedOutfit(userId, input.outfit_id);
    const rows = await query<{ wardrobe_item_id: string }>(
      `SELECT oi.wardrobe_item_id::text
       FROM outfit_items oi
       JOIN wardrobe_items wi ON wi.id = oi.wardrobe_item_id
       WHERE oi.outfit_id = $1 AND wi.user_id = $2 AND wi.deleted_at IS NULL`,
      [input.outfit_id, userId]
    );
    itemIds = rows.map((row) => row.wardrobe_item_id);
  } else {
    await ensureOwnedItems(userId, itemIds);
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const history = await client.query(
      `INSERT INTO outfit_wear_history (
         user_id, outfit_id, wardrobe_item_ids, occasion_slug, worn_date, location, weather_context, user_rating, notes
       )
       VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9)
       RETURNING *`,
      [userId, input.outfit_id ?? null, itemIds, input.occasion_slug ?? null, input.worn_date, input.location ?? null, input.weather_context ?? null, input.user_rating ?? null, input.notes ?? null]
    );

    if (itemIds.length) {
      await client.query(
        `UPDATE wardrobe_items
         SET times_worn = times_worn + 1, last_worn_at = $3::date
         WHERE user_id = $1 AND id = ANY($2::uuid[]) AND deleted_at IS NULL`,
        [userId, itemIds, input.worn_date]
      );
    }

    await client.query("COMMIT");
    await updateMemoryFromWearHistory(userId);
    return history.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listHistory(userId: string, input: { from?: string; to?: string; occasion_slug?: string }) {
  const filters = ["user_id = $1"];
  const params: unknown[] = [userId];
  if (input.from) {
    params.push(input.from);
    filters.push(`worn_date >= $${params.length}::date`);
  }
  if (input.to) {
    params.push(input.to);
    filters.push(`worn_date <= $${params.length}::date`);
  }
  if (input.occasion_slug) {
    params.push(input.occasion_slug);
    filters.push(`occasion_slug = $${params.length}`);
  }
  return query(`SELECT * FROM outfit_wear_history WHERE ${filters.join(" AND ")} ORDER BY worn_date DESC, created_at DESC`, params);
}

export async function recentHistory(userId: string) {
  return query("SELECT * FROM outfit_wear_history WHERE user_id = $1 ORDER BY worn_date DESC, created_at DESC LIMIT 20", [userId]);
}

export async function calendar(userId: string) {
  return query(
    `SELECT worn_date, COUNT(*)::int AS outfits_worn, array_agg(id) AS history_ids
     FROM outfit_wear_history
     WHERE user_id = $1
     GROUP BY worn_date
     ORDER BY worn_date DESC`,
    [userId]
  );
}

export async function deleteHistory(userId: string, id: string) {
  const history = await queryOne("SELECT * FROM outfit_wear_history WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!history) {
    const error = new Error("Outfit history entry not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  return queryOne("DELETE FROM outfit_wear_history WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
}

async function ensureOwnedOutfit(userId: string, outfitId: string) {
  const outfit = await queryOne("SELECT id FROM outfits WHERE id = $1 AND user_id = $2", [outfitId, userId]);
  if (!outfit) throwForbidden("Outfit not found");
}

async function ensureOwnedItems(userId: string, itemIds: string[]) {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM wardrobe_items WHERE user_id = $1 AND deleted_at IS NULL AND id = ANY($2::uuid[])",
    [userId, itemIds]
  );
  if ((row?.count ?? 0) !== itemIds.length) throwForbidden("One or more wardrobe items were not found");
}

function throwForbidden(message: string): never {
  const error = new Error(message);
  (error as Error & { statusCode?: number }).statusCode = 404;
  throw error;
}
