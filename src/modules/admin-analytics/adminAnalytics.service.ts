import { query, queryOne } from "../../database/db.js";

export async function userAnalytics() {
  const [summary, byRole, byStatus, dailySignups] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(*)::int AS total_users,
         COUNT(*) FILTER (WHERE account_status = 'active')::int AS active_users,
         COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS new_this_month
       FROM users
       WHERE deleted_at IS NULL`
    ),
    query("SELECT role, COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL GROUP BY role ORDER BY role"),
    query("SELECT account_status, COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL GROUP BY account_status ORDER BY account_status"),
    query(
      `SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY day
       ORDER BY day ASC`
    )
  ]);

  return { summary, by_role: byRole, by_status: byStatus, daily_signups: dailySignups };
}

export async function wardrobeAnalytics() {
  const [summary, byCategory, byColor, uploadsByDay] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(*)::int AS total_items,
         COUNT(*) FILTER (WHERE is_favorite = TRUE)::int AS favorite_items,
         AVG(ai_confidence)::numeric(4,3) AS average_ai_confidence
       FROM wardrobe_items
       WHERE deleted_at IS NULL`
    ),
    query(
      `SELECT COALESCE(category, 'unknown') AS category, COUNT(*)::int AS count
       FROM wardrobe_items
       WHERE deleted_at IS NULL
       GROUP BY category
       ORDER BY count DESC
       LIMIT 20`
    ),
    query(
      `SELECT COALESCE(color, 'unknown') AS color, COUNT(*)::int AS count
       FROM wardrobe_items
       WHERE deleted_at IS NULL
       GROUP BY color
       ORDER BY count DESC
       LIMIT 20`
    ),
    query(
      `SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS count
       FROM wardrobe_items
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY day
       ORDER BY day ASC`
    )
  ]);

  return { summary, by_category: byCategory, by_color: byColor, uploads_by_day: uploadsByDay };
}

export async function outfitAnalytics() {
  const [summary, byOccasion, generatedByDay, scoreAverages] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(*)::int AS total_outfits,
         COUNT(*) FILTER (WHERE is_saved = TRUE)::int AS saved_outfits
       FROM outfits`
    ),
    query(
      `SELECT COALESCE(oc.name, 'unknown') AS occasion, COUNT(*)::int AS count
       FROM outfits o
       LEFT JOIN outfit_occasions oc ON oc.id = o.occasion_id
       GROUP BY oc.name
       ORDER BY count DESC
       LIMIT 20`
    ),
    query(
      `SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS count
       FROM outfits
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY day
       ORDER BY day ASC`
    ),
    queryOne(
      `SELECT
         AVG(color_harmony_score)::numeric(4,2) AS avg_color_harmony,
         AVG(formality_score)::numeric(4,2) AS avg_formality,
         AVG(comfort_score)::numeric(4,2) AS avg_comfort
       FROM outfits`
    )
  ]);

  return { summary, by_occasion: byOccasion, generated_by_day: generatedByDay, score_averages: scoreAverages };
}

export async function aiUsageAnalytics() {
  const [summary, byAction, byModel, usageByDay] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(*)::int AS total_actions,
         COALESCE(SUM(tokens_used), 0)::int AS total_tokens,
         COUNT(DISTINCT user_id)::int AS active_ai_users
       FROM ai_usage_logs`
    ),
    query(
      `SELECT action_type, COUNT(*)::int AS count, COALESCE(SUM(tokens_used), 0)::int AS tokens
       FROM ai_usage_logs
       GROUP BY action_type
       ORDER BY count DESC`
    ),
    query(
      `SELECT model, COUNT(*)::int AS count, COALESCE(SUM(tokens_used), 0)::int AS tokens
       FROM ai_usage_logs
       GROUP BY model
       ORDER BY count DESC`
    ),
    query(
      `SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS actions, COALESCE(SUM(tokens_used), 0)::int AS tokens
       FROM ai_usage_logs
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY day
       ORDER BY day ASC`
    )
  ]);

  return { summary, by_action: byAction, by_model: byModel, usage_by_day: usageByDay };
}

export async function subscriptionAnalytics() {
  const [summary, byPlan, byStatus] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(*) FILTER (WHERE us.status IN ('active', 'trialing'))::int AS active_subscriptions,
         COUNT(DISTINCT us.user_id)::int AS subscribed_users,
         0::numeric AS monthly_recurring_revenue
       FROM user_subscriptions us`
    ),
    query(
      `SELECT sp.name AS plan, COUNT(*)::int AS count
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.status IN ('active', 'trialing')
       GROUP BY sp.name
       ORDER BY count DESC`
    ),
    query(
      `SELECT status, COUNT(*)::int AS count
       FROM user_subscriptions
       GROUP BY status
       ORDER BY status`
    )
  ]);

  return { summary, by_plan: byPlan, by_status: byStatus };
}

export async function visionAnalytics() {
  const [summary, commonImprovements, missingEssentials, usageByPlan] = await Promise.all([
    queryOne(
      `SELECT
         (SELECT COUNT(*)::int FROM outfit_photo_reviews) AS total_outfit_reviews,
         (SELECT COUNT(*)::int FROM wardrobe_scan_jobs) AS total_wardrobe_scans,
         (SELECT COUNT(*)::int FROM wardrobe_health_reports) AS total_wardrobe_health_reports,
         (SELECT AVG(overall_score)::numeric(4,2) FROM outfit_photo_reviews) AS average_outfit_review_score`
    ),
    query(
      `SELECT improvement, COUNT(*)::int AS count
       FROM outfit_photo_reviews, unnest(improvements) AS improvement
       GROUP BY improvement
       ORDER BY count DESC
       LIMIT 15`
    ),
    query(
      `SELECT missing_item::text AS missing_item, COUNT(*)::int AS count
       FROM wardrobe_health_reports, jsonb_array_elements(missing_essentials) AS missing_item
       GROUP BY missing_item
       ORDER BY count DESC
       LIMIT 15`
    ),
    query(
      `SELECT COALESCE(sp.name, 'Free') AS plan_name, COUNT(aul.id)::int AS vision_actions
       FROM ai_usage_logs aul
       JOIN users u ON u.id = aul.user_id
       LEFT JOIN LATERAL (
         SELECT usp.name
         FROM user_subscriptions us
         JOIN subscription_plans usp ON usp.id = us.plan_id
         WHERE us.user_id = u.id AND us.status IN ('active', 'trialing')
         ORDER BY us.created_at DESC
         LIMIT 1
       ) sp ON TRUE
       WHERE aul.action_type IN ('vision_wardrobe_analysis', 'outfit_photo_review', 'wardrobe_health')
       GROUP BY sp.name
       ORDER BY vision_actions DESC`
    )
  ]);

  return {
    summary,
    most_common_improvement_suggestions: commonImprovements,
    most_common_missing_wardrobe_essentials: missingEssentials,
    vision_usage_by_subscription_plan: usageByPlan
  };
}

export async function fashionMemoryAnalytics() {
  const [summary, commonOccasions, likedAesthetics, dislikedCategories, averageRating, eventUsageByPlan] = await Promise.all([
    queryOne(
      `SELECT
         (SELECT COUNT(*)::int FROM outfit_wear_history) AS total_wear_history_logs,
         (SELECT COUNT(*)::int FROM user_fashion_events) AS total_fashion_events,
         (SELECT COUNT(*)::int FROM outfit_feedback) AS total_feedback_records`
    ),
    query(
      `SELECT occasion_slug, COUNT(*)::int AS count
       FROM outfit_wear_history
       WHERE occasion_slug IS NOT NULL
       GROUP BY occasion_slug
       ORDER BY count DESC
       LIMIT 15`
    ),
    query(
      `SELECT memory_key, COUNT(*)::int AS count
       FROM user_style_memory
       WHERE memory_type IN ('liked_style', 'preferred_aesthetic')
       GROUP BY memory_key
       ORDER BY count DESC
       LIMIT 15`
    ),
    query(
      `SELECT disliked_part AS category, COUNT(*)::int AS count
       FROM outfit_feedback, unnest(disliked_parts) AS disliked_part
       GROUP BY disliked_part
       ORDER BY count DESC
       LIMIT 15`
    ),
    queryOne("SELECT AVG(rating)::numeric(4,2) AS average_outfit_rating FROM outfit_feedback WHERE rating IS NOT NULL"),
    query(
      `SELECT COALESCE(sp.name, 'Free') AS plan_name, COUNT(aul.id)::int AS event_styling_actions
       FROM ai_usage_logs aul
       JOIN users u ON u.id = aul.user_id
       LEFT JOIN LATERAL (
         SELECT usp.name
         FROM user_subscriptions us
         JOIN subscription_plans usp ON usp.id = us.plan_id
         WHERE us.user_id = u.id AND us.status IN ('active', 'trialing')
         ORDER BY us.created_at DESC
         LIMIT 1
       ) sp ON TRUE
       WHERE aul.action_type IN ('event_styling', 'fashion_memory_rebuild', 'outfit_feedback_learning')
       GROUP BY sp.name
       ORDER BY event_styling_actions DESC`
    )
  ]);

  return {
    summary,
    most_common_occasions: commonOccasions,
    most_liked_aesthetics: likedAesthetics,
    most_disliked_categories: dislikedCategories,
    average_outfit_rating: averageRating,
    event_styling_usage_by_plan: eventUsageByPlan
  };
}

export async function communityAnalytics() {
  const [summary, topAesthetics, topOccasions, mostFollowedCreators, mostSavedPosts, engagement] = await Promise.all([
    queryOne(
      `SELECT
         (SELECT COUNT(*)::int FROM community_posts) AS total_posts,
         (SELECT COUNT(*)::int FROM community_post_likes) AS total_likes,
         (SELECT COUNT(*)::int FROM community_post_saves) AS total_saves,
         (SELECT COUNT(*)::int FROM community_comments) AS total_comments,
         (SELECT COUNT(*)::int FROM creator_profiles) AS total_creators`
    ),
    query(
      `SELECT aesthetic_slug, COUNT(*)::int AS count
       FROM community_posts
       WHERE aesthetic_slug IS NOT NULL
       GROUP BY aesthetic_slug
       ORDER BY count DESC
       LIMIT 15`
    ),
    query(
      `SELECT occasion_slug, COUNT(*)::int AS count
       FROM community_posts
       WHERE occasion_slug IS NOT NULL
       GROUP BY occasion_slug
       ORDER BY count DESC
       LIMIT 15`
    ),
    query(
      `SELECT id, display_name, follower_count
       FROM creator_profiles
       ORDER BY follower_count DESC
       LIMIT 15`
    ),
    query(
      `SELECT id, title, save_count
       FROM community_posts
       ORDER BY save_count DESC
       LIMIT 15`
    ),
    query(
      `SELECT action_type, COUNT(*)::int AS count
       FROM discovery_events
       GROUP BY action_type
       ORDER BY count DESC`
    )
  ]);

  return {
    summary,
    top_aesthetics: topAesthetics,
    top_occasions: topOccasions,
    most_followed_creators: mostFollowedCreators,
    most_saved_posts: mostSavedPosts,
    discovery_engagement_rates: engagement
  };
}
