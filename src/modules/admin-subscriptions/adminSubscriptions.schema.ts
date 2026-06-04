import { z } from "zod";
import { paginationQuerySchema } from "../admin/admin.schema.js";

const featuresSchema = z.record(z.unknown()).default({});

export const subscriptionPlanCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  price_monthly: z.number().min(0),
  price_yearly: z.number().min(0),
  max_wardrobe_items: z.number().int().min(0),
  max_ai_generations_per_month: z.number().int().min(0),
  features: featuresSchema
});

export const subscriptionPlansQuerySchema = paginationQuerySchema.extend({
  sort_by: z.enum(["created_at", "name", "price_monthly", "price_yearly"]).default("price_monthly"),
  sort_order: z.enum(["asc", "desc"]).default("asc")
});

export const subscriptionPlanUpdateSchema = subscriptionPlanCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const subscriptionUsersQuerySchema = paginationQuerySchema.extend({
  plan_id: z.string().uuid().optional(),
  status: z.enum(["active", "trialing", "past_due", "cancelled", "expired"]).optional(),
  sort_by: z.enum(["created_at", "starts_at", "ends_at", "status"]).default("created_at")
});

export const userSubscriptionUpdateSchema = z.object({
  plan_id: z.string().uuid(),
  status: z.enum(["active", "trialing", "past_due", "cancelled", "expired"]).default("active"),
  ends_at: z.string().datetime().optional().nullable()
});

export const userIdParamsSchema = z.object({
  userId: z.string().uuid()
});
