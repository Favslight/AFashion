import { query, queryOne } from "../../database/db.js";
import { getPagination, getPaginationMeta } from "../admin/admin.schema.js";
import { personalShopperAgent } from "../ai/ai.agents.js";
import {
  calculateColorHarmonyScore,
  calculateComfortScore,
  calculateFormalityScore,
  calculateOccasionFitScore,
  calculateOverallOutfitScore,
  calculateWardrobeMatchScore
} from "../ai/ai.scoring.js";
import { buildOutfitGenerationContext, buildUserFashionContext } from "../ai/ai.context.js";

interface ListQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order: "asc" | "desc";
}

const tableConfig = {
  colors: {
    table: "color_combinations",
    search: ["primary_color", "matching_color", "harmony_type", "description"],
    sort: new Set(["created_at", "score", "primary_color"])
  },
  "style-rules": {
    table: "style_rules",
    search: ["title", "category", "rule_text"],
    sort: new Set(["created_at", "updated_at", "priority", "title"])
  },
  "occasion-rules": {
    table: "occasion_rules",
    search: ["occasion_slug", "rule_type", "rule_text"],
    sort: new Set(["created_at", "updated_at", "priority", "occasion_slug"])
  },
  "body-type-rules": {
    table: "body_type_rules",
    search: ["body_type"],
    sort: new Set(["created_at", "body_type"])
  },
  "climate-rules": {
    table: "climate_style_rules",
    search: ["climate_type"],
    sort: new Set(["created_at", "climate_type"])
  },
  aesthetics: {
    table: "fashion_aesthetics",
    search: ["name", "slug", "description"],
    sort: new Set(["created_at", "name"])
  }
} as const;

type AdminResource = keyof typeof tableConfig;

export async function listColorCombinations() {
  return query(
    `SELECT *
     FROM color_combinations
     ORDER BY score DESC, primary_color ASC`
  );
}

export async function listAesthetics() {
  return query(
    `SELECT *
     FROM fashion_aesthetics
     ORDER BY name ASC`
  );
}

export async function listStyleRules(input: ListQuery) {
  return listResource("style-rules", input);
}

export async function listOccasionRules(slug: string) {
  return query(
    `SELECT *
     FROM occasion_rules
     WHERE occasion_slug = $1 AND is_active = TRUE
     ORDER BY priority DESC, created_at ASC`,
    [slug]
  );
}

export async function scoreOutfit(userId: string, input: {
  wardrobe_item_ids: string[];
  occasion_slug: string;
  weather?: string;
  mood?: string;
}) {
  const context = await buildOutfitGenerationContext(userId, input.occasion_slug);
  const selectedItems = await query(
    `SELECT id, name, category, subcategory, gender_fit, color, secondary_colors, style_tags, material, season_tags, ai_description
     FROM wardrobe_items
     WHERE user_id = $1 AND deleted_at IS NULL AND id = ANY($2::uuid[])`,
    [userId, input.wardrobe_item_ids]
  );

  if (selectedItems.length !== input.wardrobe_item_ids.length) {
    const error = new Error("One or more wardrobe items were not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const scores = {
    color_harmony_score: calculateColorHarmonyScore(selectedItems, context.color_rules),
    occasion_fit_score: calculateOccasionFitScore(selectedItems, context.occasion_rules),
    formality_score: calculateFormalityScore(selectedItems, context.occasion),
    comfort_score: calculateComfortScore(selectedItems, context.climate_rules, input.weather),
    wardrobe_match_score: calculateWardrobeMatchScore(selectedItems, context.profile)
  };

  return calculateOverallOutfitScore(scores);
}

export async function recommendMissingItems(userId: string, input: {
  occasion_slug?: string;
  aesthetic_slugs?: string[];
  budget_range?: string;
}) {
  const context = await buildUserFashionContext(userId);
  const occasionContext = input.occasion_slug
    ? await buildOutfitGenerationContext(userId, input.occasion_slug)
    : null;

  return personalShopperAgent(userId, {
    ...context,
    occasion_context: occasionContext,
    request: input
  });
}

export async function listResource(resource: AdminResource, input: ListQuery) {
  const config = tableConfig[resource];
  const filters: string[] = ["1=1"];
  const params: unknown[] = [];

  if (input.search) {
    params.push(`%${input.search}%`);
    filters.push(`(${config.search.map((column) => `${column} ILIKE $${params.length}`).join(" OR ")})`);
  }
  if (input.category && resource === "style-rules") {
    params.push(input.category);
    filters.push(`category = $${params.length}`);
  }
  if (typeof input.is_active === "boolean" && ["style_rules", "occasion_rules"].includes(config.table)) {
    params.push(input.is_active);
    filters.push(`is_active = $${params.length}`);
  }

  const sortBy = input.sort_by && config.sort.has(input.sort_by) ? input.sort_by : "created_at";
  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();

  const [items, total] = await Promise.all([
    query(
      `SELECT *
       FROM ${config.table}
       WHERE ${where}
       ORDER BY ${sortBy} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(`SELECT COUNT(*)::int AS count FROM ${config.table} WHERE ${where}`, params)
  ]);

  return {
    items,
    pagination: getPaginationMeta(total?.count ?? 0, input.page, input.limit)
  };
}

export async function createResource(resource: AdminResource, input: Record<string, unknown>) {
  switch (resource) {
    case "colors":
      return queryOne(
        `INSERT INTO color_combinations (primary_color, matching_color, harmony_type, score, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [input.primary_color, input.matching_color, input.harmony_type ?? null, input.score ?? 0, input.description ?? null]
      );
    case "style-rules":
      return queryOne(
        `INSERT INTO style_rules (title, category, gender_support, rule_text, priority, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [input.title, input.category, input.gender_support, input.rule_text, input.priority ?? 1, input.is_active ?? true]
      );
    case "occasion-rules":
      return queryOne(
        `INSERT INTO occasion_rules (occasion_slug, rule_type, rule_text, recommended_categories, avoid_categories, recommended_colors, avoid_colors, formality_level, gender_support, priority, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          input.occasion_slug,
          input.rule_type,
          input.rule_text,
          input.recommended_categories ?? [],
          input.avoid_categories ?? [],
          input.recommended_colors ?? [],
          input.avoid_colors ?? [],
          input.formality_level ?? null,
          input.gender_support ?? ["male", "female", "unisex"],
          input.priority ?? 1,
          input.is_active ?? true
        ]
      );
    case "body-type-rules":
      return queryOne(
        `INSERT INTO body_type_rules (body_type, gender_support, recommended_fits, avoid_fits, styling_tips)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [input.body_type, input.gender_support ?? ["male", "female", "unisex"], input.recommended_fits ?? [], input.avoid_fits ?? [], input.styling_tips ?? []]
      );
    case "climate-rules":
      return queryOne(
        `INSERT INTO climate_style_rules (climate_type, recommended_fabrics, avoid_fabrics, recommended_categories, styling_tips)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [input.climate_type, input.recommended_fabrics ?? [], input.avoid_fabrics ?? [], input.recommended_categories ?? [], input.styling_tips ?? []]
      );
    case "aesthetics":
      return queryOne(
        `INSERT INTO fashion_aesthetics (name, slug, description, keywords, recommended_colors, common_categories)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [input.name, input.slug, input.description ?? null, input.keywords ?? [], input.recommended_colors ?? [], input.common_categories ?? []]
      );
  }
}

export async function updateResource(resource: AdminResource, id: string, input: Record<string, unknown>) {
  await getResource(resource, id);
  const config = tableConfig[resource];
  const allowedColumns = Object.keys(input);
  const setFragments = allowedColumns.map((column, index) => `${column} = $${index + 2}`);

  if (!setFragments.length) {
    return getResource(resource, id);
  }

  return queryOne(
    `UPDATE ${config.table}
     SET ${setFragments.join(", ")}
     WHERE id = $1
     RETURNING *`,
    [id, ...allowedColumns.map((column) => input[column])]
  );
}

export async function deleteResource(resource: AdminResource, id: string) {
  await getResource(resource, id);
  return queryOne(`DELETE FROM ${tableConfig[resource].table} WHERE id = $1 RETURNING id`, [id]);
}

async function getResource(resource: AdminResource, id: string) {
  const row = await queryOne(`SELECT * FROM ${tableConfig[resource].table} WHERE id = $1`, [id]);
  if (!row) {
    const error = new Error("Fashion intelligence resource not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  return row;
}
