import { queryOne } from "../../database/db.js";
import type { DbAdminUser } from "../../types/index.js";
import { sanitizeAdminUser, signAdminJwt, verifyPassword } from "../../utils/security.js";

export async function login(input: { email: string; password: string }) {
  const admin = await queryOne<DbAdminUser>(
    "SELECT * FROM admin_users WHERE email = $1",
    [input.email]
  );

  if (!admin || admin.status !== "active" || !(await verifyPassword(input.password, admin.password_hash))) {
    const error = new Error("Invalid admin email or password");
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }

  await queryOne("UPDATE admin_users SET last_login_at = NOW() WHERE id = $1 RETURNING id", [admin.id]);

  return {
    admin: sanitizeAdminUser(admin),
    token: signAdminJwt({ id: admin.id, email: admin.email, role: admin.role })
  };
}

export async function getMe(adminId: string) {
  const admin = await queryOne<DbAdminUser>(
    "SELECT * FROM admin_users WHERE id = $1 AND status = 'active'",
    [adminId]
  );
  return admin ? sanitizeAdminUser(admin) : null;
}
