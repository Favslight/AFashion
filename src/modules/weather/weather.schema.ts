import { z } from "zod";

export const currentWeatherQuerySchema = z.object({
  location: z.string().trim().min(2).max(160)
});

const preferencesSchema = z.union([
  z.record(z.unknown()),
  z.string().trim().max(1000).transform((value) => (value ? { notes: value } : undefined))
]).optional();

export const weatherStyleAdviceSchema = z.object({
  location: z.string().trim().min(2).max(160),
  occasionSlug: z.string().trim().min(2).max(120),
  preferences: preferencesSchema
});
