import { getClient, query, queryOne } from "../../database/db.js";
import type { WardrobeItemAnalysis } from "../../types/index.js";
import {
  deleteCloudinaryImage,
  optimizeImage,
  uploadImageToCloudinary,
  validateImageBuffer
} from "../../utils/image.js";
import { analyzeWardrobeImage } from "../ai/ai.service.js";
import { ensureWardrobeLimit } from "../subscriptions/subscriptions.service.js";

interface UploadInput {
  name: string;
  category?: string;
  subcategory?: string;
  gender_fit?: string;
  color?: string;
  material?: string;
}

interface UpdateInput {
  name?: string;
  category?: string | null;
  subcategory?: string | null;
  gender_fit?: string | null;
  color?: string | null;
  secondary_colors?: string[];
  style_tags?: string[];
  material?: string | null;
  season_tags?: string[];
  is_favorite?: boolean;
  times_worn?: number;
  last_worn_at?: string | null;
}

export async function uploadWardrobeItem(userId: string, buffer: Buffer, input: UploadInput) {
  await ensureWardrobeLimit(userId);
  await validateImageBuffer(buffer);
  const optimized = await optimizeImage(buffer);
  const upload = await uploadImageToCloudinary(optimized, `what-should-i-wear/${userId}/wardrobe`);

  return queryOne(
    `INSERT INTO wardrobe_items (
       user_id,
       name,
       category,
       subcategory,
       gender_fit,
       color,
       material,
       image_url,
       image_public_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      userId,
      input.name,
      input.category ?? null,
      input.subcategory ?? null,
      input.gender_fit ?? null,
      input.color ?? null,
      input.material ?? null,
      upload.secure_url,
      upload.public_id
    ]
  );
}

export async function listWardrobe(userId: string) {
  return query(
    `SELECT *
     FROM wardrobe_items
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [userId]
  );
}

export async function getWardrobeItem(userId: string, itemId: string) {
  const item = await queryOne(
    `SELECT *
     FROM wardrobe_items
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [itemId, userId]
  );

  if (!item) {
    const error = new Error("Wardrobe item not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return item;
}

export async function updateWardrobeItem(userId: string, itemId: string, input: UpdateInput) {
  await getWardrobeItem(userId, itemId);

  return queryOne(
    `UPDATE wardrobe_items
     SET
       name = COALESCE($3, name),
       category = COALESCE($4, category),
       subcategory = COALESCE($5, subcategory),
       gender_fit = COALESCE($6, gender_fit),
       color = COALESCE($7, color),
       secondary_colors = COALESCE($8, secondary_colors),
       style_tags = COALESCE($9, style_tags),
       material = COALESCE($10, material),
       season_tags = COALESCE($11, season_tags),
       is_favorite = COALESCE($12, is_favorite),
       times_worn = COALESCE($13, times_worn),
       last_worn_at = COALESCE($14, last_worn_at)
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [
      itemId,
      userId,
      input.name,
      input.category,
      input.subcategory,
      input.gender_fit,
      input.color,
      input.secondary_colors,
      input.style_tags,
      input.material,
      input.season_tags,
      input.is_favorite,
      input.times_worn,
      input.last_worn_at
    ]
  );
}

export async function deleteWardrobeItem(userId: string, itemId: string) {
  const item = await getWardrobeItem(userId, itemId) as { image_public_id?: string };
  const deleted = await queryOne(
    `UPDATE wardrobe_items
     SET deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [itemId, userId]
  );

  if (item.image_public_id) {
    await deleteCloudinaryImage(item.image_public_id);
  }

  return deleted;
}

export async function analyzeAndUpdateWardrobeItem(userId: string, itemId: string) {
  const item = await getWardrobeItem(userId, itemId) as { image_url: string };
  const analysis = await analyzeWardrobeImage(userId, item.image_url);
  return applyAnalysis(userId, itemId, analysis);
}

async function applyAnalysis(userId: string, itemId: string, analysis: WardrobeItemAnalysis) {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE wardrobe_items
       SET
         category = $3,
         subcategory = $4,
         color = $5,
         secondary_colors = $6,
         style_tags = $7,
         material = $8,
         season_tags = $9,
         gender_fit = $10,
         ai_description = $11,
         ai_confidence = $12
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [
        itemId,
        userId,
        analysis.category,
        (analysis as WardrobeItemAnalysis & { subcategory?: string }).subcategory ?? null,
        analysis.color,
        analysis.secondary_colors,
        analysis.style_tags,
        analysis.material,
        analysis.season_tags,
        analysis.gender_fit,
        analysis.description,
        analysis.confidence_score
      ]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
