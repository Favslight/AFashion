import { query, queryOne } from "../../database/db.js";
import { rankForYou } from "./discovery.engine.js";

export async function feed(input: { page: number; limit: number }) {
  const offset = (input.page - 1) * input.limit;
  return query(
    `SELECT cp.*, cr.display_name, cr.verified
     FROM community_posts cp
     LEFT JOIN creator_profiles cr ON cr.id = cp.creator_profile_id
     WHERE cp.visibility = 'public' AND cp.status = 'published'
     ORDER BY cp.created_at DESC
     LIMIT $1 OFFSET $2`,
    [input.limit, offset]
  );
}

export async function trending(input: { page: number; limit: number }) {
  const offset = (input.page - 1) * input.limit;
  return query(
    `SELECT cp.*, cr.display_name, cr.verified,
      (cp.like_count + cp.save_count * 2 + cp.comment_count) AS trend_score
     FROM community_posts cp
     LEFT JOIN creator_profiles cr ON cr.id = cp.creator_profile_id
     WHERE cp.visibility = 'public' AND cp.status = 'published'
     ORDER BY trend_score DESC, cp.created_at DESC
     LIMIT $1 OFFSET $2`,
    [input.limit, offset]
  );
}

export async function byAesthetic(slug: string, input: { page: number; limit: number }) {
  const offset = (input.page - 1) * input.limit;
  return query(
    `SELECT * FROM community_posts
     WHERE aesthetic_slug = $1 AND visibility = 'public' AND status = 'published'
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [slug, input.limit, offset]
  );
}

export async function byOccasion(slug: string, input: { page: number; limit: number }) {
  const offset = (input.page - 1) * input.limit;
  return query(
    `SELECT * FROM community_posts
     WHERE occasion_slug = $1 AND visibility = 'public' AND status = 'published'
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [slug, input.limit, offset]
  );
}

export async function forYou(userId: string, input: { page: number; limit: number }) {
  const candidates = await query<{
    id: string;
    user_id: string;
    creator_profile_id: string | null;
    occasion_slug: string | null;
    aesthetic_slug: string | null;
    tags: string[];
    like_count: number;
    save_count: number;
  }>(
    `SELECT cp.*
     FROM community_posts cp
     WHERE cp.visibility = 'public' AND cp.status = 'published'
     ORDER BY cp.created_at DESC
     LIMIT 250`
  );
  const ranked = await rankForYou(userId, candidates);
  const offset = (input.page - 1) * input.limit;
  const page = ranked.slice(offset, offset + input.limit);

  if (page.length) {
    await Promise.all(page.map((entry) =>
      queryOne("INSERT INTO discovery_events (user_id, post_id, action_type) VALUES ($1, $2, 'viewed') RETURNING id", [userId, entry.post.id])
    ));
  }

  return page;
}
