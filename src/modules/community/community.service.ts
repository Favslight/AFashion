import { getClient, query, queryOne } from "../../database/db.js";
import { deleteCloudinaryImage } from "../../utils/image.js";

export async function createPost(userId: string, input: Record<string, unknown>) {
  const creator = await ensureCreatorProfile(userId);
  const post = await queryOne(
    `INSERT INTO community_posts (
       user_id, creator_profile_id, title, description, cover_image_url, cover_image_public_id,
       source_type, source_id, occasion_slug, aesthetic_slug, tags, visibility
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      userId,
      creator.id,
      input.title ?? null,
      input.description ?? null,
      input.cover_image_url ?? null,
      input.cover_image_public_id ?? null,
      input.source_type,
      input.source_id ?? null,
      input.occasion_slug ?? null,
      input.aesthetic_slug ?? null,
      input.tags ?? [],
      input.visibility ?? "public"
    ]
  );
  await refreshCreatorPostCount(creator.id);
  return post;
}

export async function listPosts(input: { search?: string; occasion_slug?: string; aesthetic_slug?: string; tag?: string; page: number; limit: number }) {
  const params: unknown[] = [];
  const filters = ["cp.visibility = 'public'", "cp.status = 'published'"];
  if (input.search) {
    params.push(`%${input.search}%`);
    filters.push(`(cp.title ILIKE $${params.length} OR cp.description ILIKE $${params.length})`);
  }
  if (input.occasion_slug) {
    params.push(input.occasion_slug);
    filters.push(`cp.occasion_slug = $${params.length}`);
  }
  if (input.aesthetic_slug) {
    params.push(input.aesthetic_slug);
    filters.push(`cp.aesthetic_slug = $${params.length}`);
  }
  if (input.tag) {
    params.push(input.tag);
    filters.push(`$${params.length} = ANY(cp.tags)`);
  }
  const offset = (input.page - 1) * input.limit;
  return query(
    `SELECT cp.*, cr.display_name, cr.verified
     FROM community_posts cp
     LEFT JOIN creator_profiles cr ON cr.id = cp.creator_profile_id
     WHERE ${filters.join(" AND ")}
     ORDER BY cp.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, input.limit, offset]
  );
}

export async function getPost(userId: string | null, postId: string) {
  const post = await queryOne(
    `SELECT cp.*, cr.display_name, cr.verified,
      EXISTS(SELECT 1 FROM community_post_likes cpl WHERE cpl.post_id = cp.id AND cpl.user_id = $2) AS liked_by_me,
      EXISTS(SELECT 1 FROM community_post_saves cps WHERE cps.post_id = cp.id AND cps.user_id = $2) AS saved_by_me
     FROM community_posts cp
     LEFT JOIN creator_profiles cr ON cr.id = cp.creator_profile_id
     WHERE cp.id = $1 AND cp.status != 'removed'`,
    [postId, userId]
  );
  if (!post) throwNotFound("Community post not found");
  if ((post as { visibility?: string; user_id?: string }).visibility !== "public" && (post as { user_id?: string }).user_id !== userId) {
    throwNotFound("Community post not found");
  }
  return post;
}

export async function updatePost(userId: string, postId: string, input: Record<string, unknown>) {
  await ensureOwnedPost(userId, postId);
  return queryOne(
    `UPDATE community_posts
     SET title = COALESCE($3, title),
       description = COALESCE($4, description),
       cover_image_url = COALESCE($5, cover_image_url),
       cover_image_public_id = COALESCE($6, cover_image_public_id),
       occasion_slug = COALESCE($7, occasion_slug),
       aesthetic_slug = COALESCE($8, aesthetic_slug),
       tags = COALESCE($9, tags),
       visibility = COALESCE($10, visibility),
       status = COALESCE($11, status)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [postId, userId, input.title, input.description, input.cover_image_url, input.cover_image_public_id, input.occasion_slug, input.aesthetic_slug, input.tags, input.visibility, input.status]
  );
}

export async function deletePost(userId: string, postId: string, isAdmin = false) {
  const post = isAdmin
    ? await queryOne<{ id: string; cover_image_public_id: string | null; creator_profile_id: string | null }>("SELECT id, cover_image_public_id, creator_profile_id FROM community_posts WHERE id = $1", [postId])
    : await queryOne<{ id: string; cover_image_public_id: string | null; creator_profile_id: string | null }>("SELECT id, cover_image_public_id, creator_profile_id FROM community_posts WHERE id = $1 AND user_id = $2", [postId, userId]);
  if (!post) throwNotFound("Community post not found");
  await queryOne("DELETE FROM community_posts WHERE id = $1 RETURNING id", [postId]);
  if (post.cover_image_public_id) await deleteCloudinaryImage(post.cover_image_public_id);
  if (post.creator_profile_id) await refreshCreatorPostCount(post.creator_profile_id);
}

export async function likePost(userId: string, postId: string) {
  await getPost(userId, postId);
  await queryOne("INSERT INTO community_post_likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id", [userId, postId]);
  await queryOne("UPDATE community_posts SET like_count = (SELECT COUNT(*) FROM community_post_likes WHERE post_id = $1) WHERE id = $1 RETURNING id", [postId]);
  await logDiscoveryEvent(userId, postId, "liked");
}

export async function unlikePost(userId: string, postId: string) {
  await queryOne("DELETE FROM community_post_likes WHERE user_id = $1 AND post_id = $2 RETURNING id", [userId, postId]);
  await queryOne("UPDATE community_posts SET like_count = (SELECT COUNT(*) FROM community_post_likes WHERE post_id = $1) WHERE id = $1 RETURNING id", [postId]);
}

export async function savePost(userId: string, postId: string) {
  await getPost(userId, postId);
  await queryOne("INSERT INTO community_post_saves (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id", [userId, postId]);
  await queryOne("UPDATE community_posts SET save_count = (SELECT COUNT(*) FROM community_post_saves WHERE post_id = $1) WHERE id = $1 RETURNING id", [postId]);
  await logDiscoveryEvent(userId, postId, "saved");
}

export async function unsavePost(userId: string, postId: string) {
  await queryOne("DELETE FROM community_post_saves WHERE user_id = $1 AND post_id = $2 RETURNING id", [userId, postId]);
  await queryOne("UPDATE community_posts SET save_count = (SELECT COUNT(*) FROM community_post_saves WHERE post_id = $1) WHERE id = $1 RETURNING id", [postId]);
}

export async function addComment(userId: string, postId: string, content: string) {
  await getPost(userId, postId);
  const comment = await queryOne("INSERT INTO community_comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *", [userId, postId, content]);
  await queryOne("UPDATE community_posts SET comment_count = (SELECT COUNT(*) FROM community_comments WHERE post_id = $1) WHERE id = $1 RETURNING id", [postId]);
  return comment;
}

export async function listComments(postId: string) {
  return query(
    `SELECT cc.*, u.full_name
     FROM community_comments cc
     JOIN users u ON u.id = cc.user_id
     WHERE cc.post_id = $1
     ORDER BY cc.created_at DESC`,
    [postId]
  );
}

export async function deleteComment(userId: string, commentId: string) {
  const comment = await queryOne<{ id: string; post_id: string }>("SELECT id, post_id FROM community_comments WHERE id = $1 AND user_id = $2", [commentId, userId]);
  if (!comment) throwNotFound("Comment not found");
  await queryOne("DELETE FROM community_comments WHERE id = $1 RETURNING id", [commentId]);
  await queryOne("UPDATE community_posts SET comment_count = (SELECT COUNT(*) FROM community_comments WHERE post_id = $1) WHERE id = $1 RETURNING id", [comment.post_id]);
}

export async function reportPost(userId: string, postId: string, input: { reason: string; details?: string | null }) {
  await getPost(userId, postId);
  return queryOne(
    "INSERT INTO community_reports (reporter_user_id, post_id, reason, details) VALUES ($1, $2, $3, $4) RETURNING *",
    [userId, postId, input.reason, input.details ?? null]
  );
}

export async function shareOutfit(userId: string, outfitId: string) {
  const outfit = await queryOne<{ id: string; title: string; ai_summary: string | null; occasion_slug: string | null }>(
    `SELECT o.id, o.title, o.ai_summary, oc.slug AS occasion_slug
     FROM outfits o
     LEFT JOIN outfit_occasions oc ON oc.id = o.occasion_id
     WHERE o.id = $1 AND o.user_id = $2`,
    [outfitId, userId]
  );
  if (!outfit) throwNotFound("Outfit not found");
  return createPost(userId, {
    title: outfit.title,
    description: outfit.ai_summary,
    source_type: "ai_generated_outfit",
    source_id: outfit.id,
    occasion_slug: outfit.occasion_slug,
    tags: ["shared-outfit"],
    visibility: "public"
  });
}

export async function adminListPosts() {
  return query("SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 200");
}

export async function adminListReports() {
  return query(
    `SELECT cr.*, cp.title AS post_title, u.email AS reporter_email
     FROM community_reports cr
     JOIN community_posts cp ON cp.id = cr.post_id
     JOIN users u ON u.id = cr.reporter_user_id
     ORDER BY cr.created_at DESC`
  );
}

export async function adminUpdateReport(adminId: string, reportId: string, input: { status: string; hide_post?: boolean }) {
  const report = await queryOne<{ id: string; post_id: string }>("SELECT id, post_id FROM community_reports WHERE id = $1", [reportId]);
  if (!report) throwNotFound("Community report not found");
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      "UPDATE community_reports SET status = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $1 RETURNING *",
      [reportId, input.status, adminId]
    );
    if (input.hide_post) {
      await client.query("UPDATE community_posts SET status = 'hidden' WHERE id = $1", [report.post_id]);
    }
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureCreatorProfile(userId: string) {
  const existing = await queryOne<{ id: string }>("SELECT id FROM creator_profiles WHERE user_id = $1", [userId]);
  if (existing) return existing;
  return queryOne<{ id: string }>(
    `INSERT INTO creator_profiles (user_id, display_name)
     SELECT id, full_name FROM users WHERE id = $1
     RETURNING id`,
    [userId]
  ) as Promise<{ id: string }>;
}

async function ensureOwnedPost(userId: string, postId: string) {
  const post = await queryOne("SELECT id FROM community_posts WHERE id = $1 AND user_id = $2", [postId, userId]);
  if (!post) throwNotFound("Community post not found");
}

async function refreshCreatorPostCount(creatorId: string) {
  await queryOne(
    "UPDATE creator_profiles SET total_posts = (SELECT COUNT(*) FROM community_posts WHERE creator_profile_id = $1 AND status != 'removed') WHERE id = $1 RETURNING id",
    [creatorId]
  );
}

async function logDiscoveryEvent(userId: string, postId: string, actionType: string) {
  await queryOne("INSERT INTO discovery_events (user_id, post_id, action_type) VALUES ($1, $2, $3) RETURNING id", [userId, postId, actionType]);
}

function throwNotFound(message: string): never {
  const error = new Error(message);
  (error as Error & { statusCode?: number }).statusCode = 404;
  throw error;
}
