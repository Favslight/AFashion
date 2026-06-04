import { z } from "zod";

export const styleChatSchema = z.object({
  session_id: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000)
});

export const recommendForEventSchema = z.object({
  event: z.string().trim().min(2).max(160),
  weather: z.string().trim().max(160).optional(),
  mood: z.string().trim().max(120).optional(),
  style_preference: z.string().trim().max(160).optional()
});

export const analyzeOutfitPhotoFieldsSchema = z.object({
  occasion: z.string().trim().max(160).optional()
});
