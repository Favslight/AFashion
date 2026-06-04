import { query, queryOne } from "../../database/db.js";

export async function getDashboard() {
  const [
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    totalWardrobeItems,
    totalOutfits,
    totalAiChats,
    totalPremiumUsers,
    aiUsageSummary,
    recentAuditLogs,
    pendingReports
  ] = await Promise.all([
    count("SELECT COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL"),
    count("SELECT COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL AND account_status = 'active'"),
    count("SELECT COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL AND created_at >= date_trunc('month', NOW())"),
    count("SELECT COUNT(*)::int AS count FROM wardrobe_items WHERE deleted_at IS NULL"),
    count("SELECT COUNT(*)::int AS count FROM outfits"),
    count("SELECT COUNT(*)::int AS count FROM ai_chat_sessions"),
    count(
      `SELECT COUNT(DISTINCT us.user_id)::int AS count
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.status IN ('active', 'trialing') AND sp.name IN ('Pro', 'Premium')`
    ),
    queryOne(
      `SELECT
         COUNT(*)::int AS total_actions,
         COALESCE(SUM(tokens_used), 0)::int AS total_tokens,
         COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS actions_this_month
       FROM ai_usage_logs`
    ),
    query(
      `SELECT aal.*, au.full_name AS admin_name, au.email AS admin_email
       FROM admin_audit_logs aal
       JOIN admin_users au ON au.id = aal.admin_user_id
       ORDER BY aal.created_at DESC
       LIMIT 10`
    ),
    query(
      `SELECT mr.*, reporter.email AS reporter_email, reported.email AS reported_email
       FROM moderation_reports mr
       JOIN users reporter ON reporter.id = mr.reporter_user_id
       LEFT JOIN users reported ON reported.id = mr.reported_user_id
       WHERE mr.status = 'pending'
       ORDER BY mr.created_at ASC
       LIMIT 10`
    )
  ]);

  return {
    total_users: totalUsers,
    active_users: activeUsers,
    new_users_this_month: newUsersThisMonth,
    total_wardrobe_items: totalWardrobeItems,
    total_outfits_generated: totalOutfits,
    total_ai_chats: totalAiChats,
    total_premium_users: totalPremiumUsers,
    revenue_summary: {
      currency: "USD",
      monthly_recurring_revenue: 0,
      note: "Billing integration pending"
    },
    ai_usage_summary: aiUsageSummary,
    recent_audit_logs: recentAuditLogs,
    pending_moderation_reports: pendingReports
  };
}

async function count(sql: string) {
  const row = await queryOne<{ count: number }>(sql);
  return row?.count ?? 0;
}
