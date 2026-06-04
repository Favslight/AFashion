import { z } from "zod";
import { paginationQuerySchema } from "../admin/admin.schema.js";

export const adminUsersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(["user", "admin", "super_admin"]).optional(),
  account_status: z.enum(["active", "suspended", "deactivated"]).optional(),
  subscription_plan: z.string().trim().max(80).optional(),
  sort_by: z.enum(["created_at", "email", "full_name", "role", "account_status"]).default("created_at")
});

export const userStatusUpdateSchema = z.object({
  account_status: z.enum(["active", "suspended", "deactivated"]),
  suspension_reason: z.string().trim().max(500).optional().nullable()
});

export const userRoleUpdateSchema = z.object({
  role: z.enum(["user", "admin", "super_admin"])
});
