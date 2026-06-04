import { z } from "zod";

const textArray = z.array(z.string().trim().min(1).max(80)).max(30);

export const wardrobeUploadFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().max(80).optional(),
  subcategory: z.string().trim().max(80).optional(),
  gender_fit: z.string().trim().max(80).optional(),
  color: z.string().trim().max(80).optional(),
  material: z.string().trim().max(80).optional()
});

export const wardrobeUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().max(80).optional().nullable(),
  subcategory: z.string().trim().max(80).optional().nullable(),
  gender_fit: z.string().trim().max(80).optional().nullable(),
  color: z.string().trim().max(80).optional().nullable(),
  secondary_colors: textArray.optional(),
  style_tags: textArray.optional(),
  material: z.string().trim().max(80).optional().nullable(),
  season_tags: textArray.optional(),
  is_favorite: z.boolean().optional(),
  times_worn: z.number().int().min(0).optional(),
  last_worn_at: z.string().datetime().optional().nullable()
});
