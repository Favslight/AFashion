import { queryOne } from "../../database/db.js";
import { upsertPreference } from "../cultural-fashion/culturalFashion.service.js";

interface StyleProfileInput {
  gender_preference?: string | null;
  body_type?: string | null;
  budget_range?: string | null;
  climate_location?: string | null;
  fashion_goals?: string[];
  favorite_aesthetics?: string[];
  favorite_colors?: string[];
  preferred_categories?: string[];
  fashion_inspirations?: string[];
  country?: string | null;
  ethnic_group?: string | null;
  preferred_cultural_styles?: string[];
  wears_traditional_attire?: boolean;
  cultural_style_notes?: string | null;
}

export async function getProfile(userId: string) {
  const profile = await queryOne(
    `SELECT *
     FROM user_style_profiles
     WHERE user_id = $1`,
    [userId]
  );
  const cultural_preferences = await queryOne(
    `SELECT *
     FROM user_cultural_preferences
     WHERE user_id = $1`,
    [userId]
  );

  return { profile, cultural_preferences };
}

export async function upsertProfile(userId: string, input: StyleProfileInput) {
  const profile = await queryOne(
    `INSERT INTO user_style_profiles (
       user_id,
       gender_preference,
       body_type,
       budget_range,
       climate_location,
       fashion_goals,
       favorite_aesthetics,
       favorite_colors,
       preferred_categories,
       fashion_inspirations
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id) DO UPDATE SET
       gender_preference = EXCLUDED.gender_preference,
       body_type = EXCLUDED.body_type,
       budget_range = EXCLUDED.budget_range,
       climate_location = EXCLUDED.climate_location,
       fashion_goals = EXCLUDED.fashion_goals,
       favorite_aesthetics = EXCLUDED.favorite_aesthetics,
       favorite_colors = EXCLUDED.favorite_colors,
       preferred_categories = EXCLUDED.preferred_categories,
       fashion_inspirations = EXCLUDED.fashion_inspirations
     RETURNING *`,
    [
      userId,
      input.gender_preference ?? null,
      input.body_type ?? null,
      input.budget_range ?? null,
      input.climate_location ?? null,
      input.fashion_goals ?? [],
      input.favorite_aesthetics ?? [],
      input.favorite_colors ?? [],
      input.preferred_categories ?? [],
      input.fashion_inspirations ?? []
    ]
  );

  const hasCulturalFields = [
    "country",
    "ethnic_group",
    "preferred_cultural_styles",
    "wears_traditional_attire",
    "cultural_style_notes"
  ].some((key) => key in input);

  const cultural_preferences = hasCulturalFields
    ? await upsertPreference(userId, {
        country: input.country ?? null,
        ethnic_group: input.ethnic_group ?? null,
        preferred_cultural_styles: input.preferred_cultural_styles ?? [],
        wears_traditional_attire: input.wears_traditional_attire ?? false,
        cultural_style_notes: input.cultural_style_notes ?? null
      })
    : await queryOne(
        `SELECT *
         FROM user_cultural_preferences
         WHERE user_id = $1`,
        [userId]
      );

  return { profile, cultural_preferences };
}

export async function patchProfile(userId: string, input: StyleProfileInput) {
  const existing = await getProfile(userId);
  return upsertProfile(userId, {
    ...((existing.profile ?? {}) as StyleProfileInput),
    ...((existing.cultural_preferences ?? {}) as StyleProfileInput),
    ...input
  });
}
