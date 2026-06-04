import { z } from "zod";
import { paginationQuerySchema } from "../admin/admin.schema.js";

const textArray = z.array(z.string().trim().min(1).max(120)).max(50).default([]);

export const fashionListQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().max(80).optional(),
  is_active: z.coerce.boolean().optional(),
  sort_by: z.enum(["created_at", "updated_at", "priority", "title", "score", "name"]).optional()
});

export const occasionSlugParamsSchema = z.object({
  slug: z.string().trim().min(2).max(120)
});

export const scoreOutfitSchema = z.object({
  wardrobe_item_ids: z.array(z.string().uuid()).min(1).max(12),
  occasion_slug: z.string().trim().min(2).max(120),
  weather: z.string().trim().max(120).optional(),
  mood: z.string().trim().max(120).optional()
});

export const missingItemsSchema = z.object({
  occasion_slug: z.string().trim().min(2).max(120).optional(),
  aesthetic_slugs: z.array(z.string().trim().min(2).max(120)).max(10).optional(),
  budget_range: z.string().trim().max(120).optional()
});

export const colorCombinationCreateSchema = z.object({
  primary_color: z.string().trim().min(1).max(80).transform((value) => value.toLowerCase()),
  matching_color: z.string().trim().min(1).max(80).transform((value) => value.toLowerCase()),
  harmony_type: z.string().trim().max(80).optional().nullable(),
  score: z.number().min(0).max(10).default(0),
  description: z.string().trim().max(500).optional().nullable()
});

export const colorCombinationUpdateSchema = colorCombinationCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const styleRuleCreateSchema = z.object({
  title: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(80),
  gender_support: textArray.default(["male", "female", "unisex"]),
  rule_text: z.string().trim().min(10),
  priority: z.number().int().min(1).max(10).default(1),
  is_active: z.boolean().default(true)
});

export const styleRuleUpdateSchema = styleRuleCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const occasionRuleCreateSchema = z.object({
  occasion_slug: z.string().trim().min(2).max(120),
  rule_type: z.string().trim().min(2).max(80),
  rule_text: z.string().trim().min(10),
  recommended_categories: textArray.optional(),
  avoid_categories: textArray.optional(),
  recommended_colors: textArray.optional(),
  avoid_colors: textArray.optional(),
  formality_level: z.string().trim().max(80).optional().nullable(),
  gender_support: textArray.default(["male", "female", "unisex"]),
  priority: z.number().int().min(1).max(10).default(1),
  is_active: z.boolean().default(true)
});

export const occasionRuleUpdateSchema = occasionRuleCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const bodyTypeRuleCreateSchema = z.object({
  body_type: z.string().trim().min(2).max(80),
  gender_support: textArray.default(["male", "female", "unisex"]),
  recommended_fits: textArray.optional(),
  avoid_fits: textArray.optional(),
  styling_tips: textArray.optional()
});

export const bodyTypeRuleUpdateSchema = bodyTypeRuleCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const climateRuleCreateSchema = z.object({
  climate_type: z.string().trim().min(2).max(80),
  recommended_fabrics: textArray.optional(),
  avoid_fabrics: textArray.optional(),
  recommended_categories: textArray.optional(),
  styling_tips: textArray.optional()
});

export const climateRuleUpdateSchema = climateRuleCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const aestheticCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(700).optional().nullable(),
  keywords: textArray.optional(),
  recommended_colors: textArray.optional(),
  common_categories: textArray.optional()
});

export const aestheticUpdateSchema = aestheticCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});
