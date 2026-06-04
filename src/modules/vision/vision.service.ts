import { getClient, query, queryOne } from "../../database/db.js";
import {
  deleteCloudinaryImage,
  optimizeImage,
  uploadImageToCloudinary,
  validateImageBuffer
} from "../../utils/image.js";
import { buildUserFashionContext } from "../ai/ai.context.js";
import {
  outfitPhotoReviewAgent,
  visionWardrobeAnalysisAgent
} from "../ai/ai.agents.js";
import {
  ensureAiLimit,
  ensureMinimumPlan,
  ensureWardrobeLimit,
  getCurrentSubscription
} from "../subscriptions/subscriptions.service.js";

type VisionAnalysis = Awaited<ReturnType<typeof visionWardrobeAnalysisAgent>>;

export async function analyzeWardrobeImageUpload(userId: string, buffer: Buffer, input: {
  saveToWardrobe: boolean;
  name?: string;
}) {
  await ensureAiLimit(userId);
  await ensureVisionUsageLimit(userId, "wardrobe_scan");
  await validateImageBuffer(buffer);
  const optimized = await optimizeImage(buffer);
  const upload = await uploadImageToCloudinary(optimized, `what-should-i-wear/${userId}/vision-wardrobe`);
  const context = await buildUserFashionContext(userId);
  const analysis = await visionWardrobeAnalysisAgent(userId, upload.secure_url, context);

  let wardrobeItem = null;
  if (input.saveToWardrobe) {
    await ensureWardrobeLimit(userId);
    wardrobeItem = await createWardrobeItemFromAnalysis(userId, upload.secure_url, upload.public_id, input.name, analysis);
  }

  const scanJob = await saveScanJob(userId, {
    wardrobe_item_id: (wardrobeItem as { id?: string } | null)?.id ?? null,
    status: "completed",
    image_url: upload.secure_url,
    image_public_id: upload.public_id,
    result: analysis
  });

  return { analysis, image_url: upload.secure_url, image_public_id: upload.public_id, wardrobe_item: wardrobeItem, scan_job: scanJob };
}

export async function reviewOutfitPhoto(userId: string, buffer: Buffer, input: {
  occasionSlug?: string;
  location?: string;
  weatherData?: unknown;
}) {
  await ensureAiLimit(userId);
  await ensureVisionUsageLimit(userId, "photo_review");
  await validateImageBuffer(buffer);
  const optimized = await optimizeImage(buffer);
  const upload = await uploadImageToCloudinary(optimized, `what-should-i-wear/${userId}/outfit-reviews`);

  const weatherContext = input.weatherData ?? (input.location ? { location: input.location } : null);
  const review = await outfitPhotoReviewAgent(userId, upload.secure_url, {
    occasionSlug: input.occasionSlug,
    weatherContext
  });

  const saved = await queryOne(
    `INSERT INTO outfit_photo_reviews (
       user_id, image_url, image_public_id, occasion_slug, weather_context,
       overall_score, color_harmony_score, formality_score, fit_balance_score, occasion_suitability_score,
       ai_feedback, strengths, improvements, accessory_suggestions, alternative_suggestions, final_verdict, raw_ai_response
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING *`,
    [
      userId,
      upload.secure_url,
      upload.public_id,
      input.occasionSlug ?? null,
      weatherContext ?? null,
      review.overallScore,
      review.colorHarmonyScore,
      review.formalityScore,
      review.fitBalanceScore,
      review.occasionSuitabilityScore,
      review.feedback,
      review.strengths,
      review.improvements,
      review.accessorySuggestions,
      review.alternativeSuggestions,
      review.finalVerdict,
      review
    ]
  );

  return { review: saved };
}

export async function listReviews(userId: string) {
  return query(
    `SELECT id, image_url, occasion_slug, weather_context, overall_score, color_harmony_score,
      formality_score, fit_balance_score, occasion_suitability_score, ai_feedback, strengths,
      improvements, accessory_suggestions, alternative_suggestions, final_verdict, created_at
     FROM outfit_photo_reviews
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
}

export async function getReview(userId: string, reviewId: string) {
  const review = await queryOne(
    `SELECT id, image_url, occasion_slug, weather_context, overall_score, color_harmony_score,
      formality_score, fit_balance_score, occasion_suitability_score, ai_feedback, strengths,
      improvements, accessory_suggestions, alternative_suggestions, final_verdict, raw_ai_response, created_at
     FROM outfit_photo_reviews
     WHERE id = $1 AND user_id = $2`,
    [reviewId, userId]
  );
  if (!review) throwNotFound("Outfit photo review not found");
  return review;
}

export async function deleteReview(userId: string, reviewId: string) {
  const review = await queryOne<{ id: string; image_public_id: string }>(
    "SELECT id, image_public_id FROM outfit_photo_reviews WHERE id = $1 AND user_id = $2",
    [reviewId, userId]
  );
  if (!review) throwNotFound("Outfit photo review not found");

  await queryOne("DELETE FROM outfit_photo_reviews WHERE id = $1 AND user_id = $2 RETURNING id", [reviewId, userId]);
  await deleteCloudinaryImage(review.image_public_id);
}

export async function rescanWardrobeItem(userId: string, itemId: string) {
  await ensureAiLimit(userId);
  await ensureVisionUsageLimit(userId, "wardrobe_scan");
  const item = await queryOne<{ id: string; image_url: string; image_public_id: string }>(
    "SELECT id, image_url, image_public_id FROM wardrobe_items WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
    [itemId, userId]
  );
  if (!item) throwNotFound("Wardrobe item not found");

  const job = await saveScanJob(userId, {
    wardrobe_item_id: item.id,
    status: "processing",
    image_url: item.image_url,
    image_public_id: item.image_public_id
  });

  try {
    const analysis = await visionWardrobeAnalysisAgent(userId, item.image_url, await buildUserFashionContext(userId));
    const updated = await updateWardrobeItemFromAnalysis(userId, itemId, analysis);
    const completed = await completeScanJob((job as { id: string }).id, "completed", analysis);
    return { item: updated, scan_job: completed, analysis };
  } catch (error) {
    await completeScanJob((job as { id: string }).id, "failed", null, error instanceof Error ? error.message : "Scan failed");
    throw error;
  }
}

export async function bulkScan(userId: string, files: Array<{ buffer: Buffer; filename?: string }>) {
  await ensureMinimumPlan(userId, ["Premium"], "Bulk wardrobe scan");
  await ensureAiLimit(userId);
  const limit = await getBulkLimit(userId);
  if (files.length > limit) {
    const error = new Error(`Bulk scan limit exceeded. Your plan allows ${limit} items per request`);
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  const successful: unknown[] = [];
  const failed: unknown[] = [];

  for (const [index, file] of files.entries()) {
    try {
      await ensureWardrobeLimit(userId);
      await ensureVisionUsageLimit(userId, "wardrobe_scan");
      await validateImageBuffer(file.buffer);
      const optimized = await optimizeImage(file.buffer);
      const upload = await uploadImageToCloudinary(optimized, `what-should-i-wear/${userId}/bulk-wardrobe`);
      const job = await saveScanJob(userId, {
        status: "processing",
        image_url: upload.secure_url,
        image_public_id: upload.public_id
      });
      const analysis = await visionWardrobeAnalysisAgent(userId, upload.secure_url, await buildUserFashionContext(userId));
      const item = await createWardrobeItemFromAnalysis(userId, upload.secure_url, upload.public_id, file.filename, analysis);
      const completedJob = await completeScanJob((job as { id: string }).id, "completed", analysis);
      successful.push({ index, item, scan_job: completedJob, analysis });
    } catch (error) {
      failed.push({ index, filename: file.filename, error: error instanceof Error ? error.message : "Scan failed" });
    }
  }

  return { successful, failed };
}

export async function listScanJobs(userId: string) {
  return query(
    `SELECT *
     FROM wardrobe_scan_jobs
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
}

export async function getScanJob(userId: string, jobId: string) {
  const job = await queryOne("SELECT * FROM wardrobe_scan_jobs WHERE id = $1 AND user_id = $2", [jobId, userId]);
  if (!job) throwNotFound("Scan job not found");
  return job;
}

async function createWardrobeItemFromAnalysis(userId: string, imageUrl: string, publicId: string, name: string | undefined, analysis: VisionAnalysis) {
  return queryOne(
    `INSERT INTO wardrobe_items (
       user_id, name, category, subcategory, gender_fit, color, secondary_colors,
       style_tags, material, season_tags, image_url, image_public_id, ai_description, ai_confidence
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      userId,
      name || analysis.description.slice(0, 80) || `${analysis.color} ${analysis.category}`,
      analysis.category,
      analysis.subcategory,
      analysis.genderFit,
      analysis.color,
      analysis.secondaryColors,
      [...analysis.styleTags, analysis.pattern, analysis.formalityLevel].filter(Boolean),
      analysis.materialGuess,
      analysis.seasonTags,
      imageUrl,
      publicId,
      analysis.description,
      analysis.confidence
    ]
  );
}

async function updateWardrobeItemFromAnalysis(userId: string, itemId: string, analysis: VisionAnalysis) {
  return queryOne(
    `UPDATE wardrobe_items
     SET category = $3, subcategory = $4, gender_fit = $5, color = $6, secondary_colors = $7,
       style_tags = $8, material = $9, season_tags = $10, ai_description = $11, ai_confidence = $12
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [
      itemId,
      userId,
      analysis.category,
      analysis.subcategory,
      analysis.genderFit,
      analysis.color,
      analysis.secondaryColors,
      [...analysis.styleTags, analysis.pattern, analysis.formalityLevel].filter(Boolean),
      analysis.materialGuess,
      analysis.seasonTags,
      analysis.description,
      analysis.confidence
    ]
  );
}

async function saveScanJob(userId: string, input: {
  wardrobe_item_id?: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  image_url?: string | null;
  image_public_id?: string | null;
  result?: unknown;
}) {
  return queryOne(
    `INSERT INTO wardrobe_scan_jobs (user_id, wardrobe_item_id, status, image_url, image_public_id, result, started_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $3 IN ('processing','completed','failed') THEN NOW() ELSE NULL END,
       CASE WHEN $3 IN ('completed','failed') THEN NOW() ELSE NULL END)
     RETURNING *`,
    [userId, input.wardrobe_item_id ?? null, input.status, input.image_url ?? null, input.image_public_id ?? null, input.result ?? null]
  );
}

async function completeScanJob(jobId: string, status: "completed" | "failed", result?: unknown, errorMessage?: string) {
  return queryOne(
    `UPDATE wardrobe_scan_jobs
     SET status = $2, result = $3, error_message = $4, completed_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [jobId, status, result ?? null, errorMessage ?? null]
  );
}

async function ensureVisionUsageLimit(userId: string, type: "photo_review" | "wardrobe_scan") {
  const subscription = await getCurrentSubscription(userId);
  const planName = subscription.plan?.name?.toLowerCase() ?? "free";
  const table = type === "photo_review" ? "outfit_photo_reviews" : "wardrobe_scan_jobs";
  const limits = type === "photo_review"
    ? { free: 5, pro: 40, premium: 150 }
    : { free: 10, pro: 100, premium: 500 };
  const limit = limits[planName as keyof typeof limits] ?? limits.free;
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM ${table} WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())`,
    [userId]
  );
  if ((row?.count ?? 0) >= limit) {
    const error = new Error(`Monthly ${type.replace("_", " ")} limit reached for your current plan`);
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

async function getBulkLimit(userId: string) {
  const subscription = await getCurrentSubscription(userId);
  const planName = subscription.plan?.name?.toLowerCase() ?? "free";
  const limits = { free: 0, pro: 10, premium: 50 };
  return limits[planName as keyof typeof limits] ?? limits.free;
}

function throwNotFound(message: string): never {
  const error = new Error(message);
  (error as Error & { statusCode?: number }).statusCode = 404;
  throw error;
}
