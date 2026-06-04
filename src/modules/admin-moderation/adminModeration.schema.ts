import { z } from "zod";
import { paginationQuerySchema } from "../admin/admin.schema.js";

export const moderationReportsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["pending", "reviewing", "resolved", "dismissed"]).optional(),
  entity_type: z.string().trim().max(80).optional(),
  sort_by: z.enum(["created_at", "status", "entity_type"]).default("created_at")
});

export const moderationReportStatusSchema = z.object({
  status: z.enum(["pending", "reviewing", "resolved", "dismissed"]),
  resolution_note: z.string().trim().max(1000).optional().nullable()
});

export const blockedKeywordQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().max(80).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  is_active: z.coerce.boolean().optional(),
  sort_by: z.enum(["created_at", "keyword", "category", "severity"]).default("created_at")
});

export const blockedKeywordCreateSchema = z.object({
  keyword: z.string().trim().min(1).max(120).transform((value) => value.toLowerCase()),
  category: z.string().trim().min(2).max(80),
  severity: z.enum(["low", "medium", "high", "critical"]),
  is_active: z.boolean().default(true)
});

export const blockedKeywordUpdateSchema = blockedKeywordCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const adminWardrobeQuerySchema = paginationQuerySchema.extend({
  user_id: z.string().uuid().optional(),
  category: z.string().trim().max(80).optional(),
  sort_by: z.enum(["created_at", "name", "category", "ai_confidence"]).default("created_at")
});

export const adminOutfitQuerySchema = paginationQuerySchema.extend({
  user_id: z.string().uuid().optional(),
  occasion_id: z.string().uuid().optional(),
  is_saved: z.coerce.boolean().optional(),
  sort_by: z.enum(["created_at", "title", "color_harmony_score", "formality_score", "comfort_score"]).default("created_at")
});
