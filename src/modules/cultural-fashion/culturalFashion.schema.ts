import { z } from "zod";
import { paginationQuerySchema } from "../admin/admin.schema.js";

const textArray = z.array(z.string().trim().min(1).max(160)).max(80).default([]);

export const culturalSlugParamsSchema = z.object({
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/)
});

export const culturalIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const culturalSearchQuerySchema = z.object({
  country: z.string().trim().max(120).optional(),
  ethnicGroup: z.string().trim().max(120).optional(),
  q: z.string().trim().max(160).optional()
});

export const culturalListQuerySchema = paginationQuerySchema.extend({
  country: z.string().trim().max(120).optional(),
  ethnic_group: z.string().trim().max(120).optional(),
  is_active: z.coerce.boolean().optional(),
  sort_by: z.enum(["created_at", "updated_at", "country", "ethnic_group", "slug"]).optional()
});

export const culturalPreferenceSchema = z.object({
  country: z.string().trim().min(2).max(120).optional().nullable(),
  ethnic_group: z.string().trim().min(2).max(120).optional().nullable(),
  preferred_cultural_styles: textArray.optional(),
  wears_traditional_attire: z.boolean().default(false),
  cultural_style_notes: z.string().trim().max(1000).optional().nullable()
});

export const patchCulturalPreferenceSchema = culturalPreferenceSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const culturalStyleRequestSchema = z.object({
  cultureSlug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/),
  occasionSlug: z.string().trim().min(2).max(140),
  genderPreference: z.string().trim().min(2).max(80).optional(),
  mood: z.string().trim().max(120).optional(),
  useWardrobe: z.boolean().default(true)
});

export const culturalProfileCreateSchema = z.object({
  country: z.string().trim().min(2).max(120),
  region: z.string().trim().max(120).optional().nullable(),
  ethnic_group: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(2000).optional().nullable(),
  male_signature_outfits: textArray.optional(),
  female_signature_outfits: textArray.optional(),
  unisex_signature_outfits: textArray.optional(),
  common_fabrics: textArray.optional(),
  common_colors: textArray.optional(),
  symbolic_colors: z.record(z.unknown()).default({}),
  common_accessories: textArray.optional(),
  modern_variations: textArray.optional(),
  cultural_notes: textArray.optional(),
  mistakes_to_avoid: textArray.optional(),
  is_active: z.boolean().default(true)
});

export const culturalProfileUpdateSchema = culturalProfileCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const culturalOccasionRuleCreateSchema = z.object({
  cultural_profile_id: z.string().uuid(),
  occasion_slug: z.string().trim().min(2).max(140),
  dress_code_level: z.string().trim().max(120).optional().nullable(),
  male_recommendations: textArray.optional(),
  female_recommendations: textArray.optional(),
  unisex_recommendations: textArray.optional(),
  accessories: textArray.optional(),
  color_guidance: textArray.optional(),
  avoid_rules: textArray.optional(),
  formality_notes: z.string().trim().max(1200).optional().nullable()
});

export const culturalOccasionRuleUpdateSchema = culturalOccasionRuleCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const culturalComponentCreateSchema = z.object({
  cultural_profile_id: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  component_type: z.string().trim().min(2).max(80),
  gender_support: textArray.default(["male", "female", "unisex"]),
  description: z.string().trim().max(1200).optional().nullable(),
  common_pairings: textArray.optional(),
  suitable_occasions: textArray.optional()
});

export const culturalComponentUpdateSchema = culturalComponentCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});
