import { query, queryOne } from "../../database/db.js";
import { getCurrentSubscription } from "../subscriptions/subscriptions.service.js";

export async function createBoard(userId: string, input: Record<string, unknown>) {
  await ensureBoardLimit(userId);
  return queryOne(
    `INSERT INTO style_boards (user_id, title, description, cover_image_url, visibility)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, input.title, input.description ?? null, input.cover_image_url ?? null, input.visibility ?? "private"]
  );
}

export async function listBoards(userId: string) {
  return query("SELECT * FROM style_boards WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
}

export async function getBoard(userId: string, boardId: string) {
  const board = await queryOne(
    "SELECT * FROM style_boards WHERE id = $1 AND (user_id = $2 OR visibility = 'public')",
    [boardId, userId]
  );
  if (!board) throwNotFound("Style board not found");
  const items = await query(
    `SELECT sbi.*, cp.title, cp.cover_image_url, cp.occasion_slug, cp.aesthetic_slug
     FROM style_board_items sbi
     JOIN community_posts cp ON cp.id = sbi.post_id
     WHERE sbi.board_id = $1
     ORDER BY sbi.created_at DESC`,
    [boardId]
  );
  return { board, items };
}

export async function updateBoard(userId: string, boardId: string, input: Record<string, unknown>) {
  await ensureOwnedBoard(userId, boardId);
  return queryOne(
    `UPDATE style_boards
     SET title = COALESCE($3, title),
       description = COALESCE($4, description),
       cover_image_url = COALESCE($5, cover_image_url),
       visibility = COALESCE($6, visibility)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [boardId, userId, input.title, input.description, input.cover_image_url, input.visibility]
  );
}

export async function deleteBoard(userId: string, boardId: string) {
  await ensureOwnedBoard(userId, boardId);
  return queryOne("DELETE FROM style_boards WHERE id = $1 AND user_id = $2 RETURNING id", [boardId, userId]);
}

export async function addItem(userId: string, boardId: string, postId: string) {
  await ensureOwnedBoard(userId, boardId);
  const post = await queryOne("SELECT id FROM community_posts WHERE id = $1 AND visibility = 'public' AND status = 'published'", [postId]);
  if (!post) throwNotFound("Community post not found");
  return queryOne(
    `INSERT INTO style_board_items (board_id, post_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [boardId, postId]
  );
}

export async function removeItem(userId: string, boardId: string, itemId: string) {
  await ensureOwnedBoard(userId, boardId);
  return queryOne("DELETE FROM style_board_items WHERE id = $1 AND board_id = $2 RETURNING id", [itemId, boardId]);
}

async function ensureOwnedBoard(userId: string, boardId: string) {
  const board = await queryOne("SELECT id FROM style_boards WHERE id = $1 AND user_id = $2", [boardId, userId]);
  if (!board) throwNotFound("Style board not found");
}

async function ensureBoardLimit(userId: string) {
  const subscription = await getCurrentSubscription(userId);
  const plan = subscription.plan?.name?.toLowerCase() ?? "free";
  const limits = { free: 3, pro: 25, premium: 200 };
  const limit = limits[plan as keyof typeof limits] ?? limits.free;
  const row = await queryOne<{ count: number }>("SELECT COUNT(*)::int AS count FROM style_boards WHERE user_id = $1", [userId]);
  if ((row?.count ?? 0) >= limit) {
    const error = new Error("Style board limit reached for your current plan");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

function throwNotFound(message: string): never {
  const error = new Error(message);
  (error as Error & { statusCode?: number }).statusCode = 404;
  throw error;
}
