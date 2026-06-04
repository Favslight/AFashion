import { z } from "zod";

export const outfitIdParamsSchema = z.object({ outfitId: z.string().uuid() });

export const outfitFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  liked_parts: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  disliked_parts: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  feedback_note: z.string().trim().max(1000).optional().nullable(),
  would_wear_again: z.boolean().optional().nullable()
});
