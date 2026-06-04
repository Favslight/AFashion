import { z } from "zod";

export const boardCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(700).optional().nullable(),
  cover_image_url: z.string().url().optional().nullable(),
  visibility: z.enum(["private", "public"]).default("private")
});

export const boardUpdateSchema = boardCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const boardParamsSchema = z.object({ id: z.string().uuid() });
export const boardItemParamsSchema = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

export const boardItemCreateSchema = z.object({
  post_id: z.string().uuid()
});
