import { z } from "zod";

const textArray = z.array(z.string().trim().min(1).max(80)).max(30).default([]);

export const styleProfileSchema = z.object({
  gender_preference: z.string().trim().max(80).optional().nullable(),
  body_type: z.string().trim().max(80).optional().nullable(),
  budget_range: z.string().trim().max(80).optional().nullable(),
  climate_location: z.string().trim().max(120).optional().nullable(),
  fashion_goals: textArray.optional(),
  favorite_aesthetics: textArray.optional(),
  favorite_colors: textArray.optional(),
  preferred_categories: textArray.optional(),
  fashion_inspirations: textArray.optional(),
  country: z.string().trim().max(120).optional().nullable(),
  ethnic_group: z.string().trim().max(120).optional().nullable(),
  preferred_cultural_styles: textArray.optional(),
  wears_traditional_attire: z.boolean().optional(),
  cultural_style_notes: z.string().trim().max(1000).optional().nullable()
});

export const patchStyleProfileSchema = styleProfileSchema.partial();
