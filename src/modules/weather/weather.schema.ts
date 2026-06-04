import { z } from "zod";

export const currentWeatherQuerySchema = z.object({
  location: z.string().trim().min(2).max(160)
});

export const weatherStyleAdviceSchema = z.object({
  location: z.string().trim().min(2).max(160),
  occasionSlug: z.string().trim().min(2).max(120),
  preferences: z.record(z.unknown()).optional()
});
