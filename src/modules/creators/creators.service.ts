import { getClient, query, queryOne } from "../../database/db.js";

export async function createProfile(userId: string, input: Record<string, unknown>) {
  return queryOne(
    `INSERT INTO creator_profiles (
       user_id, display_name, bio, profile_image_url, profile_image_public_id,
       website_url, instagram_handle, tiktok_handle, creator_type
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       bio = EXCLUDED.bio,
       profile_image_url = EXCLUDED.profile_image_url,
       profile_image_public_id = EXCLUDED.profile_image_public_id,
       website_url = EXCLUDED.website_url,
       instagram_handle = EXCLUDED.instagram_handle,
       tiktok_handle = EXCLUDED.tiktok_handle,
       creator_type = EXCLUDED.creator_type
     RETURNING *`,
    [
      userId,
      input.display_name,
      input.bio ?? null,
      input.profile_image_url ?? null,
      input.profile_image_public_id ?? null,
      input.website_url ?? null,
      input.instagram_handle ?? null,
      input.tiktok_handle ?? null,
      input.creator_type ?? "public_user"
    ]
  );
}

export async function myProfile(userId: string) {
  return queryOne("SELECT * FROM creator_profiles WHERE user_id = $1", [userId]);
}

export async function getCreator(id: string) {
  const creator = await queryOne(
    `SELECT cp.*, u.full_name AS owner_name
     FROM creator_profiles cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.id = $1`,
    [id]
  );
  if (!creator) throwNotFound("Creator profile not found");
  return creator;
}

export async function updateProfile(userId: string, input: Record<string, unknown>) {
  const existing = await myProfile(userId);
  if (!existing) throwNotFound("Creator profile not found");
  return queryOne(
    `UPDATE creator_profiles
     SET display_name = COALESCE($2, display_name),
       bio = COALESCE($3, bio),
       profile_image_url = COALESCE($4, profile_image_url),
       profile_image_public_id = COALESCE($5, profile_image_public_id),
       website_url = COALESCE($6, website_url),
       instagram_handle = COALESCE($7, instagram_handle),
       tiktok_handle = COALESCE($8, tiktok_handle),
       creator_type = COALESCE($9, creator_type)
     WHERE user_id = $1
     RETURNING *`,
    [userId, input.display_name, input.bio, input.profile_image_url, input.profile_image_public_id, input.website_url, input.instagram_handle, input.tiktok_handle, input.creator_type]
  );
}

export async function deleteProfile(userId: string) {
  const existing = await myProfile(userId);
  if (!existing) throwNotFound("Creator profile not found");
  return queryOne("DELETE FROM creator_profiles WHERE user_id = $1 RETURNING id", [userId]);
}

export async function followCreator(userId: string, creatorId: string) {
  const creator = await getCreator(creatorId) as { user_id: string };
  if (creator.user_id === userId) {
    const error = new Error("You cannot follow yourself");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO creator_followers (creator_profile_id, follower_user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [creatorId, userId]
    );
    const result = await client.query(
      "UPDATE creator_profiles SET follower_count = (SELECT COUNT(*) FROM creator_followers WHERE creator_profile_id = $1) WHERE id = $1 RETURNING *",
      [creatorId]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function unfollowCreator(userId: string, creatorId: string) {
  await getCreator(creatorId);
  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM creator_followers WHERE creator_profile_id = $1 AND follower_user_id = $2", [creatorId, userId]);
    const result = await client.query(
      "UPDATE creator_profiles SET follower_count = (SELECT COUNT(*) FROM creator_followers WHERE creator_profile_id = $1) WHERE id = $1 RETURNING *",
      [creatorId]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function followers(creatorId: string) {
  await getCreator(creatorId);
  return query(
    `SELECT cf.id, cf.created_at, u.id AS user_id, u.full_name
     FROM creator_followers cf
     JOIN users u ON u.id = cf.follower_user_id
     WHERE cf.creator_profile_id = $1
     ORDER BY cf.created_at DESC`,
    [creatorId]
  );
}

export async function posts(creatorId: string) {
  await getCreator(creatorId);
  return query(
    `SELECT *
     FROM community_posts
     WHERE creator_profile_id = $1 AND visibility = 'public' AND status = 'published'
     ORDER BY created_at DESC`,
    [creatorId]
  );
}

function throwNotFound(message: string): never {
  const error = new Error(message);
  (error as Error & { statusCode?: number }).statusCode = 404;
  throw error;
}
