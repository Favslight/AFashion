import { queryOne } from "../../database/db.js";
import type { DbUser } from "../../types/index.js";
import { sanitizeUser } from "../../utils/security.js";

export async function updateCurrentUser(userId: string, input: { full_name?: string }) {
  const user = await queryOne<DbUser>(
    `UPDATE users
     SET full_name = COALESCE($2, full_name)
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *`,
    [userId, input.full_name]
  );

  return user ? sanitizeUser(user) : null;
}
