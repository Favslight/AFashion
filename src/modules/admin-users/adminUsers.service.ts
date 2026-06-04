import { query, queryOne } from "../../database/db.js";
import type { AccountStatus, DbAdminUser, DbUser, UserRole } from "../../types/index.js";
import { sanitizeUser } from "../../utils/security.js";
import { getPagination, getPaginationMeta } from "../admin/admin.schema.js";
import { ensureAdminCanModifyTargetUser } from "../admin/admin.middleware.js";

interface ListUsersInput {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  account_status?: AccountStatus;
  subscription_plan?: string;
  sort_by: "created_at" | "email" | "full_name" | "role" | "account_status";
  sort_order: "asc" | "desc";
}

const userSelect = `
  u.id,
  u.full_name,
  u.email,
  u.role,
  u.account_status,
  u.email_verified,
  u.created_at,
  u.updated_at,
  u.suspended_at,
  u.suspended_by,
  u.suspension_reason,
  sp.name AS subscription_plan
`;

export async function listUsers(input: ListUsersInput) {
  const filters: string[] = ["u.deleted_at IS NULL"];
  const params: unknown[] = [];

  if (input.search) {
    params.push(`%${input.search}%`);
    filters.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }

  if (input.role) {
    params.push(input.role);
    filters.push(`u.role = $${params.length}`);
  }

  if (input.account_status) {
    params.push(input.account_status);
    filters.push(`u.account_status = $${params.length}`);
  }

  if (input.subscription_plan) {
    params.push(input.subscription_plan);
    filters.push(`sp.name ILIKE $${params.length}`);
  }

  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();
  const sortBy = `u.${input.sort_by}`;

  const [rows, totalRow] = await Promise.all([
    query(
      `SELECT ${userSelect}
       FROM users u
       LEFT JOIN LATERAL (
         SELECT usp.name
         FROM user_subscriptions us
         JOIN subscription_plans usp ON usp.id = us.plan_id
         WHERE us.user_id = u.id AND us.status IN ('active', 'trialing')
         ORDER BY us.created_at DESC
         LIMIT 1
       ) sp ON TRUE
       WHERE ${where}
       ORDER BY ${sortBy} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM users u
       LEFT JOIN LATERAL (
         SELECT usp.name
         FROM user_subscriptions us
         JOIN subscription_plans usp ON usp.id = us.plan_id
         WHERE us.user_id = u.id AND us.status IN ('active', 'trialing')
         ORDER BY us.created_at DESC
         LIMIT 1
       ) sp ON TRUE
       WHERE ${where}`,
      params
    )
  ]);

  return {
    users: rows,
    pagination: getPaginationMeta(totalRow?.count ?? 0, input.page, input.limit)
  };
}

export async function getUser(userId: string) {
  const user = await queryOne<DbUser & { subscription_plan?: string | null }>(
    `SELECT ${userSelect}
     FROM users u
     LEFT JOIN LATERAL (
       SELECT usp.name
       FROM user_subscriptions us
       JOIN subscription_plans usp ON usp.id = us.plan_id
       WHERE us.user_id = u.id AND us.status IN ('active', 'trialing')
       ORDER BY us.created_at DESC
       LIMIT 1
     ) sp ON TRUE
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [userId]
  );

  if (!user) {
    const error = new Error("User not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const [wardrobe, outfits, aiUsage] = await Promise.all([
    queryOne<{ count: number }>("SELECT COUNT(*)::int AS count FROM wardrobe_items WHERE user_id = $1 AND deleted_at IS NULL", [userId]),
    queryOne<{ count: number }>("SELECT COUNT(*)::int AS count FROM outfits WHERE user_id = $1", [userId]),
    queryOne<{ count: number; total_tokens: number }>(
      "SELECT COUNT(*)::int AS count, COALESCE(SUM(tokens_used), 0)::int AS total_tokens FROM ai_usage_logs WHERE user_id = $1",
      [userId]
    )
  ]);

  return {
    user,
    usage: {
      wardrobe_items: wardrobe?.count ?? 0,
      outfits: outfits?.count ?? 0,
      ai_actions: aiUsage?.count ?? 0,
      ai_tokens: aiUsage?.total_tokens ?? 0
    }
  };
}

export async function updateUserStatus(adminUserId: string, userId: string, input: {
  account_status: AccountStatus;
  suspension_reason?: string | null;
}) {
  const target = await ensureAdminCanModifyTargetUser(adminUserId, userId);
  if (target.role === "super_admin") {
    const error = new Error("Super admins cannot be suspended or deactivated");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  const isSuspended = input.account_status === "suspended";
  const user = await queryOne<DbUser>(
    `UPDATE users
     SET account_status = $3,
       suspended_at = CASE WHEN $3 = 'suspended' THEN NOW() ELSE NULL END,
      suspended_by = CASE WHEN $3 = 'suspended' THEN $1::uuid ELSE NULL END,
       suspension_reason = CASE WHEN $3 = 'suspended' THEN $4 ELSE NULL END
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [adminUserId, userId, input.account_status, isSuspended ? input.suspension_reason ?? null : null]
  );

  return user ? sanitizeUser(user) : null;
}

export async function updateUserRole(adminUserId: string, userId: string, role: UserRole) {
  const admin = await queryOne<Pick<DbAdminUser, "role">>("SELECT role FROM admin_users WHERE id = $1 AND status = 'active'", [adminUserId]);
  if (admin?.role !== "super_admin") {
    const error = new Error("Only super admins can change user roles");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  await ensureAdminCanModifyTargetUser(adminUserId, userId);
  const user = await queryOne<DbUser>(
    `UPDATE users
     SET role = $2
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *`,
    [userId, role]
  );

  return user ? sanitizeUser(user) : null;
}

export async function softDeleteUser(adminUserId: string, userId: string) {
  const target = await ensureAdminCanModifyTargetUser(adminUserId, userId);
  if (target.role === "super_admin") {
    const error = new Error("Super admins cannot be deleted");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  return queryOne(
    `UPDATE users
     SET deleted_at = NOW(), account_status = 'deactivated'
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [userId]
  );
}
