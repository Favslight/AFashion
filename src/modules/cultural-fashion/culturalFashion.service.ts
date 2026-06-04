import { query, queryOne } from "../../database/db.js";
import { getPagination, getPaginationMeta } from "../admin/admin.schema.js";
import { culturalFashionStylingAgent } from "../ai/ai.agents.js";
import { buildCulturalFashionContext } from "../ai/ai.context.js";

interface ListQuery {
  page: number;
  limit: number;
  search?: string;
  country?: string;
  ethnic_group?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order: "asc" | "desc";
}

interface CulturalStyleInput {
  cultureSlug: string;
  occasionSlug: string;
  genderPreference?: string;
  mood?: string;
  useWardrobe?: boolean;
}

const adminResourceConfig = {
  profiles: {
    table: "cultural_fashion_profiles",
    search: ["country", "region", "ethnic_group", "slug", "description"],
    sort: new Set(["created_at", "updated_at", "country", "ethnic_group", "slug"])
  },
  "occasion-rules": {
    table: "cultural_occasion_rules",
    search: ["occasion_slug", "dress_code_level", "formality_notes"],
    sort: new Set(["created_at", "updated_at", "occasion_slug", "dress_code_level"])
  },
  components: {
    table: "cultural_outfit_components",
    search: ["name", "component_type", "description"],
    sort: new Set(["created_at", "name", "component_type"])
  }
} as const;

export type CulturalAdminResource = keyof typeof adminResourceConfig;

export async function listProfiles(input: Partial<ListQuery> = {}) {
  const filters = ["is_active = TRUE"];
  const params: unknown[] = [];

  if (input.country) {
    params.push(input.country);
    filters.push(`country ILIKE $${params.length}`);
  }
  if (input.ethnic_group) {
    params.push(input.ethnic_group);
    filters.push(`ethnic_group ILIKE $${params.length}`);
  }
  if (input.search) {
    params.push(`%${input.search}%`);
    filters.push(`(country ILIKE $${params.length} OR region ILIKE $${params.length} OR ethnic_group ILIKE $${params.length} OR slug ILIKE $${params.length})`);
  }

  return query(
    `SELECT id, country, region, ethnic_group, slug, description, male_signature_outfits,
      female_signature_outfits, unisex_signature_outfits, common_fabrics, common_colors,
      symbolic_colors, common_accessories, modern_variations, cultural_notes, mistakes_to_avoid,
      created_at, updated_at
     FROM cultural_fashion_profiles
     WHERE ${filters.join(" AND ")}
     ORDER BY country ASC, ethnic_group ASC`,
    params
  );
}

export async function getProfileBySlug(slug: string) {
  const profile = await queryOne(
    `SELECT *
     FROM cultural_fashion_profiles
     WHERE slug = $1 AND is_active = TRUE`,
    [slug]
  );

  if (!profile) {
    const error = new Error("Cultural fashion profile not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return profile;
}

export async function listOccasionRulesForProfile(slug: string) {
  const profile = await getProfileBySlug(slug);
  const rules = await query(
    `SELECT *
     FROM cultural_occasion_rules
     WHERE cultural_profile_id = $1
     ORDER BY occasion_slug ASC, created_at ASC`,
    [(profile as { id: string }).id]
  );

  return { profile, rules };
}

export async function searchProfiles(input: { country?: string; ethnicGroup?: string; q?: string }) {
  return listProfiles({
    country: input.country ? `%${input.country}%` : undefined,
    ethnic_group: input.ethnicGroup ? `%${input.ethnicGroup}%` : undefined,
    search: input.q
  });
}

export async function getPreference(userId: string) {
  return queryOne(
    `SELECT *
     FROM user_cultural_preferences
     WHERE user_id = $1`,
    [userId]
  );
}

export async function upsertPreference(userId: string, input: Record<string, unknown>) {
  return queryOne(
    `INSERT INTO user_cultural_preferences (
       user_id,
       country,
       ethnic_group,
       preferred_cultural_styles,
       wears_traditional_attire,
       cultural_style_notes
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       country = EXCLUDED.country,
       ethnic_group = EXCLUDED.ethnic_group,
       preferred_cultural_styles = EXCLUDED.preferred_cultural_styles,
       wears_traditional_attire = EXCLUDED.wears_traditional_attire,
       cultural_style_notes = EXCLUDED.cultural_style_notes
     RETURNING *`,
    [
      userId,
      input.country ?? null,
      input.ethnic_group ?? null,
      input.preferred_cultural_styles ?? [],
      input.wears_traditional_attire ?? false,
      input.cultural_style_notes ?? null
    ]
  );
}

export async function patchPreference(userId: string, input: Record<string, unknown>) {
  const existing = await getPreference(userId);
  return upsertPreference(userId, {
    ...(existing ?? {}),
    ...input
  });
}

export async function styleCulturalLook(userId: string, input: CulturalStyleInput) {
  const context = await buildCulturalFashionContext({
    userId,
    cultureSlug: input.cultureSlug,
    occasionSlug: input.occasionSlug,
    genderPreference: input.genderPreference,
    useWardrobe: input.useWardrobe ?? true
  });

  return culturalFashionStylingAgent(userId, {
    request: {
      culture_slug: input.cultureSlug,
      occasion_slug: input.occasionSlug,
      gender_preference: input.genderPreference,
      mood: input.mood,
      use_wardrobe: input.useWardrobe ?? true
    },
    cultural_context: context
  });
}

export async function adminListResource(resource: CulturalAdminResource, input: ListQuery) {
  const config = adminResourceConfig[resource];
  const filters: string[] = ["1=1"];
  const params: unknown[] = [];

  if (input.search) {
    params.push(`%${input.search}%`);
    filters.push(`(${config.search.map((column) => `${column} ILIKE $${params.length}`).join(" OR ")})`);
  }
  if (resource === "profiles") {
    if (input.country) {
      params.push(`%${input.country}%`);
      filters.push(`country ILIKE $${params.length}`);
    }
    if (input.ethnic_group) {
      params.push(`%${input.ethnic_group}%`);
      filters.push(`ethnic_group ILIKE $${params.length}`);
    }
    if (typeof input.is_active === "boolean") {
      params.push(input.is_active);
      filters.push(`is_active = $${params.length}`);
    }
  }

  const { limit, offset } = getPagination(input);
  const sortBy = input.sort_by && config.sort.has(input.sort_by) ? input.sort_by : "created_at";
  const order = input.sort_order.toUpperCase();
  const where = filters.join(" AND ");

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

export async function adminGetResource(resource: CulturalAdminResource, id: string) {
  const item = await queryOne(`SELECT * FROM ${adminResourceConfig[resource].table} WHERE id = $1`, [id]);
  if (!item) {
    const error = new Error("Cultural fashion resource not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  return item;
}

export async function adminCreateResource(resource: CulturalAdminResource, input: Record<string, unknown>) {
  switch (resource) {
    case "profiles":
      return queryOne(
        `INSERT INTO cultural_fashion_profiles (
          country, region, ethnic_group, slug, description, male_signature_outfits,
          female_signature_outfits, unisex_signature_outfits, common_fabrics, common_colors,
          symbolic_colors, common_accessories, modern_variations, cultural_notes, mistakes_to_avoid, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          input.country,
          input.region ?? null,
          input.ethnic_group,
          input.slug,
          input.description ?? null,
          input.male_signature_outfits ?? [],
          input.female_signature_outfits ?? [],
          input.unisex_signature_outfits ?? [],
          input.common_fabrics ?? [],
          input.common_colors ?? [],
          input.symbolic_colors ?? {},
          input.common_accessories ?? [],
          input.modern_variations ?? [],
          input.cultural_notes ?? [],
          input.mistakes_to_avoid ?? [],
          input.is_active ?? true
        ]
      );
    case "occasion-rules":
      await adminGetResource("profiles", input.cultural_profile_id as string);
      return queryOne(
        `INSERT INTO cultural_occasion_rules (
          cultural_profile_id, occasion_slug, dress_code_level, male_recommendations,
          female_recommendations, unisex_recommendations, accessories, color_guidance,
          avoid_rules, formality_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          input.cultural_profile_id,
          input.occasion_slug,
          input.dress_code_level ?? null,
          input.male_recommendations ?? [],
          input.female_recommendations ?? [],
          input.unisex_recommendations ?? [],
          input.accessories ?? [],
          input.color_guidance ?? [],
          input.avoid_rules ?? [],
          input.formality_notes ?? null
        ]
      );
    case "components":
      await adminGetResource("profiles", input.cultural_profile_id as string);
      return queryOne(
        `INSERT INTO cultural_outfit_components (
          cultural_profile_id, name, component_type, gender_support, description, common_pairings, suitable_occasions
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          input.cultural_profile_id,
          input.name,
          input.component_type,
          input.gender_support ?? ["male", "female", "unisex"],
          input.description ?? null,
          input.common_pairings ?? [],
          input.suitable_occasions ?? []
        ]
      );
  }
}

export async function adminUpdateResource(resource: CulturalAdminResource, id: string, input: Record<string, unknown>) {
  await adminGetResource(resource, id);
  if ("cultural_profile_id" in input && input.cultural_profile_id) {
    await adminGetResource("profiles", input.cultural_profile_id as string);
  }

  const columns = Object.keys(input);
  if (!columns.length) {
    return adminGetResource(resource, id);
  }

  const fragments = columns.map((column, index) => `${column} = $${index + 2}`);
  return queryOne(
    `UPDATE ${adminResourceConfig[resource].table}
     SET ${fragments.join(", ")}
     WHERE id = $1
     RETURNING *`,
    [id, ...columns.map((column) => input[column])]
  );
}

export async function adminDeleteResource(resource: CulturalAdminResource, id: string) {
  await adminGetResource(resource, id);
  return queryOne(`DELETE FROM ${adminResourceConfig[resource].table} WHERE id = $1 RETURNING id`, [id]);
}
