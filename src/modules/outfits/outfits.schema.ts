import { z } from "zod";

export const generateOutfitSchema = z.object({
  occasion_id: z.string().uuid().optional(),
  occasion_slug: z.string().trim().min(2).max(120).optional(),
  occasionSlug: z.string().trim().min(2).max(120).optional(),
  weather: z.string().trim().max(160).optional(),
  weatherData: z.unknown().optional(),
  location: z.string().trim().min(2).max(160).optional(),
  useWeather: z.boolean().default(false),
  includeAlternatives: z.boolean().default(true),
  allowRecentlyWorn: z.boolean().default(false),
  avoidItemsWornWithinDays: z.number().int().min(1).max(365).default(14),
  eventId: z.string().uuid().optional(),
  useFashionMemory: z.boolean().default(true),
  cultureSlug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/).optional(),
  culturalOccasion: z.boolean().default(false),
  mood: z.string().trim().max(120).optional(),
  gender_style_preference: z.string().trim().max(160).optional()
}).refine((value) => value.occasion_id || value.occasion_slug || value.occasionSlug, {
  message: "occasion_id or occasion_slug/occasionSlug is required"
});
