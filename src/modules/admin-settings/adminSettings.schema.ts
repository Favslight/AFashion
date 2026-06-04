import { z } from "zod";
import { paginationQuerySchema } from "../admin/admin.schema.js";

const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(jsonValue)
  ])
);

export const settingKeyParamsSchema = z.object({
  key: z.string().trim().min(1).max(120)
});

export const siteSettingCreateSchema = z.object({
  setting_key: z.string().trim().min(2).max(120).regex(/^[a-z0-9_]+$/),
  setting_value: jsonValue.refine((value) => value !== undefined, "setting_value is required"),
  description: z.string().trim().max(500).optional().nullable(),
  is_public: z.boolean().default(false)
});

export const siteSettingUpdateSchema = z.object({
  setting_value: jsonValue.optional(),
  description: z.string().trim().max(500).optional().nullable(),
  is_public: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const settingsQuerySchema = paginationQuerySchema.extend({
  is_public: z.coerce.boolean().optional(),
  sort_by: z.enum(["setting_key", "created_at", "updated_at"]).default("setting_key"),
  sort_order: z.enum(["asc", "desc"]).default("asc")
});

export const policiesQuerySchema = paginationQuerySchema.extend({
  policy_type: z.string().trim().max(80).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  sort_by: z.enum(["created_at", "updated_at", "title", "policy_type", "status"]).default("created_at")
});

export const policyCreateSchema = z.object({
  title: z.string().trim().min(2).max(180),
  policy_type: z.enum([
    "terms_of_service",
    "privacy_policy",
    "community_guidelines",
    "ai_safety_rules",
    "image_upload_rules",
    "subscription_refund_policy"
  ]),
  content: z.string().trim().min(20),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  version: z.string().trim().min(1).max(40)
});

export const policyUpdateSchema = policyCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});
