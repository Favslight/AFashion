import { getClient, query, queryOne } from "../../database/db.js";
import { DEFAULT_PLAN_NAME } from "../../utils/constants.js";
import type { SubscriptionPlan } from "../../types/index.js";

export async function listPlans() {
  return query<SubscriptionPlan>(
    `SELECT *
     FROM subscription_plans
     ORDER BY price_monthly ASC`
  );
}

export async function getCurrentSubscription(userId: string) {
  const subscription = await queryOne<{
    id: string;
    status: string;
    starts_at: string;
    ends_at: string | null;
    plan: SubscriptionPlan;
  }>(
    `SELECT
       us.id,
       us.status,
       us.starts_at,
       us.ends_at,
       to_jsonb(sp.*) AS plan
     FROM user_subscriptions us
     JOIN subscription_plans sp ON sp.id = us.plan_id
     WHERE us.user_id = $1
       AND us.status IN ('active', 'trialing')
       AND (us.ends_at IS NULL OR us.ends_at > NOW())
     ORDER BY us.created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (subscription) {
    return subscription;
  }

  const freePlan = await queryOne<SubscriptionPlan>(
    "SELECT * FROM subscription_plans WHERE name = $1",
    [DEFAULT_PLAN_NAME]
  );

  return {
    id: null,
    status: "active",
    starts_at: new Date().toISOString(),
    ends_at: null,
    plan: freePlan
  };
}

export async function changePlan(userId: string, planId: string) {
  const plan = await queryOne<SubscriptionPlan>("SELECT * FROM subscription_plans WHERE id = $1", [planId]);
  if (!plan) {
    const error = new Error("Subscription plan not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE user_subscriptions
       SET status = 'cancelled', ends_at = NOW()
       WHERE user_id = $1 AND status IN ('active', 'trialing')`,
      [userId]
    );
    const result = await client.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [userId, planId]
    );
    await client.query("COMMIT");
    return {
      ...result.rows[0],
      plan
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function ensureWardrobeLimit(userId: string) {
  const subscription = await getCurrentSubscription(userId);
  if (!subscription.plan) {
    throw new Error("Default subscription plan is not configured");
  }

  const count = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM wardrobe_items WHERE user_id = $1 AND deleted_at IS NULL",
    [userId]
  );

  if (Number(count?.count ?? 0) >= subscription.plan.max_wardrobe_items) {
    const error = new Error("Wardrobe item limit reached for your current plan");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

export async function ensureAiLimit(userId: string) {
  const subscription = await getCurrentSubscription(userId);
  if (!subscription.plan) {
    throw new Error("Default subscription plan is not configured");
  }

  const usage = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM ai_usage_logs
     WHERE user_id = $1
       AND created_at >= date_trunc('month', NOW())`,
    [userId]
  );

  if (Number(usage?.count ?? 0) >= subscription.plan.max_ai_generations_per_month) {
    const error = new Error("Monthly AI generation limit reached for your current plan");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

export async function ensureMinimumPlan(userId: string, allowedPlans: string[], featureName: string) {
  const subscription = await getCurrentSubscription(userId);
  const planName = subscription.plan?.name;

  if (!planName || !allowedPlans.map((plan) => plan.toLowerCase()).includes(planName.toLowerCase())) {
    const error = new Error(`${featureName} requires ${allowedPlans.join(" or ")} subscription`);
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  return subscription;
}

export async function logAiUsage(userId: string, actionType: string, tokensUsed: number, model: string) {
  await queryOne(
    `INSERT INTO ai_usage_logs (user_id, action_type, tokens_used, model)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [userId, actionType, tokensUsed, model]
  );
}
