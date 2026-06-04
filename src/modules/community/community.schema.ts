import { z } from "zod";

const textArray = z.array(z.string().trim().min(1).max(80)).max(30).default([]);

export const communityPostCreateSchema = z.object({
  title: z.string().trim().max(180).optional().nullable(),
  description: z.string().trim().max(1200).optional().nullable(),
  cover_image_url: z.string().url().optional().nullable(),
  cover_image_public_id: z.string().trim().max(200).optional().nullable(),
  source_type: z.enum(["ai_generated_outfit", "wardrobe_outfit", "outfit_photo", "inspiration_post"]),
  source_id: z.string().uuid().optional().nullable(),
  occasion_slug: z.string().trim().max(120).optional().nullable(),
  aesthetic_slug: z.string().trim().max(120).optional().nullable(),
  tags: textArray,
  visibility: z.enum(["public", "private", "unlisted"]).default("public")
});

export const communityPostPatchSchema = communityPostCreateSchema.partial().extend({
  status: z.enum(["published", "hidden", "removed"]).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const postParamsSchema = z.object({ id: z.string().uuid() });
export const commentParamsSchema = z.object({ id: z.string().uuid() });
export const outfitParamsSchema = z.object({ outfitId: z.string().uuid() });

export const commentsSchema = z.object({
  content: z.string().trim().min(1).max(500)
});

export const reportSchema = z.object({
  reason: z.string().trim().min(2).max(120),
  details: z.string().trim().max(1000).optional().nullable()
});

export const postsQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  occasion_slug: z.string().trim().max(120).optional(),
  aesthetic_slug: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const adminReportUpdateSchema = z.object({
  status: z.enum(["pending", "reviewing", "resolved", "dismissed"]),
  hide_post: z.boolean().default(false)
});
