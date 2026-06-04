import { query } from "../../database/db.js";
import { buildFashionMemoryContext } from "../ai/ai.memory.js";

export async function calculateDiscoveryScore(userId: string, post: {
  id: string;
  user_id: string;
  creator_profile_id?: string | null;
  occasion_slug?: string | null;
  aesthetic_slug?: string | null;
  tags?: string[];
  like_count?: number;
  save_count?: number;
}) {
  const [profileRows, memory, followed, interactions] = await Promise.all([
    query<{ favorite_colors: string[]; favorite_aesthetics: string[]; preferred_categories: string[] }>(
      "SELECT favorite_colors, favorite_aesthetics, preferred_categories FROM user_style_profiles WHERE user_id = $1",
      [userId]
    ),
    buildFashionMemoryContext(userId),
    query<{ creator_profile_id: string }>("SELECT creator_profile_id FROM creator_followers WHERE follower_user_id = $1", [userId]),
    query<{ post_id: string; action_type: string }>("SELECT post_id, action_type FROM discovery_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200", [userId])
  ]);

  const profile = profileRows[0];
  const followedIds = new Set(followed.map((row) => row.creator_profile_id));
  const seenIds = new Set(interactions.map((row) => row.post_id));
  let score = 0;

  if (post.creator_profile_id && followedIds.has(post.creator_profile_id)) score += 25;
  if (profile?.favorite_aesthetics?.some((value) => value.toLowerCase() === post.aesthetic_slug?.toLowerCase())) score += 20;
  if (post.tags?.some((tag) => profile?.preferred_categories?.map((value) => value.toLowerCase()).includes(tag.toLowerCase()))) score += 10;
  if (memory.memory.some((entry) => String((entry as { memory_key?: string }).memory_key).toLowerCase() === post.aesthetic_slug?.toLowerCase())) score += 15;
  score += Math.min(20, Number(post.save_count ?? 0) * 1.5);
  score += Math.min(10, Number(post.like_count ?? 0));
  if (seenIds.has(post.id)) score -= 8;
  if (post.user_id === userId) score -= 20;

  return score;
}

export async function rankForYou(userId: string, posts: Array<{
  id: string;
  user_id: string;
  creator_profile_id?: string | null;
  occasion_slug?: string | null;
  aesthetic_slug?: string | null;
  tags?: string[];
  like_count?: number;
  save_count?: number;
}>) {
  const scored = await Promise.all(posts.map(async (post) => ({
    post,
    discovery_score: await calculateDiscoveryScore(userId, post)
  })));

  return scored.sort((a, b) => b.discovery_score - a.discovery_score);
}
