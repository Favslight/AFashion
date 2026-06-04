import { z } from "zod";

export const analyzeWardrobeFieldsSchema = z.object({
  saveToWardrobe: z.coerce.boolean().default(false),
  name: z.string().trim().min(1).max(120).optional()
});

export const outfitReviewFieldsSchema = z.object({
  occasionSlug: z.string().trim().min(2).max(120).optional(),
  location: z.string().trim().min(2).max(160).optional(),
  weatherData: z.string().optional().transform((value) => {
    if (!value) return undefined;
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return { raw: value };
    }
  })
});

export const bulkScanFieldsSchema = z.object({
  defaultCategory: z.string().trim().max(80).optional()
});

export const uuidParamsSchema = z.object({
  id: z.string().uuid()
});
