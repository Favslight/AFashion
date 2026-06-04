import { z } from "zod";

export const markWornSchema = z.object({
  outfit_id: z.string().uuid().optional().nullable(),
  wardrobe_item_ids: z.array(z.string().uuid()).min(1).optional(),
  occasion_slug: z.string().trim().max(120).optional(),
  worn_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().trim().max(160).optional(),
  weather_context: z.unknown().optional(),
  user_rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().trim().max(1000).optional()
}).refine((value) => value.outfit_id || value.wardrobe_item_ids?.length, {
  message: "outfit_id or wardrobe_item_ids is required"
});

export const historyQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  occasion_slug: z.string().trim().max(120).optional()
});

export const historyParamsSchema = z.object({ id: z.string().uuid() });
