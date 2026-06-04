import { getClient, query, queryOne } from "../../database/db.js";
import { getPagination, getPaginationMeta } from "../admin/admin.schema.js";

interface PlanInput {
  name?: string;
  price_monthly?: number;
  price_yearly?: number;
  max_wardrobe_items?: number;
  max_ai_generations_per_month?: number;
  features?: Record<string, unknown>;
}

interface SubscriptionUsersQuery {
  page: number;
  limit: number;
  search?: string;
  plan_id?: string;
  status?: string;
  sort_by: "created_at" | "starts_at" | "ends_at" | "status";
  sort_order: "asc" | "desc";
}

export async function listPlans(input: {
  page: number;
  limit: number;
  search?: string;
  sort_by: "created_at" | "name" | "price_monthly" | "price_yearly";
  sort_order: "asc" | "desc";
}) {
  const filters: string[] = ["1=1"];
  const params: unknown[] = [];

  if (input.search) {
    params.push(`%${input.search}%`);
    filters.push(`name ILIKE $${params.length}`);
  }

  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();

  const [plans, total] = await Promise.all([
    query(
      `SELECT *
       FROM subscription_plans
       WHERE ${where}
       ORDER BY ${input.sort_by} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(`SELECT COUNT(*)::int AS count FROM subscription_plans WHERE ${where}`, params)
  ]);

  return {
    plans,
    pagination: getPaginationMeta(total?.count ?? 0, input.page, input.limit)
  };
}

export async function createPlan(input: Required<PlanInput>) {
  return queryOne(
    `INSERT INTO subscription_plans (
       name,
       price_monthly,
       price_yearly,
       max_wardrobe_items,
       max_ai_generations_per_month,
       features
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.name,
      input.price_monthly,
      input.price_yearly,
      input.max_wardrobe_items,
      input.max_ai_generations_per_month,
      input.features
    ]
  );
}

export async function updatePlan(id: string, input: PlanInput) {
  await getPlan(id);
  return queryOne(
    `UPDATE subscription_plans
     SET name = COALESCE($2, name),
       price_monthly = COALESCE($3, price_monthly),
       price_yearly = COALESCE($4, price_yearly),
       max_wardrobe_items = COALESCE($5, max_wardrobe_items),
       max_ai_generations_per_month = COALESCE($6, max_ai_generations_per_month),
       features = COALESCE($7, features)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.name,
      input.price_monthly,
      input.price_yearly,
      input.max_wardrobe_items,
      input.max_ai_generations_per_month,
      input.features
    ]
  );
}

export async function deletePlan(id: string) {
  await getPlan(id);
  const activeUsers = await queryOne<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM user_subscriptions WHERE plan_id = $1 AND status IN ('active', 'trialing')",
    [id]
  );

  if ((activeUsers?.count ?? 0) > 0) {
    const error = new Error("Cannot delete a plan with active subscribers");
    (error as Error & { statusCode?: number }).statusCode = 409;
    throw error;
  }

  return queryOne("DELETE FROM subscription_plans WHERE id = $1 RETURNING id", [id]);
}

export async function listUserSubscriptions(input: SubscriptionUsersQuery) {
  const filters: string[] = ["u.deleted_at IS NULL"];
  const params: unknown[] = [];

  if (input.search) {
    params.push(`%${input.search}%`);
    filters.push(`(u.email ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`);
  }
  if (input.plan_id) {
    params.push(input.plan_id);
    filters.push(`us.plan_id = $${params.length}`);
  }
  if (input.status) {
    params.push(input.status);
    filters.push(`us.status = $${params.length}`);
  }

  const where = filters.join(" AND ");
  const { limit, offset } = getPagination(input);
  const order = input.sort_order.toUpperCase();

  const [subscriptions, total] = await Promise.all([
    query(
      `SELECT
         us.*,
         u.email AS user_email,
         u.full_name AS user_full_name,
         sp.name AS plan_name,
         sp.price_monthly,
         sp.price_yearly
       FROM user_subscriptions us
       JOIN users u ON u.id = us.user_id
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE ${where}
       ORDER BY us.${input.sort_by} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM user_subscriptions us
       JOIN users u ON u.id = us.user_id
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE ${where}`,
      params
    )
  ]);

  return {
    subscriptions,
    pagination: getPaginationMeta(total?.count ?? 0, input.page, input.limit)
  };
}

export async function updateUserSubscription(userId: string, input: {
  plan_id: string;
  status: string;
  ends_at?: string | null;
}) {
  const [user, plan] = await Promise.all([
    queryOne("SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL", [userId]),
    getPlan(input.plan_id)
  ]);

  if (!user) {
    const error = new Error("User not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE user_subscriptions
       SET status = 'cancelled', ends_at = COALESCE(ends_at, NOW())
       WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')`,
      [userId]
    );
    const result = await client.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status, ends_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, input.plan_id, input.status, input.ends_at ?? null]
    );
    await client.query("COMMIT");
    return { ...result.rows[0], plan };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getPlan(id: string) {
  const plan = await queryOne("SELECT * FROM subscription_plans WHERE id = $1", [id]);
  if (!plan) {
    const error = new Error("Subscription plan not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  return plan;
}
