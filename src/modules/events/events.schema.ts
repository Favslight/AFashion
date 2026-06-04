import { z } from "zod";

export const eventCreateSchema = z.object({
  title: z.string().trim().min(2).max(180),
  occasion_slug: z.string().trim().max(120).optional().nullable(),
  event_date: z.string().datetime(),
  location: z.string().trim().max(160).optional().nullable(),
  dress_code: z.string().trim().max(160).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  reminder_enabled: z.boolean().default(true)
});

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  selected_outfit_id: z.string().uuid().optional().nullable()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const eventParamsSchema = z.object({ id: z.string().uuid() });

export const selectOutfitSchema = z.object({
  outfit_id: z.string().uuid()
});

export const eventGenerateSchema = z.object({
  mood: z.string().trim().max(120).optional(),
  useWeather: z.boolean().default(true),
  allowRecentlyWorn: z.boolean().default(false),
  avoidItemsWornWithinDays: z.number().int().min(1).max(365).default(14)
});
