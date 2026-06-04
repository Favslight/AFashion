import { query, queryOne } from "../../database/db.js";
import { buildUserFashionContext } from "../ai/ai.context.js";
import { wardrobeHealthAgent } from "../ai/ai.agents.js";
import { ensureAiLimit, ensureMinimumPlan } from "../subscriptions/subscriptions.service.js";

export async function analyzeWardrobeHealth(userId: string, input: { focus: string; climate?: string }) {
  await ensureMinimumPlan(userId, ["Pro", "Premium"], "Wardrobe health reports");
  await ensureAiLimit(userId);

  const context = await buildUserFashionContext(userId);
  const wardrobeItems = context.wardrobe_items as Array<{
    category?: string;
    color?: string;
    style_tags?: string[];
    material?: string;
    season_tags?: string[];
  }>;

  const categoryBreakdown = countBy(wardrobeItems.map((item) => item.category ?? "unknown"));
  const colorBreakdown = countBy(wardrobeItems.map((item) => item.color ?? "unknown"));
  const styleBreakdown = countBy(wardrobeItems.flatMap((item) => item.style_tags ?? []));

  const aiReport = await wardrobeHealthAgent(userId, {
    focus: input.focus,
    climate: input.climate,
    context,
    deterministic_breakdowns: {
      category_breakdown: categoryBreakdown,
      color_breakdown: colorBreakdown,
      style_breakdown: styleBreakdown
    }
  });

  const report = await queryOne(
    `INSERT INTO wardrobe_health_reports (
       user_id, total_items, category_breakdown, color_breakdown, style_breakdown,
       missing_essentials, overrepresented_items, underrepresented_items, recommendations, ai_summary
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      userId,
      wardrobeItems.length,
      categoryBreakdown,
      colorBreakdown,
      styleBreakdown,
      aiReport.missingEssentials,
      aiReport.overrepresentedItems,
      aiReport.underrepresentedItems,
      aiReport.recommendations,
      aiReport.summary
    ]
  );

  return { report };
}

export async function latestReport(userId: string) {
  return queryOne(
    `SELECT *
     FROM wardrobe_health_reports
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
}

export async function listReports(userId: string) {
  return query(
    `SELECT id, total_items, category_breakdown, color_breakdown, style_breakdown,
      missing_essentials, overrepresented_items, underrepresented_items, recommendations, ai_summary, created_at
     FROM wardrobe_health_reports
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
}

export async function getReport(userId: string, reportId: string) {
  const report = await queryOne(
    "SELECT * FROM wardrobe_health_reports WHERE id = $1 AND user_id = $2",
    [reportId, userId]
  );
  if (!report) {
    const error = new Error("Wardrobe health report not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  return report;
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    const key = value?.toLowerCase?.() || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
